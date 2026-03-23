/**
 * smartImportMatcher — Moteur de détection intelligente pour l'import Excel
 *
 * Objectif : lire N'IMPORTE QUEL Excel et en extraire des données VSME
 * avec le minimum d'information possible.
 *
 * Stratégies (par ordre de priorité) :
 * 1. Code exact dans une cellule ("B3.1")
 * 2. Code embarqué dans du texte ("B3.1 - Consommation…", "★ B3.1")
 * 3. Matching textuel fuzzy en français ("Consommation totale d'énergie" → B3.1)
 * 4. Auto-détection de la colonne valeur (numérique, ou texte si narratif)
 * 5. Si pas de colonne valeur dédiée → cherche dans TOUTES les colonnes restantes
 *
 * Aucune dépendance UI — pur utilitaire.
 */

import { MODULE_B, MODULE_C, type Datapoint } from "@/data/vsme-data";
import type { ParsedRow, ParseResult } from "@/types/import";

// ─── Types publics ──────────────────────────────────────────────────────────

export interface ColumnDetection {
  columnName: string;
  confidence: number; // 0-1
  matchCount: number;
  sampleMatches: string[];
}

export interface RowMatch {
  rowNumber: number;
  matchedCode: string | null;
  matchedIntitule: string;
  matchSource: "code" | "text" | "none";
  confidence: number; // 0-1
  rawValue: string;
  rawLabel: string; // texte original de la cellule
}

export interface SmartMatchResult {
  codeColumn: ColumnDetection | null;
  textColumn: ColumnDetection | null;
  valueColumn: ColumnDetection | null;
  matches: RowMatch[];
  matchRate: number; // ratio de lignes matchées
  totalRows: number;
}

// ─── Index interne ──────────────────────────────────────────────────────────

interface IndicatorIndex {
  code: string;
  codeUpper: string;
  normalizedIntitule: string;
  keywords: string[];
  original: Datapoint;
}

// ─── Stopwords français ─────────────────────────────────────────────────────

const FR_STOPWORDS = new Set([
  "le", "la", "les", "de", "du", "des", "un", "une", "et", "en", "par",
  "pour", "sur", "au", "aux", "a", "d", "l", "est", "son", "sa", "ses",
  "ce", "cette", "qui", "que", "dans", "dont", "ou", "ne", "pas", "plus",
  "avec", "se", "si", "nous", "vous", "ils", "elles", "leur", "leurs",
]);

// ─── Regex codes VSME ───────────────────────────────────────────────────────

/** Code exact seul dans la cellule */
const VSME_CODE_EXACT_RE = /^[BC]\d{1,2}\.\d{1,2}$/i;

/** Code embarqué dans du texte (ex: "B3.1 - Consommation…", "★ B3.1", "B3.1:") */
const VSME_CODE_EMBEDDED_RE = /\b([BC]\d{1,2}\.\d{1,2})\b/i;

// ─── Helpers texte ──────────────────────────────────────────────────────────

/** Normalise un texte français : minuscules, sans accents, sans ponctuation */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/['']/g, " ")          // élisions → espace
    .replace(/[^a-z0-9\s]/g, " ")   // ponctuation → espace
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrait les mots-clés significatifs d'un texte (sans stopwords) */
export function extractKeywords(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized
    .split(" ")
    .filter((w) => w.length > 1 && !FR_STOPWORDS.has(w));
}

/** Tente d'extraire un code VSME d'une cellule (exact ou embarqué) */
function extractCode(cellValue: string): string | null {
  const trimmed = cellValue.trim();
  // Code exact
  if (VSME_CODE_EXACT_RE.test(trimmed)) return trimmed.toUpperCase();
  // Code embarqué (ex: "★ B3.1", "B3.1 - Consommation", "Code: B3.1")
  const match = trimmed.match(VSME_CODE_EMBEDDED_RE);
  if (match) return match[1].toUpperCase();
  return null;
}

