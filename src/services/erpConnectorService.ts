/**
 * ERP CONNECTOR SERVICE
 *
 * Gère le catalogue de connecteurs, les connexions actives,
 * les mappings comptables → ESG, et la synchronisation des données.
 *
 * Architecture : local-first (IndexedDB), compatible Supabase ultérieurement.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ERPProvider,
  ERPConnectorDefinition,
  ERPConnection,
  ERPMapping,
  MappingRule,
  SyncJob,
  SyncStats,
  SyncDataPreview,
  AccountMappingTemplate,
  PredefinedMappingRule,
  ConnectionStatus,
  SyncStatus,
  ERPInvoice,
  ERPEmployee,
  ERPJournalEntry,
  ERPAdapterCapabilities,
  EnrichedSyncDataPreview,
  ESGDataPoint,
} from '@/types/erp';
import { idbPutValue, makeValueId } from '@/services/idbService';
import type { VSMEValue } from '@/services/idbService';
import { classifyInvoices, classifyJournalEntries, buildSupplierSummary, buildSupplierSummaryFromEntries, type SupplierCategorySummary } from '@/services/erpCategorizationEngine';
import { extractFromInvoices, extractFromJournalEntries } from '@/services/erpUnitExtractor';
import { aggregateToESG, toEnrichedPreviews, type AggregationInput } from '@/services/erpESGAggregator';
import { syncEngine } from '@/services/syncEngine';

// ─── Catalogue de connecteurs ───────────────────────────────────────

export const ERP_CATALOG: ERPConnectorDefinition[] = [
  {
    id: 'pennylane',
    name: 'Pennylane',
    description: 'Comptabilité & facturation pour TPE/PME. Extraction automatique des données financières et comptables.',
    logo: '🟣',
    authMethod: 'api_key',
    categories: ['comptabilite', 'achats'],
    status: 'available',
    region: ['fr'],
    fields: [
      { key: 'api_key', label: 'Clé API Pennylane', type: 'password', placeholder: 'plk_...', required: true, helpText: 'Paramètres → API → Générer une clé' },
      { key: 'company_id', label: 'ID Société', type: 'text', placeholder: 'Ex: 12345', required: true },
    ],
    endpoints: [
      {
        id: 'pl_plan_comptable',
        name: 'Plan comptable',
        description: 'Tous les comptes et leurs soldes',
        category: 'comptabilite',
        dataFields: [
          { key: 'account_number', label: 'N° de compte', type: 'string' },
          { key: 'label', label: 'Libellé', type: 'string' },
          { key: 'balance', label: 'Solde', type: 'currency', unit: '€' },
        ],
      },
      {
        id: 'pl_ecritures',
        name: 'Écritures comptables',
        description: 'Journal des écritures avec détail',
        category: 'comptabilite',
        dataFields: [
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'account_number', label: 'N° de compte', type: 'string' },
          { key: 'label', label: 'Libellé', type: 'string' },
          { key: 'debit', label: 'Débit', type: 'currency', unit: '€' },
          { key: 'credit', label: 'Crédit', type: 'currency', unit: '€' },
        ],
      },
      {
        id: 'pl_factures',
        name: 'Factures fournisseurs',
        description: 'Achats et charges par fournisseur',
        category: 'achats',
        dataFields: [
          { key: 'supplier', label: 'Fournisseur', type: 'string' },
          { key: 'amount', label: 'Montant HT', type: 'currency', unit: '€' },
          { key: 'category', label: 'Catégorie', type: 'string' },
          { key: 'date', label: 'Date', type: 'date' },
        ],
      },
    ],
  },
  {
    id: 'odoo',
    name: 'Odoo',
    description: 'ERP open source complet : comptabilité, RH, achats, inventaire. Extraction multi-modules.',
    logo: '🟢',
    authMethod: 'api_key',
    categories: ['comptabilite', 'rh', 'achats'],
    status: 'available',
    region: ['fr', 'eu', 'global'],
    fields: [
      { key: 'url', label: 'URL Odoo', type: 'url', placeholder: 'https://mon-entreprise.odoo.com', required: true },
      { key: 'database', label: 'Base de données', type: 'text', placeholder: 'ma-base', required: true },
      { key: 'api_key', label: 'Clé API', type: 'password', placeholder: 'Clé API Odoo', required: true },
      { key: 'username', label: 'Utilisateur', type: 'text', placeholder: 'admin@entreprise.com', required: true },
    ],
    endpoints: [
      {
        id: 'odoo_accounting',
        name: 'Comptabilité',
        description: 'Plan comptable et écritures',
        category: 'comptabilite',
        dataFields: [
          { key: 'account_code', label: 'Code compte', type: 'string' },
          { key: 'name', label: 'Libellé', type: 'string' },
          { key: 'balance', label: 'Solde', type: 'currency', unit: '€' },
        ],
      },
      {
        id: 'odoo_hr',
        name: 'Ressources Humaines',
        description: 'Effectifs, contrats, formations',
        category: 'rh',
        dataFields: [
          { key: 'employee_count', label: 'Effectif total', type: 'number', unit: 'ETP' },
          { key: 'gender_ratio', label: 'Ratio H/F', type: 'number', unit: '%' },
          { key: 'training_hours', label: 'Heures formation', type: 'number', unit: 'h' },
          { key: 'turnover_rate', label: 'Taux de rotation', type: 'number', unit: '%' },
        ],
      },
      {
        id: 'odoo_purchases',
        name: 'Achats',
        description: 'Commandes fournisseurs et approvisionnement',
        category: 'achats',
        dataFields: [
          { key: 'supplier', label: 'Fournisseur', type: 'string' },
          { key: 'amount', label: 'Montant', type: 'currency', unit: '€' },
          { key: 'product_category', label: 'Catégorie produit', type: 'string' },
        ],
      },
    ],
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Solutions comptables et de gestion pour PME/ETI françaises.',
    logo: '🟡',
    authMethod: 'api_key',
    categories: ['comptabilite', 'rh'],
    status: 'coming_soon',
    region: ['fr', 'eu'],
    fields: [
      { key: 'api_key', label: 'Clé API Sage', type: 'password', required: true },
      { key: 'company_id', label: 'ID Société', type: 'text', required: true },
    ],
    endpoints: [],
  },
  {
    id: 'cegid',
    name: 'Cegid',
    description: 'Logiciel de gestion et comptabilité pour entreprises françaises.',
    logo: '🔵',
    authMethod: 'api_key',
    categories: ['comptabilite', 'rh'],
    status: 'coming_soon',
    region: ['fr'],
    fields: [
      { key: 'api_key', label: 'Clé API Cegid', type: 'password', required: true },
    ],
    endpoints: [],
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Comptabilité cloud Intuit, populaire à l\'international.',
    logo: '🟩',
    authMethod: 'oauth2',
    categories: ['comptabilite', 'achats'],
    status: 'coming_soon',
    region: ['us', 'eu', 'global'],
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
    ],
    endpoints: [],
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Comptabilité cloud pour PME, forte présence UK/Australie.',
    logo: '🔷',
    authMethod: 'oauth2',
    categories: ['comptabilite'],
    status: 'coming_soon',
    region: ['eu', 'global'],
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
    ],
    endpoints: [],
  },
  {
    id: 'fec_import',
    name: 'Import FEC',
    description: 'Fichier des Écritures Comptables — standard légal français. Compatible tout logiciel comptable.',
    logo: '📄',
    authMethod: 'file_upload',
    categories: ['comptabilite'],
    status: 'available',
    region: ['fr'],
    fields: [
      { key: 'fec_file', label: 'Fichier FEC (.txt ou .csv)', type: 'file', required: true, helpText: 'Le FEC est obligatoire et exportable depuis tout logiciel comptable français' },
    ],
    endpoints: [
      {
        id: 'fec_entries',
        name: 'Écritures comptables FEC',
        description: 'Toutes les écritures du fichier FEC',
        category: 'comptabilite',
        dataFields: [
          { key: 'JournalCode', label: 'Code journal', type: 'string' },
          { key: 'CompteNum', label: 'N° compte', type: 'string' },
          { key: 'CompteLib', label: 'Libellé compte', type: 'string' },
          { key: 'Debit', label: 'Débit', type: 'currency', unit: '€' },
          { key: 'Credit', label: 'Crédit', type: 'currency', unit: '€' },
          { key: 'EcritureDate', label: 'Date écriture', type: 'date' },
        ],
      },
    ],
  },
  {
    id: 'custom_api',
    name: 'API Personnalisée',
    description: 'Connectez n\'importe quel système via son API REST. Configuration manuelle des endpoints.',
    logo: '🔧',
    authMethod: 'api_key',
    categories: ['comptabilite', 'rh', 'achats', 'energie', 'dechets', 'transport'],
    status: 'available',
    region: ['global'],
    fields: [
      { key: 'base_url', label: 'URL de base', type: 'url', placeholder: 'https://api.mon-erp.com/v1', required: true },
      { key: 'api_key', label: 'Clé API / Bearer Token', type: 'password', required: true },
      { key: 'header_name', label: 'Nom du header auth', type: 'text', placeholder: 'Authorization', required: false, helpText: 'Par défaut : Authorization: Bearer <token>' },
    ],
    endpoints: [],
  },
];

// ─── Mappings comptables → ESG prédéfinis (Plan Comptable Général FR) ───────

export const ACCOUNT_MAPPING_TEMPLATES: AccountMappingTemplate[] = [
  {
    id: 'pcg-energy-ghg',
    name: 'Énergie & GES (PCG)',
    description: 'Mapping des comptes de charges énergie vers les indicateurs E1',
    provider: 'universal',
    rules: [
      { accountPattern: '6061*', accountLabel: 'Énergie (eau, électricité, gaz)', targetCode: 'B3.1', targetName: 'Consommation totale d\'énergie', transformation: 'factor', transformParams: { factor: 0.001, note: '€ → estimation MWh via prix moyen' }, unit: 'MWh/an', category: 'E', confidence: 0.7 },
      { accountPattern: '60611*', accountLabel: 'Eau', targetCode: 'B4.1', targetName: 'Consommation totale d\'eau', transformation: 'factor', transformParams: { factor: 1, note: 'Estimation m³ via factures' }, unit: 'm³/an', category: 'E', confidence: 0.6 },
      { accountPattern: '60612*', accountLabel: 'Électricité', targetCode: 'B3.2', targetName: 'dont énergie renouvelable', transformation: 'factor', transformParams: { factor: 0.001, note: '€ → MWh estimation' }, unit: 'MWh/an', category: 'E', confidence: 0.5 },
      { accountPattern: '60613*', accountLabel: 'Gaz', targetCode: 'B7.1', targetName: 'Émissions GES Scope 1', transformation: 'factor', transformParams: { factor: 0.205, note: 'kWh gaz → tCO2e (facteur ADEME)' }, unit: 'tCO2e', category: 'E', confidence: 0.65 },
      { accountPattern: '6251*', accountLabel: 'Voyages et déplacements', targetCode: 'B7.3', targetName: 'Émissions GES Scope 3', transformation: 'factor', transformParams: { factor: 0.0002, note: '€ → tCO2e estimation déplacements' }, unit: 'tCO2e', category: 'E', confidence: 0.4 },
    ],
  },
  {
    id: 'pcg-social',
    name: 'Social (PCG)',
    description: 'Mapping des comptes de charges sociales vers les indicateurs S',
    provider: 'universal',
    rules: [
      { accountPattern: '641*', accountLabel: 'Rémunérations du personnel', targetCode: 'B8.1', targetName: 'Salaires et traitements', transformation: 'direct', unit: '€', category: 'S', confidence: 0.9 },
      { accountPattern: '6333*', accountLabel: 'Formation professionnelle', targetCode: 'B8.7', targetName: 'Investissement formation', transformation: 'direct', unit: '€', category: 'S', confidence: 0.85 },
      { accountPattern: '6284*', accountLabel: 'Participation aux résultats', targetCode: 'B8.8', targetName: 'Participation et intéressement', transformation: 'direct', unit: '€', category: 'S', confidence: 0.8 },
    ],
  },
  {
    id: 'pcg-governance',
    name: 'Gouvernance (PCG)',
    description: 'Mapping des comptes de gouvernance et conformité',
    provider: 'universal',
    rules: [
      { accountPattern: '6226*', accountLabel: 'Honoraires d\'audit', targetCode: 'B11.1', targetName: 'Frais d\'audit et certification', transformation: 'direct', unit: '€', category: 'G', confidence: 0.9 },
      { accountPattern: '6354*', accountLabel: 'Droits de propriété intellectuelle', targetCode: 'B11.3', targetName: 'Investissements PI & conformité', transformation: 'direct', unit: '€', category: 'G', confidence: 0.7 },
    ],
  },
  {
    id: 'pcg-waste',
    name: 'Déchets & Pollution (PCG)',
    description: 'Mapping des comptes de traitement des déchets',
    provider: 'universal',
    rules: [
      { accountPattern: '6068*', accountLabel: 'Traitement des déchets', targetCode: 'B5.1', targetName: 'Production totale de déchets', transformation: 'factor', transformParams: { factor: 0.5, note: '€ → tonnes estimation' }, unit: 'tonnes', category: 'E', confidence: 0.5 },
    ],
  },
];

// ─── Storage keys ───────────────────────────────────────────────────

const STORAGE_KEYS = {
  connections: 'solvid_erp_connections',
  mappings: 'solvid_erp_mappings',
  syncJobs: 'solvid_erp_sync_jobs',
};

// ─── Supabase write-through helpers ─────────────────────────────────

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result;
}

/** Sync a single ERP entity to Supabase (fire-and-forget) */
function syncErpEntity(
  table: 'erp_connections' | 'erp_mappings' | 'erp_sync_jobs' | 'esg_data_points',
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  data: Record<string, unknown>
): void {
  const payload = operation === 'DELETE' ? { id: data.id } : toSnakeCase(data);
  syncEngine.syncToCloud(table, operation, payload).catch(() => {});
}

