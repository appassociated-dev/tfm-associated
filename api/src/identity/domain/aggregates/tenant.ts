import { AggregateRoot, DomainEvent } from '../../../shared/domain';
import { TenantId } from '../value-objects/tenant-id';
import { Cif } from '../value-objects/cif';
import { Slug } from '../value-objects/slug';
import { TenantStatus } from '../value-objects/tenant-status';
import { CollectivityType } from '../value-objects/collectivity-type';
import { buildTenantDatabaseName } from '../../../shared/infrastructure/persistence/build-tenant-database-name';
/** Propiedades para crear un nuevo Tenant via factory method. */
export interface CreateTenantProps {
  name: string;
  cif: string;
  type: string;
  contactEmail: string;
}

/** Propiedades completas para reconstituir un Tenant desde persistencia. */
export interface TenantProps {
  id: TenantId;
  name: string;
  slug: Slug;
  cif: Cif;
  type: CollectivityType;
  status: TenantStatus;
  databaseName: string;
  databaseUser: string | null;
  contactEmail: string;
  createdAt: Date;
}

/**
 * Aggregate Root que representa un tenant (colectividad) en el sistema.
 * Cada tenant tiene su propia base de datos aislada (ADR-002).
 */
export class Tenant extends AggregateRoot<TenantId> {
  private readonly _name: string;
  private readonly _slug: Slug;
  private readonly _cif: Cif;
  private readonly _type: CollectivityType;
  private readonly _status: TenantStatus;
  private readonly _databaseName: string;
  private readonly _databaseUser: string | null;
  private readonly _contactEmail: string;
  private readonly _createdAt: Date;

  private constructor(props: TenantProps) {
    super(props.id);
    this._name = props.name;
    this._slug = props.slug;
    this._cif = props.cif;
    this._type = props.type;
    this._status = props.status;
    this._databaseName = props.databaseName;
    this._databaseUser = props.databaseUser;
    this._contactEmail = props.contactEmail;
    this._createdAt = props.createdAt;
  }

  // --- Getters ---

  get name(): string {
    return this._name;
  }

  get slug(): Slug {
    return this._slug;
  }

  get cif(): Cif {
    return this._cif;
  }

  get type(): CollectivityType {
    return this._type;
  }

  get status(): TenantStatus {
    return this._status;
  }

  get databaseName(): string {
    return this._databaseName;
  }

  get databaseUser(): string | null {
    return this._databaseUser;
  }

  get contactEmail(): string {
    return this._contactEmail;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // --- Métodos de eventos ---

  /**
   * Registra un evento de dominio desde la capa de aplicación.
   * Permite al handler añadir eventos tras completar operaciones externas
   * (e.g., TenantProvisionedEvent con adminUserId ya conocido).
   */
  registerProvisionedEvent(event: DomainEvent): void {
    this.addDomainEvent(event);
  }

  // --- Factory Methods ---

  /**
   * Crea un nuevo Tenant con validación de invariantes.
   * Genera UUID, slug, databaseName y registra evento TenantProvisioned.
   */
  static create(props: CreateTenantProps): Tenant {
    // Validar invariantes
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('El nombre del tenant no puede estar vacío.');
    }

    if (!props.contactEmail || props.contactEmail.trim().length === 0) {
      throw new Error('El email de contacto no puede estar vacío.');
    }

    const tenantId = TenantId.create();
    const slug = Slug.fromName(props.name);
    const cif = Cif.create(props.cif);
    const type = CollectivityType.fromString(props.type);
    const status = TenantStatus.active();
    const databaseName = buildTenantDatabaseName(tenantId.toValue());
    const databaseUser = `tenant_${tenantId.toValue().replace(/-/g, '_')}`;
    const createdAt = new Date();

    const tenant = new Tenant({
      id: tenantId,
      name: props.name,
      slug,
      cif,
      type,
      status,
      databaseName,
      databaseUser,
      contactEmail: props.contactEmail,
      createdAt,
    });

    return tenant;
  }

  /**
   * Reconstituye un Tenant desde persistencia sin emitir eventos ni validar.
   * Usado para hidratar el aggregate desde el repositorio.
   */
  static reconstitute(props: TenantProps): Tenant {
    return new Tenant(props);
  }
}
