import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatDate, formatFileSize, formatTimeAgo } from '../src/app/shared/utils/formatters.js';

describe('Formatters', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Octets');
      expect(formatFileSize(1024)).toBe('1 Ko');
      expect(formatFileSize(1048576)).toBe('1 Mo');
      expect(formatFileSize(1073741824)).toBe('1 Go');
    });

    it('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 Ko');
      expect(formatFileSize(5242880)).toBe('5 Mo');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-15T14:30:00');
      const formatted = formatDate(date);
      expect(formatted).toContain('15/01/2025');
      expect(formatted).toContain('14:30');
    });

    it('should handle null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });

    it('should handle Firestore timestamp', () => {
      const firestoreTimestamp = {
        toDate: () => new Date('2025-01-15T14:30:00')
      };
      const formatted = formatDate(firestoreTimestamp);
      expect(formatted).toContain('15/01/2025');
    });
  });

  describe('formatTimeAgo', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T14:30:00'));
    });

    it('should format seconds ago', () => {
      const date = new Date('2025-01-15T14:29:30');
      expect(formatTimeAgo(date)).toBe('À l\'instant');
    });

    it('should format minutes ago', () => {
      const date = new Date('2025-01-15T14:25:00');
      expect(formatTimeAgo(date)).toBe('Il y a 5 minutes');
    });

    it('should format hours ago', () => {
      const date = new Date('2025-01-15T12:30:00');
      expect(formatTimeAgo(date)).toBe('Il y a 2 heures');
    });

    it('should format days ago', () => {
      const date = new Date('2025-01-13T14:30:00');
      expect(formatTimeAgo(date)).toBe('Il y a 2 jours');
    });
  });
});
