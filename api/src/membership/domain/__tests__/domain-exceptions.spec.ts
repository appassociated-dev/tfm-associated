import { describe, it, expect } from 'vitest';
import { MemberTypeCodeAlreadyExistsError } from '../exceptions/member-type-code-already-exists.exception';
import { MemberTypeNotFoundError } from '../exceptions/member-type-not-found.exception';
import { InvalidMemberTypeDataError } from '../exceptions/invalid-member-type-data.exception';
import { CircularTransitionError } from '../exceptions/circular-transition.exception';
import { MemberTypeIsTransitionTargetError } from '../exceptions/member-type-is-transition-target.exception';

describe('Membership Domain Exceptions', () => {
  // --- MemberTypeCodeAlreadyExistsError ---

  describe('MemberTypeCodeAlreadyExistsError', () => {
    it('debería crear el error con el formato de mensaje correcto', () => {
      const error = new MemberTypeCodeAlreadyExistsError('SOCIO');

      expect(error.message).toBe("MemberType with code 'SOCIO' already exists");
    });

    it('debería tener el código correcto', () => {
      const error = new MemberTypeCodeAlreadyExistsError('SOCIO');

      expect(error.code).toBe('MEMBER_TYPE.CODE_ALREADY_EXISTS');
    });

    it('debería ser una instancia de Error', () => {
      const error = new MemberTypeCodeAlreadyExistsError('SOCIO');

      expect(error).toBeInstanceOf(Error);
    });

    it('debería tener el nombre correcto', () => {
      const error = new MemberTypeCodeAlreadyExistsError('SOCIO');

      expect(error.name).toBe('MemberTypeCodeAlreadyExistsError');
    });
  });

  // --- MemberTypeNotFoundError ---

  describe('MemberTypeNotFoundError', () => {
    it('debería crear el error con el formato de mensaje correcto', () => {
      const error = new MemberTypeNotFoundError('550e8400-e29b-41d4-a716-446655440000');

      expect(error.message).toBe(
        "MemberType with id '550e8400-e29b-41d4-a716-446655440000' not found",
      );
    });

    it('debería tener el código correcto', () => {
      const error = new MemberTypeNotFoundError('some-id');

      expect(error.code).toBe('MEMBER_TYPE.NOT_FOUND');
    });

    it('debería ser una instancia de Error', () => {
      const error = new MemberTypeNotFoundError('some-id');

      expect(error).toBeInstanceOf(Error);
    });

    it('debería tener el nombre correcto', () => {
      const error = new MemberTypeNotFoundError('some-id');

      expect(error.name).toBe('MemberTypeNotFoundError');
    });
  });

  // --- InvalidMemberTypeDataError ---

  describe('InvalidMemberTypeDataError', () => {
    it('debería crear el error con el formato de mensaje correcto', () => {
      const error = new InvalidMemberTypeDataError('name', 'cannot be empty');

      expect(error.message).toBe('Invalid member type data: name — cannot be empty');
    });

    it('debería tener el código correcto', () => {
      const error = new InvalidMemberTypeDataError('field', 'reason');

      expect(error.code).toBe('MEMBER_TYPE.INVALID_DATA');
    });

    it('debería ser una instancia de Error', () => {
      const error = new InvalidMemberTypeDataError('field', 'reason');

      expect(error).toBeInstanceOf(Error);
    });

    it('debería tener el nombre correcto', () => {
      const error = new InvalidMemberTypeDataError('field', 'reason');

      expect(error.name).toBe('InvalidMemberTypeDataError');
    });
  });

  // --- CircularTransitionError ---

  describe('CircularTransitionError', () => {
    it('debería crear el error con el formato de mensaje correcto', () => {
      const error = new CircularTransitionError('id-1', 'id-2');

      expect(error.message).toBe(
        "Circular transition detected: MemberType 'id-1' cannot transition to 'id-2'",
      );
    });

    it('debería tener el código correcto', () => {
      const error = new CircularTransitionError('id-1', 'id-2');

      expect(error.code).toBe('MEMBER_TYPE.CIRCULAR_TRANSITION');
    });

    it('debería ser una instancia de Error', () => {
      const error = new CircularTransitionError('id-1', 'id-2');

      expect(error).toBeInstanceOf(Error);
    });

    it('debería tener el nombre correcto', () => {
      const error = new CircularTransitionError('id-1', 'id-2');

      expect(error.name).toBe('CircularTransitionError');
    });
  });

  // --- MemberTypeIsTransitionTargetError ---

  describe('MemberTypeIsTransitionTargetError', () => {
    it('debería crear el error con el formato de mensaje correcto', () => {
      const error = new MemberTypeIsTransitionTargetError('id-1');

      expect(error.message).toBe(
        "MemberType 'id-1' cannot be deactivated because it is a transition target",
      );
    });

    it('debería tener el código correcto', () => {
      const error = new MemberTypeIsTransitionTargetError('id-1');

      expect(error.code).toBe('MEMBER_TYPE.IS_TRANSITION_TARGET');
    });

    it('debería ser una instancia de Error', () => {
      const error = new MemberTypeIsTransitionTargetError('id-1');

      expect(error).toBeInstanceOf(Error);
    });

    it('debería tener el nombre correcto', () => {
      const error = new MemberTypeIsTransitionTargetError('id-1');

      expect(error.name).toBe('MemberTypeIsTransitionTargetError');
    });
  });
});
