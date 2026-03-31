import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CloseSubscriptionHandler } from '../close-subscription.handler';
import { CloseSubscriptionCommand } from '../close-subscription.command';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { IntegrationEventPublisher } from '../../../../shared/application/ports/integration-event.publisher';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { FeeSubscription } from '../../../domain/entities/fee-subscription';
import { FeePlan } from '../../../domain/aggregates/fee-plan';
import { Discount } from '../../../domain/value-objects/discount';
import { MemberAccountNotFoundError, SubscriptionNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ACCOUNT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FEE_PLAN_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un FeePlan reconstituido para obtener el Money del amount. */
function createFeePlan(): FeePlan {
  return FeePlan.reconstitute({
    id: FEE_PLAN_ID,
    code: 'CUOTA-ANUAL',
    name: 'Cuota Anual',
    description: null,
    type: 'RECURRING',
    frequency: 'ANNUAL',
    amount: 12000,
    billingMonths: [1],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/** Crea una suscripción activa. */
function createActiveSubscription(): FeeSubscription {
  const discountResult = Discount.create(0, 0);
  if (!discountResult.ok) throw discountResult.error;

  return FeeSubscription.create({
    feePlanId: FEE_PLAN_ID,
    registrationDate: new Date('2025-01-01'),
    discount: discountResult.value,
    feePlanAmount: createFeePlan().amount,
    personalDiscountReason: null,
  });
}

/** Variable para la suscripción activa compartida. */
let activeSubscription: FeeSubscription;

/** Crea un MemberAccount con una suscripción activa. */
function createMemberAccountWithSubscription(): MemberAccount {
  activeSubscription = createActiveSubscription();
  return MemberAccount.reconstitute({
    id: MEMBER_ACCOUNT_ID,
    memberId: MEMBER_ID,
    tenantId: TENANT_ID,
    subscriptions: [activeSubscription],
    createdAt: new Date(),
  });
}

describe('CloseSubscriptionHandler', () => {
  let handler: CloseSubscriptionHandler;
  let memberAccountRepository: MemberAccountRepository;
  let outboxPublisher: IntegrationEventPublisher;

  beforeEach(() => {
    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(createMemberAccountWithSubscription()),
      findByMemberId: vi.fn().mockResolvedValue(null),
      existsByMemberId: vi.fn().mockResolvedValue(false),
      findAllWithActiveSubscriptions: vi.fn().mockResolvedValue([]),
    };

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    handler = new CloseSubscriptionHandler(memberAccountRepository, outboxPublisher);
  });

  /** Crea un comando válido con overrides opcionales. */
  function validCommand(
    overrides: Partial<CloseSubscriptionCommand> = {},
  ): CloseSubscriptionCommand {
    return new CloseSubscriptionCommand(
      overrides.tenantId ?? TENANT_ID,
      overrides.memberAccountId ?? MEMBER_ACCOUNT_ID,
      overrides.subscriptionId ?? activeSubscription.id.toValue(),
      overrides.cancelReason ?? 'MEMBER_LEAVE',
    );
  }

  it('debería cerrar suscripción con motivo MEMBER_LEAVE y publicar eventos', async () => {
    const command = validCommand({ cancelReason: 'MEMBER_LEAVE' });

    // El handler retorna void
    await expect(handler.execute(command)).resolves.toBeUndefined();

    // Verificar configuración de tenantId
    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);

    // Verificar persistencia y publicación de eventos
    expect(memberAccountRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledWith(TENANT_ID, expect.any(Array));
  });

  it('debería cerrar suscripción con motivo EXEMPTION correctamente', async () => {
    const command = validCommand({ cancelReason: 'EXEMPTION' });

    await expect(handler.execute(command)).resolves.toBeUndefined();

    expect(memberAccountRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledWith(TENANT_ID, expect.any(Array));
  });

  it('debería lanzar SubscriptionNotFoundError cuando la suscripción no existe', async () => {
    const command = validCommand({
      subscriptionId: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    await expect(handler.execute(command)).rejects.toThrow(SubscriptionNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar MemberAccountNotFoundError cuando la cuenta no existe', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberAccountNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });
});
