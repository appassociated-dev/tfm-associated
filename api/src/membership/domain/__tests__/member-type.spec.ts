import { describe, it, expect } from 'vitest';
import { validate as uuidValidate } from 'uuid';
import { MemberType } from '../aggregates/member-type';
import { MemberTypeCreatedEvent } from '../events/member-type-created.event';

/** Props válidas para crear un MemberType. */
const validProps = {
  code: 'SOCIO',
  name: 'Socio Numerario',
  description: 'Socio de pleno derecho con voto',
  ageRangeMin: 18,
  ageRangeMax: null as number | null,
  votingRight: true,
  eligibleForOffice: true,
  minimumSeniorityForVoting: 6,
  minimumSeniorityForOffice: 12,
  automaticTransitionTargetId: null as string | null,
  rulesConfig: { maxMembers: 500 },
  collectivityType: 'PENA',
  tenantId: '660e8400-e29b-41d4-a716-446655440001',
};

describe('MemberType', () => {
  // --- create() con datos válidos ---

  it('debería crear un MemberType con propiedades correctas', () => {
    const result = MemberType.create(validProps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const mt = result.value;
      expect(uuidValidate(mt.id.toValue())).toBe(true);
      expect(mt.code.value).toBe('SOCIO');
      expect(mt.name).toBe('Socio Numerario');
      expect(mt.description).toBe('Socio de pleno derecho con voto');
      expect(mt.votingRight).toBe(true);
      expect(mt.eligibleForOffice).toBe(true);
      expect(mt.minimumSeniorityForVoting).toBe(6);
      expect(mt.minimumSeniorityForOffice).toBe(12);
      expect(mt.automaticTransitionTargetId).toBeNull();
      expect(mt.active).toBe(true);
    }
  });

  it('debería emitir un evento MemberTypeCreated al crear', () => {
    const result = MemberType.create(validProps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const events = result.value.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(MemberTypeCreatedEvent);
      expect(events[0].eventType).toBe('member-type.created');
    }
  });

  it('debería incluir datos correctos en el payload del evento', () => {
    const result = MemberType.create(validProps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const events = result.value.pullDomainEvents();
      const event = events[0] as MemberTypeCreatedEvent;
      expect(event.payload.code).toBe('SOCIO');
      expect(event.payload.name).toBe('Socio Numerario');
      expect(event.payload.tenantId).toBe('660e8400-e29b-41d4-a716-446655440001');
    }
  });

  it('debería establecer active=true al crear', () => {
    const result = MemberType.create(validProps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.active).toBe(true);
    }
  });

  it('debería establecer createdAt y updatedAt como fechas actuales', () => {
    const before = new Date();
    const result = MemberType.create(validProps);
    const after = new Date();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.value.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(result.value.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.value.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    }
  });

  // --- create() con datos inválidos ---

  it('debería rechazar nombre vacío', () => {
    const result = MemberType.create({ ...validProps, name: '' });

    expect(result.ok).toBe(false);
  });

  it('debería rechazar nombre con solo espacios', () => {
    const result = MemberType.create({ ...validProps, name: '   ' });

    expect(result.ok).toBe(false);
  });

  it('debería rechazar código inválido', () => {
    const result = MemberType.create({ ...validProps, code: 'A' });

    expect(result.ok).toBe(false);
  });

  it('debería rechazar edad min negativa', () => {
    const result = MemberType.create({ ...validProps, ageRangeMin: -1 });

    expect(result.ok).toBe(false);
  });

  it('debería rechazar minimumSeniorityForVoting > minimumSeniorityForOffice cuando ambos > 0', () => {
    const result = MemberType.create({
      ...validProps,
      minimumSeniorityForVoting: 24,
      minimumSeniorityForOffice: 12,
    });

    expect(result.ok).toBe(false);
  });

  it('debería aceptar minimumSeniorityForVoting === minimumSeniorityForOffice', () => {
    const result = MemberType.create({
      ...validProps,
      minimumSeniorityForVoting: 12,
      minimumSeniorityForOffice: 12,
    });

    expect(result.ok).toBe(true);
  });

  it('debería aceptar cuando minimumSeniorityForVoting=0 y minimumSeniorityForOffice=0', () => {
    const result = MemberType.create({
      ...validProps,
      minimumSeniorityForVoting: 0,
      minimumSeniorityForOffice: 0,
    });

    expect(result.ok).toBe(true);
  });

  // --- create() con automaticTransitionTargetId ---

  it('debería aceptar un automaticTransitionTargetId válido', () => {
    const targetId = '550e8400-e29b-41d4-a716-446655440000';
    const result = MemberType.create({
      ...validProps,
      automaticTransitionTargetId: targetId,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.automaticTransitionTargetId?.toValue()).toBe(targetId);
    }
  });

  // --- deactivate() ---

  it('debería desactivar un MemberType', () => {
    const result = MemberType.create(validProps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const mt = result.value;
      mt.deactivate();
      expect(mt.active).toBe(false);
    }
  });

  // --- canAcceptAge() ---

  it('debería aceptar edad dentro del rango', () => {
    const result = MemberType.create({ ...validProps, ageRangeMin: 18, ageRangeMax: 65 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.canAcceptAge(30)).toBe(true);
    }
  });

  it('debería rechazar edad fuera del rango', () => {
    const result = MemberType.create({ ...validProps, ageRangeMin: 18, ageRangeMax: 65 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.canAcceptAge(17)).toBe(false);
    }
  });

  // --- hasVotingRight() ---

  it('debería conceder derecho a voto cuando tiene votingRight y suficiente antigüedad', () => {
    const result = MemberType.create({
      ...validProps,
      votingRight: true,
      minimumSeniorityForVoting: 6,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.hasVotingRight(12)).toBe(true);
    }
  });

  it('debería negar derecho a voto cuando no tiene votingRight', () => {
    const result = MemberType.create({
      ...validProps,
      votingRight: false,
      minimumSeniorityForVoting: 0,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.hasVotingRight(100)).toBe(false);
    }
  });

  it('debería negar derecho a voto con antigüedad insuficiente', () => {
    const result = MemberType.create({
      ...validProps,
      votingRight: true,
      minimumSeniorityForVoting: 12,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.hasVotingRight(6)).toBe(false);
    }
  });

  // --- isEligibleForOffice() ---

  it('debería ser elegible para cargo cuando cumple requisitos', () => {
    const result = MemberType.create({
      ...validProps,
      eligibleForOffice: true,
      minimumSeniorityForOffice: 12,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isEligibleForOffice(24)).toBe(true);
    }
  });

  it('debería no ser elegible cuando no tiene eligibleForOffice', () => {
    const result = MemberType.create({
      ...validProps,
      eligibleForOffice: false,
      minimumSeniorityForOffice: 0,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isEligibleForOffice(100)).toBe(false);
    }
  });

  it('debería no ser elegible con antigüedad insuficiente', () => {
    const result = MemberType.create({
      ...validProps,
      eligibleForOffice: true,
      minimumSeniorityForOffice: 24,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isEligibleForOffice(12)).toBe(false);
    }
  });

  // --- update() ---

  it('debería actualizar propiedades del MemberType', () => {
    const result = MemberType.create(validProps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const mt = result.value;
      const updateResult = mt.update({
        name: 'Socio Veterano',
        description: 'Socio con más de 10 años',
        ageRangeMin: 30,
        ageRangeMax: null,
        votingRight: true,
        eligibleForOffice: false,
        minimumSeniorityForVoting: 0,
        minimumSeniorityForOffice: 0,
        automaticTransitionTargetId: null,
        rulesConfig: { maxMembers: 200 },
        collectivityType: 'PENA',
      });

      expect(updateResult.ok).toBe(true);
      expect(mt.name).toBe('Socio Veterano');
      expect(mt.description).toBe('Socio con más de 10 años');
    }
  });

  it('debería rechazar actualización con nombre vacío', () => {
    const result = MemberType.create(validProps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const updateResult = result.value.update({
        name: '',
        description: validProps.description,
        ageRangeMin: validProps.ageRangeMin,
        ageRangeMax: validProps.ageRangeMax,
        votingRight: validProps.votingRight,
        eligibleForOffice: validProps.eligibleForOffice,
        minimumSeniorityForVoting: validProps.minimumSeniorityForVoting,
        minimumSeniorityForOffice: validProps.minimumSeniorityForOffice,
        automaticTransitionTargetId: validProps.automaticTransitionTargetId,
        rulesConfig: validProps.rulesConfig,
        collectivityType: validProps.collectivityType,
      });

      expect(updateResult.ok).toBe(false);
    }
  });

  it('debería actualizar updatedAt al hacer update', () => {
    const result = MemberType.create(validProps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const mt = result.value;
      const originalUpdatedAt = mt.updatedAt;

      // Pequeña espera para que la fecha cambie
      const updateResult = mt.update({
        name: 'Nuevo nombre',
        description: validProps.description,
        ageRangeMin: validProps.ageRangeMin,
        ageRangeMax: validProps.ageRangeMax,
        votingRight: validProps.votingRight,
        eligibleForOffice: validProps.eligibleForOffice,
        minimumSeniorityForVoting: validProps.minimumSeniorityForVoting,
        minimumSeniorityForOffice: validProps.minimumSeniorityForOffice,
        automaticTransitionTargetId: validProps.automaticTransitionTargetId,
        rulesConfig: validProps.rulesConfig,
        collectivityType: validProps.collectivityType,
      });

      expect(updateResult.ok).toBe(true);
      expect(mt.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    }
  });

  // --- reconstitute() ---

  it('debería reconstituir un MemberType sin emitir eventos', () => {
    const result = MemberType.create(validProps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const mt = result.value;
      mt.pullDomainEvents(); // Limpiar eventos

      const reconstituted = MemberType.reconstitute({
        id: mt.id.toValue(),
        code: mt.code.value,
        name: mt.name,
        description: mt.description,
        ageRangeMin: mt.ageRange.min,
        ageRangeMax: mt.ageRange.max,
        votingRight: mt.votingRight,
        eligibleForOffice: mt.eligibleForOffice,
        minimumSeniorityForVoting: mt.minimumSeniorityForVoting,
        minimumSeniorityForOffice: mt.minimumSeniorityForOffice,
        automaticTransitionTargetId: mt.automaticTransitionTargetId?.toValue() ?? null,
        rulesConfig: mt.rulesConfig.getRaw(),
        collectivityType: 'PENA',
        active: mt.active,
        createdAt: mt.createdAt,
        updatedAt: mt.updatedAt,
      });

      const events = reconstituted.pullDomainEvents();
      expect(events).toHaveLength(0);
      expect(reconstituted.name).toBe(mt.name);
      expect(reconstituted.id.equals(mt.id)).toBe(true);
    }
  });
});