/** Vérifie si une valeur est "utile" (non vide, pas juste un header) */
function isUsableValue(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  return s.length > 0 && s !== "-" && s !== "N/A" && s !== "n/a";
}

/** Détecte si une string représente un nombre (FR ou EN) */
function parseNumericValue(val: string): number | null {
  const cleaned = val.trim().replace(/\s/g, "").replace(",", ".");
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

// ─── Construction de l'index ────────────────────────────────────────────────

function getAllDatapoints(): Datapoint[] {
  return [
    ...MODULE_B.flatMap((s) => s.datapoints),
    ...MODULE_C.flatMap((s) => s.datapoints),
  ];
}

function buildIndicatorIndex(datapoints: Datapoint[]): IndicatorIndex[] {
  return datapoints.map((dp) => ({
    code: dp.code,
    codeUpper: dp.code.toUpperCase(),
    normalizedIntitule: normalizeText(dp.intitule),
    keywords: extractKeywords(dp.intitule),
    original: dp,
  }));
}

function buildCodeMap(datapoints: Datapoint[]): Map<string, Datapoint> {
  const map = new Map<string, Datapoint>();
  for (const dp of datapoints) {
    map.set(dp.code.toUpperCase(), dp);
  }
  return map;
}

// ─── Scoring texte ──────────────────────────────────────────────────────────

function scoreTextMatch(cellText: string, indicator: IndicatorIndex): number {
  const normalizedCell = normalizeText(cellText);
  if (!normalizedCell || normalizedCell.length < 3) return 0;

  // Exact match
  if (normalizedCell === indicator.normalizedIntitule) return 1.0;

  // Keyword-based scoring (plus précis que "contains" pour distinguer B3.1 vs B3.2)
  const cellKeywords = extractKeywords(cellText);
  if (cellKeywords.length === 0 || indicator.keywords.length === 0) return 0;

  const cellSet = new Set(cellKeywords);
  const indSet = new Set(indicator.keywords);

  // Mots de l'indicateur trouvés dans la cellule (recall)
  const indInCell = indicator.keywords.filter((k) => cellSet.has(k)).length;
  const recall = indInCell / indicator.keywords.length;

  // Mots de la cellule trouvés dans l'indicateur (precision)
  const cellInInd = cellKeywords.filter((k) => indSet.has(k)).length;
  const precision = cellInInd / cellKeywords.length;

  // F1-score pondéré : pénalise les mots excédentaires des deux côtés
  // Cela empêche "Consommation totale d'énergie renouvelable" de matcher B3.1
  // car le mot "renouvelable" n'est PAS dans B3.1, ce qui baisse la precision
  if (recall === 0) return 0;

  const f1 = 2 * (precision * recall) / (precision + recall);

  // Bonus si contains complet (un texte est sous-chaîne de l'autre)
  const containsBonus =
    normalizedCell.includes(indicator.normalizedIntitule) ||
    indicator.normalizedIntitule.includes(normalizedCell)
      ? 0.1
      : 0;

  // Score final : F1 pondéré avec bonus contains
  if (f1 >= 0.8) return Math.min(0.85 + containsBonus, 1.0);
  if (f1 >= 0.6) return 0.55 + 0.3 * f1 + containsBonus;
  if (f1 >= 0.4) return 0.3 + 0.3 * f1;
  if (f1 >= 0.25) return 0.15 + 0.2 * f1;

  return 0;
}

function findBestTextMatch(
  cellText: string,
  index: IndicatorIndex[]
): { indicator: IndicatorIndex; score: number } | null {
  let best: { indicator: IndicatorIndex; score: number } | null = null;

  for (const ind of index) {
    const score = scoreTextMatch(cellText, ind);
    if (score > (best?.score ?? 0)) {
      best = { indicator: ind, score };
    }
  }

  return best && best.score >= 0.2 ? best : null;
}

// ─── Détection de colonnes ──────────────────────────────────────────────────

/**
 * Détecte la colonne contenant des codes VSME.
 * Accepte les codes exacts (B3.1) ET les codes embarqués (★ B3.1, B3.1 - Conso…)
 * Seuil très bas : 1 seul match suffit si la colonne a peu de lignes.
 */
export function detectCodeColumn(
  headers: string[],
  rows: ParsedRow[]
): ColumnDetection | null {
  let bestCol: ColumnDetection | null = null;

  for (const header of headers) {
    let matchCount = 0;
    const samples: string[] = [];

    for (const row of rows) {
      const val = String(row.data[header] ?? "").trim();
      if (!val) continue;
      const code = extractCode(val);
      if (code) {
        matchCount++;
        if (samples.length < 5) samples.push(val);
      }
    }

    // Seuil ultra-bas : 1 match si ≤5 lignes, sinon 2 matches
    const minRequired = rows.length <= 5 ? 1 : 2;
    if (matchCount >= minRequired && matchCount > (bestCol?.matchCount ?? 0)) {
      bestCol = {
        columnName: header,
        confidence: Math.min(matchCount / Math.max(rows.length, 1), 1),
        matchCount,
        sampleMatches: samples,
      };
    }
  }

  return bestCol;
}

/**
 * Détecte la colonne contenant des descriptions textuelles d'indicateurs.
 * Seuil bas : 2 matches suffisent.
 */
export function detectTextColumn(
  headers: string[],
  rows: ParsedRow[],
  index: IndicatorIndex[]
): ColumnDetection | null {
  let bestCol: ColumnDetection | null = null;
  let bestScore = 0;

  for (const header of headers) {
    let textCells = 0;
    let matchCount = 0;
    let totalScore = 0;
    const samples: string[] = [];

    for (const row of rows) {
      const val = String(row.data[header] ?? "").trim();
      if (!val) continue;

      const isNumeric = parseNumericValue(val) !== null;
      if (!isNumeric && val.length > 2) textCells++;

      const match = findBestTextMatch(val, index);
      if (match) {
        matchCount++;
        totalScore += match.score;
        if (samples.length < 5) {
          samples.push(`${val} → ${match.indicator.code}`);
        }
      }
    }

    // Seuil souple : au moins 20% textuel et 2 matches
    const nonEmptyRows = rows.filter(r => String(r.data[header] ?? "").trim()).length;
    if (nonEmptyRows > 0 && textCells < nonEmptyRows * 0.2) continue;
    if (matchCount < Math.min(2, rows.length)) continue;

    const avgScore = totalScore / Math.max(matchCount, 1);
    const columnScore = avgScore * (matchCount / Math.max(rows.length, 1));

    if (columnScore > bestScore) {
      bestScore = columnScore;
      bestCol = {
        columnName: header,
        confidence: avgScore,
        matchCount,
        sampleMatches: samples,
      };
    }
  }

  return bestCol;
}

/**
 * Détecte la colonne contenant les valeurs.
 * Stratégie : cherche la colonne la plus numérique parmi les restantes.
 * Si pas de colonne très numérique, prend quand même la meilleure (seuil bas : 20%).
 */
export function detectValueColumn(
  headers: string[],
  rows: ParsedRow[],
  excludeColumns: string[]
): ColumnDetection | null {
  const excluded = new Set(excludeColumns.map((c) => c.toLowerCase()));
  let bestCol: ColumnDetection | null = null;
  let bestNumericRatio = 0;

  for (const header of headers) {
    if (excluded.has(header.toLowerCase())) continue;

    let numericCount = 0;
    let hasAnyValue = 0;
    const samples: string[] = [];

    for (const row of rows) {
      const val = row.data[header];
      if (!isUsableValue(val)) continue;
      hasAnyValue++;

      const num = parseNumericValue(String(val));
      if (num !== null) {
        numericCount++;
        if (samples.length < 5) samples.push(String(val));
      }
    }

    if (hasAnyValue === 0) continue;

    const ratio = numericCount / Math.max(hasAnyValue, 1);
    // Seuil bas : 20% de valeurs numériques suffit
    if (ratio > 0.2 && ratio > bestNumericRatio) {
      bestNumericRatio = ratio;
      bestCol = {
        columnName: header,
        confidence: ratio,
        matchCount: numericCount,
        sampleMatches: samples,
      };
    }
  }

  // Si aucune colonne numérique trouvée, prendre la première colonne non-exclue
  // qui contient des valeurs (utile pour les indicateurs narratifs / texte)
  if (!bestCol) {
    for (const header of headers) {
      if (excluded.has(header.toLowerCase())) continue;
      let valueCount = 0;
      const samples: string[] = [];
      for (const row of rows) {
        if (isUsableValue(row.data[header])) {
          valueCount++;
          if (samples.length < 5) samples.push(String(row.data[header]));
        }
      }
      if (valueCount > 0) {
        bestCol = {
          columnName: header,
          confidence: valueCount / Math.max(rows.length, 1),
          matchCount: valueCount,
          sampleMatches: samples,
        };
        break;
      }
    }
  }

  return bestCol;
}

// ─── Matching des lignes ────────────────────────────────────────────────────

function autoMatchRows(
  rows: ParsedRow[],
  headers: string[],
  codeColumn: string | null,
  textColumn: string | null,
  valueColumn: string | null,
  index: IndicatorIndex[],
  codeMap: Map<string, Datapoint>
): RowMatch[] {
  return rows.map((row) => {
    // ── Extraire la valeur ─────────────────────────────────────────────────
    let rawValue = "";
    if (valueColumn) {
      rawValue = String(row.data[valueColumn] ?? "").trim();
    }
    // Si pas de colonne valeur dédiée, chercher dans toutes les autres colonnes
    if (!rawValue) {
      for (const h of headers) {
        if (h === codeColumn || h === textColumn) continue;
        const v = row.data[h];
        if (isUsableValue(v)) {
          rawValue = String(v).trim();
          break;
        }
      }
    }

    // ── Stratégie 1 : Match par code (exact ou embarqué) ──────────────────
    if (codeColumn) {
      const cellVal = String(row.data[codeColumn] ?? "").trim();
      const code = extractCode(cellVal);
      if (code) {
        const dp = codeMap.get(code);
        if (dp) {
          return {
            rowNumber: row.rowNumber,
            matchedCode: dp.code,
            matchedIntitule: dp.intitule,
            matchSource: "code" as const,
            confidence: 1.0,
            rawValue,
            rawLabel: cellVal,
          };
        }
      }
    }

    // ── Stratégie 1b : Chercher un code dans TOUTES les colonnes ──────────
    // (si pas de colonne code dédiée, ou si la colonne code n'a rien donné)
    if (!codeColumn) {
      for (const h of headers) {
        const cellVal = String(row.data[h] ?? "").trim();
        const code = extractCode(cellVal);
        if (code) {
          const dp = codeMap.get(code);
          if (dp) {
            // Trouver la valeur dans une autre colonne
            let val = rawValue;
            if (!val) {
              for (const h2 of headers) {
                if (h2 === h) continue;
                const v = row.data[h2];
                if (isUsableValue(v)) { val = String(v).trim(); break; }
              }
            }
            return {
              rowNumber: row.rowNumber,
              matchedCode: dp.code,
              matchedIntitule: dp.intitule,
              matchSource: "code" as const,
              confidence: 0.95,
              rawValue: val,
              rawLabel: cellVal,
            };
          }
        }
      }
    }

    // ── Stratégie 2 : Match par texte ─────────────────────────────────────
    if (textColumn) {
      const textVal = String(row.data[textColumn] ?? "").trim();
      if (textVal.length > 2) {
        // D'abord vérifier s'il y a un code embarqué dans le texte
        const embeddedCode = extractCode(textVal);
        if (embeddedCode) {
          const dp = codeMap.get(embeddedCode);
          if (dp) {
            return {
              rowNumber: row.rowNumber,
              matchedCode: dp.code,
              matchedIntitule: dp.intitule,
              matchSource: "code" as const,
              confidence: 0.95,
              rawValue,
              rawLabel: textVal,
            };
          }
        }
        // Sinon fuzzy match textuel
        const match = findBestTextMatch(textVal, index);
        if (match && match.score >= 0.3) {
          return {
            rowNumber: row.rowNumber,
            matchedCode: match.indicator.code,
            matchedIntitule: match.indicator.original.intitule,
            matchSource: "text" as const,
            confidence: match.score,
            rawValue,
            rawLabel: textVal,
          };
        }
      }
    }

    // ── Stratégie 2b : Chercher du texte matchable dans toutes les colonnes
    if (!textColumn) {
      for (const h of headers) {
        const cellVal = String(row.data[h] ?? "").trim();
        if (cellVal.length < 4) continue;
        if (parseNumericValue(cellVal) !== null) continue; // skip numeric
        const match = findBestTextMatch(cellVal, index);
        if (match && match.score >= 0.4) {
          let val = rawValue;
          if (!val) {
            for (const h2 of headers) {
              if (h2 === h) continue;
              const v = row.data[h2];
              if (isUsableValue(v)) { val = String(v).trim(); break; }
            }
          }
          return {
            rowNumber: row.rowNumber,
            matchedCode: match.indicator.code,
            matchedIntitule: match.indicator.original.intitule,
            matchSource: "text" as const,
            confidence: match.score,
            rawValue: val,
            rawLabel: cellVal,
          };
        }
      }
    }

    // ── Pas de match ──────────────────────────────────────────────────────
    const label =
      (textColumn ? String(row.data[textColumn] ?? "") : "") ||
      (codeColumn ? String(row.data[codeColumn] ?? "") : "") ||
      // Prendre la première colonne non-vide comme label
      headers.map(h => String(row.data[h] ?? "").trim()).find(v => v.length > 0) ||
      `Ligne ${row.rowNumber}`;

    return {
      rowNumber: row.rowNumber,
      matchedCode: null,
      matchedIntitule: "",
      matchSource: "none" as const,
      confidence: 0,
      rawValue,
      rawLabel: label,
    };
  });
}

// ─── Fonction principale ────────────────────────────────────────────────────

/**
 * Analyse un ParseResult et tente de matcher automatiquement les lignes
 * aux 79 indicateurs VSME connus, par code ET par description textuelle.
 *
 * Fonctionne même avec un Excel très simple (2 colonnes : label + valeur).
 */
export function smartAutoMatch(parseResult: ParseResult): SmartMatchResult {
  const allDatapoints = getAllDatapoints();
  const index = buildIndicatorIndex(allDatapoints);
  const codeMap = buildCodeMap(allDatapoints);

  const { headers, rows } = parseResult;

  // 1. Détecter la colonne code
  const codeColumn = detectCodeColumn(headers, rows);

  // 2. Détecter la colonne texte (exclure la colonne code si trouvée)
  const headersForText = codeColumn
    ? headers.filter((h) => h !== codeColumn.columnName)
    : headers;
  const textColumn = detectTextColumn(headersForText, rows, index);

  // 3. Détecter la colonne valeur (exclure code + texte)
  const excludeCols = [
    ...(codeColumn ? [codeColumn.columnName] : []),
    ...(textColumn ? [textColumn.columnName] : []),
  ];
  const valueColumn = detectValueColumn(headers, rows, excludeCols);

  // 4. Matcher les lignes — scan toutes les colonnes si pas de colonne dédiée
  const matches = autoMatchRows(
    rows,
    headers,
    codeColumn?.columnName ?? null,
    textColumn?.columnName ?? null,
    valueColumn?.columnName ?? null,
    index,
    codeMap
  );

  const matchedCount = matches.filter((m) => m.matchSource !== "none").length;

  return {
    codeColumn,
    textColumn,
    valueColumn,
    matches,
    matchRate: rows.length > 0 ? matchedCount / rows.length : 0,
    totalRows: rows.length,
  };
}
