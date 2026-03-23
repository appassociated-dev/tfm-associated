import { AggregateRoot } from '../../../shared/domain';
import { UserId } from '../value-objects/user-id';
import { Email } from '../value-objects/email';
import { PasswordHash } from '../value-objects/password-hash';
import { UserStatus } from '../value-objects/user-status';
import { UserAuthenticatedEvent } from '../events/user-authenticated.event';
import { AuthenticationFailedEvent } from '../events/authentication-failed.event';
import { UserBlockedEvent } from '../events/user-blocked.event';
import type { PasswordHasher } from '../ports/password-hasher.port';

/** Constantes de configuración de bloqueo. */
const SLIDING_WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

/** Tipo Result para operaciones que pueden fallar sin lanzar excepciones. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Error de dominio para autenticación. */
export class AuthenticationError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
  }
}

/** Propiedades para crear un nuevo User via factory method. */
export interface CreateUserProps {
  email: string;
  passwordHash: string;
  name: string;
}

/** Propiedades completas para reconstituir un User desde persistencia. */
export interface ReconstituteUserProps {
  id: UserId;
  email: Email;
  passwordHash: PasswordHash;
  name: string;
  status: UserStatus;
  failedAttempts: number;
  failedAttemptTimestamps: Date[];
  blockedUntil: Date | null;
  createdAt: Date;
  lastAccess: Date | null;
}

/**
 * Aggregate Root que representa un usuario del sistema.
 * Gestiona la autenticación, el bloqueo por intentos fallidos
 * y la ventana deslizante de 10 minutos para el conteo de intentos.
 */
export class User extends AggregateRoot<UserId> {
  private readonly _email: Email;
  private readonly _passwordHash: PasswordHash;
  private readonly _name: string;
  private _status: UserStatus;
  private _failedAttempts: number;
  private _failedAttemptTimestamps: Date[];
  private _blockedUntil: Date | null;
  private readonly _createdAt: Date;
  private _lastAccess: Date | null;

  private constructor(props: ReconstituteUserProps) {
    super(props.id);
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._name = props.name;
    this._status = props.status;
    this._failedAttempts = props.failedAttempts;
    this._failedAttemptTimestamps = [...props.failedAttemptTimestamps];
    this._blockedUntil = props.blockedUntil;
    this._createdAt = props.createdAt;
    this._lastAccess = props.lastAccess;
  }

  // --- Getters ---

  get email(): Email {
    return this._email;
  }

  get passwordHash(): PasswordHash {
    return this._passwordHash;
  }

  get name(): string {
    return this._name;
  }

  get status(): UserStatus {
    return this._status;
  }

  get failedAttempts(): number {
    return this._failedAttempts;
  }

