/**
 * ERP ESG AGGREGATOR
 *
 * Le "cerveau" qui combine fournisseurs classifiés + quantités physiques
 * extraites + données HR + soldes comptables pour produire les indicateurs
 * VSME avec niveau de confiance traçable.
 *
 * Chaque indicateur utilise la meilleure source disponible (priorité décroissante) :
 * 1. Mesure directe : quantité physique parsée depuis une facture
 * 2. Fournisseur classifié : montant converti via prix moyen
 * 3. Estimation comptable : solde de compte PCG × facteur
 */

import type {
  ESGDataPoint, ESGDataSource, DataConfidenceLevel,
  ERPInvoice, ERPJournalEntry, ERPEmployee, ERPHRSummary,
  ESGSupplierCategory, SupplierClassification, EnrichedSyncDataPreview,
} from '@/types/erp';
import type { InvoiceQuantityResult, EntryQuantityResult } from './erpUnitExtractor';

// ─── Facteurs de conversion ─────────────────────────────────────────

// Prix moyens (pour conversion € → unité physique quand pas de quantité directe)
const AVG_PRICES = {
  electricity_per_MWh: 180,   // €/MWh (tarif moyen PME 2024-2025)
  gas_per_MWh: 80,            // €/MWh PCS
  water_per_m3: 4.50,         // €/m³
  waste_per_tonne: 250,       // €/tonne (collecte + traitement)
  diesel_per_liter: 1.60,     // €/L
  training_per_day: 800,      // €/jour formation
};

// Facteurs d'émission (France, source ADEME Base Carbone)
const EMISSION_FACTORS = {
  electricity_france: 0.052,  // tCO2e/MWh (mix FR 2024)
  natural_gas: 0.205,         // tCO2e/MWh PCS
  diesel: 0.00267,            // tCO2e/L
  petrol: 0.00231,            // tCO2e/L
  train_per_euro: 0.000005,   // tCO2e/€ (TGV)
  plane_per_euro: 0.000150,   // tCO2e/€ (moyen-courrier)
};

// ─── Types d'entrée ─────────────────────────────────────────────────

