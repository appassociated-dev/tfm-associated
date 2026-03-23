/**
 * Re-exportación del puerto de cifrado desde shared.
 * El puerto se movió a shared/domain/ports/ para uso cross-BC (Identity + Membership).
 * Este archivo mantiene compatibilidad hacia atrás con los imports existentes.
 *
 * @deprecated Importar desde '@shared/domain/ports/encryption-service.port' o '@shared/domain'.
 */
export {
  ENCRYPTION_SERVICE,
  type EncryptionService,
} from '../../../shared/domain/ports/encryption-service.port';
