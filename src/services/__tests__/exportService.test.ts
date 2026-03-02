import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateExport } from '../exportService';
import type { ExportFormat, ExportScope } from '../exportService';
import type { Indicator } from '../exportService';

// ============================================================================
// TESTS UNITAIRES - EXPORT SERVICE
// ============================================================================

describe('exportService', () => {
  const mockIndicators: Indicator[] = [
    {
      id: 'ind-e1-co2',
      code: 'E1-CO2',
      name: 'Émissions CO2 totales',
      pillar: 'E',
      value: 14540,
      unit: 'tCO2e',
      period: '2025',
      status: 'ACCEPTED',
    },
    {
      id: 'ind-s1-employees',
      code: 'S1-EMP',
      name: 'Nombre d\'employés',
      pillar: 'S',
      value: 245,
      unit: 'personnes',
      period: '2025',
      status: 'PROVIDED',
    },
    {
      id: 'ind-g1-board',
      code: 'G1-BOARD',
      name: 'Membres du conseil',
      pillar: 'G',
      value: 7,
      unit: 'personnes',
      period: '2025',
      status: 'ACCEPTED',
    },
  ];

  describe('generateExport', () => {
    it('should generate PDF export', async () => {
      const result = await generateExport(
        'pdf',
        'complete',
        mockIndicators,
        { includeAuditTrail: true },
        undefined,
        undefined
      );

      expect(result).toBeDefined();
      expect(result.format).toBe('pdf');
      expect(result.pdfBlob).toBeDefined();
      expect(result.pdfBlob?.type).toBe('application/pdf');
    });

    it('should generate JSON export', async () => {
      const result = await generateExport(
        'json',
        'indicators',
        mockIndicators,
        {},
        undefined,
        undefined
      );

      expect(result).toBeDefined();
      expect(result.format).toBe('json');
      expect(result.jsonBlob).toBeDefined();
      expect(result.jsonBlob?.type).toBe('application/json');
    });

    it('should generate CSV export', async () => {
      const result = await generateExport(
        'excel',
        'indicators',
        mockIndicators,
        {},
        undefined,
        undefined
      );

      expect(result).toBeDefined();
      expect(result.format).toBe('excel');
      expect(result.excelBlob).toBeDefined();
    });

    it('should generate ZIP export with all formats', async () => {
      const result = await generateExport(
        'all',
        'complete',
        mockIndicators,
        { includeAuditTrail: true, includeEvidences: true },
        undefined,
        undefined
      );

      expect(result).toBeDefined();
      expect(result.format).toBe('all');
      expect(result.zipBlob).toBeDefined();
      expect(result.pdfBlob).toBeDefined();
      expect(result.jsonBlob).toBeDefined();
      expect(result.excelBlob).toBeDefined();
    });

    it('should filter indicators by category', async () => {
      const result = await generateExport(
        'json',
        'indicators',
        mockIndicators,
        { categoryFilter: 'E' },
        undefined,
        undefined
      );

      expect(result).toBeDefined();
      
      // Parse JSON to verify filtering
      if (result.jsonBlob) {
        const text = await result.jsonBlob.text();
        const data = JSON.parse(text);
        
        expect(data.indicators).toBeDefined();
        expect(data.indicators.length).toBe(1);
        expect(data.indicators[0].category).toBe('E');
      }
    });

    it('should call progress callback', async () => {
      const progressFn = vi.fn();

      await generateExport(
        'pdf',
        'complete',
        mockIndicators,
        {},
        undefined,
        progressFn
      );

      expect(progressFn).toHaveBeenCalled();
      expect(progressFn.mock.calls[0][0]).toBeGreaterThanOrEqual(0);
      expect(progressFn.mock.calls[0][0]).toBeLessThanOrEqual(100);
    });

    it('should include audit trail when option is set', async () => {
      const result = await generateExport(
        'json',
        'complete',
        mockIndicators,
        { includeAuditTrail: true },
        undefined,
        undefined
      );

      if (result.jsonBlob) {
        const text = await result.jsonBlob.text();
        const data = JSON.parse(text);
        
        expect(data.auditTrail).toBeDefined();
      }
    });

    it('should generate unique export IDs', async () => {
      const result1 = await generateExport('pdf', 'complete', mockIndicators, {});
      const result2 = await generateExport('pdf', 'complete', mockIndicators, {});

      expect(result1.id).not.toBe(result2.id);
    });

    it('should set correct status on success', async () => {
      const result = await generateExport('pdf', 'complete', mockIndicators, {});

      expect(result.status).toBe('completed');
      expect(result.errorMessage).toBeUndefined();
    });

    it('should calculate correct file size', async () => {
      const result = await generateExport('pdf', 'complete', mockIndicators, {});

      expect(result.size).toBeGreaterThan(0);
      expect(result.sizeFormatted).toMatch(/\d+(\.\d+)?\s+(B|KB|MB|GB)/);
    });
  });
});
