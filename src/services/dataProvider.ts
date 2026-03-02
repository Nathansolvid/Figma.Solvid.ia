/**
 * DATA PROVIDER - Couche d'abstraction unique pour la persistance
 * 
 * Architecture :
 * - LocalProvider (IndexedDB/localStorage) : Toujours actif, par défaut
 * - ApiProvider (optionnel) : Wrap apiClient, fallback automatique vers local
 * 
 * Principe NO-DEAD-CLICK :
 * Toute opération doit réussir (en local) ou échouer gracieusement avec feedback.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

// ==================== TYPES ====================

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  createdAt: string;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;
  sector?: string;
  size?: string;
  createdAt: string;
  logo?: string;
}

export interface Session {
  userId: string;
  role: string;
  organizationId: string;
  email: string;
  tokenFake: string;
  createdAt: string;
}

export interface Dossier {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  ownerId: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface PackTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'banque' | 'donneur-ordre' | 'questionnaire' | 'pre-audit';
  checklistTemplateItems: ChecklistTemplateItem[];
  defaultKPIs: KPITemplate[];
}

export interface ChecklistTemplateItem {
  code: string;
  label: string;
  requirementLevel: 'MANDATORY' | 'RECOMMENDED';
  category: 'E' | 'S' | 'G';
  description?: string;
}

export interface KPITemplate {
  code: string;
  name: string;
  unit: string;
  category: 'E' | 'S' | 'G';
  calculationType?: 'direct' | 'computed';
  formula?: string;
}

export interface PackInstance {
  id: string;
  name: string;
  dossierId: string;
  templateCode: string;
  templateName: string;
  organizationId: string;
  ownerId: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';
  completionScore: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerId?: string;
}

export interface ChecklistItem {
  id: string;
  packId: string;
  code: string;
  label: string;
  requirementLevel: 'MANDATORY' | 'RECOMMENDED';
  category: 'E' | 'S' | 'G';
  status: 'MISSING' | 'PROVIDED' | 'NEEDS_REVIEW' | 'ACCEPTED' | 'REJECTED';
  description?: string;
  comment?: string;
  assignedTo?: string;
  dueDate?: string;
  updatedAt: string;
}

export interface KPIRequirement {
  id: string;
  packId: string;
  code: string;
  name: string;
  unit: string;
  category: 'E' | 'S' | 'G';
  status: 'missing' | 'in-progress' | 'provided' | 'validated';
  value?: number;
  period?: string;
  calculationType?: 'direct' | 'computed';
  formula?: string;
  sources?: string; // JSON stringified array of source IDs
  methodology?: string;
  hasEvidence: boolean;
  evidenceCount: number;
  warnings?: string[]; // JSON stringified
  updatedAt: string;
}

export interface DataImport {
  id: string;
  packId: string;
  fileName: string;
  mappingName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  rowsTotal: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsErrored: number;
  errorDetails?: string; // JSON stringified
  uploadedBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface DataRow {
  id: string;
  importId: string;
  packId: string;
  indicatorCode: string;
  value: number;
  unit: string;
  period: string;
  source?: string;
  methodology?: string;
  comment?: string;
  rowIndex: number;
  createdAt: string;
}

export interface Folder {
  id: string;
  packId: string;
  name: string;
  category: 'E' | 'S' | 'G';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Indicator {
  id: string;
  folderId: string;
  packId: string;
  code: string;
  name: string;
  unit: string;
  category: 'E' | 'S' | 'G';
  status: 'missing' | 'in-progress' | 'provided' | 'validated' | 'accepted' | 'rejected';
  value?: number;
  period?: string;
  requirementLevel?: 'MANDATORY' | 'RECOMMENDED';
  hasEvidence: boolean;
  evidenceCount: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: string;
  packId: string;
  indicatorId?: string; // 🆕 Add indicatorId for evidence-indicator link
  fileName: string;
  fileType: string;
  fileSize: number;
  fileBlobBase64?: string; // Fallback si IndexedDB blob fails
  fileHash: string;
  period?: string;
  category?: 'E' | 'S' | 'G';
  uploadedBy: string;
  uploadedAt: string;
  linkedIndicators: string[]; // Array of KPI codes
}

export interface EvidenceLink {
  id: string;
  evidenceId: string;
  kpiId: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: 'user' | 'organization' | 'dossier' | 'pack' | 'checklist' | 'kpi' | 'import' | 'evidence' | 'export';
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  details?: string; // JSON stringified
  before?: string; // JSON stringified
  after?: string; // JSON stringified
  timestamp: string;
  ipAddress?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'E' | 'S' | 'G' | 'General';
  status: 'pending' | 'in-progress' | 'review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  packId?: string;
  assignedTo?: string;
  dueDate?: string;
  linkedIndicators: string[]; // Array of indicator codes
  hasExcelTemplate: boolean;
  excelTemplateUrl?: string; // URL or blob for template
  excelStatus?: 'not_started' | 'uploaded' | 'validated';
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'pack_submitted' | 'pack_approved' | 'pack_rejected' | 'changes_requested' | 'comment_added' | 'evidence_uploaded' | 'import_completed' | 'export_generated' | 'task_assigned' | 'mention';
  title: string;
  description: string;
  packId?: string;
  read: boolean;
  createdAt: string;
}

export interface ExportHistory {
  id: string;
  packId: string;
  type: 'pdf' | 'zip' | 'excel' | 'csv';
  fileName: string;
  fileSize: number;
  generatedBy: string;
  generatedAt: string;
  blobBase64?: string; // Store export for re-download
}

// ==================== INDEXED DB SCHEMA ====================

interface SolvidDBSchema extends DBSchema {
  users: { key: string; value: User };
  organizations: { key: string; value: Organization };
  sessions: { key: string; value: Session };
  dossiers: { key: string; value: Dossier; indexes: { organizationId: string } };
  pack_templates: { key: string; value: PackTemplate };
  pack_instances: { key: string; value: PackInstance; indexes: { dossierId: string; organizationId: string } };
  checklist_items: { key: string; value: ChecklistItem; indexes: { packId: string } };
  kpi_requirements: { key: string; value: KPIRequirement; indexes: { packId: string; code: string } };
  data_imports: { key: string; value: DataImport; indexes: { packId: string } };
  data_rows: { key: string; value: DataRow; indexes: { importId: string; packId: string; indicatorCode: string } };
  folders: { key: string; value: Folder; indexes: { packId: string } };
  indicators: { key: string; value: Indicator; indexes: { folderId: string; packId: string } };
  evidence: { key: string; value: Evidence; indexes: { packId: string; indicatorId: string } }; // 🆕 Add indicatorId index
  evidence_links: { key: string; value: EvidenceLink; indexes: { evidenceId: string; kpiId: string } };
  audit_logs: { key: string; value: AuditLog; indexes: { entityType: string; entityId: string; timestamp: string } };
  tasks: { key: string; value: Task; indexes: { assignedTo: string; packId: string } };
  notifications: { key: string; value: Notification; indexes: { userId: string; read: boolean } };
  export_history: { key: string; value: ExportHistory; indexes: { packId: string } };
}

// ==================== LOCAL PROVIDER (IndexedDB) ====================

class LocalProvider {
  private db: IDBPDatabase<SolvidDBSchema> | null = null;
  private readonly DB_NAME = 'solvid_local_v1';
  private readonly DB_VERSION = 3; // 🆕 Increment version to add indicatorId index

  async init(): Promise<void> {
    try {
      this.db = await openDB<SolvidDBSchema>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log('🔧 Upgrading IndexedDB:', { oldVersion, newVersion });

          // Users
          if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
          }

          // Organizations
          if (!db.objectStoreNames.contains('organizations')) {
            db.createObjectStore('organizations', { keyPath: 'id' });
          }

          // Sessions
          if (!db.objectStoreNames.contains('sessions')) {
            db.createObjectStore('sessions', { keyPath: 'userId' });
          }

          // Dossiers
          if (!db.objectStoreNames.contains('dossiers')) {
            const dossierStore = db.createObjectStore('dossiers', { keyPath: 'id' });
            dossierStore.createIndex('organizationId', 'organizationId');
          }

          // Pack Templates
          if (!db.objectStoreNames.contains('pack_templates')) {
            db.createObjectStore('pack_templates', { keyPath: 'id' });
          }

          // Pack Instances
          if (!db.objectStoreNames.contains('pack_instances')) {
            const packStore = db.createObjectStore('pack_instances', { keyPath: 'id' });
            packStore.createIndex('dossierId', 'dossierId');
            packStore.createIndex('organizationId', 'organizationId');
          }

          // Checklist Items
          if (!db.objectStoreNames.contains('checklist_items')) {
            const checklistStore = db.createObjectStore('checklist_items', { keyPath: 'id' });
            checklistStore.createIndex('packId', 'packId');
          }

          // KPI Requirements
          if (!db.objectStoreNames.contains('kpi_requirements')) {
            const kpiStore = db.createObjectStore('kpi_requirements', { keyPath: 'id' });
            kpiStore.createIndex('packId', 'packId');
            kpiStore.createIndex('code', 'code');
          }

          // Data Imports
          if (!db.objectStoreNames.contains('data_imports')) {
            const importStore = db.createObjectStore('data_imports', { keyPath: 'id' });
            importStore.createIndex('packId', 'packId');
          }

          // Data Rows
          if (!db.objectStoreNames.contains('data_rows')) {
            const rowStore = db.createObjectStore('data_rows', { keyPath: 'id' });
            rowStore.createIndex('importId', 'importId');
            rowStore.createIndex('packId', 'packId');
            rowStore.createIndex('indicatorCode', 'indicatorCode');
          }

          // Folders
          if (!db.objectStoreNames.contains('folders')) {
            const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
            folderStore.createIndex('packId', 'packId');
          }

          // Indicators
          if (!db.objectStoreNames.contains('indicators')) {
            const indicatorStore = db.createObjectStore('indicators', { keyPath: 'id' });
            indicatorStore.createIndex('folderId', 'folderId');
            indicatorStore.createIndex('packId', 'packId');
          }

          // Evidence
          if (!db.objectStoreNames.contains('evidence')) {
            const evidenceStore = db.createObjectStore('evidence', { keyPath: 'id' });
            evidenceStore.createIndex('packId', 'packId');
            evidenceStore.createIndex('indicatorId', 'indicatorId'); // 🆕 Add indicatorId index
          }

          // Evidence Links
          if (!db.objectStoreNames.contains('evidence_links')) {
            const linkStore = db.createObjectStore('evidence_links', { keyPath: 'id' });
            linkStore.createIndex('evidenceId', 'evidenceId');
            linkStore.createIndex('kpiId', 'kpiId');
          }

          // Audit Logs
          if (!db.objectStoreNames.contains('audit_logs')) {
            const logStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
            logStore.createIndex('entityType', 'entityType');
            logStore.createIndex('entityId', 'entityId');
            logStore.createIndex('timestamp', 'timestamp');
          }

          // Tasks
          if (!db.objectStoreNames.contains('tasks')) {
            const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
            taskStore.createIndex('assignedTo', 'assignedTo');
            taskStore.createIndex('packId', 'packId');
          }

          // Notifications
          if (!db.objectStoreNames.contains('notifications')) {
            const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
            notifStore.createIndex('userId', 'userId');
            notifStore.createIndex('read', 'read');
          }

          // Export History
          if (!db.objectStoreNames.contains('export_history')) {
            const exportStore = db.createObjectStore('export_history', { keyPath: 'id' });
            exportStore.createIndex('packId', 'packId');
          }
        },
      });

      console.log('✅ IndexedDB initialized:', this.DB_NAME);
    } catch (error) {
      console.error('❌ IndexedDB initialization failed:', error);
      console.warn('⚠️ Fallback to localStorage (less performant)');
      // Fallback handled in each method
    }
  }

  // ==================== GENERIC CRUD ====================

  async create<T extends keyof SolvidDBSchema>(
    store: T,
    data: SolvidDBSchema[T]['value']
  ): Promise<SolvidDBSchema[T]['value']> {
    if (!this.db) await this.init();
    
    try {
      if (this.db) {
        await this.db.add(store, data as any);
        console.log(`✅ Created in ${store}:`, data);
        return data;
      }
    } catch (error) {
      console.error(`❌ Create failed in ${store}:`, error);
    }

    // Fallback to localStorage
    return this.createInLocalStorage(store, data);
  }

  async read<T extends keyof SolvidDBSchema>(
    store: T,
    id: string
  ): Promise<SolvidDBSchema[T]['value'] | null> {
    if (!this.db) await this.init();

    try {
      if (this.db) {
        const result = await this.db.get(store, id);
        return result || null;
      }
    } catch (error) {
      console.error(`❌ Read failed in ${store}:`, error);
    }

    // Fallback to localStorage
    return this.readFromLocalStorage(store, id);
  }

  async update<T extends keyof SolvidDBSchema>(
    store: T,
    data: SolvidDBSchema[T]['value']
  ): Promise<SolvidDBSchema[T]['value']> {
    if (!this.db) await this.init();

    try {
      if (this.db) {
        await this.db.put(store, data as any);
        console.log(`✅ Updated in ${store}:`, data);
        return data;
      }
    } catch (error) {
      console.error(`❌ Update failed in ${store}:`, error);
    }

    // Fallback to localStorage
    return this.updateInLocalStorage(store, data);
  }

  async delete<T extends keyof SolvidDBSchema>(
    store: T,
    id: string
  ): Promise<void> {
    if (!this.db) await this.init();

    try {
      if (this.db) {
        await this.db.delete(store, id);
        console.log(`✅ Deleted from ${store}:`, id);
        return;
      }
    } catch (error) {
      console.error(`❌ Delete failed in ${store}:`, error);
    }

    // Fallback to localStorage
    this.deleteFromLocalStorage(store, id);
  }

  async list<T extends keyof SolvidDBSchema>(
    store: T
  ): Promise<Array<SolvidDBSchema[T]['value']>> {
    if (!this.db) await this.init();

    try {
      if (this.db) {
        const results = await this.db.getAll(store);
        return results;
      }
    } catch (error) {
      console.error(`❌ List failed in ${store}:`, error);
    }

    // Fallback to localStorage
    return this.listFromLocalStorage(store);
  }

  async listByIndex<T extends keyof SolvidDBSchema>(
    store: T,
    indexName: string,
    indexValue: any
  ): Promise<Array<SolvidDBSchema[T]['value']>> {
    if (!this.db) await this.init();

    try {
      if (this.db) {
        const results = await this.db.getAllFromIndex(store, indexName as any, indexValue);
        return results;
      }
    } catch (error) {
      console.error(`❌ List by index failed in ${store}:`, error);
    }

    // Fallback to localStorage with filter
    const all = await this.listFromLocalStorage(store);
    return all.filter((item: any) => item[indexName] === indexValue);
  }

  // ==================== LOCALSTORAGE FALLBACK ====================

  private createInLocalStorage<T extends keyof SolvidDBSchema>(
    store: T,
    data: SolvidDBSchema[T]['value']
  ): SolvidDBSchema[T]['value'] {
    const key = `${this.DB_NAME}_${store}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(data);
    localStorage.setItem(key, JSON.stringify(existing));
    console.log(`✅ Created in localStorage ${store}:`, data);
    return data;
  }

  private readFromLocalStorage<T extends keyof SolvidDBSchema>(
    store: T,
    id: string
  ): SolvidDBSchema[T]['value'] | null {
    const key = `${this.DB_NAME}_${store}`;
    const all = JSON.parse(localStorage.getItem(key) || '[]');
    return all.find((item: any) => item.id === id) || null;
  }

  private updateInLocalStorage<T extends keyof SolvidDBSchema>(
    store: T,
    data: SolvidDBSchema[T]['value']
  ): SolvidDBSchema[T]['value'] {
    const key = `${this.DB_NAME}_${store}`;
    const all = JSON.parse(localStorage.getItem(key) || '[]');
    const index = all.findIndex((item: any) => item.id === (data as any).id);
    if (index >= 0) {
      all[index] = data;
    } else {
      all.push(data);
    }
    localStorage.setItem(key, JSON.stringify(all));
    console.log(`✅ Updated in localStorage ${store}:`, data);
    return data;
  }

  private deleteFromLocalStorage<T extends keyof SolvidDBSchema>(
    store: T,
    id: string
  ): void {
    const key = `${this.DB_NAME}_${store}`;
    const all = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = all.filter((item: any) => item.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
    console.log(`✅ Deleted from localStorage ${store}:`, id);
  }

  private listFromLocalStorage<T extends keyof SolvidDBSchema>(
    store: T
  ): Array<SolvidDBSchema[T]['value']> {
    const key = `${this.DB_NAME}_${store}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  // ==================== AUDIT LOG (immuable) ====================

  async logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditLog: AuditLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...log,
    };

    await this.create('audit_logs', auditLog);
  }
}

// ==================== DATA PROVIDER SINGLETON ====================

export class DataProvider {
  private static instance: DataProvider;
  private local: LocalProvider;

  private constructor() {
    this.local = new LocalProvider();
  }

  static getInstance(): DataProvider {
    if (!DataProvider.instance) {
      DataProvider.instance = new DataProvider();
    }
    return DataProvider.instance;
  }

  async init(): Promise<void> {
    await this.local.init();
    console.log('✅ DataProvider initialized');
  }

  // Expose local provider methods
  get store() {
    return this.local;
  }

  // Helper: Log action with automatic notification creation
  async logAndNotify(
    log: Omit<AuditLog, 'id' | 'timestamp'>,
    notification?: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ): Promise<void> {
    await this.local.logAction(log);

    if (notification) {
      await this.local.create('notifications', {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        read: false,
        ...notification,
      });
    }
  }
}

// ==================== EXPORT SINGLETON ====================

export const dataProvider = DataProvider.getInstance();

// Helper to initialize on app start
export async function initDataProvider(): Promise<void> {
  await dataProvider.init();
}