interface ERPRawRecord {
  accountCode: string;
  accountLabel: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AggregationInput {
  accountData: ERPRawRecord[];
  invoices: ERPInvoice[];
  journalEntries: ERPJournalEntry[];
  employees: ERPEmployee[];
  invoiceQuantities: InvoiceQuantityResult[];
  entryQuantities: EntryQuantityResult[];
  supplierClassifications: Map<string, SupplierClassification>;
}

// ─── Helpers ────────────────────────────────────────────────────────

function getAccountBalance(records: ERPRawRecord[], pattern: string): number {
  return records
    .filter(r => pattern.endsWith('*')
      ? r.accountCode.startsWith(pattern.slice(0, -1))
      : r.accountCode === pattern)
    .reduce((sum, r) => sum + Math.abs(r.balance), 0);
}

function getInvoicesByCategory(
  invoices: ERPInvoice[],
  classifications: Map<string, SupplierClassification>,
  ...categories: ESGSupplierCategory[]
): ERPInvoice[] {
  return invoices.filter(inv => {
    const cls = classifications.get(inv.supplier.id);
    return cls && categories.includes(cls.category);
  });
}

function getQuantitiesByCategory(
  quantities: InvoiceQuantityResult[],
  classifications: Map<string, SupplierClassification>,
  ...categories: ESGSupplierCategory[]
): InvoiceQuantityResult[] {
  return quantities.filter(q => {
    const cls = classifications.get(q.supplierId);
    return cls && categories.includes(cls.category);
  });
}

function sumInvoiceAmounts(invoices: ERPInvoice[]): number {
  return invoices.reduce((s, i) => s + i.totalHT, 0);
}

function buildSources(items: Array<{ reference: string; supplierName?: string; description?: string; amount: number; date: string; physicalQuantity?: number; physicalUnit?: string }>, type: ESGDataSource['type']): ESGDataSource[] {
  return items.map(item => ({ type, ...item }));
}

// ─── Agrégation principale ──────────────────────────────────────────

export function aggregateToESG(input: AggregationInput): ESGDataPoint[] {
  const points: ESGDataPoint[] = [];
  const { accountData, invoices, employees, invoiceQuantities, entryQuantities, supplierClassifications } = input;

  // Merge entry quantities dans un format compatible InvoiceQuantityResult
  // pour que les fonctions helper puissent les utiliser (FEC notamment)
  const mergedQuantities: InvoiceQuantityResult[] = [
    ...invoiceQuantities,
    ...entryQuantities.map(eq => ({
      invoiceId: eq.entryId,
      supplierId: eq.supplierId,
      supplierName: eq.supplierName,
      date: eq.date,
      amount: eq.amount,
      quantity: eq.quantity,
    })),
  ];

  // ── B1.1 Effectifs (ETP) ──────────────────────────────────────────
  if (employees.length > 0) {
    const totalFTE = employees.reduce((s, e) => s + e.fte, 0);
    points.push({
      vsmeCode: 'B1.1', vsmeName: 'Nombre d\'employés (ETP)',
      value: Math.round(totalFTE * 10) / 10, unit: 'ETP',
      confidence: 'direct_measurement', confidenceScore: 0.95,
      pillar: 'S',
      sources: employees.slice(0, 5).map(e => ({
        type: 'hr_record' as const, reference: e.id, description: `${e.name} (${e.fte} ETP)`,
        amount: e.salary || 0, date: '',
      })),
      method: `Somme des ETP de ${employees.length} employés (données RH)`,
    });
  }

  // ── B1.2 Chiffre d'affaires ───────────────────────────────────────
  // NB: 70* inclut déjà 701, 706, 707, etc. — ne pas additionner 706 séparément
  const revenue = getAccountBalance(accountData, '70*');
  if (revenue > 0) {
    points.push({
      vsmeCode: 'B1.2', vsmeName: 'Chiffre d\'affaires net',
      value: Math.round(revenue), unit: '€',
      confidence: 'direct_measurement', confidenceScore: 0.95,
      pillar: 'G',
      sources: [{ type: 'account_balance', reference: '70*', amount: revenue, date: '', description: 'Comptes de produits (classe 7)' }],
      method: 'Solde des comptes 70* (balance comptable)',
    });
  }

  // ── B3.1 Consommation totale d'énergie (MWh) ─────────────────────
  {
    const elecQuantities = getQuantitiesByCategory(mergedQuantities, supplierClassifications, 'energy_electricity');
    const gasQuantities = getQuantitiesByCategory(mergedQuantities, supplierClassifications, 'energy_gas');
    const allEnergyQuantities = [...elecQuantities, ...gasQuantities];

    const directMWh = allEnergyQuantities
      .filter(q => q.quantity && q.quantity.normalizedUnit === 'MWh')
      .reduce((s, q) => s + q.quantity!.normalizedValue, 0);

    if (directMWh > 0) {
      // Priorité 1 : quantités physiques parsées
      points.push({
        vsmeCode: 'B3.1', vsmeName: 'Consommation totale d\'énergie',
        value: Math.round(directMWh * 100) / 100, unit: 'MWh/an',
        confidence: 'direct_measurement', confidenceScore: 0.90,
        pillar: 'E',
        sources: buildSources(allEnergyQuantities.filter(q => q.quantity).map(q => ({
          reference: q.invoiceId, supplierName: q.supplierName,
          description: q.quantity!.sourceText, amount: q.amount,
          physicalQuantity: q.quantity!.normalizedValue, physicalUnit: 'MWh',
          date: q.date,
        })), 'invoice'),
        method: `kWh/MWh extraits de ${allEnergyQuantities.filter(q => q.quantity).length} factures énergie`,
      });
    } else {
      // Priorité 2 : montants fournisseurs classifiés ÷ prix moyen
      const elecInvoices = getInvoicesByCategory(invoices, supplierClassifications, 'energy_electricity');
      const gasInvoices = getInvoicesByCategory(invoices, supplierClassifications, 'energy_gas');
      const elecTotal = sumInvoiceAmounts(elecInvoices);
      const gasTotal = sumInvoiceAmounts(gasInvoices);
      const estimatedMWh = elecTotal / AVG_PRICES.electricity_per_MWh + gasTotal / AVG_PRICES.gas_per_MWh;

      if (estimatedMWh > 0) {
        points.push({
          vsmeCode: 'B3.1', vsmeName: 'Consommation totale d\'énergie',
          value: Math.round(estimatedMWh * 100) / 100, unit: 'MWh/an',
          confidence: 'supplier_classified', confidenceScore: 0.70,
          pillar: 'E',
          sources: buildSources([...elecInvoices, ...gasInvoices].map(i => ({
            reference: i.invoiceNumber, supplierName: i.supplier.name,
            amount: i.totalHT, date: i.date, description: 'Facture énergie',
          })), 'invoice'),
          method: `${elecInvoices.length + gasInvoices.length} factures énergie (${Math.round(elecTotal)}€ élec + ${Math.round(gasTotal)}€ gaz) ÷ prix moyens`,
        });
      } else {
        // Priorité 3 : solde comptable × facteur
        const accountEnergy = getAccountBalance(accountData, '6061*');
        if (accountEnergy > 0) {
          const fallbackMWh = accountEnergy / AVG_PRICES.electricity_per_MWh;
          points.push({
            vsmeCode: 'B3.1', vsmeName: 'Consommation totale d\'énergie',
            value: Math.round(fallbackMWh * 100) / 100, unit: 'MWh/an',
            confidence: 'account_estimated', confidenceScore: 0.40,
            pillar: 'E',
            sources: [{ type: 'account_balance', reference: '6061*', amount: accountEnergy, date: '', description: 'Énergie (eau, élec, gaz)' }],
            method: `Compte 6061* (${Math.round(accountEnergy)}€) ÷ prix moyen énergie`,
          });
        }
      }
    }
  }

  // ── B4.1 Volume total d'eau (m³) ──────────────────────────────────
  {
    const waterQuantities = getQuantitiesByCategory(mergedQuantities, supplierClassifications, 'water');
    const directM3 = waterQuantities
      .filter(q => q.quantity && q.quantity.normalizedUnit === 'm³')
      .reduce((s, q) => s + q.quantity!.normalizedValue, 0);

    if (directM3 > 0) {
      points.push({
        vsmeCode: 'B4.1', vsmeName: 'Volume total d\'eau prélevée',
        value: Math.round(directM3), unit: 'm³/an',
        confidence: 'direct_measurement', confidenceScore: 0.90,
        pillar: 'E',
        sources: buildSources(waterQuantities.filter(q => q.quantity).map(q => ({
          reference: q.invoiceId, supplierName: q.supplierName,
          description: q.quantity!.sourceText, amount: q.amount,
          physicalQuantity: q.quantity!.normalizedValue, physicalUnit: 'm³',
          date: q.date,
        })), 'invoice'),
        method: `m³ extraits de ${waterQuantities.filter(q => q.quantity).length} factures eau`,
      });
    } else {
      const waterInvoices = getInvoicesByCategory(invoices, supplierClassifications, 'water');
      const waterTotal = sumInvoiceAmounts(waterInvoices);
      if (waterTotal > 0) {
        points.push({
          vsmeCode: 'B4.1', vsmeName: 'Volume total d\'eau prélevée',
          value: Math.round(waterTotal / AVG_PRICES.water_per_m3), unit: 'm³/an',
          confidence: 'supplier_classified', confidenceScore: 0.65,
          pillar: 'E',
          sources: buildSources(waterInvoices.map(i => ({
            reference: i.invoiceNumber, supplierName: i.supplier.name,
            amount: i.totalHT, date: i.date, description: 'Facture eau',
          })), 'invoice'),
          method: `${waterInvoices.length} factures eau (${Math.round(waterTotal)}€) ÷ ${AVG_PRICES.water_per_m3}€/m³`,
        });
      }
    }
  }

  // ── B5.1 Déchets totaux (tonnes) ──────────────────────────────────
  {
    const wasteQuantities = getQuantitiesByCategory(mergedQuantities, supplierClassifications, 'waste_collection', 'waste_recycling');
    const directTonnes = wasteQuantities
      .filter(q => q.quantity && q.quantity.normalizedUnit === 'tonnes')
      .reduce((s, q) => s + q.quantity!.normalizedValue, 0);

    if (directTonnes > 0) {
      points.push({
        vsmeCode: 'B5.1', vsmeName: 'Production totale de déchets',
        value: Math.round(directTonnes * 100) / 100, unit: 'tonnes/an',
        confidence: 'direct_measurement', confidenceScore: 0.90,
        pillar: 'E',
        sources: buildSources(wasteQuantities.filter(q => q.quantity).map(q => ({
          reference: q.invoiceId, supplierName: q.supplierName,
          description: q.quantity!.sourceText, amount: q.amount,
          physicalQuantity: q.quantity!.normalizedValue, physicalUnit: 'tonnes',
          date: q.date,
        })), 'invoice'),
        method: `Tonnes extraites de ${wasteQuantities.filter(q => q.quantity).length} factures déchets`,
      });
    } else {
      const wasteInvoices = getInvoicesByCategory(invoices, supplierClassifications, 'waste_collection', 'waste_recycling');
      const wasteTotal = sumInvoiceAmounts(wasteInvoices);
      if (wasteTotal > 0) {
        points.push({
          vsmeCode: 'B5.1', vsmeName: 'Production totale de déchets',
          value: Math.round(wasteTotal / AVG_PRICES.waste_per_tonne * 100) / 100, unit: 'tonnes/an',
          confidence: 'supplier_classified', confidenceScore: 0.55,
          pillar: 'E',
          sources: buildSources(wasteInvoices.map(i => ({
            reference: i.invoiceNumber, supplierName: i.supplier.name,
            amount: i.totalHT, date: i.date, description: 'Facture déchets',
          })), 'invoice'),
          method: `${wasteInvoices.length} factures déchets (${Math.round(wasteTotal)}€) ÷ ${AVG_PRICES.waste_per_tonne}€/tonne`,
        });
      }
    }
  }

  // ── B7.1 GES Scope 1 (tCO2e) — gaz + carburant ───────────────────
  {
    const gasQuantities = getQuantitiesByCategory(mergedQuantities, supplierClassifications, 'energy_gas');
    const gasMWh = gasQuantities
      .filter(q => q.quantity && q.quantity.normalizedUnit === 'MWh')
      .reduce((s, q) => s + q.quantity!.normalizedValue, 0);

    const gasInvoices = getInvoicesByCategory(invoices, supplierClassifications, 'energy_gas');
    const gasTotal = sumInvoiceAmounts(gasInvoices);
    const estimatedGasMWh = gasMWh > 0 ? gasMWh : gasTotal / AVG_PRICES.gas_per_MWh;

    const scope1 = estimatedGasMWh * EMISSION_FACTORS.natural_gas;

    if (scope1 > 0) {
      const conf: DataConfidenceLevel = gasMWh > 0 ? 'direct_measurement' : (gasTotal > 0 ? 'supplier_classified' : 'account_estimated');
      points.push({
        vsmeCode: 'B7.1', vsmeName: 'Émissions GES Scope 1',
        value: Math.round(scope1 * 100) / 100, unit: 'tCO2e/an',
        confidence: conf, confidenceScore: conf === 'direct_measurement' ? 0.85 : 0.60,
        pillar: 'E',
        sources: buildSources(gasInvoices.map(i => ({
          reference: i.invoiceNumber, supplierName: i.supplier.name,
          amount: i.totalHT, date: i.date, description: 'Gaz naturel',
        })), 'invoice'),
        method: `${Math.round(estimatedGasMWh)} MWh gaz × ${EMISSION_FACTORS.natural_gas} tCO2e/MWh`,
      });
    }
  }

  // ── B7.2 GES Scope 2 (tCO2e) — électricité ───────────────────────
  {
    const elecQuantities = getQuantitiesByCategory(mergedQuantities, supplierClassifications, 'energy_electricity');
    const elecMWh = elecQuantities
      .filter(q => q.quantity && q.quantity.normalizedUnit === 'MWh')
      .reduce((s, q) => s + q.quantity!.normalizedValue, 0);

    const elecInvoices = getInvoicesByCategory(invoices, supplierClassifications, 'energy_electricity');
    const elecTotal = sumInvoiceAmounts(elecInvoices);
    const estimatedElecMWh = elecMWh > 0 ? elecMWh : elecTotal / AVG_PRICES.electricity_per_MWh;

    const scope2 = estimatedElecMWh * EMISSION_FACTORS.electricity_france;

    if (scope2 > 0) {
      const conf: DataConfidenceLevel = elecMWh > 0 ? 'direct_measurement' : (elecTotal > 0 ? 'supplier_classified' : 'account_estimated');
      points.push({
        vsmeCode: 'B7.2', vsmeName: 'Émissions GES Scope 2 (market-based)',
        value: Math.round(scope2 * 100) / 100, unit: 'tCO2e/an',
        confidence: conf, confidenceScore: conf === 'direct_measurement' ? 0.85 : 0.60,
        pillar: 'E',
        sources: buildSources(elecInvoices.map(i => ({
          reference: i.invoiceNumber, supplierName: i.supplier.name,
          amount: i.totalHT, date: i.date, description: 'Électricité',
        })), 'invoice'),
        method: `${Math.round(estimatedElecMWh)} MWh élec × ${EMISSION_FACTORS.electricity_france} tCO2e/MWh (mix FR)`,
      });
    }
  }

  // ── B7.3 GES Scope 3 — déplacements professionnels (tCO2e) ────────
  {
    const travelInvoices = getInvoicesByCategory(invoices, supplierClassifications, 'transport_business_travel');
    const travelTotal = sumInvoiceAmounts(travelInvoices);
    const travelFromAccounts = getAccountBalance(accountData, '6251*') + getAccountBalance(accountData, '6256*');
    const travelBudget = travelTotal > 0 ? travelTotal : travelFromAccounts;

    if (travelBudget > 0) {
      // Estimation : mix train/avion selon le montant (PME françaises ≈ 70% train, 30% avion)
      const scope3Train = travelBudget * 0.70 * EMISSION_FACTORS.train_per_euro;
      const scope3Plane = travelBudget * 0.30 * EMISSION_FACTORS.plane_per_euro;
      const scope3Total = scope3Train + scope3Plane;

      points.push({
        vsmeCode: 'B7.3', vsmeName: 'Émissions GES Scope 3 — déplacements',
        value: Math.round(scope3Total * 100) / 100, unit: 'tCO2e/an',
        confidence: travelTotal > 0 ? 'supplier_classified' : 'account_estimated',
        confidenceScore: travelTotal > 0 ? 0.55 : 0.35,
        pillar: 'E',
        sources: travelTotal > 0
          ? buildSources(travelInvoices.map(i => ({
              reference: i.invoiceNumber, supplierName: i.supplier.name,
              amount: i.totalHT, date: i.date, description: 'Déplacement professionnel',
            })), 'invoice')
          : [{ type: 'account_balance' as const, reference: '6251*', amount: travelFromAccounts, date: '', description: 'Voyages et déplacements' }],
        method: `${Math.round(travelBudget)}€ déplacements × mix train/avion (70/30) × facteurs ADEME`,
      });
    }
  }

  // ── B8.1 Salaires et traitements (€) ──────────────────────────────
  {
    const salaryFromHR = employees.reduce((s, e) => s + (e.salary || 0), 0);
    const salaryFromAccounts = getAccountBalance(accountData, '641*');
    const value = salaryFromHR > 0 ? salaryFromHR : salaryFromAccounts;

    if (value > 0) {
      points.push({
        vsmeCode: 'B8.1', vsmeName: 'Salaires et traitements',
        value: Math.round(value), unit: '€',
        confidence: salaryFromHR > 0 ? 'direct_measurement' : 'account_estimated',
        confidenceScore: salaryFromHR > 0 ? 0.95 : 0.85,
        pillar: 'S',
        sources: salaryFromHR > 0
          ? [{ type: 'hr_record' as const, reference: 'payroll', amount: salaryFromHR, date: '', description: `Masse salariale ${employees.length} employés` }]
          : [{ type: 'account_balance' as const, reference: '641*', amount: salaryFromAccounts, date: '', description: 'Rémunérations du personnel' }],
        method: salaryFromHR > 0
          ? `Somme des salaires bruts de ${employees.length} employés (RH)`
          : 'Solde du compte 641* (balance comptable)',
      });
    }
  }

  // ── B8.2 Répartition par genre (% femmes) ─────────────────────────
  if (employees.length > 0) {
    const females = employees.filter(e => e.gender === 'female').length;
    const pct = Math.round(females / employees.length * 1000) / 10;
    points.push({
      vsmeCode: 'B8.2', vsmeName: 'Répartition par genre — % femmes',
      value: pct, unit: '%',
      confidence: 'direct_measurement', confidenceScore: 0.95,
      pillar: 'S',
      sources: [{ type: 'hr_record', reference: 'hr.employee', amount: employees.length, date: '', description: `${females} femmes / ${employees.length} total` }],
      method: `${females} femmes sur ${employees.length} employés (données RH)`,
    });
  }

  // ── B8.5 Jours de formation / employé ─────────────────────────────
  {
    const trainingInvoices = getInvoicesByCategory(invoices, supplierClassifications, 'training');
    const trainingTotal = sumInvoiceAmounts(trainingInvoices);
    const trainingFromAccounts = getAccountBalance(accountData, '6333*');
    const trainingBudget = trainingTotal > 0 ? trainingTotal : trainingFromAccounts;

    if (trainingBudget > 0) {
      const headcount = employees.length > 0 ? employees.length : 50; // fallback
      const daysPerEmployee = Math.round(trainingBudget / AVG_PRICES.training_per_day / headcount * 10) / 10;
      points.push({
        vsmeCode: 'B8.5', vsmeName: 'Jours de formation par employé',
        value: daysPerEmployee, unit: 'jours/ETP',
        confidence: trainingTotal > 0 ? 'supplier_classified' : 'account_estimated',
        confidenceScore: trainingTotal > 0 ? 0.65 : 0.50,
        pillar: 'S',
        sources: trainingTotal > 0
          ? buildSources(trainingInvoices.map(i => ({
              reference: i.invoiceNumber, supplierName: i.supplier.name,
              amount: i.totalHT, date: i.date, description: 'Facture formation',
            })), 'invoice')
          : [{ type: 'account_balance', reference: '6333*', amount: trainingFromAccounts, date: '', description: 'Participation formation' }],
        method: `${Math.round(trainingBudget)}€ ÷ ${AVG_PRICES.training_per_day}€/jour ÷ ${headcount} employés`,
      });
    }
  }

  // ── B11.1 Frais d'audit et certification (€) ─────────────────────
  {
    const auditInvoices = getInvoicesByCategory(invoices, supplierClassifications, 'audit_legal');
    const auditTotal = sumInvoiceAmounts(auditInvoices);
    const auditFromAccounts = getAccountBalance(accountData, '6226*');
    const value = auditTotal > 0 ? auditTotal : auditFromAccounts;

    if (value > 0) {
      points.push({
        vsmeCode: 'B11.1', vsmeName: 'Frais d\'audit et certification',
        value: Math.round(value), unit: '€',
        confidence: auditTotal > 0 ? 'supplier_classified' : 'account_estimated',
        confidenceScore: auditTotal > 0 ? 0.90 : 0.80,
        pillar: 'G',
        sources: auditTotal > 0
          ? buildSources(auditInvoices.map(i => ({
              reference: i.invoiceNumber, supplierName: i.supplier.name,
              amount: i.totalHT, date: i.date, description: 'Audit / certification',
            })), 'invoice')
          : [{ type: 'account_balance', reference: '6226*', amount: auditFromAccounts, date: '', description: 'Honoraires audit' }],
        method: auditTotal > 0
          ? `Somme de ${auditInvoices.length} factures audit (${auditInvoices.map(i => i.supplier.name).join(', ')})`
          : 'Solde du compte 6226* (balance comptable)',
      });
    }
  }

  return points;
}

// ─── Conversion ESGDataPoint[] → EnrichedSyncDataPreview[] ──────────

export function toEnrichedPreviews(points: ESGDataPoint[]): EnrichedSyncDataPreview[] {
  return points.map(pt => ({
    erpField: pt.sources[0]?.reference || '—',
    erpValue: pt.sources.reduce((s, src) => s + src.amount, 0),
    targetCode: pt.vsmeCode,
    targetName: pt.vsmeName,
    transformedValue: pt.value,
    unit: pt.unit,
    status: 'mapped' as const,
    confidence: pt.confidence,
    confidenceScore: pt.confidenceScore,
    sourceCount: pt.sources.length,
    sources: pt.sources,
    method: pt.method,
  }));
}
