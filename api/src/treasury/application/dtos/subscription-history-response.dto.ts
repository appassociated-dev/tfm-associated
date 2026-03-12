import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberAccount } from '../../domain/aggregates/member-account';
import { SubscriptionResponseDto } from './subscription-response.dto';

/**
 * DTO de respuesta para el historial de suscripciones de una cuenta de socio.
 * Incluye la suscripción activa y el historial completo.
 */
export class SubscriptionHistoryResponseDto {
  @ApiProperty({ description: 'ID de la cuenta de socio (UUID)' })
  memberAccountId!: string;

  @ApiProperty({ description: 'ID del socio (UUID)' })
  memberId!: string;

  @ApiPropertyOptional({
    description: 'Suscripción periódica activa (null si no existe)',
    type: () => SubscriptionResponseDto,
  })
  activeSubscription!: SubscriptionResponseDto | null;

  @ApiProperty({
    description: 'Historial completo de suscripciones ordenado por fecha de alta descendente',
    type: () => [SubscriptionResponseDto],
  })
  history!: SubscriptionResponseDto[];

  /**
   * Construye un DTO de respuesta a partir del aggregate MemberAccount
   * y las suscripciones ya mapeadas a DTOs.
   */
  static fromDomain(
    account: MemberAccount,
    subscriptions: SubscriptionResponseDto[],
    activeSubscription: SubscriptionResponseDto | null,
  ): SubscriptionHistoryResponseDto {
    const dto = new SubscriptionHistoryResponseDto();
    dto.memberAccountId = account.id.toValue();
    dto.memberId = account.memberId;
    dto.activeSubscription = activeSubscription;
    dto.history = subscriptions;
    return dto;
  }
}
