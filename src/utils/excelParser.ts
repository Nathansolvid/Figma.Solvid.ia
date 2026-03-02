/**
 * EXCEL PARSER
 * Upload et parsing de fichiers Excel pour import de données ESG
 */

import * as XLSX from 'xlsx';

export interface ParsedRow {
  [key: string]: string | number | null;
}

export interface ParseResult {
  success: boolean;
  data: ParsedRow[];
  errors: string[];
  warnings: string[];
  rowCount: number;
  columnCount: number;
  detectedColumns: string[];
}

export interface ValidationRule {
  column: string;
  required?: boolean;
  type?: 'string' | 'number' | 'date';
  pattern?: RegExp;
  min?: number;
  max?: number;
}

/**
 * Parser un fichier Excel
 */
export async function parseExcelFile(
  file: File,
  options: {
    sheetName?: string;
    headerRow?: number;
    validationRules?: ValidationRule[];
  } = {}
): Promise<ParseResult> {
  const { sheetName, headerRow = 0, validationRules = [] } = options;

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Impossible de lire le fichier');
        }

        // Lire le workbook
        const workbook = XLSX.read(data, { type: 'binary' });

        // Sélectionner la feuille
        const selectedSheetName = sheetName || workbook.SheetNames[1] || workbook.SheetNames[0]; // Prend "Données" par défaut (index 1)
        const worksheet = workbook.Sheets[selectedSheetName];

        if (!worksheet) {
          throw new Error(`Feuille "${selectedSheetName}" introuvable`);
        }

        // Convertir en JSON
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Retourne un tableau de tableaux
          defval: null,
          blankrows: false,
        });

        if (jsonData.length === 0) {
          throw new Error('Le fichier est vide');
        }

        // Extraire les en-têtes
        const headers = jsonData[headerRow] as string[];
        const detectedColumns = headers.filter(h => h); // Supprimer les valeurs vides

        // Extraire les lignes de données (après les en-têtes et les exemples)
        const dataRows = jsonData.slice(headerRow + 2); // +2 pour sauter la ligne d'exemple

        // Convertir en objets
        const parsedData: ParsedRow[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        dataRows.forEach((row, index) => {
          const rowNumber = index + headerRow + 3; // Numéro réel dans Excel

          // Ignorer les lignes complètement vides
          if (row.every(cell => cell === null || cell === '' || cell === undefined)) {
            return;
          }

          const rowData: ParsedRow = {};
          let hasError = false;

          headers.forEach((header, colIndex) => {
            if (!header) return;

            const cellValue = row[colIndex];
            rowData[header] = cellValue;

            // Validation
            const rule = validationRules.find(r => r.column === header);
            if (rule) {
              // Requis
              if (rule.required && (cellValue === null || cellValue === '' || cellValue === undefined)) {
                errors.push(`Ligne ${rowNumber}: "${header}" est obligatoire`);
                hasError = true;
              }

              // Type
              if (cellValue !== null && cellValue !== '' && cellValue !== undefined) {
                if (rule.type === 'number' && typeof cellValue !== 'number') {
                  // Tenter de convertir
                  const num = parseFloat(String(cellValue).replace(/\s/g, '').replace(',', '.'));
                  if (isNaN(num)) {
                    errors.push(`Ligne ${rowNumber}: "${header}" doit être un nombre`);
                    hasError = true;
                  } else {
                    rowData[header] = num;
                  }
                }

                if (rule.type === 'string' && typeof cellValue === 'number') {
                  rowData[header] = String(cellValue);
                }
              }

              // Min/Max
              if (rule.type === 'number' && typeof rowData[header] === 'number') {
                if (rule.min !== undefined && (rowData[header] as number) < rule.min) {
                  warnings.push(`Ligne ${rowNumber}: "${header}" est inférieur à ${rule.min}`);
                }
                if (rule.max !== undefined && (rowData[header] as number) > rule.max) {
                  warnings.push(`Ligne ${rowNumber}: "${header}" est supérieur à ${rule.max}`);
                }
              }

              // Pattern
              if (rule.pattern && typeof cellValue === 'string') {
                if (!rule.pattern.test(cellValue)) {
                  warnings.push(`Ligne ${rowNumber}: "${header}" ne correspond pas au format attendu`);
                }
              }
            }
          });

          if (!hasError) {
            parsedData.push(rowData);
          }
        });

        resolve({
          success: errors.length === 0,
          data: parsedData,
          errors,
          warnings,
          rowCount: parsedData.length,
          columnCount: detectedColumns.length,
          detectedColumns,
        });
      } catch (error) {
        resolve({
          success: false,
          data: [],
          errors: [error instanceof Error ? error.message : 'Erreur lors du parsing'],
          warnings: [],
          rowCount: 0,
          columnCount: 0,
          detectedColumns: [],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: ['Erreur lors de la lecture du fichier'],
        warnings: [],
        rowCount: 0,
        columnCount: 0,
        detectedColumns: [],
      });
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Mapper les données parsées vers des indicateurs ESG
 */
export function mapToIndicators(
  parsedData: ParsedRow[],
  mapping: {
    codeColumn: string;
    nameColumn?: string;
    valueColumn: string;
    unitColumn?: string;
    periodColumn?: string;
    sourceColumn?: string;
    categoryColumn?: string;
  }
): Array<{
  code: string;
  name?: string;
  value: number;
  unit?: string;
  period?: string;
  source?: string;
  category?: 'E' | 'S' | 'G';
}> {
  return parsedData.map(row => ({
    code: String(row[mapping.codeColumn] || ''),
    name: mapping.nameColumn ? String(row[mapping.nameColumn] || '') : undefined,
    value: Number(row[mapping.valueColumn] || 0),
    unit: mapping.unitColumn ? String(row[mapping.unitColumn] || '') : undefined,
    period: mapping.periodColumn ? String(row[mapping.periodColumn] || '') : undefined,
    source: mapping.sourceColumn ? String(row[mapping.sourceColumn] || '') : undefined,
    category: mapping.categoryColumn ? (row[mapping.categoryColumn] as 'E' | 'S' | 'G') : undefined,
  }));
}

/**
 * Règles de validation par template
 */
export const VALIDATION_RULES: Record<string, ValidationRule[]> = {
  energie: [
    { column: 'Type d\'énergie *', required: true, type: 'string' },
    { column: 'Période *', required: true, type: 'string', pattern: /^\d{4}$/ },
    { column: 'Consommation (kWh) *', required: true, type: 'number', min: 0 },
    { column: 'Source de données', required: false, type: 'string' },
  ],
  ges: [
    { column: 'Scope *', required: true, type: 'string', pattern: /^Scope [123]$/ },
    { column: 'Période *', required: true, type: 'string', pattern: /^\d{4}$/ },
    { column: 'Émissions (tCO2e) *', required: true, type: 'number', min: 0 },
  ],
  eau: [
    { column: 'Site / Usage *', required: true, type: 'string' },
    { column: 'Période *', required: true, type: 'string' },
    { column: 'Consommation (m³) *', required: true, type: 'number', min: 0 },
  ],
  dechets: [
    { column: 'Type de déchet *', required: true, type: 'string' },
    { column: 'Mode de traitement *', required: true, type: 'string' },
    { column: 'Période *', required: true, type: 'string' },
    { column: 'Quantité (tonnes) *', required: true, type: 'number', min: 0 },
  ],
  effectifs: [
    { column: 'Catégorie *', required: true, type: 'string' },
    { column: 'Période *', required: true, type: 'string' },
    { column: 'Effectif total *', required: true, type: 'number', min: 0 },
  ],
  formation: [
    { column: 'Thématique *', required: true, type: 'string' },
    { column: 'Période *', required: true, type: 'string' },
    { column: 'Heures totales *', required: true, type: 'number', min: 0 },
  ],
  gouvernance: [
    { column: 'Indicateur *', required: true, type: 'string' },
    { column: 'Période *', required: true, type: 'string' },
    { column: 'Valeur *', required: true, type: 'number' },
  ],
};

/**
 * Obtenir les règles de validation selon le nom du fichier
 */
export function getValidationRules(fileName: string): ValidationRule[] {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('energie') || lowerName.includes('energy')) {
    return VALIDATION_RULES.energie;
  }
  if (lowerName.includes('ges') || lowerName.includes('emission')) {
    return VALIDATION_RULES.ges;
  }
  if (lowerName.includes('eau') || lowerName.includes('water')) {
    return VALIDATION_RULES.eau;
  }
  if (lowerName.includes('dechet') || lowerName.includes('waste')) {
    return VALIDATION_RULES.dechets;
  }
  if (lowerName.includes('effectif') || lowerName.includes('rh') || lowerName.includes('headcount')) {
    return VALIDATION_RULES.effectifs;
  }
  if (lowerName.includes('formation') || lowerName.includes('training')) {
    return VALIDATION_RULES.formation;
  }
  if (lowerName.includes('gouvernance') || lowerName.includes('governance')) {
    return VALIDATION_RULES.gouvernance;
  }
  
  return []; // Pas de validation spécifique
}
