import type { DomainEvent } from '../../domain/domain-event.base';

/**
 * Alias del tipo de cliente Prisma dentro de una transacción interactiva del tenant.
 * Es el parámetro `tx` que Prisma pasa al callback de `$transaction(async (tx) => ...)`.
 *
 * En el cliente Prisma real, este tipo es:
 *   Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
 *
 * Aquí usamos `unknown` con una interfaz estructural mínima para evitar acoplamiento
 * con los tipos concretos generados por Prisma, que varían entre main y tenant DBs.
 * Los consumidores pasan el objeto `tx` directamente y TypeScript lo valida en el punto de uso.
 */
export type PrismaTransactionClient = {
  outboxEvent: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
};

/**
 * Token de inyección para el puerto DomainAuditPublisher.
 * Implementado por PrismaDomainAuditPublisher en la capa de infraestructura.
 */
export const DOMAIN_AUDIT_PUBLISHER = Symbol('DOMAIN_AUDIT_PUBLISHER');

/**
 * Puerto de salida para escribir eventos de auditoría en el outbox del tenant (DB-Tenant).
 * Las escrituras ocurren DENTRO de la transacción del dominio para garantizar atomicidad (GAP-011).
 * La tabla tenant.outbox_events es de solo auditoría — no tiene columnas de retry.
 */
export interface DomainAuditPublisher {
  publish(txClient: PrismaTransactionClient, events: DomainEvent[]): Promise<void>;
}