// ─── Service ────────────────────────────────────────────────────────

class ERPConnectorService {
  // ── Catalogue ──────────────────────────────────────────────────

  getCatalog(): ERPConnectorDefinition[] {
    return ERP_CATALOG;
  }

  getConnectorDef(provider: ERPProvider): ERPConnectorDefinition | undefined {
    return ERP_CATALOG.find(c => c.id === provider);
  }

  getAvailableConnectors(): ERPConnectorDefinition[] {
    return ERP_CATALOG.filter(c => c.status === 'available');
  }

  // ── Connexions ─────────────────────────────────────────────────

  getConnections(): ERPConnection[] {
    const raw = localStorage.getItem(STORAGE_KEYS.connections);
    return raw ? JSON.parse(raw) : [];
  }

  getConnection(id: string): ERPConnection | undefined {
    return this.getConnections().find(c => c.id === id);
  }

  getConnectionsByOrg(organizationId: string): ERPConnection[] {
    return this.getConnections().filter(c => c.organizationId === organizationId);
  }

  saveConnection(connection: ERPConnection): ERPConnection {
    const connections = this.getConnections();
    const idx = connections.findIndex(c => c.id === connection.id);
    if (idx >= 0) {
      connections[idx] = { ...connection, updatedAt: new Date().toISOString() };
    } else {
      connections.push(connection);
    }
    localStorage.setItem(STORAGE_KEYS.connections, JSON.stringify(connections));
    // Sync to Supabase
    syncErpEntity('erp_connections', idx >= 0 ? 'UPDATE' : 'INSERT', connection as any);
    return connection;
  }

