/**
 * ERP CATEGORIZATION ENGINE
 *
 * Classifie les fournisseurs et écritures comptables en catégories ESG.
 * 3 niveaux de classification par priorité :
 * 1. Dictionnaire de fournisseurs connus (confiance 0.95)
 * 2. Pattern regex sur le nom (confiance 0.75)
 * 3. Code comptable PCG (confiance 0.50)
 */

import type {
  ERPSupplier, ERPInvoice, ERPJournalEntry,
  ESGSupplierCategory, SupplierClassification,
} from '@/types/erp';

// ─── Dictionnaire fournisseurs connus (FR) ──────────────────────────

interface KnownSupplierEntry {
  category: ESGSupplierCategory;
  vsmeTargets: string[];
}

const KNOWN_SUPPLIERS: Record<string, KnownSupplierEntry> = {
  // Énergie — Électricité
  'edf': { category: 'energy_electricity', vsmeTargets: ['B3.1', 'B7.2'] },
  'edf entreprises': { category: 'energy_electricity', vsmeTargets: ['B3.1', 'B7.2'] },
  'enercoop': { category: 'energy_electricity', vsmeTargets: ['B3.1', 'B3.2'] },
  'direct energie': { category: 'energy_electricity', vsmeTargets: ['B3.1', 'B7.2'] },
  'totalenergies electricite': { category: 'energy_electricity', vsmeTargets: ['B3.1', 'B7.2'] },
  'ekwateur': { category: 'energy_electricity', vsmeTargets: ['B3.1', 'B3.2'] },
  'ilek': { category: 'energy_electricity', vsmeTargets: ['B3.1', 'B3.2'] },
  'mint energie': { category: 'energy_electricity', vsmeTargets: ['B3.1', 'B7.2'] },
  'vattenfall': { category: 'energy_electricity', vsmeTargets: ['B3.1', 'B7.2'] },
  'eni': { category: 'energy_electricity', vsmeTargets: ['B3.1', 'B7.2'] },
  'alpiq': { category: 'energy_electricity', vsmeTargets: ['B3.1', 'B7.2'] },
  'iberdrola': { category: 'energy_electricity', vsmeTargets: ['B3.1', 'B7.2'] },

  // Énergie — Gaz
  'engie': { category: 'energy_gas', vsmeTargets: ['B3.1', 'B7.1'] },
  'engie gaz': { category: 'energy_gas', vsmeTargets: ['B3.1', 'B7.1'] },
  'totalenergies gaz': { category: 'energy_gas', vsmeTargets: ['B3.1', 'B7.1'] },
  'butagaz': { category: 'energy_gas', vsmeTargets: ['B3.1', 'B7.1'] },
  'primagaz': { category: 'energy_gas', vsmeTargets: ['B3.1', 'B7.1'] },
  'antargaz': { category: 'energy_gas', vsmeTargets: ['B3.1', 'B7.1'] },

  // Énergie — Carburant
  'totalenergies': { category: 'energy_fuel', vsmeTargets: ['B3.1', 'B7.1'] },
  'shell': { category: 'energy_fuel', vsmeTargets: ['B3.1', 'B7.1'] },
  'bp': { category: 'energy_fuel', vsmeTargets: ['B3.1', 'B7.1'] },
  'esso': { category: 'energy_fuel', vsmeTargets: ['B3.1', 'B7.1'] },
  'avia': { category: 'energy_fuel', vsmeTargets: ['B3.1', 'B7.1'] },

  // Eau
  'veolia eau': { category: 'water', vsmeTargets: ['B4.1'] },
  'veolia': { category: 'water', vsmeTargets: ['B4.1'] },
  'suez eau': { category: 'water', vsmeTargets: ['B4.1'] },
  'suez': { category: 'water', vsmeTargets: ['B4.1'] },
  'saur': { category: 'water', vsmeTargets: ['B4.1'] },
  'eau de paris': { category: 'water', vsmeTargets: ['B4.1'] },
  'sedif': { category: 'water', vsmeTargets: ['B4.1'] },
  'lyonnaise des eaux': { category: 'water', vsmeTargets: ['B4.1'] },

  // Déchets
  'veolia proprete': { category: 'waste_collection', vsmeTargets: ['B5.1'] },
  'suez recyclage': { category: 'waste_recycling', vsmeTargets: ['B5.1'] },
  'paprec': { category: 'waste_recycling', vsmeTargets: ['B5.1'] },
  'derichebourg': { category: 'waste_recycling', vsmeTargets: ['B5.1'] },
  'sita': { category: 'waste_collection', vsmeTargets: ['B5.1'] },
  'nicollin': { category: 'waste_collection', vsmeTargets: ['B5.1'] },
  'seche environnement': { category: 'waste_collection', vsmeTargets: ['B5.1'] },
  'coved': { category: 'waste_collection', vsmeTargets: ['B5.1'] },

  // Transport
  'sncf': { category: 'transport_business_travel', vsmeTargets: ['B7.3'] },
  'air france': { category: 'transport_business_travel', vsmeTargets: ['B7.3'] },
  'easyjet': { category: 'transport_business_travel', vsmeTargets: ['B7.3'] },
  'eurostar': { category: 'transport_business_travel', vsmeTargets: ['B7.3'] },
  'hertz': { category: 'transport_business_travel', vsmeTargets: ['B7.3'] },
  'europcar': { category: 'transport_business_travel', vsmeTargets: ['B7.3'] },
  'uber': { category: 'transport_business_travel', vsmeTargets: ['B7.3'] },

  // Audit & Conseil
  'kpmg': { category: 'audit_legal', vsmeTargets: ['B11.1'] },
  'ey': { category: 'audit_legal', vsmeTargets: ['B11.1'] },
  'ernst & young': { category: 'audit_legal', vsmeTargets: ['B11.1'] },
  'deloitte': { category: 'audit_legal', vsmeTargets: ['B11.1'] },
  'pwc': { category: 'audit_legal', vsmeTargets: ['B11.1'] },
  'mazars': { category: 'audit_legal', vsmeTargets: ['B11.1'] },
  'grant thornton': { category: 'audit_legal', vsmeTargets: ['B11.1'] },
  'bdo': { category: 'audit_legal', vsmeTargets: ['B11.1'] },

  // Formation
  'cegos': { category: 'training', vsmeTargets: ['B8.5'] },
  'demos': { category: 'training', vsmeTargets: ['B8.5'] },
  'orsys': { category: 'training', vsmeTargets: ['B8.5'] },
  'afpa': { category: 'training', vsmeTargets: ['B8.5'] },
  'opco': { category: 'training', vsmeTargets: ['B8.5'] },
};

