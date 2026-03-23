/**
 * Re-exportación del servicio de cifrado desde shared.
 * La implementación se movió a shared/infrastructure/services/ para uso cross-BC.
 * Este archivo mantiene compatibilidad hacia atrás con los imports existentes.
 *
 * @deprecated Importar desde '@shared/infrastructure/services/aes256-encryption.service'.
 */
export { Aes256EncryptionService } from '../../../shared/infrastructure/services/aes256-encryption.service';
