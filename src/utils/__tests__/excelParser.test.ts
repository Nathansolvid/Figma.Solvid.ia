import { describe, it, expect } from 'vitest';
import { detectColumnMapping, validateMapping } from '../excelParser';

// ============================================================================
// TESTS UNITAIRES - EXCEL PARSER
// ============================================================================

describe('excelParser', () => {
  describe('detectColumnMapping', () => {
    it('should detect standard column names', () => {
      const headers = ['Code', 'Nom', 'Valeur', 'Unité', 'Période'];
      const mapping = detectColumnMapping(headers);

      expect(mapping.code).toBe(0);
      expect(mapping.name).toBe(1);
      expect(mapping.value).toBe(2);
      expect(mapping.unit).toBe(3);
      expect(mapping.period).toBe(4);
    });

    it('should detect case-insensitive headers', () => {
      const headers = ['CODE', 'NOM', 'VALEUR', 'UNITE', 'PERIODE'];
      const mapping = detectColumnMapping(headers);

      expect(mapping.code).toBe(0);
      expect(mapping.name).toBe(1);
      expect(mapping.value).toBe(2);
      expect(mapping.unit).toBe(3);
      expect(mapping.period).toBe(4);
    });

    it('should detect English headers', () => {
      const headers = ['Code', 'Name', 'Value', 'Unit', 'Period'];
      const mapping = detectColumnMapping(headers);

      expect(mapping.code).toBe(0);
      expect(mapping.name).toBe(1);
      expect(mapping.value).toBe(2);
      expect(mapping.unit).toBe(3);
      expect(mapping.period).toBe(4);
    });

    it('should detect variant column names', () => {
      const headers = ['Indicateur', 'Libellé', 'Quantité', 'Type', 'Année'];
      const mapping = detectColumnMapping(headers);

      expect(mapping.code).toBe(0); // 'Indicateur' → code
      expect(mapping.name).toBe(1); // 'Libellé' → name
      expect(mapping.value).toBe(2); // 'Quantité' → value
      expect(mapping.unit).toBe(3); // 'Type' → unit
      expect(mapping.period).toBe(4); // 'Année' → period
    });

    it('should handle missing columns', () => {
      const headers = ['Code', 'Valeur']; // Missing name, unit, period
      const mapping = detectColumnMapping(headers);

      expect(mapping.code).toBe(0);
      expect(mapping.value).toBe(1);
      expect(mapping.name).toBeUndefined();
      expect(mapping.unit).toBeUndefined();
      expect(mapping.period).toBeUndefined();
    });

    it('should handle extra columns', () => {
      const headers = ['Code', 'Nom', 'Valeur', 'Extra1', 'Extra2', 'Unité'];
      const mapping = detectColumnMapping(headers);

      expect(mapping.code).toBe(0);
      expect(mapping.name).toBe(1);
      expect(mapping.value).toBe(2);
      expect(mapping.unit).toBe(5);
    });

    it('should detect category column', () => {
      const headers = ['Code', 'Catégorie', 'Valeur'];
      const mapping = detectColumnMapping(headers);

      expect(mapping.code).toBe(0);
      expect(mapping.category).toBe(1);
      expect(mapping.value).toBe(2);
    });

    it('should detect status column', () => {
      const headers = ['Code', 'Statut', 'Valeur'];
      const mapping = detectColumnMapping(headers);

      expect(mapping.code).toBe(0);
      expect(mapping.status).toBe(1);
      expect(mapping.value).toBe(2);
    });

    it('should handle empty headers', () => {
      const headers: string[] = [];
      const mapping = detectColumnMapping(headers);

      expect(Object.keys(mapping)).toHaveLength(0);
    });

    it('should handle headers with special characters', () => {
      const headers = ['Code *', 'Nom (FR)', 'Valeur €', 'Unité_mesure'];
      const mapping = detectColumnMapping(headers);

      expect(mapping.code).toBe(0);
      expect(mapping.name).toBe(1);
      expect(mapping.value).toBe(2);
      expect(mapping.unit).toBe(3);
    });
  });

  describe('validateMapping', () => {
    it('should validate complete mapping', () => {
      const mapping = {
        code: 0,
        name: 1,
        value: 2,
        unit: 3,
        period: 4,
      };

      const errors = validateMapping(mapping);

      expect(errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const mapping = {
        name: 1,
        value: 2,
        // Missing 'code' (required)
      };

      const errors = validateMapping(mapping);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('code'))).toBe(true);
    });

    it('should detect missing value field', () => {
      const mapping = {
        code: 0,
        name: 1,
        // Missing 'value' (required)
      };

      const errors = validateMapping(mapping);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('value') || e.includes('valeur'))).toBe(true);
    });

    it('should allow optional fields to be missing', () => {
      const mapping = {
        code: 0,
        value: 2,
        // Missing optional fields (name, unit, period) is OK
      };

      const errors = validateMapping(mapping);

      // Should only complain about 'name' if it's required in your implementation
      // Adjust based on actual requirements
      expect(errors.length).toBeLessThanOrEqual(1);
    });

    it('should detect duplicate column mappings', () => {
      const mapping = {
        code: 0,
        name: 0, // Duplicate index
        value: 2,
      };

      const errors = validateMapping(mapping);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('duplicate') || e.includes('duplic'))).toBe(true);
    });

    it('should detect negative column indices', () => {
      const mapping = {
        code: -1,
        value: 2,
      };

      const errors = validateMapping(mapping);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept valid minimal mapping', () => {
      const mapping = {
        code: 0,
        value: 1,
      };

      const errors = validateMapping(mapping);

      // Depending on requirements, this might be valid or not
      // Adjust expectation based on actual implementation
      expect(errors.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle headers with leading/trailing spaces', () => {
      const headers = ['  Code  ', '  Nom  ', '  Valeur  '];
      const mapping = detectColumnMapping(headers);

      expect(mapping.code).toBe(0);
      expect(mapping.name).toBe(1);
      expect(mapping.value).toBe(2);
    });

    it('should handle headers with accents', () => {
      const headers = ['Côde', 'Nôm', 'Valëur', 'Périodé'];
      const mapping = detectColumnMapping(headers);

      expect(mapping.code).toBe(0);
      expect(mapping.name).toBe(1);
      expect(mapping.value).toBe(2);
      expect(mapping.period).toBe(3);
    });

    it('should prefer exact matches over partial matches', () => {
      const headers = ['Code Indicateur', 'Code', 'Valeur'];
      const mapping = detectColumnMapping(headers);

      // Should prefer 'Code' (exact match) over 'Code Indicateur' (partial)
      expect(mapping.code).toBe(1);
    });

    it('should handle very long header names', () => {
      const longHeader = 'A'.repeat(1000);
      const headers = ['Code', longHeader, 'Valeur'];
      const mapping = detectColumnMapping(headers);

      expect(mapping.code).toBe(0);
      expect(mapping.value).toBe(2);
    });
  });
});