// ─── Patterns regex sur le nom ──────────────────────────────────────

const SUPPLIER_NAME_PATTERNS: Array<{ pattern: RegExp; category: ESGSupplierCategory; vsmeTargets: string[] }> = [
  { pattern: /\b(electri|kwh|courant|haute tension|basse tension)\b/i, category: 'energy_electricity', vsmeTargets: ['B3.1', 'B7.2'] },
  { pattern: /\b(gaz\s|gnv|propane|butane|methane)\b/i, category: 'energy_gas', vsmeTargets: ['B3.1', 'B7.1'] },
  { pattern: /\b(carburant|gasoil|diesel|essence|fuel|petrole|fioul)\b/i, category: 'energy_fuel', vsmeTargets: ['B3.1', 'B7.1'] },
  { pattern: /\b(eau\s|adduction|assainissement|hydraulique)\b/i, category: 'water', vsmeTargets: ['B4.1'] },
  { pattern: /\b(dechet|ordure|collecte|tri\s|recyclage|benne|proprete)\b/i, category: 'waste_collection', vsmeTargets: ['B5.1'] },
  { pattern: /\b(audit|commiss.*compte|certif|expertise\s?comptable)\b/i, category: 'audit_legal', vsmeTargets: ['B11.1'] },
  { pattern: /\b(formation|organisme.*form|cpf|opco|apprentissage)\b/i, category: 'training', vsmeTargets: ['B8.5'] },
  { pattern: /\b(transport|logistiq|fret|livraison|messagerie)\b/i, category: 'transport_freight', vsmeTargets: ['B7.3'] },
  { pattern: /\b(voyage|deplacement|hotel|hebergement|billet.*train|billet.*avion)\b/i, category: 'transport_business_travel', vsmeTargets: ['B7.3'] },
  { pattern: /\b(assurance|mutuelle|prevoyance)\b/i, category: 'insurance', vsmeTargets: [] },
  { pattern: /\b(telecom|telephone|mobile|internet|fibre|sfr|orange|bouygues|free)\b/i, category: 'telecom', vsmeTargets: [] },
];

// ─── Mapping code comptable → catégorie (fallback) ──────────────────

