import { describe, it, expect } from 'vitest';
import { MemberTypePrismaMapper, PrismaRawMemberType } from '../member-type-prisma.mapper';
import { MemberType } from '../../../domain/aggregates/member-type';

describe('MemberTypePrismaMapper', () => {
  const validRaw: PrismaRawMemberType = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    code: 'NUMERARIO',
    name: 'Hermano Numerario',
    description: 'Hermano de pleno derecho.',
    ageRangeMin: 18,
    ageRangeMax: null,
    votingRight: true,
    eligibleForOffice: true,
    minimumSeniorityForVoting: 6,
    minimumSeniorityForOffice: 24,
    automaticTransitionTargetId: null,
    rulesConfig: {},
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('toDomain', () => {
    it('debería convertir un registro Prisma a un aggregate MemberType', () => {
      const memberType = MemberTypePrismaMapper.toDomain(validRaw);

      expect(memberType).toBeInstanceOf(MemberType);
      expect(memberType.id.toValue()).toBe(validRaw.id);
      expect(memberType.code.value).toBe(validRaw.code);
      expect(memberType.name).toBe(validRaw.name);
      expect(memberType.description).toBe(validRaw.description);
      expect(memberType.ageRange.min).toBe(validRaw.ageRangeMin);
      expect(memberType.ageRange.max).toBe(validRaw.ageRangeMax);
      expect(memberType.votingRight).toBe(validRaw.votingRight);
      expect(memberType.eligibleForOffice).toBe(validRaw.eligibleForOffice);
      expect(memberType.minimumSeniorityForVoting).toBe(validRaw.minimumSeniorityForVoting);
      expect(memberType.minimumSeniorityForOffice).toBe(validRaw.minimumSeniorityForOffice);
      expect(memberType.automaticTransitionTargetId).toBeNull();
      expect(memberType.active).toBe(validRaw.active);
    });

    it('debería manejar description null como cadena vacía', () => {
      const rawWithNull = { ...validRaw, description: null };
      const memberType = MemberTypePrismaMapper.toDomain(rawWithNull);

      expect(memberType.description).toBe('');
    });

    it('debería aceptar un collectivityType personalizado', () => {
      const memberType = MemberTypePrismaMapper.toDomain(validRaw, 'COFRADIA');

      expect(memberType).toBeInstanceOf(MemberType);
    });
  });

  describe('toPersistence', () => {
    it('debería convertir un aggregate MemberType a datos de persistencia', () => {
      const memberType = MemberTypePrismaMapper.toDomain(validRaw);
      const data = MemberTypePrismaMapper.toPersistence(memberType);

      expect(data.id).toBe(validRaw.id);
      expect(data.code).toBe(validRaw.code);
      expect(data.name).toBe(validRaw.name);
      expect(data.description).toBe(validRaw.description);
      expect(data.ageRangeMin).toBe(validRaw.ageRangeMin);
      expect(data.ageRangeMax).toBe(validRaw.ageRangeMax);
      expect(data.votingRight).toBe(validRaw.votingRight);
      expect(data.eligibleForOffice).toBe(validRaw.eligibleForOffice);
      expect(data.automaticTransitionTargetId).toBeNull();
      expect(data.active).toBe(validRaw.active);
    });

    it('debería preservar automaticTransitionTargetId cuando existe', () => {
      const targetId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
      const rawWithTarget = { ...validRaw, automaticTransitionTargetId: targetId };
      const memberType = MemberTypePrismaMapper.toDomain(rawWithTarget);
      const data = MemberTypePrismaMapper.toPersistence(memberType);

      expect(data.automaticTransitionTargetId).toBe(targetId);
    });
  });
});
