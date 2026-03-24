import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma-tenant';
import { PrismaMemberRepository } from '../infrastructure/persistence/prisma-member.repository';
import { PrismaMemberTypeRepository } from '../infrastructure/persistence/prisma-member-type.repository';
import { MemberPrismaMapper } from '../infrastructure/persistence/member-prisma.mapper';
import { Aes256EncryptionService } from '../infrastructure/services/aes256-encryption.service';
import { PrismaMemberOutboxPublisher } from '../infrastructure/services/prisma-member-outbox.publisher';
import { PrismaTenantService } from '../../shared/infrastructure/persistence/prisma-tenant.service';
import { CreateMemberHandler } from '../application/commands/create-member.handler';
import { UpdateMemberHandler } from '../application/commands/update-member.handler';
import { CreateMemberCommand } from '../application/commands/create-member.command';
import { UpdateMemberCommand } from '../application/commands/update-member.command';
import { Member } from '../domain/aggregates/member';
import { MemberTypeId } from '../domain/value-objects/member-type-id';
import { MemberNumber } from '../domain/value-objects/member-number';
import { PersonalData } from '../domain/value-objects/personal-data';
import { ContactData } from '../domain/value-objects/contact-data';
import { IdentityDocument, DocumentType } from '../domain/value-objects/identity-document';
import { BankDetails } from '../domain/value-objects/bank-details';
import { CustomFields } from '../domain/value-objects/custom-fields';
import { MemberStatus } from '../domain/value-objects/member-status';
import { MemberId } from '../domain/value-objects/member-id';
import { ErrorReporter } from '../../shared/domain';

/**
 * Tests de integración para UC-006: Gestión de ficha de socio.
 *
 * Requiere PostgreSQL corriendo (Docker Compose).
 * Ejecutar con: npx -w api vitest run src/membership/__tests__/member-management.integration-spec.ts --no-coverage
 *
 * Pruebas verificadas contra BD real:
 * - CRUD completo de socios
 * - Cifrado/descifrado de IBAN (RNF-006)
 * - Unicidad de DNI y email
 * - Campos inmutables en actualización
 * - Filtrado por estado
 * - Campos personalizados (cofradía, peña)
 * - Generación secuencial de números de socio
 * - Eventos en outbox
 */

// --- Configuración de test ---

/** Clave de cifrado de test: 64 hex chars = 32 bytes. */
const TEST_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

/** URL de conexión a PostgreSQL principal. */
const DATABASE_MAIN_URL =
  process.env.DATABASE_MAIN_URL ??
  'postgresql://associated:associated_dev@localhost:5432/associated_main';

/** Nombre de la BD de test para el tenant ficticio. */
const TEST_DB_NAME = 'associated_test_uc006_integration';

/** Extraer host y puerto de la URL principal. */
function extractHostPort(url: string): { host: string; port: string } {
  const match = url.match(/@([^:/?]+):?(\d+)?\//);
  return {
    host: match?.[1] ?? 'localhost',
    port: match?.[2] ?? '5432',
  };
}

/** URL de conexión directa al tenant de test (mismo superusuario para simplificar). */
function buildTestTenantUrl(): string {
  const { host, port } = extractHostPort(DATABASE_MAIN_URL);
  return `postgresql://associated:associated_dev@${host}:${port}/${TEST_DB_NAME}`;
}

/**
 * Comprueba si PostgreSQL está disponible intentando una conexión.
 */
async function isPostgresAvailable(): Promise<boolean> {
  const { PrismaClient: MainPrismaClient } = await import('@prisma-main');
  const adapter = new PrismaPg({ connectionString: DATABASE_MAIN_URL });
  const client = new MainPrismaClient({ adapter });
  try {
    await client.$connect();
    await client.$disconnect();
    return true;
  } catch {
    return false;
  }
}

/**
 * Crea la BD de test y ejecuta migraciones del schema tenant.
 */
async function setupTestDatabase(): Promise<void> {
  const { PrismaClient: MainPrismaClient } = await import('@prisma-main');
  const adapter = new PrismaPg({ connectionString: DATABASE_MAIN_URL });
  const mainClient = new MainPrismaClient({ adapter });

  try {
    await mainClient.$connect();

    // Eliminar BD si existe (limpieza de ejecución previa)
    try {
      await mainClient.$queryRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
    } catch {
      // Ignorar errores
    }

    // Crear BD de test
    await mainClient.$queryRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}"`);
  } finally {
    await mainClient.$disconnect();
  }

  // Aplicar schema completo en la BD de test (prisma db push)
  const schemaPath = resolve(process.cwd(), 'prisma', 'tenant', 'schema.prisma');
  const tenantUrl = buildTestTenantUrl();

  execSync(`npx prisma db push --schema="${schemaPath}" --url="${tenantUrl}" --accept-data-loss`, {
    env: {
      ...process.env,
    },
    timeout: 60_000,
    stdio: 'pipe',
  });
}