const ACCOUNT_CODE_MAP: Array<{ pattern: string; category: ESGSupplierCategory; vsmeTargets: string[] }> = [
  { pattern: '60611', category: 'water', vsmeTargets: ['B4.1'] },
  { pattern: '60612', category: 'energy_electricity', vsmeTargets: ['B3.1', 'B7.2'] },
  { pattern: '60613', category: 'energy_gas', vsmeTargets: ['B3.1', 'B7.1'] },
  { pattern: '6061', category: 'energy_other', vsmeTargets: ['B3.1'] },
  { pattern: '6068', category: 'waste_collection', vsmeTargets: ['B5.1'] },
  { pattern: '6226', category: 'audit_legal', vsmeTargets: ['B11.1'] },
  { pattern: '6251', category: 'transport_business_travel', vsmeTargets: ['B7.3'] },
  { pattern: '6333', category: 'training', vsmeTargets: ['B8.5'] },
  { pattern: '616', category: 'insurance', vsmeTargets: [] },
  { pattern: '626', category: 'telecom', vsmeTargets: [] },
];

// ─── Classification d'un fournisseur ────────────────────────────────

function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifySupplier(
  supplier: ERPSupplier,
  accountCode?: string,
  description?: string,
): SupplierClassification {
  const normalized = normalizeText(supplier.name);

  // Niveau 1 : Dictionnaire connu (confiance 0.95)
  for (const [key, entry] of Object.entries(KNOWN_SUPPLIERS)) {
    if (normalized.includes(key) || normalized === key) {
      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        category: entry.category,
        confidence: 0.95,
        matchMethod: 'known_list',
        vsmeTargets: entry.vsmeTargets,
      };
    }
  }

  // Niveau 2 : Pattern regex sur le nom (confiance 0.75)
  for (const { pattern, category, vsmeTargets } of SUPPLIER_NAME_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        category,
        confidence: 0.75,
        matchMethod: 'name_pattern',
        vsmeTargets,
      };
    }
  }

  // Niveau 2b : Pattern sur la description de facture/écriture
  if (description) {
    const normalizedDesc = normalizeText(description);
    for (const { pattern, category, vsmeTargets } of SUPPLIER_NAME_PATTERNS) {
      if (pattern.test(normalizedDesc)) {
        return {
          supplierId: supplier.id,
          supplierName: supplier.name,
          category,
          confidence: 0.70,
          matchMethod: 'description_parse',
          vsmeTargets,
        };
      }
    }
  }

  // Niveau 3 : Code comptable PCG (confiance 0.50)
  if (accountCode) {
    for (const { pattern, category, vsmeTargets } of ACCOUNT_CODE_MAP) {
      if (accountCode.startsWith(pattern)) {
        return {
          supplierId: supplier.id,
          supplierName: supplier.name,
          category,
          confidence: 0.50,
          matchMethod: 'account_code',
          vsmeTargets,
        };
      }
    }
  }

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    category: 'uncategorized',
    confidence: 0,
    matchMethod: 'account_code',
    vsmeTargets: [],
  };
}

// ─── Classification batch de factures ───────────────────────────────

export function classifyInvoices(invoices: ERPInvoice[]): Map<string, SupplierClassification> {
  const classifications = new Map<string, SupplierClassification>();

  for (const invoice of invoices) {
    const key = invoice.supplier.id;
    if (classifications.has(key)) continue;

    const classification = classifySupplier(
      invoice.supplier,
      invoice.accountCode || invoice.lines[0]?.accountCode,
      invoice.rawDescription || invoice.lines[0]?.description,
    );
    classifications.set(key, classification);
  }

  return classifications;
}

// ─── Classification batch d'écritures FEC ───────────────────────────

export function classifyJournalEntries(entries: ERPJournalEntry[]): Map<string, SupplierClassification> {
  const classifications = new Map<string, SupplierClassification>();

  for (const entry of entries) {
    if (!entry.auxiliaryCode || classifications.has(entry.auxiliaryCode)) continue;

    const supplier: ERPSupplier = {
      id: entry.auxiliaryCode,
      name: entry.auxiliaryLabel || entry.auxiliaryCode,
    };

    const classification = classifySupplier(
      supplier,
      entry.accountCode,
      entry.description,
    );
    classifications.set(entry.auxiliaryCode, classification);
  }

  return classifications;
}

// ─── Résumé par catégorie ───────────────────────────────────────────

export interface SupplierCategorySummary {
  category: ESGSupplierCategory;
  supplierCount: number;
  invoiceCount: number;
  totalAmount: number;
  suppliers: Array<{ name: string; amount: number; confidence: number }>;
  vsmeTargets: string[];
}

