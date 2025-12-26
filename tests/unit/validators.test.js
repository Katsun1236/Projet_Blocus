import { describe, it, expect } from 'vitest';
import { Validators } from '../src/app/shared/utils/validators.js';

describe('Validators', () => {
  describe('email', () => {
    it('should validate correct emails', () => {
      expect(Validators.email('test@example.com')).toBeNull();
      expect(Validators.email('user.name+tag@example.co.uk')).toBeNull();
    });

    it('should reject invalid emails', () => {
      expect(Validators.email('invalid')).toBe('Email invalide');
      expect(Validators.email('test@')).toBe('Email invalide');
      expect(Validators.email('@example.com')).toBe('Email invalide');
    });
  });

  describe('password', () => {
    it('should validate strong passwords', () => {
      expect(Validators.password('Password123')).toBeNull();
      expect(Validators.password('MyP@ssw0rd')).toBeNull();
    });

    it('should reject weak passwords', () => {
      expect(Validators.password('short')).toBe('Minimum 8 caractères');
      expect(Validators.password('noupperca$e1')).toBe('Au moins une majuscule');
      expect(Validators.password('NOLOWERCASE1')).toBe('Au moins une minuscule');
      expect(Validators.password('NoNumbers')).toBe('Au moins un chiffre');
    });
  });

  describe('required', () => {
    it('should validate non-empty values', () => {
      expect(Validators.required('test')).toBeNull();
      expect(Validators.required('  value  ')).toBeNull();
    });

    it('should reject empty values', () => {
      expect(Validators.required('')).toBe('Champ requis');
      expect(Validators.required('   ')).toBe('Champ requis');
    });
  });

  describe('minLength', () => {
    it('should validate minimum length', () => {
      const validator = Validators.minLength(5);
      expect(validator('12345')).toBeNull();
      expect(validator('123456')).toBeNull();
    });

    it('should reject too short values', () => {
      const validator = Validators.minLength(5);
      expect(validator('1234')).toBe('Minimum 5 caractères');
    });
  });

  describe('maxLength', () => {
    it('should validate maximum length', () => {
      const validator = Validators.maxLength(5);
      expect(validator('12345')).toBeNull();
      expect(validator('1234')).toBeNull();
    });

    it('should reject too long values', () => {
      const validator = Validators.maxLength(5);
      expect(validator('123456')).toBe('Maximum 5 caractères');
    });
  });
});
