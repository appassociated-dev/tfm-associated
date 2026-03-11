import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de entrada para la generación de cargos prorrateados de una suscripción.
 * Validado con class-validator y documentado con Swagger.
 */
export class GenerateSubscriptionChargesDto {
  @ApiProperty({
    description: 'ID de la suscripción para la que se generan los cargos (UUID v4)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4', { message: 'El subscriptionId debe ser un UUID v4 válido.' })
  subscriptionId!: string;
}
