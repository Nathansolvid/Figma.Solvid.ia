/**
 * ERP UNIT EXTRACTOR
 *
 * Extrait les quantités physiques (kWh, m³, tonnes, litres) à partir
 * des descriptions de factures et écritures comptables.
 * Normalise vers les unités VSME standard (MWh, m³, tonnes).
 */

import type { ERPInvoice, ERPJournalEntry, ExtractedQuantity } from '@/types/erp';

// ─── Patterns d'extraction ──────────────────────────────────────────

interface QuantityPattern {
  regex: RegExp;
  unit: string;
  normalizedUnit: string;
  conversionFactor: number;  // multiply extracted value → normalizedUnit
}

const QUANTITY_PATTERNS: QuantityPattern[] = [
  // Énergie (électricité, gaz)
  { regex: /([\d\s,.]+)\s*kwh/i, unit: 'kWh', normalizedUnit: 'MWh', conversionFactor: 0.001 },
  { regex: /([\d\s,.]+)\s*mwh/i, unit: 'MWh', normalizedUnit: 'MWh', conversionFactor: 1 },
  { regex: /([\d\s,.]+)\s*gwh/i, unit: 'GWh', normalizedUnit: 'MWh', conversionFactor: 1000 },

  // Gaz (volume → énergie)
  { regex: /([\d\s,.]+)\s*m[³3]\s*(?:de\s+)?gaz/i, unit: 'm³ gaz', normalizedUnit: 'MWh', conversionFactor: 0.01055 },

  // Eau
  { regex: /([\d\s,.]+)\s*m[³3]/i, unit: 'm³', normalizedUnit: 'm³', conversionFactor: 1 },
  { regex: /([\d\s,.]+)\s*litres?/i, unit: 'L', normalizedUnit: 'm³', conversionFactor: 0.001 },

  // Déchets
  { regex: /([\d\s,.]+)\s*tonnes?/i, unit: 'tonnes', normalizedUnit: 'tonnes', conversionFactor: 1 },
  { regex: /([\d\s,.]+)\s*kg/i, unit: 'kg', normalizedUnit: 'tonnes', conversionFactor: 0.001 },
  { regex: /([\d\s,.]+)\s*t\b/i, unit: 't', normalizedUnit: 'tonnes', conversionFactor: 1 },

  // Carburant
  { regex: /([\d\s,.]+)\s*(?:litres?\s+(?:de\s+)?)?(?:gasoil|diesel|gazole)/i, unit: 'L diesel', normalizedUnit: 'L', conversionFactor: 1 },
  { regex: /([\d\s,.]+)\s*(?:litres?\s+(?:de\s+)?)?(?:essence|sp95|sp98|e10|e85)/i, unit: 'L essence', normalizedUnit: 'L', conversionFactor: 1 },
];

// ─── Parsing nombre format européen ─────────────────────────────────

function parseEuropeanNumber(raw: string): number | null {
  // "38 500" → 38500, "1 234,56" → 1234.56, "12.500,00" → 12500.00
  let cleaned = raw.replace(/\s/g, '');

  // Si le dernier séparateur est une virgule → décimal
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > lastDot) {
    // Format français : 12.500,56 ou 1234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Format anglais ou pas de virgule
    cleaned = cleaned.replace(/,/g, '');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : num;
}

// ─── Extraction d'une quantité physique depuis un texte ─────────────

export function extractPhysicalQuantity(text: string): ExtractedQuantity | null {
  for (const { regex, unit, normalizedUnit, conversionFactor } of QUANTITY_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      const rawValue = parseEuropeanNumber(match[1]);
      if (rawValue !== null) {
        return {
          value: rawValue,
          unit,
          normalizedUnit,
          normalizedValue: Math.round(rawValue * conversionFactor * 1000) / 1000,
          confidence: 0.90,
          sourceText: match[0].trim(),
        };
      }
    }
  }
  return null;
}

// ─── Extraction batch depuis des factures ───────────────────────────

export interface InvoiceQuantityResult {
  invoiceId: string;
  supplierId: string;
  supplierName: string;
  date: string;
  amount: number;
  quantity: ExtractedQuantity | null;
}

export function extractFromInvoices(invoices: ERPInvoice[]): InvoiceQuantityResult[] {
  const results: InvoiceQuantityResult[] = [];

  for (const invoice of invoices) {
    // Chercher dans les lignes de facture d'abord
    let bestQuantity: ExtractedQuantity | null = null;

    for (const line of invoice.lines) {
      // Priorité 1 : champs structurés de la ligne (quantity + unit)
      if (line.quantity && line.unit) {
        const pattern = QUANTITY_PATTERNS.find(p => p.unit.toLowerCase() === line.unit!.toLowerCase());
        if (pattern) {
          bestQuantity = {
            value: line.quantity,
            unit: line.unit,
            normalizedUnit: pattern.normalizedUnit,
            normalizedValue: Math.round(line.quantity * pattern.conversionFactor * 1000) / 1000,
            confidence: 0.95,
            sourceText: `${line.quantity} ${line.unit}`,
          };
          break;
        }
      }

      // Priorité 2 : extraction depuis la description
      const extracted = extractPhysicalQuantity(line.description);
      if (extracted && (!bestQuantity || extracted.confidence > bestQuantity.confidence)) {
        bestQuantity = extracted;
      }
    }

    // Priorité 3 : description globale de la facture
    if (!bestQuantity && invoice.rawDescription) {
      bestQuantity = extractPhysicalQuantity(invoice.rawDescription);
    }

    results.push({
      invoiceId: invoice.id,
      supplierId: invoice.supplier.id,
      supplierName: invoice.supplier.name,
      date: invoice.date,
      amount: invoice.totalHT,
      quantity: bestQuantity,
    });
  }

  return results;
}

// ─── Extraction batch depuis des écritures FEC ──────────────────────

export interface EntryQuantityResult {
  entryId: string;
  supplierId: string;
  supplierName: string;
  date: string;
  amount: number;
  accountCode: string;
  quantity: ExtractedQuantity | null;
}

export function extractFromJournalEntries(entries: ERPJournalEntry[]): EntryQuantityResult[] {
  return entries
    .filter(e => e.debit > 0) // Charges uniquement
    .map(entry => ({
      entryId: entry.id,
      supplierId: entry.auxiliaryCode || '',
      supplierName: entry.auxiliaryLabel || '',
      date: entry.date,
      amount: entry.debit,
      accountCode: entry.accountCode,
      quantity: extractPhysicalQuantity(entry.description),
    }));
}