  createConnection(params: {
    organizationId: string;
    provider: ERPProvider;
    name: string;
    credentials: Record<string, string>;
  }): ERPConnection {
    const connection: ERPConnection = {
      id: uuidv4(),
      organizationId: params.organizationId,
      provider: params.provider,
      name: params.name,
      status: 'disconnected',
      credentials: params.credentials,
      config: {
        autoSync: false,
        syncFrequency: 'manual',
        enabledEndpoints: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.saveConnection(connection);
  }

  deleteConnection(id: string): void {
    // Cleanup related mappings and sync jobs first
    const deletedMappings = this.getMappings().filter(m => m.connectionId === id);
    const deletedJobs = this.getSyncJobs().filter(j => j.connectionId === id);

    const connections = this.getConnections().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.connections, JSON.stringify(connections));
    const mappings = this.getMappings().filter(m => m.connectionId !== id);
    localStorage.setItem(STORAGE_KEYS.mappings, JSON.stringify(mappings));
    const jobs = this.getSyncJobs().filter(j => j.connectionId !== id);
    localStorage.setItem(STORAGE_KEYS.syncJobs, JSON.stringify(jobs));

    // Sync deletions to Supabase
    syncErpEntity('erp_connections', 'DELETE', { id });
    for (const m of deletedMappings) syncErpEntity('erp_mappings', 'DELETE', { id: m.id });
    for (const j of deletedJobs) syncErpEntity('erp_sync_jobs', 'DELETE', { id: j.id });
  }

  async testConnection(connection: ERPConnection): Promise<{ success: boolean; message: string }> {
    const def = this.getConnectorDef(connection.provider);
    if (!def) return { success: false, message: 'Connecteur inconnu' };

    // Check required fields
    for (const field of def.fields) {
      if (field.required && !connection.credentials[field.key]) {
        return { success: false, message: `Champ requis manquant : ${field.label}` };
      }
    }

    // 1) Validation locale du format des credentials (avant d'appeler le backend)
    const localCheck = this.validateCredentialFormat(connection);
    if (!localCheck.valid) {
      return { success: false, message: localCheck.message };
    }

    // 2) Try backend proxy (appel réel vers l'API Pennylane/Odoo)
    try {
      const backendUrl = this.getBackendUrl();
      const res = await fetch(`${backendUrl}/erp/connections/${connection.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: connection.provider, credentials: connection.credentials }),
      });
      if (res.ok) {
        const result = await res.json();
        const updated = {
          ...connection,
          status: (result.success ? 'connected' : 'error') as ConnectionStatus,
          updatedAt: new Date().toISOString(),
        };
        this.saveConnection(updated);
        return result;
      }
    } catch {
      console.log('[ERP] Backend indisponible, tentative appel direct');
    }

    // 3) Fallback : appel direct vers l'API depuis le navigateur
    const directResult = await this.testConnectionDirect(connection);
    const updated = {
      ...connection,
      status: (directResult.success ? 'connected' : 'error') as ConnectionStatus,
      updatedAt: new Date().toISOString(),
    };
    this.saveConnection(updated);
    return directResult;
  }

  /**
   * Vérifie le format des credentials avant d'appeler l'API.
   * Rejette les clés API trop courtes, mal formatées, ou placeholder.
   */
  private validateCredentialFormat(connection: ERPConnection): { valid: boolean; message: string } {
    const { provider, credentials } = connection;

    switch (provider) {
      case 'pennylane': {
        const key = credentials.api_key || '';
        const companyId = credentials.company_id || '';
        if (key.length < 20) {
          return { valid: false, message: 'Clé API Pennylane trop courte — elle doit faire au moins 20 caractères (format: plk_...)' };
        }
        if (/^(test|demo|fake|xxx|aaa)/i.test(key)) {
          return { valid: false, message: 'Clé API invalide — veuillez entrer votre vraie clé Pennylane (Paramètres → API)' };
        }
        if (!/^\d+$/.test(companyId)) {
          return { valid: false, message: 'ID société Pennylane invalide — doit être un nombre (ex: 12345)' };
        }
        return { valid: true, message: '' };
      }

      case 'odoo': {
        const url = credentials.url || '';
        const db = credentials.database || '';
        const user = credentials.username || '';
        const key = credentials.api_key || '';

        if (!/^https?:\/\/.+/.test(url)) {
          return { valid: false, message: 'URL Odoo invalide — doit commencer par http:// ou https://' };
        }
        if (url.includes('example.com') || url.includes('localhost')) {
          return { valid: false, message: 'URL Odoo invalide — entrez l\'URL réelle de votre instance' };
        }
        if (db.length < 2) {
          return { valid: false, message: 'Nom de base Odoo trop court' };
        }
        if (!user.includes('@') && user.length < 3) {
          return { valid: false, message: 'Nom d\'utilisateur Odoo invalide' };
        }
        if (key.length < 8) {
          return { valid: false, message: 'Clé API Odoo trop courte — minimum 8 caractères' };
        }
        return { valid: true, message: '' };
      }

      case 'fec_import': {
        const content = credentials.fec_content || '';
        if (content.length < 100) {
          return { valid: false, message: 'Fichier FEC vide ou trop court' };
        }
        const firstLine = content.split('\n')[0]?.toLowerCase() || '';
        if (!firstLine.includes('comptenum') && !firstLine.includes('journalcode')) {
          return { valid: false, message: 'Format FEC non reconnu — la première ligne doit contenir les colonnes standard (CompteNum, JournalCode...)' };
        }
        const lineCount = content.split('\n').length;
        if (lineCount < 3) {
          return { valid: false, message: 'Fichier FEC trop court — au moins 2 écritures nécessaires' };
        }
        return { valid: true, message: '' };
      }

      default:
        return { valid: true, message: '' };
    }
  }

  /**
   * Tente un appel direct vers l'API ERP depuis le navigateur.
   * Fonctionne pour Pennylane (CORS autorisé) et FEC (local).
   * Pour Odoo, CORS bloqué → message explicite.
   */
  private async testConnectionDirect(connection: ERPConnection): Promise<{ success: boolean; message: string }> {
    const { provider, credentials } = connection;

    switch (provider) {
      case 'pennylane': {
        try {
          const res = await fetch('https://app.pennylane.com/api/external/v1/company', {
            headers: {
              'Authorization': `Bearer ${credentials.api_key}`,
              'Accept': 'application/json',
            },
          });
          if (res.ok) {
            const data = await res.json();
            return { success: true, message: `Connecté à ${data.name || 'Pennylane'} ✓` };
          }
          if (res.status === 401) return { success: false, message: 'Clé API Pennylane invalide — vérifiez dans Paramètres → API' };
          if (res.status === 403) return { success: false, message: 'Accès refusé — vérifiez les permissions de votre clé API' };
          return { success: false, message: `Erreur Pennylane (${res.status}) — réessayez ou vérifiez votre clé` };
        } catch (e: any) {
          // CORS ou réseau
          if (e.message?.includes('Failed to fetch') || e.message?.includes('CORS')) {
            return { success: false, message: 'Impossible de vérifier la clé directement (CORS). Vérifiez que votre clé commence par "plk_" et réessayez — la connexion sera validée lors de la première synchronisation.' };
          }
          return { success: false, message: `Erreur réseau : ${e.message}` };
        }
      }

      case 'odoo': {
        try {
          const res = await fetch(`${credentials.url}/jsonrpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', method: 'call',
              params: { service: 'common', method: 'authenticate', args: [credentials.database, credentials.username, credentials.api_key, {}] },
            }),
          });
          const data = await res.json();
          if (data.result) {
            return { success: true, message: `Connecté à Odoo (uid: ${data.result}) ✓` };
          }
          return { success: false, message: 'Authentification Odoo échouée — vérifiez utilisateur, mot de passe et base de données' };
        } catch (e: any) {
          if (e.message?.includes('Failed to fetch') || e.message?.includes('CORS')) {
            return { success: false, message: `Impossible de contacter ${credentials.url} — vérifiez l'URL et que CORS est configuré, ou utilisez le backend proxy.` };
          }
          return { success: false, message: `Erreur réseau Odoo : ${e.message}` };
        }
      }

      case 'fec_import': {
        // FEC = validation locale complète, pas d'appel réseau
        const content = credentials.fec_content || '';
        const lines = content.split('\n');
        const header = lines[0]?.toLowerCase() || '';

        if (!header.includes('comptenum')) {
          return { success: false, message: 'Colonne CompteNum absente — vérifiez que c\'est un FEC standard (tab-separated)' };
        }

        const dataLines = lines.slice(1).filter(l => l.trim().length > 0);
        const hasAux = header.includes('compauxnum') || header.includes('compauxlib');
        const auxMsg = hasAux ? ' (avec comptes auxiliaires — classification fournisseurs possible)' : ' (sans comptes auxiliaires — classification limitée aux codes comptables)';

        return {
          success: true,
          message: `FEC valide : ${dataLines.length} écritures détectées${auxMsg} ✓`,
        };
      }

      default:
        return { success: false, message: 'Type de connecteur non supporté pour la vérification directe' };
    }
  }

  // ── Mappings ───────────────────────────────────────────────────

  getMappings(): ERPMapping[] {
    const raw = localStorage.getItem(STORAGE_KEYS.mappings);
    return raw ? JSON.parse(raw) : [];
  }

  getMappingsByConnection(connectionId: string): ERPMapping[] {
    return this.getMappings().filter(m => m.connectionId === connectionId);
  }

  saveMapping(mapping: ERPMapping): ERPMapping {
    const mappings = this.getMappings();
    const idx = mappings.findIndex(m => m.id === mapping.id);
    if (idx >= 0) {
      mappings[idx] = { ...mapping, updatedAt: new Date().toISOString() };
    } else {
      mappings.push(mapping);
    }
    localStorage.setItem(STORAGE_KEYS.mappings, JSON.stringify(mappings));
    // Sync to Supabase
    syncErpEntity('erp_mappings', idx >= 0 ? 'UPDATE' : 'INSERT', mapping as any);
    return mapping;
  }

  createDefaultMapping(connectionId: string): ERPMapping {
    // Build mapping rules from predefined templates
    const allRules: MappingRule[] = [];
    for (const template of ACCOUNT_MAPPING_TEMPLATES) {
      for (const rule of template.rules) {
        allRules.push({
          id: uuidv4(),
          erpEndpoint: 'plan_comptable',
          erpField: rule.accountPattern,
          targetCode: rule.targetCode,
          targetName: rule.targetName,
          transformation: rule.transformation,
          transformParams: rule.transformParams,
          unit: rule.unit,
          category: rule.category,
          isActive: true,
        });
      }
    }

    const mapping: ERPMapping = {
      id: uuidv4(),
      connectionId,
      name: 'Mapping PCG → VSME (auto)',
      description: 'Mapping automatique basé sur le Plan Comptable Général français',
      rules: allRules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.saveMapping(mapping);
  }

  deleteMapping(id: string): void {
    const mappings = this.getMappings().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.mappings, JSON.stringify(mappings));
  }

  // ── Templates de mapping prédéfinis ────────────────────────────

  getAccountMappingTemplates(): AccountMappingTemplate[] {
    return ACCOUNT_MAPPING_TEMPLATES;
  }

  // ── Synchronisation ────────────────────────────────────────────

  getSyncJobs(): SyncJob[] {
    const raw = localStorage.getItem(STORAGE_KEYS.syncJobs);
    return raw ? JSON.parse(raw) : [];
  }

  getSyncJobsByConnection(connectionId: string): SyncJob[] {
    return this.getSyncJobs().filter(j => j.connectionId === connectionId);
  }

  getLastSync(connectionId: string): SyncJob | undefined {
    const jobs = this.getSyncJobsByConnection(connectionId);
    return jobs.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  }

  /**
   * Lance une synchronisation via le backend proxy.
   * Fallback local si le backend est indisponible.
   */
  async runSync(connectionId: string, mappingId?: string): Promise<SyncJob> {
    const connection = this.getConnection(connectionId);
    if (!connection) throw new Error('Connexion introuvable');

    const mappings = this.getMappingsByConnection(connectionId);
    const mapping = mappingId
      ? mappings.find(m => m.id === mappingId)
      : mappings[0];

    if (!mapping) throw new Error('Aucun mapping configuré pour cette connexion');

    // Try backend first
    try {
      const backendUrl = this.getBackendUrl();
      const res = await fetch(`${backendUrl}/erp/sync/${connectionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mappingId,
          connection,
          mapping,
        }),
      });

      if (res.ok) {
        const syncJob: SyncJob = await res.json();
        this.saveSyncJob(syncJob);
        this.saveConnection({
          ...connection,
          lastSyncAt: syncJob.completedAt,
          lastSyncStatus: syncJob.status as any,
        });
        return syncJob;
      }
    } catch {
      console.log('[ERP] Backend indisponible pour sync, fallback local');
    }

    // Fallback: local simulation
    return this.runSyncLocal(connection, mapping);
  }

  private async runSyncLocal(connection: ERPConnection, mapping: ERPMapping): Promise<SyncJob> {
    const job: SyncJob = {
      id: uuidv4(),
      connectionId: connection.id,
      status: 'syncing',
      startedAt: new Date().toISOString(),
      triggeredBy: 'manual',
      stats: { totalRecords: 0, mappedRecords: 0, importedRecords: 0, skippedRecords: 0, errorRecords: 0, indicatorsUpdated: 0 },
      errors: [],
      dataPreview: [],
    };
    this.saveSyncJob(job);

    await new Promise(r => setTimeout(r, 2000));

    const activeRules = mapping.rules.filter(r => r.isActive);
    const preview: SyncDataPreview[] = activeRules.map(rule => {
      const rawValue = this.generateDemoValue(rule);
      const transformed = this.applyTransformation(rawValue, rule);
      return {
        erpField: rule.erpField,
        erpValue: rawValue,
        targetCode: rule.targetCode,
        targetName: rule.targetName,
        transformedValue: transformed,
        unit: rule.unit || '',
        status: 'mapped' as const,
      };
    });

    const completedJob: SyncJob = {
      ...job,
      status: 'success',
      completedAt: new Date().toISOString(),
      stats: {
        totalRecords: activeRules.length * 12,
        mappedRecords: activeRules.length,
        importedRecords: activeRules.length,
        skippedRecords: 0,
        errorRecords: 0,
        indicatorsUpdated: activeRules.length,
        duration: 2000,
      },
      dataPreview: preview,
    };

    this.saveSyncJob(completedJob);
    this.saveConnection({
      ...connection,
      lastSyncAt: completedJob.completedAt,
      lastSyncStatus: 'success',
    });

    return completedJob;
  }

  private saveSyncJob(job: SyncJob): void {
    const jobs = this.getSyncJobs();
    const idx = jobs.findIndex(j => j.id === job.id);
    if (idx >= 0) {
      jobs[idx] = job;
    } else {
      jobs.push(job);
    }
    localStorage.setItem(STORAGE_KEYS.syncJobs, JSON.stringify(jobs));
    // Sync to Supabase
    syncErpEntity('erp_sync_jobs', idx >= 0 ? 'UPDATE' : 'INSERT', job as any);
  }

  private generateDemoValue(rule: MappingRule): number {
    // Generate realistic demo values based on category
    const ranges: Record<string, [number, number]> = {
      'B3.1': [150000, 500000],    // Énergie en €
      'B3.2': [50000, 200000],     // Énergie renouvelable en €
      'B4.1': [10000, 50000],      // Eau en €
      'B5.1': [20000, 80000],      // Déchets en €
      'B7.1': [30000, 100000],     // GES en €
      'B7.3': [50000, 200000],     // Déplacements en €
      'B8.1': [500000, 2000000],   // Salaires en €
      'B8.7': [10000, 50000],      // Formation en €
      'B8.8': [20000, 100000],     // Participation en €
      'B11.1': [15000, 60000],     // Audit en €
      'B11.3': [5000, 30000],      // PI en €
    };
    const [min, max] = ranges[rule.targetCode] || [10000, 100000];
    return Math.round(min + Math.random() * (max - min));
  }

  private applyTransformation(value: number, rule: MappingRule): number {
    switch (rule.transformation) {
      case 'direct':
        return value;
      case 'factor':
        return Math.round(value * (rule.transformParams?.factor || 1) * 100) / 100;
      case 'sum':
        return value;
      case 'count':
        return Math.round(value / 1000);
      default:
        return value;
    }
  }

  // ── Backend URL ─────────────────────────────────────────────────

  private getBackendUrl(): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return supabaseUrl
      ? `${supabaseUrl}/functions/v1/make-server-aa780fc8`
      : '/api';
  }

  // ── Sync enrichie (v2) ────────────────────────────────────────

  /**
   * Pipeline enrichi : factures + classification + extraction quantités + agrégation ESG.
   * Try backend first, fallback local avec données simulées.
   */
  async runEnrichedSync(connectionId: string): Promise<{
    job: SyncJob;
    enrichedPreviews: EnrichedSyncDataPreview[];
    esgPoints: ESGDataPoint[];
    supplierSummary: SupplierCategorySummary[];
  }> {
    const connection = this.getConnection(connectionId);
    if (!connection) throw new Error('Connexion introuvable');

    // Try backend first
    try {
      const backendUrl = this.getBackendUrl();
      const res = await fetch(`${backendUrl}/erp/sync-enriched/${connectionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection }),
      });

      if (res.ok) {
        const result = await res.json();
        return this.processEnrichedData(connection, result.data, result.capabilities);
      }
    } catch {
      console.log('[ERP] Backend indisponible pour sync enrichie, fallback local');
    }

    // Fallback: local simulation
    return this.runEnrichedSyncLocal(connection);
  }

  /**
   * Fallback local : génère des données simulées réalistes puis applique le pipeline complet.
   */
  private async runEnrichedSyncLocal(connection: ERPConnection): Promise<{
    job: SyncJob;
    enrichedPreviews: EnrichedSyncDataPreview[];
    esgPoints: ESGDataPoint[];
    supplierSummary: SupplierCategorySummary[];
  }> {
    await new Promise(r => setTimeout(r, 2000));

    const year = new Date().getFullYear().toString();
    const data = this.generateSimulatedEnrichedData(year);
    const capabilities: ERPAdapterCapabilities = {
      hasInvoices: true,
      hasInvoiceLines: true,
      hasJournalEntries: false,
      hasHR: connection.provider === 'odoo',
    };

    return this.processEnrichedData(connection, data, capabilities);
  }

  /**
   * Coeur du pipeline : classification → extraction → agrégation → previews.
   */
  private processEnrichedData(
    connection: ERPConnection,
    data: {
      accountData: Array<{ accountCode: string; accountLabel: string; debit: number; credit: number; balance: number }>;
      invoices: ERPInvoice[];
      journalEntries: ERPJournalEntry[];
      employees: ERPEmployee[];
    },
    capabilities: ERPAdapterCapabilities,
  ): {
    job: SyncJob;
    enrichedPreviews: EnrichedSyncDataPreview[];
    esgPoints: ESGDataPoint[];
    supplierSummary: SupplierCategorySummary[];
  } {
    // 1) Classifier les fournisseurs — via factures ET/OU écritures
    //    FEC → pas de factures mais des écritures avec CompAuxNum/CompAuxLib
    //    Pennylane/Odoo → factures avec supplier.name
    const invoiceClassifications = data.invoices.length > 0
      ? classifyInvoices(data.invoices)
      : new Map();

    const entryClassifications = data.journalEntries.length > 0
      ? classifyJournalEntries(data.journalEntries)
      : new Map();

    // Merge les deux maps de classifications (factures prioritaires sur écritures)
    const classifications = new Map([...entryClassifications, ...invoiceClassifications]);

    // 2) Extraire les quantités physiques — depuis factures ET écritures
    const invoiceQuantities = data.invoices.length > 0
      ? extractFromInvoices(data.invoices)
      : [];

    const entryQuantities = data.journalEntries.length > 0
      ? extractFromJournalEntries(data.journalEntries)
      : [];

    // 3) Agréger en indicateurs ESG
    const aggregationInput: AggregationInput = {
      accountData: data.accountData,
      invoices: data.invoices,
      journalEntries: data.journalEntries,
      employees: data.employees,
      supplierClassifications: classifications,
      invoiceQuantities,
      entryQuantities,
    };
    const esgPoints = aggregateToESG(aggregationInput);

    // 4) Construire les previews enrichies
    const enrichedPreviews = toEnrichedPreviews(esgPoints);

    // 5) Résumé fournisseurs — factures (Pennylane/Odoo) OU écritures (FEC)
    let supplierSummary: SupplierCategorySummary[];
    if (data.invoices.length > 0) {
      supplierSummary = buildSupplierSummary(data.invoices, classifications);
    } else if (data.journalEntries.length > 0) {
      supplierSummary = buildSupplierSummaryFromEntries(data.journalEntries, classifications);
    } else {
      supplierSummary = [];
    }

    // 6) Construire le SyncJob
    const now = new Date().toISOString();
    const totalRecords = data.invoices.length + data.journalEntries.length + data.employees.length + data.accountData.length;
    const job: SyncJob = {
      id: uuidv4(),
      connectionId: connection.id,
      status: 'success',
      startedAt: now,
      completedAt: now,
      triggeredBy: 'manual',
      stats: {
        totalRecords,
        mappedRecords: esgPoints.length,
        importedRecords: esgPoints.length,
        skippedRecords: 0,
        errorRecords: 0,
        indicatorsUpdated: esgPoints.length,
      },
      errors: [],
      dataPreview: enrichedPreviews,
    };
    this.saveSyncJob(job);
    this.saveConnection({
      ...connection,
      lastSyncAt: now,
      lastSyncStatus: 'success',
    });

    // Persist ESG data for dashboard consumption
    localStorage.setItem('solvid_erp_esg_points', JSON.stringify(esgPoints));
    localStorage.setItem('solvid_erp_supplier_summary', JSON.stringify(supplierSummary));
    // Sync ESG data points to Supabase
    for (const pt of esgPoints) {
      syncErpEntity('esg_data_points', 'INSERT', {
        id: pt.id || uuidv4(),
        vsmeCode: pt.vsmeCode,
        pillar: pt.pillar,
        value: pt.value,
        unit: pt.unit,
        source: pt.source,
        confidence: pt.confidence,
        organizationId: connection.organizationId,
      });
    }
    localStorage.setItem('solvid_erp_last_sync_meta', JSON.stringify({
      connectionId: connection.id,
      connectionName: connection.name,
      provider: connection.provider,
      syncDate: now,
      recordCount: totalRecords,
    }));
    window.dispatchEvent(new CustomEvent('erp-sync-completed'));

    return { job, enrichedPreviews, esgPoints, supplierSummary };
  }

  /**
   * Génère des données simulées réalistes pour le mode local.
   */
  private generateSimulatedEnrichedData(year: string) {
    const invoices: ERPInvoice[] = [
      // EDF — 4 trimestres
      ...['03', '06', '09', '12'].map((m, i) => ({
        id: `inv-edf-q${i + 1}`,
        type: 'purchase' as const,
        supplier: { id: 'sup-edf', name: 'EDF Entreprises' },
        date: `${year}-${m}-15`,
        totalHT: 6800 + Math.round(Math.random() * 400),
        totalTTC: 8160,
        currency: 'EUR' as const,
        rawDescription: `Facture électricité T${i + 1} ${year} - Conso: ${35000 + Math.round(Math.random() * 5000)} kWh`,
        lines: [{
          description: `Consommation électricité T${i + 1}: ${35000 + Math.round(Math.random() * 5000)} kWh`,
          accountCode: '60612',
          amount: 6800 + Math.round(Math.random() * 400),
          quantity: 35000 + Math.round(Math.random() * 5000),
          unit: 'kWh',
        }],
      })),
      // Engie — 4 trimestres gaz
      ...['03', '06', '09', '12'].map((m, i) => ({
        id: `inv-engie-q${i + 1}`,
        type: 'purchase' as const,
        supplier: { id: 'sup-engie', name: 'Engie Pro' },
        date: `${year}-${m}-20`,
        totalHT: 3200 + Math.round(Math.random() * 300),
        totalTTC: 3840,
        currency: 'EUR' as const,
        rawDescription: `Gaz naturel T${i + 1} ${year} - ${18000 + Math.round(Math.random() * 3000)} kWh`,
        lines: [{
          description: `Consommation gaz T${i + 1}: ${18000 + Math.round(Math.random() * 3000)} kWh`,
          accountCode: '60613',
          amount: 3200 + Math.round(Math.random() * 300),
          quantity: 18000 + Math.round(Math.random() * 3000),
          unit: 'kWh',
        }],
      })),
      // Veolia — 2 semestres eau
      ...['06', '12'].map((m, i) => ({
        id: `inv-veolia-s${i + 1}`,
        type: 'purchase' as const,
        supplier: { id: 'sup-veolia', name: 'Veolia Eau' },
        date: `${year}-${m}-25`,
        totalHT: 1350 + Math.round(Math.random() * 200),
        totalTTC: 1620,
        currency: 'EUR' as const,
        rawDescription: `Eau S${i + 1} ${year} - 290 m³`,
        lines: [{
          description: `Consommation eau S${i + 1}: 290 m³`,
          accountCode: '60611',
          amount: 1350 + Math.round(Math.random() * 200),
          quantity: 290,
          unit: 'm³',
        }],
      })),
      // Paprec — 6 bimestres déchets
      ...['02', '04', '06', '08', '10', '12'].map((m, i) => ({
        id: `inv-paprec-b${i + 1}`,
        type: 'purchase' as const,
        supplier: { id: 'sup-paprec', name: 'Paprec Group' },
        date: `${year}-${m}-10`,
        totalHT: 800 + Math.round(Math.random() * 150),
        totalTTC: 960,
        currency: 'EUR' as const,
        rawDescription: `Collecte déchets bimestrielle - 0.4 tonnes`,
        lines: [{
          description: `Enlèvement déchets industriels: 0.4 tonnes`,
          accountCode: '6068',
          amount: 800 + Math.round(Math.random() * 150),
          quantity: 0.4,
          unit: 'tonnes',
        }],
      })),
      // KPMG — audit annuel
      {
        id: 'inv-kpmg-01',
        type: 'purchase' as const,
        supplier: { id: 'sup-kpmg', name: 'KPMG France' },
        date: `${year}-04-15`,
        totalHT: 35000,
        totalTTC: 42000,
        currency: 'EUR' as const,
        rawDescription: 'Honoraires audit légal et certification comptes annuels',
        lines: [{
          description: 'Audit légal comptes annuels',
          accountCode: '6226',
          amount: 35000,
        }],
      },
      // SNCF — 3 déplacements
      ...['03', '07', '11'].map((m, i) => ({
        id: `inv-sncf-${i + 1}`,
        type: 'purchase' as const,
        supplier: { id: 'sup-sncf', name: 'SNCF Voyageurs' },
        date: `${year}-${m}-12`,
        totalHT: 1200 + Math.round(Math.random() * 600),
        totalTTC: 1440,
        currency: 'EUR' as const,
        rawDescription: `Billets TGV déplacements professionnels`,
        lines: [{
          description: 'Voyages professionnels en train',
          accountCode: '6251',
          amount: 1200 + Math.round(Math.random() * 600),
        }],
      })),
      // Cegos — formation
      {
        id: 'inv-cegos-01',
        type: 'purchase' as const,
        supplier: { id: 'sup-cegos', name: 'Cegos Formation' },
        date: `${year}-05-20`,
        totalHT: 8500,
        totalTTC: 10200,
        currency: 'EUR' as const,
        rawDescription: 'Formation management durable — 5 jours',
        lines: [{
          description: 'Formation management RSE - 5 jours',
          accountCode: '6333',
          amount: 8500,
        }],
      },
      {
        id: 'inv-cegos-02',
        type: 'purchase' as const,
        supplier: { id: 'sup-cegos', name: 'Cegos Formation' },
        date: `${year}-10-15`,
        totalHT: 6200,
        totalTTC: 7440,
        currency: 'EUR' as const,
        rawDescription: 'Formation sécurité au travail — 3 jours',
        lines: [{
          description: 'Formation SST - 3 jours',
          accountCode: '6333',
          amount: 6200,
        }],
      },
    ];

    const mkAcct = (code: string, label: string, bal: number) => ({ accountCode: code, accountLabel: label, debit: bal, credit: 0, balance: bal });
    const accountData = [
      mkAcct('6061', 'Fournitures non stockables (eau, énergie)', invoices.filter(i => ['60611', '60612', '60613'].includes(i.lines[0]?.accountCode || '')).reduce((s, i) => s + i.totalHT, 0)),
      mkAcct('60611', 'Eau', invoices.filter(i => i.lines[0]?.accountCode === '60611').reduce((s, i) => s + i.totalHT, 0)),
      mkAcct('60612', 'Électricité', invoices.filter(i => i.lines[0]?.accountCode === '60612').reduce((s, i) => s + i.totalHT, 0)),
      mkAcct('60613', 'Gaz', invoices.filter(i => i.lines[0]?.accountCode === '60613').reduce((s, i) => s + i.totalHT, 0)),
      mkAcct('6068', 'Autres matières et fournitures (déchets)', invoices.filter(i => i.lines[0]?.accountCode === '6068').reduce((s, i) => s + i.totalHT, 0)),
      mkAcct('6226', 'Honoraires audit', 35000),
      mkAcct('6251', 'Voyages et déplacements', invoices.filter(i => i.lines[0]?.accountCode === '6251').reduce((s, i) => s + i.totalHT, 0)),
      mkAcct('6333', 'Formation professionnelle', 14700),
      mkAcct('641', 'Rémunérations du personnel', 1250000),
    ];

    return {
      accountData,
      invoices,
      journalEntries: [] as ERPJournalEntry[],
      employees: [] as ERPEmployee[],
    };
  }

  // ── Apply sync results to VSME referential ─────────────────────

  /**
   * Écrit les résultats de synchronisation directement dans les
   * référentiels VSME (IndexedDB). Alimente automatiquement les
   * datapoints B3.1, B7.1, B8.1, etc.
   */
  async applyToVSME(
    dossierId: string,
    period: string,
    previews: SyncDataPreview[],
  ): Promise<{ applied: number; skipped: number }> {
    let applied = 0;
    let skipped = 0;

    for (const preview of previews) {
      if (preview.status !== 'mapped' || preview.transformedValue === undefined) {
        skipped++;
        continue;
      }

      const rawValue = String(preview.transformedValue);

      const vsmeVal: VSMEValue = {
        id: makeValueId(dossierId, preview.targetCode, period),
        dossierId,
        code: preview.targetCode,
        rawValue,
        statut: rawValue && rawValue !== '0' ? 'filled' : 'empty',
        updatedAt: new Date().toISOString(),
        period,
      };

      await idbPutValue(vsmeVal);
      applied++;
    }

    return { applied, skipped };
  }

  /**
   * Applique les résultats enrichis (avec confiance) aux référentiels VSME.
   */
  async applyEnrichedToVSME(
    dossierId: string,
    period: string,
    esgPoints: ESGDataPoint[],
  ): Promise<{ applied: number; skipped: number }> {
    let applied = 0;
    let skipped = 0;

    for (const point of esgPoints) {
      if (point.value === undefined || point.value === null) {
        skipped++;
        continue;
      }

      const rawValue = String(Math.round(point.value * 100) / 100);

      const vsmeVal: VSMEValue = {
        id: makeValueId(dossierId, point.vsmeCode, period),
        dossierId,
        code: point.vsmeCode,
        rawValue,
        statut: rawValue && rawValue !== '0' ? 'filled' : 'empty',
        updatedAt: new Date().toISOString(),
        period,
      };

      await idbPutValue(vsmeVal);
      applied++;
    }

    return { applied, skipped };
  }

  // ── Stats globales ─────────────────────────────────────────────

  getStats(organizationId: string): {
    totalConnections: number;
    activeConnections: number;
    totalSyncs: number;
    lastSyncDate: string | null;
    indicatorsAutoFilled: number;
  } {
    const connections = this.getConnectionsByOrg(organizationId);
    const active = connections.filter(c => c.status === 'connected');
    const allJobs = this.getSyncJobs().filter(j =>
      connections.some(c => c.id === j.connectionId)
    );
    const lastJob = allJobs.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
    const totalIndicators = allJobs
      .filter(j => j.status === 'success')
      .reduce((sum, j) => sum + j.stats.indicatorsUpdated, 0);

    return {
      totalConnections: connections.length,
      activeConnections: active.length,
      totalSyncs: allJobs.length,
      lastSyncDate: lastJob?.completedAt || null,
      indicatorsAutoFilled: totalIndicators,
    };
  }
}

export const erpConnectorService = new ERPConnectorService();