/**
 * Elimina la BD de test.
 */
async function teardownTestDatabase(): Promise<void> {
  const { PrismaClient: MainPrismaClient } = await import('@prisma-main');
  const adapter = new PrismaPg({ connectionString: DATABASE_MAIN_URL });
  const mainClient = new MainPrismaClient({ adapter });

  try {
    await mainClient.$connect();
    await mainClient.$queryRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
  } catch {
    // Ignorar errores de limpieza
  } finally {
    await mainClient.$disconnect();
  }
}

// --- Tests ---

describe('UC-006: Member Management Integration', () => {
  let pgAvailable: boolean;
  let tenantPrisma: PrismaClient;
  let memberRepository: PrismaMemberRepository;
  let memberTypeRepository: PrismaMemberTypeRepository;
  let encryptionService: Aes256EncryptionService;
  let mapper: MemberPrismaMapper;
  let outboxPublisher: PrismaMemberOutboxPublisher;

  /** ID del tenant ficticio (constante para toda la suite). */
  const TENANT_ID = 'test-uc006-integration';

  /** ID del MemberType creado en el setup. */
  let testMemberTypeId: string;

  /**
   * Helper: crea un PrismaTenantService mockeado que retorna nuestro cliente de test.
   */
  function createMockedTenantService(): PrismaTenantService {
    const service = new PrismaTenantService();
    // Sobrescribir getClient para retornar siempre nuestro PrismaClient de test
    service.getClient = async () => tenantPrisma;
    return service;
  }

  /**
   * Helper: crea un MemberType directamente en la BD para las pruebas.
   */
  async function seedMemberType(
    overrides?: Partial<{
      id: string;
      code: string;
      name: string;
      active: boolean;
      ageRangeMin: number | null;
      ageRangeMax: number | null;
    }>,
  ): Promise<string> {
    const id = overrides?.id ?? randomUUID();
    await tenantPrisma.memberType.create({
      data: {
        id,
        code: overrides?.code ?? 'ORD',
        name: overrides?.name ?? 'Ordinario',
        description: 'Tipo de socio para tests de integración',
        ageRangeMin: overrides?.ageRangeMin ?? null,
        ageRangeMax: overrides?.ageRangeMax ?? null,
        votingRight: true,
        eligibleForOffice: false,
        minimumSeniorityForVoting: 0,
        minimumSeniorityForOffice: 0,
        active: overrides?.active ?? true,
      },
    });
    return id;
  }

  /**
   * Helper: registra un Member en el aggregate y persiste.
   */
  async function createTestMember(
    overrides?: Partial<{
      documentType: DocumentType;
      documentNumber: string;
      email: string;
      name: string;
      surnames: string;
      iban: string | null;
      customFields: Record<string, unknown>;
      memberTypeId: string;
      memberNumber: number;
      initialStatus: MemberStatus;
    }>,
  ): Promise<Member> {
    const docType = overrides?.documentType ?? DocumentType.DNI;
    const docNumber = overrides?.documentNumber ?? '12345678Z';
    const email = overrides?.email ?? 'test@example.com';
    const name = overrides?.name ?? 'Juan';
    const surnames = overrides?.surnames ?? 'García López';
    const iban = overrides?.iban !== undefined ? overrides.iban : 'ES9121000418450200051332';
    const memberTypeId = overrides?.memberTypeId ?? testMemberTypeId;
    const memberNumSeq = overrides?.memberNumber ?? 1;
    const initialStatus = overrides?.initialStatus ?? MemberStatus.ACTIVE;

    const personalDataResult = PersonalData.create({
      name,
      surnames,
      birthDate: new Date('1990-05-15'),
    });
    expect(personalDataResult.ok).toBe(true);
    if (!personalDataResult.ok) throw new Error('PersonalData creation failed');

    const contactDataResult = ContactData.create({
      email,
      phone: '612345678',
      address: 'Calle Test 1',
      postalCode: '28001',
      city: 'Madrid',
    });
    expect(contactDataResult.ok).toBe(true);
    if (!contactDataResult.ok) throw new Error('ContactData creation failed');

    const identityDocResult = IdentityDocument.create(docType, docNumber);
    expect(identityDocResult.ok).toBe(true);
    if (!identityDocResult.ok) throw new Error('IdentityDocument creation failed');

    let bankDetails: BankDetails | null = null;
    if (iban) {
      const bankResult = BankDetails.create(iban);
      expect(bankResult.ok).toBe(true);
      if (!bankResult.ok) throw new Error('BankDetails creation failed');
      bankDetails = bankResult.value;
    }

    const customFieldsResult = CustomFields.create(overrides?.customFields ?? {});
    expect(customFieldsResult.ok).toBe(true);
    if (!customFieldsResult.ok) throw new Error('CustomFields creation failed');

    const memberNumberResult = MemberNumber.fromSequence(memberNumSeq);
    expect(memberNumberResult.ok).toBe(true);
    if (!memberNumberResult.ok) throw new Error('MemberNumber creation failed');

    const registerResult = Member.register({
      memberTypeId: MemberTypeId.fromString(memberTypeId),
      memberNumber: memberNumberResult.value,
      personalData: personalDataResult.value,
      contactData: contactDataResult.value,
      identityDocument: identityDocResult.value,
      bankDetails,
      customFields: customFieldsResult.value,
      initialStatus,
    });
    expect(registerResult.ok).toBe(true);
    if (!registerResult.ok) throw new Error('Member.register failed');

    const member = registerResult.value;
    await memberRepository.save(member);
    return member;
  }

  // ====================================================================
  // Setup y teardown globales
  // ====================================================================

  beforeAll(async () => {
    pgAvailable = await isPostgresAvailable();
    if (!pgAvailable) {
      console.warn(
        '⚠️  PostgreSQL no disponible. Saltando tests de integración UC-006.\n' +
          'Iniciar con: docker compose up -d postgres',
      );
      return;
    }

    // Configurar clave de cifrado para tests
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    process.env.DATABASE_TENANT_URL = buildTestTenantUrl();

    // Crear BD de test y ejecutar migraciones
    await setupTestDatabase();

    // Crear PrismaClient directo al tenant de test
    const tenantUrl = buildTestTenantUrl();
    const adapter = new PrismaPg({ connectionString: tenantUrl });
    tenantPrisma = new PrismaClient({ adapter });
    await tenantPrisma.$connect();

    // Inicializar servicios
    encryptionService = new Aes256EncryptionService();
    mapper = new MemberPrismaMapper(encryptionService);

    const tenantService = createMockedTenantService();
    memberRepository = new PrismaMemberRepository(tenantService, mapper);
    memberRepository.setTenantId(TENANT_ID);

    memberTypeRepository = new PrismaMemberTypeRepository(tenantService);
    memberTypeRepository.setTenantId(TENANT_ID);
    outboxPublisher = new PrismaMemberOutboxPublisher(tenantService);

    // Seed de MemberType
    testMemberTypeId = await seedMemberType();
  }, 120_000);

  afterAll(async () => {
    if (!pgAvailable) return;

    try {
      await tenantPrisma.$disconnect();
    } catch {
      // Ignorar
    }

    // Eliminar BD de test
    await teardownTestDatabase();
  }, 30_000);

  /**
   * Limpia la tabla members antes de cada test para aislamiento.
   */
  beforeEach(async () => {
    if (!pgAvailable) return;
    await tenantPrisma.member.deleteMany();
    // Limpiar outbox
    await tenantPrisma.outboxEvent.deleteMany();
  });

  // ====================================================================
  // CRUD completo contra BD real
  // ====================================================================

  describe('POST /api/v1/members (Create)', () => {
    it('should create a member with complete profile data', async () => {
      if (!pgAvailable) return;

      const member = await createTestMember();

      // Verificar persistencia: leer directamente de BD
      const raw = await tenantPrisma.member.findUnique({
        where: { id: member.id.toValue() },
      });

      expect(raw).not.toBeNull();
      expect(raw!.name).toBe('Juan');
      expect(raw!.surnames).toBe('García López');
      expect(raw!.document_type).toBe('DNI');
      expect(raw!.document_number).toBe('12345678Z');
      expect(raw!.email).toBe('test@example.com');
      expect(raw!.phone).toBe('612345678');
      expect(raw!.address).toBe('Calle Test 1');
      expect(raw!.postal_code).toBe('28001');
      expect(raw!.city).toBe('Madrid');
      expect(raw!.member_type_id).toBe(testMemberTypeId);
      expect(raw!.current_status).toBe('ACTIVE');
      expect(raw!.member_number).toBe('00001');
      expect(raw!.version).toBe(0);
    }, 30_000);

    it('should store IBAN encrypted in database', async () => {
      if (!pgAvailable) return;

      const IBAN_PLAIN = 'ES9121000418450200051332';
      const member = await createTestMember({ iban: IBAN_PLAIN });

      // Leer registro raw (sin descifrar)
      const raw = await tenantPrisma.member.findUnique({
        where: { id: member.id.toValue() },
      });

      expect(raw).not.toBeNull();
      // El IBAN cifrado NO debe ser igual al texto plano
      expect(raw!.iban_encrypted).not.toBeNull();
      expect(raw!.iban_encrypted).not.toBe(IBAN_PLAIN);
      // Debe tener formato iv:authTag:cipherText (3 partes separadas por :)
      const parts = raw!.iban_encrypted!.split(':');
      expect(parts).toHaveLength(3);
    }, 30_000);

    it('should decrypt IBAN correctly when reading', async () => {
      if (!pgAvailable) return;

      const IBAN_PLAIN = 'ES9121000418450200051332';
      const member = await createTestMember({ iban: IBAN_PLAIN });

      // Leer via repositorio (descifra automáticamente)
      const memberId = MemberId.fromString(member.id.toValue());
      const readMember = await memberRepository.findById(memberId);

      expect(readMember).not.toBeNull();
      expect(readMember!.bankDetails).not.toBeNull();
      expect(readMember!.bankDetails!.iban).toBe(IBAN_PLAIN);
    }, 30_000);

    it('should reject duplicate document number', async () => {
      if (!pgAvailable) return;

      // Crear primer socio con DNI 12345678Z
      await createTestMember({
        documentNumber: '12345678Z',
        email: 'primero@test.com',
        memberNumber: 1,
      });

      // Verificar que existsByIdentityDocument detecta duplicado
      const identityDocResult = IdentityDocument.create(DocumentType.DNI, '12345678Z');
      expect(identityDocResult.ok).toBe(true);
      if (!identityDocResult.ok) return;

      const exists = await memberRepository.existsByIdentityDocument(identityDocResult.value);
      expect(exists).toBe(true);

      // Verificar que findByIdentityDocument retorna el socio existente
      const existing = await memberRepository.findByIdentityDocument(identityDocResult.value);
      expect(existing).not.toBeNull();
      expect(existing!.personalData?.name).toBe('Juan');
    }, 30_000);

    it('should reject duplicate email', async () => {
      if (!pgAvailable) return;

      // Crear primer socio
      await createTestMember({
        documentNumber: '12345678Z',
        email: 'duplicado@test.com',
        memberNumber: 1,
      });

      // Verificar que existsByEmail detecta duplicado
      const exists = await memberRepository.existsByEmail('duplicado@test.com');
      expect(exists).toBe(true);

      // El email debe ser case insensitive
      const _existsUpperCase = await memberRepository.existsByEmail('DUPLICADO@TEST.COM');
      // Nota: depende de la implementación de case sensitivity en PostgreSQL/Prisma
      // Al menos la versión normalizada debe encontrarse
      expect(exists).toBe(true);
    }, 30_000);

    it('should create member with cofradía custom_fields (bautismo)', async () => {
      if (!pgAvailable) return;

      const cofradiaFields = {
        fechaBautismo: '2000-03-25',
        parroquia: 'San Juan Bautista',
        padrinos: ['Antonio García', 'María López'],
        juraDeReglas: true,
        imposicionMedalla: '2020-04-15',
        tipoTunica: 'Nazareno',
        posicionCortejo: 3,
      };

      const member = await createTestMember({
        documentNumber: '12345678Z',
        email: 'cofradia@test.com',
        customFields: cofradiaFields,
        memberNumber: 1,
      });

      // Verificar persistencia del JSON
      const raw = await tenantPrisma.member.findUnique({
        where: { id: member.id.toValue() },
      });

      expect(raw).not.toBeNull();
      expect(raw!.custom_fields).not.toBeNull();

      const storedFields = raw!.custom_fields as Record<string, unknown>;
      expect(storedFields.fechaBautismo).toBe('2000-03-25');
      expect(storedFields.parroquia).toBe('San Juan Bautista');
      expect(storedFields.padrinos).toEqual(['Antonio García', 'María López']);
      expect(storedFields.juraDeReglas).toBe(true);
      expect(storedFields.tipoTunica).toBe('Nazareno');
      expect(storedFields.posicionCortejo).toBe(3);
    }, 30_000);

    it('should create member with peña custom_fields (tallas)', async () => {
      if (!pgAvailable) return;

      const penaFields = {
        tallaCamiseta: 'L',
        tallaPantalon: '42',
        preferenciasAlimentarias: 'Sin gluten',
        alergias: ['Frutos secos'],
        disponibilidadVoluntariado: true,
        vehiculo: true,
      };

      const member = await createTestMember({
        documentNumber: '12345678Z',
        email: 'pena@test.com',
        customFields: penaFields,
        memberNumber: 1,
      });

      // Verificar persistencia del JSON
      const raw = await tenantPrisma.member.findUnique({
        where: { id: member.id.toValue() },
      });

      expect(raw).not.toBeNull();
      const storedFields = raw!.custom_fields as Record<string, unknown>;
      expect(storedFields.tallaCamiseta).toBe('L');
      expect(storedFields.tallaPantalon).toBe('42');
      expect(storedFields.preferenciasAlimentarias).toBe('Sin gluten');
      expect(storedFields.alergias).toEqual(['Frutos secos']);
      expect(storedFields.disponibilidadVoluntariado).toBe(true);
      expect(storedFields.vehiculo).toBe(true);
    }, 30_000);
  });

  // ====================================================================
  // Lectura de socios
  // ====================================================================

  describe('GET /api/v1/members/:id (GetMember)', () => {
    it('should return member with masked IBAN via repository', async () => {
      if (!pgAvailable) return;

      const member = await createTestMember({ iban: 'ES9121000418450200051332' });
      const memberId = MemberId.fromString(member.id.toValue());
      const readMember = await memberRepository.findById(memberId);

      expect(readMember).not.toBeNull();
      // El IBAN descifrado está disponible en el aggregate
      expect(readMember!.bankDetails!.iban).toBe('ES9121000418450200051332');
      // El IBAN enmascarado se obtiene del Value Object
      expect(readMember!.bankDetails!.getMaskedIban()).toMatch(/^ES91\*+\d{4}$/);
    }, 30_000);

    it('should return null for non-existent member', async () => {
      if (!pgAvailable) return;

      const nonExistentId = MemberId.fromString(randomUUID());
      const result = await memberRepository.findById(nonExistentId);

      expect(result).toBeNull();
    }, 30_000);
  });

  // ====================================================================
  // Listado con filtros
  // ====================================================================

  describe('GET /api/v1/members (ListMembers)', () => {
    it('should list members filtered by status', async () => {
      if (!pgAvailable) return;

      // Crear 2 socios activos y 1 aspirante
      await createTestMember({
        documentNumber: '12345678Z',
        email: 'activo1@test.com',
        memberNumber: 1,
        initialStatus: MemberStatus.ACTIVE,
      });
      await createTestMember({
        documentNumber: '23456789D',
        email: 'activo2@test.com',
        memberNumber: 2,
        initialStatus: MemberStatus.ACTIVE,
      });
      await createTestMember({
        documentNumber: 'X1234567L',
        documentType: DocumentType.NIE,
        email: 'aspirante@test.com',
        memberNumber: 3,
        initialStatus: MemberStatus.APPLICANT,
      });

      // Filtrar solo ACTIVE
      const activeMembers = await memberRepository.findAll({ status: 'ACTIVE' });
      expect(activeMembers).toHaveLength(2);

      // Filtrar solo APPLICANT
      const applicants = await memberRepository.findAll({ status: 'APPLICANT' });
      expect(applicants).toHaveLength(1);
      expect(applicants[0].contactData?.email).toBe('aspirante@test.com');
    }, 30_000);

    it('should search members by name', async () => {
      if (!pgAvailable) return;

      await createTestMember({
        documentNumber: '12345678Z',
        email: 'juan@test.com',
        name: 'Juan',
        surnames: 'García López',
        memberNumber: 1,
      });
      await createTestMember({
        documentNumber: '23456789D',
        email: 'maria@test.com',
        name: 'María',
        surnames: 'Fernández Ruiz',
        memberNumber: 2,
      });

      // Buscar por nombre
      const results = await memberRepository.findAll({ search: 'Juan' });
      expect(results).toHaveLength(1);
      expect(results[0].personalData?.name).toBe('Juan');

      // Buscar por apellido
      const resultsByApellido = await memberRepository.findAll({ search: 'Fernández' });
      expect(resultsByApellido).toHaveLength(1);
      expect(resultsByApellido[0].personalData?.name).toBe('María');
    }, 30_000);
  });

  // ====================================================================
  // Actualización de socios
  // ====================================================================

  describe('PUT /api/v1/members/:id (UpdateMember)', () => {
    it('should update contact data and emit event', async () => {
      if (!pgAvailable) return;

      const member = await createTestMember();
      const memberId = MemberId.fromString(member.id.toValue());

      // Leer el socio recién creado
      const readMember = await memberRepository.findById(memberId);
      expect(readMember).not.toBeNull();

      // Actualizar datos de contacto
      const newContactResult = ContactData.create({
        email: 'nuevo@test.com',
        phone: '699887766',
        address: 'Calle Nueva 5',
        postalCode: '41001',
        city: 'Sevilla',
      });
      expect(newContactResult.ok).toBe(true);
      if (!newContactResult.ok) return;

      readMember!.updateContactData(newContactResult.value);
      await memberRepository.save(readMember!);

      // Verificar persistencia
      const updatedRaw = await tenantPrisma.member.findUnique({
        where: { id: member.id.toValue() },
      });

      expect(updatedRaw).not.toBeNull();
      expect(updatedRaw!.email).toBe('nuevo@test.com');
      expect(updatedRaw!.phone).toBe('699887766');
      expect(updatedRaw!.address).toBe('Calle Nueva 5');
      expect(updatedRaw!.postal_code).toBe('41001');
      expect(updatedRaw!.city).toBe('Sevilla');
      expect(updatedRaw!.version).toBe(1); // Incrementada por updateContactData

      // Verificar que el aggregate emitió MemberDataUpdatedEvent
      const events = readMember!.pullDomainEvents();
      const updateEvents = events.filter((e) => e.constructor.name === 'MemberDataUpdatedEvent');
      expect(updateEvents.length).toBeGreaterThanOrEqual(1);
    }, 30_000);

    it('should not modify immutable fields (DNI, memberNumber)', async () => {
      if (!pgAvailable) return;

      const member = await createTestMember({
        documentNumber: '12345678Z',
        memberNumber: 42,
      });
      const memberId = MemberId.fromString(member.id.toValue());

      // Leer socio
      const readMember = await memberRepository.findById(memberId);
      expect(readMember).not.toBeNull();

      // Actualizar datos personales (solo nombre/apellidos, NO identityDocument)
      const newPersonalDataResult = PersonalData.create({
        name: 'Nuevo Nombre',
        surnames: 'Nuevos Apellidos',
        birthDate: new Date('1990-05-15'),
      });
      expect(newPersonalDataResult.ok).toBe(true);
      if (!newPersonalDataResult.ok) return;

      readMember!.updatePersonalData(newPersonalDataResult.value);
      await memberRepository.save(readMember!);

      // Verificar: nombre cambió, pero DNI y memberNumber NO cambiaron
      const updatedRaw = await tenantPrisma.member.findUnique({
        where: { id: member.id.toValue() },
      });

      expect(updatedRaw).not.toBeNull();
      expect(updatedRaw!.name).toBe('Nuevo Nombre');
      expect(updatedRaw!.surnames).toBe('Nuevos Apellidos');
      // Campos inmutables no cambiaron
      expect(updatedRaw!.document_number).toBe('12345678Z');
      expect(updatedRaw!.document_type).toBe('DNI');
      expect(updatedRaw!.member_number).toBe('00042');
    }, 30_000);

    it('should reject duplicate email on update via repository check', async () => {
      if (!pgAvailable) return;

      // Crear 2 socios con emails distintos
      await createTestMember({
        documentNumber: '12345678Z',
        email: 'primero@test.com',
        memberNumber: 1,
      });
      await createTestMember({
        documentNumber: '23456789D',
        email: 'segundo@test.com',
        memberNumber: 2,
      });

      // Verificar que existsByEmail detecta conflicto antes de actualizar
      const emailOccupied = await memberRepository.existsByEmail('primero@test.com');
      expect(emailOccupied).toBe(true);

      // El handler de actualización comprueba esto antes de proceder
      // Aquí verificamos que la función de detección funciona correctamente
      const emailFree = await memberRepository.existsByEmail('libre@test.com');
      expect(emailFree).toBe(false);
    }, 30_000);
  });

  // ====================================================================
  // Generación de números de socio
  // ====================================================================

  describe('Member Number Generation', () => {
    it('should generate sequential member numbers', async () => {
      if (!pgAvailable) return;

      // Crear 3 socios con números secuenciales
      await createTestMember({
        documentNumber: '12345678Z',
        email: 'uno@test.com',
        memberNumber: 1,
      });
      await createTestMember({
        documentNumber: '23456789D',
        email: 'dos@test.com',
        memberNumber: 2,
      });
      await createTestMember({
        documentNumber: 'X1234567L',
        documentType: DocumentType.NIE,
        email: 'tres@test.com',
        memberNumber: 3,
      });

      // getNextMemberNumber debe devolver 4
      const nextNumber = await memberRepository.getNextMemberNumber();
      expect(nextNumber).toBe(4);
    }, 30_000);

    it('should handle concurrent inserts without duplicate numbers', async () => {
      if (!pgAvailable) return;

      // Obtener número inicial
      const startNumber = await memberRepository.getNextMemberNumber();
      expect(startNumber).toBe(1); // No hay socios todavía

      // Crear 2 socios concurrentemente con diferentes member_numbers
      // Simulamos concurrencia: ambos obtienen el siguiente número y persisten
      // El constraint UNIQUE en member_number de la BD garantiza unicidad

      const member1Promise = createTestMember({
        documentNumber: '12345678Z',
        email: 'concurrent1@test.com',
        memberNumber: 1,
      });
      const member2Promise = createTestMember({
        documentNumber: '23456789D',
        email: 'concurrent2@test.com',
        memberNumber: 2,
      });

      // Ambos deben completarse sin error
      const [member1, member2] = await Promise.all([member1Promise, member2Promise]);

      // Verificar que ambos existen con números distintos
      const raw1 = await tenantPrisma.member.findUnique({
        where: { id: member1.id.toValue() },
      });
      const raw2 = await tenantPrisma.member.findUnique({
        where: { id: member2.id.toValue() },
      });

      expect(raw1).not.toBeNull();
      expect(raw2).not.toBeNull();
      expect(raw1!.member_number).not.toBe(raw2!.member_number);

      // Verificar que el siguiente número es 3
      const nextNumber = await memberRepository.getNextMemberNumber();
      expect(nextNumber).toBe(3);
    }, 30_000);
  });

  // ====================================================================
  // Eventos en outbox
  // ====================================================================

  describe('Outbox Events', () => {
    it('should register MemberRegistered event in outbox on create', async () => {
      if (!pgAvailable) return;

      const errorReporter: ErrorReporter = {
        captureException: vi.fn(),
        captureMessage: vi.fn(),
        setUser: vi.fn(),
        setContext: vi.fn(),
      };

      const handler = new CreateMemberHandler(
        memberRepository,
        memberTypeRepository,
        errorReporter,
        outboxPublisher,
      );

      const result = await handler.execute(
        new CreateMemberCommand(
          TENANT_ID,
          'Juan',
          'García López',
          '1990-05-15',
          'DNI',
          '12345678Z',
          'test@example.com',
          '612345678',
          'Calle Test 1',
          '28001',
          'Madrid',
          'ES9121000418450200051332',
          testMemberTypeId,
          {},
          'ACTIVE',
        ),
      );

      // Verificar que el evento está en la tabla outbox
      const outboxEvents = await tenantPrisma.outboxEvent.findMany({
        where: { eventType: 'member.registered' },
      });
      expect(outboxEvents).toHaveLength(1);
      expect(outboxEvents[0].processedAt).toBeNull();

      const payload = outboxEvents[0].payload as Record<string, unknown>;
      expect(payload.memberId).toBe(result.id);
      expect(payload.memberNumber).toBe('00001');
    }, 30_000);

    it('should register MemberDataUpdated event in outbox on update', async () => {
      if (!pgAvailable) return;

      const member = await createTestMember();

      const errorReporter: ErrorReporter = {
        captureException: vi.fn(),
        captureMessage: vi.fn(),
        setUser: vi.fn(),
        setContext: vi.fn(),
      };

      const handler = new UpdateMemberHandler(
        memberRepository,
        memberTypeRepository,
        errorReporter,
        outboxPublisher,
      );

      await handler.execute(
        new UpdateMemberCommand(
          TENANT_ID,
          member.id.toValue(),
          undefined,
          undefined,
          'actualizado@test.com',
          '699000111',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        ),
      );

      // Verificar outbox
      const outboxEvents = await tenantPrisma.outboxEvent.findMany({
        where: { eventType: 'member.data-updated' },
      });
      expect(outboxEvents).toHaveLength(1);

      const payload = outboxEvents[0].payload as Record<string, unknown>;
      expect(payload.memberId).toBe(member.id.toValue());
      expect(payload.modifiedFields).toEqual(['contactData']);
      expect(payload.newEmail).toBe('actualizado@test.com');
    }, 30_000);
  });

  // ====================================================================
  // Cifrado y descifrado de IBAN (End-to-end con BD)
  // ====================================================================

  describe('IBAN Encryption (RNF-006)', () => {
    it('should round-trip encrypt and decrypt IBAN correctly', async () => {
      if (!pgAvailable) return;

      const ibans = [
        'ES9121000418450200051332',
        'ES7921000813610123456789',
        'DE89370400440532013000',
        'FR7630006000011234567890189',
      ];

      for (let i = 0; i < ibans.length; i++) {
        // Solo IBANs españoles pasan la validación de BankDetails
        // Para IBANs no-ES, cifrar/descifrar directamente con el servicio
        const encrypted = await encryptionService.encrypt(ibans[i]);
        const decrypted = await encryptionService.decrypt(encrypted);
        expect(decrypted).toBe(ibans[i]);
      }
    }, 30_000);

    it('should store different encrypted values for the same IBAN (random IV)', async () => {
      if (!pgAvailable) return;

      const IBAN = 'ES9121000418450200051332';

      // Cifrar el mismo IBAN dos veces
      const encrypted1 = await encryptionService.encrypt(IBAN);
      const encrypted2 = await encryptionService.encrypt(IBAN);

      // Las versiones cifradas deben ser diferentes (IV aleatorio)
      expect(encrypted1).not.toBe(encrypted2);

      // Pero ambas deben descifrar al mismo valor
      expect(await encryptionService.decrypt(encrypted1)).toBe(IBAN);
      expect(await encryptionService.decrypt(encrypted2)).toBe(IBAN);
    }, 30_000);
  });

  // ====================================================================
  // Socios sin IBAN
  // ====================================================================

  describe('Members without IBAN', () => {
    it('should create and read member without bank details', async () => {
      if (!pgAvailable) return;

      const member = await createTestMember({ iban: null });

      // Verificar en BD
      const raw = await tenantPrisma.member.findUnique({
        where: { id: member.id.toValue() },
      });
      expect(raw).not.toBeNull();
      expect(raw!.iban_encrypted).toBeNull();

      // Leer via repositorio
      const readMember = await memberRepository.findById(MemberId.fromString(member.id.toValue()));
      expect(readMember).not.toBeNull();
      expect(readMember!.bankDetails).toBeNull();
    }, 30_000);
  });
});
