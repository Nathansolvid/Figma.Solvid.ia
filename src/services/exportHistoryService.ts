import { openDB, IDBPDatabase } from 'idb';

// ============================================================================
// EXPORT HISTORY SERVICE - Phase 9
// ============================================================================
// Service pour gérer l'historique des exports dans IndexedDB
// Stocke les métadonnées + fichiers générés localement

const DB_NAME = 'solvid-export-history';
const DB_VERSION = 1;
const STORE_NAME = 'exports';

// Types
export interface ExportHistoryEntry {
  id: string;
  name: string;
  format: 'pdf' | 'json' | 'excel' | 'zip' | 'all';
  scope: 'indicators' | 'audit' | 'evidences' | 'complete' | string;
  size: number; // bytes
  sizeFormatted: string; // "18.4 MB"
  createdAt: string; // ISO string
  status: 'completed' | 'generating' | 'error';
  packId?: string;
  packName?: string;
  options: ExportOptions;
  // Blob storage for generated files (optional, can be large)
  pdfBlob?: Blob;
  jsonBlob?: Blob;
  excelBlob?: Blob;
  zipBlob?: Blob;
  errorMessage?: string;
}

export interface ExportOptions {
  includeTransparency?: boolean;
  includeAuditTrail?: boolean;
  includeEvidences?: boolean;
  includeCalculations?: boolean;
  categoryFilter?: string;
}

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create exports store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('packId', 'packId');
          store.createIndex('status', 'status');
          store.createIndex('format', 'format');
        }
      },
    });
  }
  return dbPromise;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Add a new export to history
 */
export async function addExportToHistory(entry: ExportHistoryEntry): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, entry);
  console.log('✅ Export added to history:', entry.id);
}

/**
 * Get all exports from history (sorted by date, most recent first)
 */
export async function getAllExports(): Promise<ExportHistoryEntry[]> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('createdAt');
  
  // Get all entries in reverse chronological order
  const entries = await index.getAll();
  
  // Sort manually (newest first)
  return entries.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get a single export by ID
 */
export async function getExportById(id: string): Promise<ExportHistoryEntry | undefined> {
  const db = await getDB();
  return await db.get(STORE_NAME, id);
}

/**
 * Get exports for a specific pack
 */
export async function getExportsByPack(packId: string): Promise<ExportHistoryEntry[]> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('packId');
  
  const entries = await index.getAll(packId);
  
  return entries.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Update export status
 */
export async function updateExportStatus(
  id: string,
  status: 'completed' | 'generating' | 'error',
  errorMessage?: string
): Promise<void> {
  const db = await getDB();
  const entry = await db.get(STORE_NAME, id);
  
  if (entry) {
    entry.status = status;
    if (errorMessage) {
      entry.errorMessage = errorMessage;
    }
    await db.put(STORE_NAME, entry);
  }
}

/**
 * Delete an export from history
 */
export async function deleteExport(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
  console.log('🗑️ Export deleted:', id);
}

/**
 * Clear all exports (useful for testing)
 */
export async function clearAllExports(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
  console.log('🗑️ All exports cleared');
}

/**
 * Get export statistics
 */
export async function getExportStats(): Promise<{
  total: number;
  totalSize: number;
  completed: number;
  failed: number;
  generating: number;
  byFormat: Record<string, number>;
}> {
  const exports = await getAllExports();
  
  const stats = {
    total: exports.length,
    totalSize: exports.reduce((sum, e) => sum + e.size, 0),
    completed: exports.filter(e => e.status === 'completed').length,
    failed: exports.filter(e => e.status === 'error').length,
    generating: exports.filter(e => e.status === 'generating').length,
    byFormat: {} as Record<string, number>,
  };
  
  // Count by format
  exports.forEach(e => {
    stats.byFormat[e.format] = (stats.byFormat[e.format] || 0) + 1;
  });
  
  return stats;
}

// ============================================================================
// BLOB STORAGE & RETRIEVAL
// ============================================================================

/**
 * Download a previously exported file
 */
export async function downloadExport(id: string, format: 'pdf' | 'json' | 'excel' | 'zip'): Promise<void> {
  const entry = await getExportById(id);
  
  if (!entry) {
    throw new Error('Export introuvable');
  }
  
  let blob: Blob | undefined;
  let extension: string;
  
  switch (format) {
    case 'pdf':
      blob = entry.pdfBlob;
      extension = 'pdf';
      break;
    case 'json':
      blob = entry.jsonBlob;
      extension = 'json';
      break;
    case 'excel':
      blob = entry.excelBlob;
      extension = 'csv';
      break;
    case 'zip':
      blob = entry.zipBlob;
      extension = 'zip';
      break;
  }
  
  if (!blob) {
    throw new Error(`Fichier ${format} non disponible pour cet export`);
  }
  
  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${entry.name}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get download URL for preview (without downloading)
 */
export async function getExportPreviewUrl(id: string, format: 'pdf' | 'json' | 'excel' | 'zip'): Promise<string | null> {
  const entry = await getExportById(id);
  
  if (!entry) {
    return null;
  }
  
  let blob: Blob | undefined;
  
  switch (format) {
    case 'pdf':
      blob = entry.pdfBlob;
      break;
    case 'json':
      blob = entry.jsonBlob;
      break;
    case 'excel':
      blob = entry.excelBlob;
      break;
    case 'zip':
      blob = entry.zipBlob;
      break;
  }
  
  if (!blob) {
    return null;
  }
  
  return URL.createObjectURL(blob);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Generate unique export ID
 */
export function generateExportId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate total size of blobs
 */
export function calculateTotalSize(blobs: (Blob | undefined)[]): number {
  return blobs.reduce((sum, blob) => sum + (blob?.size || 0), 0);
}
