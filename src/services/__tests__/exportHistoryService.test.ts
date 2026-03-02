import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  addExportToHistory,
  getAllExports,
  getExportById,
  deleteExport,
  clearAllExports,
  getExportStats,
  formatFileSize,
  generateExportId,
  type ExportHistoryEntry,
} from '../exportHistoryService';

// ============================================================================
// TESTS UNITAIRES - EXPORT HISTORY SERVICE
// ============================================================================

describe('exportHistoryService', () => {
  const mockEntry: ExportHistoryEntry = {
    id: 'exp-test-001',
    name: 'Test_Export',
    format: 'pdf',
    scope: 'Complet',
    size: 1024000,
    sizeFormatted: '1.0 MB',
    createdAt: new Date().toISOString(),
    status: 'completed',
    options: {
      includeAuditTrail: true,
      includeEvidences: true,
    },
  };

  // Clean up before each test
  beforeEach(async () => {
    await clearAllExports();
  });

  // Clean up after all tests
  afterEach(async () => {
    await clearAllExports();
  });

  describe('CRUD Operations', () => {
    it('should add export to history', async () => {
      await addExportToHistory(mockEntry);
      
      const exports = await getAllExports();
      expect(exports).toHaveLength(1);
      expect(exports[0].id).toBe(mockEntry.id);
    });

    it('should get export by ID', async () => {
      await addExportToHistory(mockEntry);
      
      const retrieved = await getExportById(mockEntry.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(mockEntry.name);
    });

    it('should return undefined for non-existent export', async () => {
      const retrieved = await getExportById('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    it('should delete export', async () => {
      await addExportToHistory(mockEntry);
      
      let exports = await getAllExports();
      expect(exports).toHaveLength(1);
      
      await deleteExport(mockEntry.id);
      
      exports = await getAllExports();
      expect(exports).toHaveLength(0);
    });

    it('should clear all exports', async () => {
      await addExportToHistory(mockEntry);
      await addExportToHistory({ ...mockEntry, id: 'exp-test-002' });
      
      let exports = await getAllExports();
      expect(exports).toHaveLength(2);
      
      await clearAllExports();
      
      exports = await getAllExports();
      expect(exports).toHaveLength(0);
    });
  });

  describe('Sorting and Ordering', () => {
    it('should return exports in reverse chronological order', async () => {
      const now = Date.now();
      
      await addExportToHistory({
        ...mockEntry,
        id: 'exp-1',
        createdAt: new Date(now - 3000).toISOString(),
      });
      
      await addExportToHistory({
        ...mockEntry,
        id: 'exp-2',
        createdAt: new Date(now - 2000).toISOString(),
      });
      
      await addExportToHistory({
        ...mockEntry,
        id: 'exp-3',
        createdAt: new Date(now - 1000).toISOString(),
      });
      
      const exports = await getAllExports();
      
      expect(exports[0].id).toBe('exp-3'); // Most recent
      expect(exports[1].id).toBe('exp-2');
      expect(exports[2].id).toBe('exp-1'); // Oldest
    });
  });

  describe('Statistics', () => {
    it('should calculate correct stats', async () => {
      await addExportToHistory({
        ...mockEntry,
        id: 'exp-1',
        format: 'pdf',
        status: 'completed',
        size: 1000000,
      });
      
      await addExportToHistory({
        ...mockEntry,
        id: 'exp-2',
        format: 'json',
        status: 'completed',
        size: 500000,
      });
      
      await addExportToHistory({
        ...mockEntry,
        id: 'exp-3',
        format: 'pdf',
        status: 'error',
        size: 0,
      });
      
      const stats = await getExportStats();
      
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.totalSize).toBe(1500000);
      expect(stats.byFormat.pdf).toBe(2);
      expect(stats.byFormat.json).toBe(1);
    });

    it('should handle empty database', async () => {
      const stats = await getExportStats();
      
      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe('Utility Functions', () => {
    it('should format file size correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1536 * 1024)).toBe('1.5 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    });

    it('should generate unique export IDs', () => {
      const id1 = generateExportId();
      const id2 = generateExportId();
      
      expect(id1).toMatch(/^exp-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^exp-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Blob Storage', () => {
    it('should store and retrieve blobs', async () => {
      const pdfBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      
      const entryWithBlob: ExportHistoryEntry = {
        ...mockEntry,
        pdfBlob,
      };
      
      await addExportToHistory(entryWithBlob);
      
      const retrieved = await getExportById(mockEntry.id);
      
      expect(retrieved?.pdfBlob).toBeDefined();
      expect(retrieved?.pdfBlob?.size).toBe(pdfBlob.size);
      expect(retrieved?.pdfBlob?.type).toBe('application/pdf');
    });

    it('should store multiple blob formats', async () => {
      const pdfBlob = new Blob(['PDF'], { type: 'application/pdf' });
      const jsonBlob = new Blob(['{}'], { type: 'application/json' });
      const csvBlob = new Blob(['csv'], { type: 'text/csv' });
      
      const entryWithBlobs: ExportHistoryEntry = {
        ...mockEntry,
        pdfBlob,
        jsonBlob,
        excelBlob: csvBlob,
      };
      
      await addExportToHistory(entryWithBlobs);
      
      const retrieved = await getExportById(mockEntry.id);
      
      expect(retrieved?.pdfBlob).toBeDefined();
      expect(retrieved?.jsonBlob).toBeDefined();
      expect(retrieved?.excelBlob).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing blobs gracefully', async () => {
      await addExportToHistory(mockEntry); // No blobs
      
      const retrieved = await getExportById(mockEntry.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.pdfBlob).toBeUndefined();
      expect(retrieved?.jsonBlob).toBeUndefined();
    });

    it('should handle error status', async () => {
      const errorEntry: ExportHistoryEntry = {
        ...mockEntry,
        status: 'error',
        errorMessage: 'Generation failed',
      };
      
      await addExportToHistory(errorEntry);
      
      const retrieved = await getExportById(mockEntry.id);
      
      expect(retrieved?.status).toBe('error');
      expect(retrieved?.errorMessage).toBe('Generation failed');
    });
  });
});
