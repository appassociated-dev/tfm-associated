import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de entrada para el cierre de una suscripción.
 * Validado con class-validator y documentado con Swagger.
 */
export class CloseSubscriptionDto {
  @ApiProperty({
    description: 'Motivo de cancelación de la suscripción',
    example: 'MEMBER_LEAVE',
    enum: ['PLAN_CHANGE', 'MEMBER_LEAVE', 'EXEMPTION', 'ONE_TIME_COMPLETED'],
  })
  @IsEnum(['PLAN_CHANGE', 'MEMBER_LEAVE', 'EXEMPTION', 'ONE_TIME_COMPLETED'], {
    message:
      'El motivo de cancelación debe ser PLAN_CHANGE, MEMBER_LEAVE, EXEMPTION o ONE_TIME_COMPLETED.',
  })
  cancelReason!: string;
}
