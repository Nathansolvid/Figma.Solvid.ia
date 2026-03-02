import { describe, it, expect } from 'vitest';
import { 
  executeCalculation, 
  detectRecalculationAvailable,
  type CalculationMethod 
} from '../calculationEngine';

// ============================================================================
// TESTS UNITAIRES - CALCULATION ENGINE
// ============================================================================

describe('calculationEngine', () => {
  describe('executeCalculation', () => {
    describe('sum method', () => {
      it('should sum simple values', () => {
        const sourceData = [
          { value: 100 },
          { value: 200 },
          { value: 300 },
        ];

        const result = executeCalculation('sum', sourceData);

        expect(result.value).toBe(600);
        expect(result.method).toBe('sum');
        expect(result.steps).toHaveLength(1);
      });

      it('should handle empty data', () => {
        const result = executeCalculation('sum', []);

        expect(result.value).toBe(0);
      });

      it('should skip null/undefined values', () => {
        const sourceData = [
          { value: 100 },
          { value: null },
          { value: 200 },
          { value: undefined },
        ];

        const result = executeCalculation('sum', sourceData);

        expect(result.value).toBe(300);
      });
    });

    describe('average method', () => {
      it('should calculate average', () => {
        const sourceData = [
          { value: 100 },
          { value: 200 },
          { value: 300 },
        ];

        const result = executeCalculation('average', sourceData);

        expect(result.value).toBe(200);
        expect(result.method).toBe('average');
      });

      it('should handle single value', () => {
        const result = executeCalculation('average', [{ value: 150 }]);

        expect(result.value).toBe(150);
      });

      it('should return 0 for empty data', () => {
        const result = executeCalculation('average', []);

        expect(result.value).toBe(0);
      });
    });

    describe('weighted_avg method', () => {
      it('should calculate weighted average', () => {
        const sourceData = [
          { value: 100, weight: 1 },
          { value: 200, weight: 2 },
          { value: 300, weight: 1 },
        ];

        const result = executeCalculation('weighted_avg', sourceData);

        // (100*1 + 200*2 + 300*1) / (1+2+1) = 800/4 = 200
        expect(result.value).toBe(200);
        expect(result.method).toBe('weighted_avg');
      });

      it('should use weight=1 if not provided', () => {
        const sourceData = [
          { value: 100 }, // weight = 1
          { value: 200 }, // weight = 1
        ];

        const result = executeCalculation('weighted_avg', sourceData);

        expect(result.value).toBe(150);
      });

      it('should handle zero weights', () => {
        const sourceData = [
          { value: 100, weight: 0 },
          { value: 200, weight: 2 },
        ];

        const result = executeCalculation('weighted_avg', sourceData);

        // (0*100 + 2*200) / 2 = 200
        expect(result.value).toBe(200);
      });
    });

    describe('formula method', () => {
      it('should evaluate simple formula', () => {
        const params = { a: 10, b: 5 };
        const result = executeCalculation('formula', [], params, 'a + b');

        expect(result.value).toBe(15);
      });

      it('should evaluate complex formula', () => {
        const params = { revenue: 1000, cost: 600 };
        const result = executeCalculation('formula', [], params, '(revenue - cost) / revenue * 100');

        expect(result.value).toBe(40); // 40% margin
      });

      it('should handle division by zero', () => {
        const params = { a: 10, b: 0 };
        const result = executeCalculation('formula', [], params, 'a / b');

        expect(result.value).toBe(Infinity);
      });

      it('should return 0 for invalid formula', () => {
        const params = { a: 10 };
        const result = executeCalculation('formula', [], params, 'invalid + formula');

        expect(result.value).toBe(0);
      });
    });

    describe('manual method', () => {
      it('should return manual value', () => {
        const result = executeCalculation('manual', [], { manualValue: 42 });

        expect(result.value).toBe(42);
        expect(result.method).toBe('manual');
      });

      it('should return 0 if no manual value provided', () => {
        const result = executeCalculation('manual', []);

        expect(result.value).toBe(0);
      });
    });
  });

  describe('detectRecalculationAvailable', () => {
    it('should detect recalculation needed when source data changes', () => {
      const indicator = {
        id: 'ind-1',
        code: 'TEST',
        name: 'Test Indicator',
        calculation_method: 'sum' as CalculationMethod,
        last_calculated_at: new Date(Date.now() - 1000).toISOString(),
        source_references: [
          {
            file_name: 'data.xlsx',
            sheet_name: 'Sheet1',
            row_number: 1,
            last_modified: new Date().toISOString(), // Modified after calculation
          },
        ],
      };

      const needsRecalc = detectRecalculationAvailable(indicator);

      expect(needsRecalc).toBe(true);
    });

    it('should return false when no recalculation needed', () => {
      const indicator = {
        id: 'ind-1',
        code: 'TEST',
        name: 'Test Indicator',
        calculation_method: 'sum' as CalculationMethod,
        last_calculated_at: new Date().toISOString(),
        source_references: [
          {
            file_name: 'data.xlsx',
            sheet_name: 'Sheet1',
            row_number: 1,
            last_modified: new Date(Date.now() - 1000).toISOString(), // Modified before calculation
          },
        ],
      };

      const needsRecalc = detectRecalculationAvailable(indicator);

      expect(needsRecalc).toBe(false);
    });

    it('should return false for manual indicators', () => {
      const indicator = {
        id: 'ind-1',
        code: 'TEST',
        name: 'Test Indicator',
        calculation_method: 'manual' as CalculationMethod,
        last_calculated_at: new Date(Date.now() - 1000).toISOString(),
        source_references: [
          {
            file_name: 'data.xlsx',
            sheet_name: 'Sheet1',
            row_number: 1,
            last_modified: new Date().toISOString(),
          },
        ],
      };

      const needsRecalc = detectRecalculationAvailable(indicator);

      expect(needsRecalc).toBe(false); // Manual indicators don't auto-recalculate
    });

    it('should handle missing timestamps', () => {
      const indicator = {
        id: 'ind-1',
        code: 'TEST',
        name: 'Test Indicator',
        calculation_method: 'sum' as CalculationMethod,
        source_references: [],
      };

      const needsRecalc = detectRecalculationAvailable(indicator);

      expect(needsRecalc).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      const sourceData = [
        { value: 1e15 },
        { value: 1e15 },
      ];

      const result = executeCalculation('sum', sourceData);

      expect(result.value).toBe(2e15);
    });

    it('should handle negative numbers', () => {
      const sourceData = [
        { value: 100 },
        { value: -50 },
        { value: -30 },
      ];

      const result = executeCalculation('sum', sourceData);

      expect(result.value).toBe(20);
    });

    it('should handle decimal precision', () => {
      const sourceData = [
        { value: 0.1 },
        { value: 0.2 },
      ];

      const result = executeCalculation('sum', sourceData);

      expect(result.value).toBeCloseTo(0.3);
    });

    it('should handle mixed integer and decimal', () => {
      const sourceData = [
        { value: 100 },
        { value: 50.5 },
        { value: 25.25 },
      ];

      const result = executeCalculation('average', sourceData);

      expect(result.value).toBeCloseTo(58.583, 2);
    });
  });
});