export function buildSupplierSummary(
  invoices: ERPInvoice[],
  classifications: Map<string, SupplierClassification>,
): SupplierCategorySummary[] {
  const byCategory = new Map<ESGSupplierCategory, {
    suppliers: Map<string, { name: string; amount: number; confidence: number }>;
    invoiceCount: number;
    vsmeTargets: Set<string>;
  }>();

  for (const invoice of invoices) {
    const classification = classifications.get(invoice.supplier.id);
    const cat = classification?.category || 'uncategorized';

    if (!byCategory.has(cat)) {
      byCategory.set(cat, { suppliers: new Map(), invoiceCount: 0, vsmeTargets: new Set() });
    }

    const group = byCategory.get(cat)!;
    group.invoiceCount++;

    const existing = group.suppliers.get(invoice.supplier.id);
    if (existing) {
      existing.amount += invoice.totalHT;
    } else {
      group.suppliers.set(invoice.supplier.id, {
        name: invoice.supplier.name,
        amount: invoice.totalHT,
        confidence: classification?.confidence || 0,
      });
    }

    classification?.vsmeTargets.forEach(t => group.vsmeTargets.add(t));
  }

  return Array.from(byCategory.entries()).map(([category, data]) => ({
    category,
    supplierCount: data.suppliers.size,
    invoiceCount: data.invoiceCount,
    totalAmount: Array.from(data.suppliers.values()).reduce((s, v) => s + v.amount, 0),
    suppliers: Array.from(data.suppliers.values()).sort((a, b) => b.amount - a.amount),
    vsmeTargets: Array.from(data.vsmeTargets),
  })).sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Construit le résumé fournisseurs depuis les écritures FEC (quand pas de factures).
 * Agrège par CompAuxNum/CompAuxLib.
 */
export function buildSupplierSummaryFromEntries(
  entries: ERPJournalEntry[],
  classifications: Map<string, SupplierClassification>,
): SupplierCategorySummary[] {
  const byCategory = new Map<ESGSupplierCategory, {
    suppliers: Map<string, { name: string; amount: number; confidence: number }>;
    invoiceCount: number;
    vsmeTargets: Set<string>;
  }>();

  for (const entry of entries) {
    if (!entry.auxiliaryCode || entry.debit <= 0) continue;

    const classification = classifications.get(entry.auxiliaryCode);
    const cat = classification?.category || 'uncategorized';

    if (!byCategory.has(cat)) {
      byCategory.set(cat, { suppliers: new Map(), invoiceCount: 0, vsmeTargets: new Set() });
    }

    const group = byCategory.get(cat)!;
    group.invoiceCount++; // Réutilisé comme "nombre d'écritures"

    const existing = group.suppliers.get(entry.auxiliaryCode);
    if (existing) {
      existing.amount += entry.debit;
    } else {
      group.suppliers.set(entry.auxiliaryCode, {
        name: entry.auxiliaryLabel || entry.auxiliaryCode,
        amount: entry.debit,
        confidence: classification?.confidence || 0,
      });
    }

    classification?.vsmeTargets.forEach(t => group.vsmeTargets.add(t));
  }

  return Array.from(byCategory.entries()).map(([category, data]) => ({
    category,
    supplierCount: data.suppliers.size,
    invoiceCount: data.invoiceCount,
    totalAmount: Array.from(data.suppliers.values()).reduce((s, v) => s + v.amount, 0),
    suppliers: Array.from(data.suppliers.values()).sort((a, b) => b.amount - a.amount),
    vsmeTargets: Array.from(data.vsmeTargets),
  })).sort((a, b) => b.totalAmount - a.totalAmount);
}

// ─── Labels pour l'UI ───────────────────────────────────────────────

export const ESG_CATEGORY_LABELS: Record<ESGSupplierCategory, string> = {
  energy_electricity: 'Électricité',
  energy_gas: 'Gaz naturel',
  energy_fuel: 'Carburant',
  energy_other: 'Énergie (autre)',
  water: 'Eau',
  waste_collection: 'Déchets (collecte)',
  waste_recycling: 'Déchets (recyclage)',
  transport_freight: 'Transport marchandises',
  transport_business_travel: 'Déplacements professionnels',
  audit_legal: 'Audit & conformité',
  training: 'Formation',
  insurance: 'Assurance',
  telecom: 'Télécom',
  it_services: 'Services IT',
  office_supplies: 'Fournitures bureau',
  uncategorized: 'Non classifié',
};
