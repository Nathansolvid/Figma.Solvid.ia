// Utilitaires pour parser Excel et CSV
//
// IMPORTANT : on utilise ExcelJS (et non SheetJS/xlsx) pour lire les fichiers
// Excel, car les templates Solvid.IA sont générés avec ExcelJS (compression
// DEFLATE) que SheetJS ne sait pas décompresser dans sa version browser
// ("Unsupported ZIP Compression method NaN").

import ExcelJS from "exceljs";
import Papa from "papaparse";
import { ParsedRow } from "@/types/import";

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  totalColumns: number;
}

/**
 * Extrait la valeur brute d'une cellule ExcelJS en une primitive JS.
 * Gère : texte enrichi (richText), formules (result), hyperliens (text), dates.
 */
function extractCellValue(value: ExcelJS.CellValue): string | number | boolean | null {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString().split("T")[0];

  const v = value as any;
  // Texte enrichi → concaténer les segments
  if (v.richText && Array.isArray(v.richText)) {
    return v.richText.map((r: any) => r.text ?? "").join("");
  }
  // Formule → utiliser le résultat calculé
  if ("result" in v) return extractCellValue(v.result as ExcelJS.CellValue);
  // Hyperlien → utiliser le texte
  if ("text" in v) return String(v.text);

  return String(value);
}

/**
 * Parse un fichier CSV
 */
export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows: ParsedRow[] = results.data.map((row: any, index: number) => ({
          rowNumber: index + 1,
          data: row,
          isValid: true,
          validationErrors: [],
        }));

        resolve({
          headers,
          rows,
          totalRows: rows.length,
          totalColumns: headers.length,
        });
      },
      error: (error) => {
        reject(new Error(`Erreur parsing CSV: ${error.message}`));
      },
    });
  });
}

/**
 * Parse un fichier Excel (.xlsx, .xls) avec ExcelJS.
 *
 * Fonctionnalités :
 *  - Supporte les templates Solvid.IA stylisés (bannière sur les 6 premières
 *    lignes, en-têtes ligne 7) grâce à la détection dynamique du sentinel
 *    "Code VSME".
 *  - Normalise automatiquement les codes VSME : retire le préfixe "★ " ajouté
 *    par le template pour signaler les champs obligatoires.
 */
export async function parseExcel(file: File): Promise<ParseResult> {
  // 1. Lire le fichier en ArrayBuffer
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Erreur lecture du fichier"));
    reader.readAsArrayBuffer(file);
  });

  try {
    // 2. Charger avec ExcelJS (supporte la compression DEFLATE)
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(arrayBuffer);

    // Prendre la première feuille (= "Données VSME" dans nos templates)
    const worksheet = wb.worksheets[0];
    if (!worksheet) throw new Error("Le fichier Excel est vide");

    // 3. Construire un tableau 2D de valeurs primitives
    const jsonData: any[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const rowArray: any[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        rowArray[colNumber - 1] = extractCellValue(cell.value);
      });
      jsonData.push(rowArray);
    });

    if (jsonData.length === 0) throw new Error("Le fichier Excel est vide");

    // 4. Recherche dynamique de la ligne d'en-têtes
    //    Supporte les fichiers avec des lignes de bannière/instructions avant
    //    les vraies colonnes (templates Solvid.IA stylisés).
    const VSME_SENTINEL = "Code VSME";
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
      const rowValues = jsonData[i].map((v: any) => String(v ?? "").trim());
      if (rowValues.includes(VSME_SENTINEL)) {
        headerRowIndex = i;
        break;
      }
    }

    // 5. Extraire les en-têtes
    const headers = jsonData[headerRowIndex].map((h: any) =>
      String(h ?? "").trim()
    );

    // 6. Construire les lignes de données
    const rows: ParsedRow[] = jsonData
      .slice(headerRowIndex + 1)
      .map((row: any[], index: number) => {
        const rowData: Record<string, any> = {};
        headers.forEach((header, colIndex) => {
          if (!header) return;
          let value = row[colIndex] !== undefined ? row[colIndex] : "";

          // Normaliser les codes VSME : retirer le préfixe "★ " (obligatoire)
          // et tout autre symbole de marquage similaire
          if (header === VSME_SENTINEL) {
            value = String(value)
              .replace(/^[★✦✷✸✹*#]\s*/, "")
              .trim();
          }
          rowData[header] = value;
        });

        return {
          rowNumber: index + headerRowIndex + 2,
          data: rowData,
          isValid: true,
          validationErrors: [],
        };
      });

    // 7. Filtrer les lignes complètement vides
    const validRows = rows.filter((row) =>
      Object.values(row.data).some(
        (val) => val !== "" && val !== null && val !== undefined
      )
    );

    const cleanHeaders = headers.filter((h) => h !== "");

    return {
      headers: cleanHeaders,
      rows: validRows,
      totalRows: validRows.length,
      totalColumns: cleanHeaders.length,
    };
  } catch (error: any) {
    throw new Error(`Erreur parsing Excel: ${error.message}`);
  }
}

/**
 * Parse un fichier (détecte automatiquement CSV ou Excel)
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCSV(file);
  } else if (extension === "xlsx" || extension === "xls") {
    return parseExcel(file);
  } else {
    throw new Error(
      "Format de fichier non supporté. Utilisez .csv, .xlsx ou .xls"
    );
  }
}
