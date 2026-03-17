import { describe, it, expect } from 'vitest';
import { MemberAccountPrismaMapper, PrismaRawMemberAccount } from '../member-account-prisma.mapper';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { Charge } from '../../../domain/entities/charge';
import { Payment } from '../../../domain/entities/payment';
import { ChargeId } from '../../../domain/value-objects/charge-id';

describe('MemberAccountPrismaMapper', () => {
  it('debería hidratar cargos y pagos al reconstituir el aggregate', () => {
    const raw: PrismaRawMemberAccount = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      memberId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      balance: 2450,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-02T00:00:00Z'),
      subscriptions: [],
      charges: [
        {
          id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          memberAccountId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          feeSubscriptionId: null,
          baseAmount: 2450,
          finalAmount: 2450,
          description: 'Cuota Q1 2025',
          fiscalYearId: null,
          billingMonth: 1,
          billingYear: 2025,
          issueDate: new Date('2025-01-01'),
          dueDate: new Date('2025-01-31'),
          status: 'PENDING',
          paidAmount: 0,
          isProrated: false,
          isManual: false,
          createdAt: new Date('2025-01-01T00:00:00Z'),
        },
      ],
      payments: [
        {
          id: '00000000-0000-4000-a000-000000000001',
          memberAccountId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          chargeId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          amount: 1000,
          paymentMethod: 'CASH',
          paymentDate: new Date('2025-01-15'),
          paymentReference: 'EF-2025-00001',
          receiptNumber: 'REC-2025-00001',
          receiptDocument: null,
          notes: 'Parcial',
          registeredBy: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          status: 'CONFIRMED',
          createdAt: new Date('2025-01-15T00:00:00Z'),
        },
      ],
    };

    const account = MemberAccountPrismaMapper.toDomain(raw, 'tenant-1');

    expect(account.charges).toHaveLength(1);
    expect(account.payments).toHaveLength(1);
    const linkedCharge = account.findChargeById(ChargeId.fromString(raw.payments![0].chargeId));
    expect(linkedCharge).not.toBeUndefined();
    expect(linkedCharge!.id.toValue()).toBe('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(account.getBalance().amount).toBe(2450);
  });

  it('debería exponer cargas y pagos al convertir a persistencia', () => {
    const account = MemberAccount.reconstitute({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      memberId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      tenantId: 'tenant-1',
      subscriptions: [],
      charges: [
        Charge.reconstitute({
          id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          subscriptionId: null,
          baseAmount: 2450,
          finalAmount: 2450,
          description: 'Cuota Q1 2025',
          fiscalYearId: null,
          billingMonth: 1,
          billingYear: 2025,
          issueDate: new Date('2025-01-01'),
          dueDate: new Date('2025-01-31'),
          status: 'PENDING',
          paidAmount: 0,
          isProrated: false,
          isManual: false,
          createdAt: new Date('2025-01-01T00:00:00Z'),
        }),
      ],
      payments: [
        Payment.reconstitute({
          id: '00000000-0000-4000-a000-000000000001',
          chargeId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          amount: 1000,
          paymentMethod: 'CASH',
          paymentDate: new Date('2025-01-15'),
          paymentReference: 'EF-2025-00001',
          receiptNumber: 'REC-2025-00001',
          notes: 'Parcial',
          registeredBy: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          status: 'CONFIRMED',
          createdAt: new Date('2025-01-15T00:00:00Z'),
        }),
      ],
      createdAt: new Date('2025-01-01T00:00:00Z'),
    });

    const persisted = MemberAccountPrismaMapper.toPersistence(account);

    expect(persisted).toHaveProperty('charges');
    expect(persisted).toHaveProperty('payments');
    expect(persisted.charges as unknown[]).toHaveLength(1);
    expect(persisted.payments as unknown[]).toHaveLength(1);
  });
});
