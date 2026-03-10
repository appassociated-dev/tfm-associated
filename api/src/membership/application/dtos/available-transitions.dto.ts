import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de salida para las transiciones de estado disponibles de un socio.
 */
export class AvailableTransitionsDto {
  @ApiProperty({ description: 'ID del socio (UUID)' })
  memberId!: string;

  @ApiProperty({ description: 'Estado actual del socio' })
  currentStatus!: string;

  @ApiProperty({
    description: 'Transiciones de estado disponibles desde el estado actual',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        description: { type: 'string' },
      },
    },
  })
  availableTransitions!: Array<{ status: string; description: string }>;
}