  get blockedUntil(): Date | null {
    return this._blockedUntil;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get lastAccess(): Date | null {
    return this._lastAccess;
  }

  get failedAttemptTimestamps(): Date[] {
    return [...this._failedAttemptTimestamps];
  }

  // --- Métodos de negocio ---

  /**
   * Autentica al usuario verificando su contraseña.
   * Comprueba primero si la cuenta está bloqueada (ventana deslizante).
   * Emite UserAuthenticatedEvent en éxito o registra intento fallido.
   *
   * @param password - Contraseña en texto plano a verificar.
   * @param hasher - Puerto de hashing inyectado (Domain Service pattern).
   * @returns Result con void en éxito o AuthenticationError en fallo.
   */
  async authenticate(
    password: string,
    hasher: PasswordHasher,
  ): Promise<Result<void, AuthenticationError>> {
    // Verificar si la cuenta está bloqueada
    if (this.isBlocked()) {
      const remaining = this.getBlockTimeRemaining();
      const minutesRemaining = Math.ceil(remaining / 60000);
      return {
        ok: false,
        error: new AuthenticationError(
          `Cuenta bloqueada. Intente de nuevo en ${minutesRemaining} minuto(s).`,
          'USER.ACCOUNT_BLOCKED',
        ),
      };
    }

    // Verificar contraseña con el hasher inyectado
    const isValid = await hasher.verify(password, this._passwordHash.value);

    if (!isValid) {
      this.recordFailedAttempt();

      // Emitir evento de fallo de autenticación para auditoría
      this.addDomainEvent(
        new AuthenticationFailedEvent({
          email: this._email.value,
          ipAddress: '', // Se completará en la capa de aplicación cuando esté disponible
          timestamp: new Date(),
          attemptCount: this._failedAttempts,
        }),
      );

      return {
        ok: false,
        error: new AuthenticationError('Credenciales inválidas.', 'USER.INVALID_CREDENTIALS'),
      };
    }

    // Autenticación exitosa: limpiar intentos y actualizar acceso
    this._failedAttempts = 0;
    this._failedAttemptTimestamps = [];
    this._lastAccess = new Date();

    // Emitir evento de autenticación exitosa
    // Nota: tenantId, ipAddress, userAgent se completarán en el handler de aplicación
    this.addDomainEvent(
      new UserAuthenticatedEvent({
        userId: this._id.toValue(),
        tenantId: '', // Se completa en el handler
        email: this._email.value,
        rol: '', // Se completa en el handler
        ipAddress: '', // Se completa en el handler
        userAgent: '', // Se completa en el handler
        timestamp: new Date(),
      }),
    );

    return { ok: true, value: undefined };
  }

  /**
   * Registra un intento fallido de autenticación.
   * Aplica ventana deslizante de 10 minutos y bloquea si se superan 5 intentos.
   */
  recordFailedAttempt(): void {
    const now = new Date();
    this._failedAttemptTimestamps.push(now);

    // Filtrar timestamps: solo los de la ventana de 10 minutos
    const windowStart = new Date(now.getTime() - SLIDING_WINDOW_MS);
    this._failedAttemptTimestamps = this._failedAttemptTimestamps.filter(
      (ts) => ts.getTime() > windowStart.getTime(),
    );

    // Actualizar conteo basado en la ventana
    this._failedAttempts = this._failedAttemptTimestamps.length;

    // Bloquear si se alcanzan los intentos máximos
    if (this._failedAttempts >= MAX_FAILED_ATTEMPTS) {
      this._blockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);
      this._status = UserStatus.blocked();

      this.addDomainEvent(
        new UserBlockedEvent({
          userId: this._id.toValue(),
          email: this._email.value,
          blockReason: `${MAX_FAILED_ATTEMPTS} intentos fallidos en ${SLIDING_WINDOW_MS / 60000} minutos`,
          blockDuration: BLOCK_DURATION_MS,
          timestamp: now,
        }),
      );
    }
  }

  /**
   * Verifica si la cuenta está actualmente bloqueada.
   * Auto-desbloquea si el período de bloqueo ha expirado.
   */
  isBlocked(): boolean {
    if (this._blockedUntil === null) {
      return false;
    }

    if (this._blockedUntil.getTime() > Date.now()) {
      return true;
    }

    // Auto-desbloqueo: el período ha expirado
    this._blockedUntil = null;
    this._status = UserStatus.active();
    this._failedAttempts = 0;
    this._failedAttemptTimestamps = [];
    return false;
  }

  /** Devuelve milisegundos restantes de bloqueo, o 0 si no está bloqueado. */
  getBlockTimeRemaining(): number {
    if (this._blockedUntil === null) {
      return 0;
    }

    const remaining = this._blockedUntil.getTime() - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  // --- Factory Methods ---

  /**
   * Crea un nuevo User con validación de invariantes.
   * Genera UUID y establece valores iniciales.
   */
  static create(props: CreateUserProps): User {
    // Validar invariantes
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('El nombre del usuario no puede estar vacío.');
    }

    const userId = UserId.create();
    const email = Email.create(props.email);
    const passwordHash = PasswordHash.fromHash(props.passwordHash);
    const now = new Date();

    return new User({
      id: userId,
      email,
      passwordHash,
      name: props.name,
      status: UserStatus.active(),
      failedAttempts: 0,
      failedAttemptTimestamps: [],
      blockedUntil: null,
      createdAt: now,
      lastAccess: null,
    });
  }

  /**
   * Reconstituye un User desde persistencia sin emitir eventos ni validar.
   * Usado para hidratar el aggregate desde el repositorio.
   */
  static reconstitute(props: ReconstituteUserProps): User {
    return new User(props);
  }
}
