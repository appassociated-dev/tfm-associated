import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para provisionar un nuevo tenant.
 * Contiene todos los datos necesarios para crear la colectividad y su admin.
 */
export class ProvisionTenantCommand implements ICommand {
  constructor(
    /** Nombre de la colectividad. */
    public readonly name: string,
    /** Tipo de colectividad (PENA, COFRADIA, CLUB_DEPORTIVO, ASOCIACION_CULTURAL). */
    public readonly collectivityType: string,
    /** CIF de la colectividad (identificador fiscal español). */
    public readonly cif: string,
    /** Email de contacto de la colectividad. */
    public readonly contactEmail: string,
    /** Nombre del usuario administrador inicial. */
    public readonly adminName: string,
    /** Email del usuario administrador inicial. */
    public readonly adminEmail: string,
    /** Contraseña del usuario administrador inicial. */
    public readonly adminPassword: string,
  ) {}
}
