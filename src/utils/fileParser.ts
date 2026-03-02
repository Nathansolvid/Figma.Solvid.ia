// Utilitaires pour parser Excel et CSV

import * as XLSX from "xlsx";
import Papa from "papaparse";
import { ParsedRow } from "@/types/import";

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  totalColumns: number;
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
 * Parse un fichier Excel (.xlsx, .xls)
 */
export async function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Prendre la première feuille
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Récupérer les données brutes
          defval: "", // Valeur par défaut pour cellules vides
        }) as any[][];

        if (jsonData.length === 0) {
          throw new Error("Le fichier Excel est vide");
        }

        // La première ligne contient les headers
        const headers = jsonData[0].map((h: any) => String(h || "").trim());
        
        // Les lignes suivantes contiennent les données
        const rows: ParsedRow[] = jsonData.slice(1).map((row: any[], index: number) => {
          const rowData: Record<string, any> = {};
          headers.forEach((header, colIndex) => {
            if (header) {
              rowData[header] = row[colIndex] !== undefined ? row[colIndex] : "";
            }
          });

          return {
            rowNumber: index + 2, // +2 car index 0 = ligne 2 (après header)
            data: rowData,
            isValid: true,
            validationErrors: [],
          };
        });

        // Filtrer les lignes complètement vides
        const validRows = rows.filter((row) => {
          return Object.values(row.data).some((val) => val !== "" && val !== null && val !== undefined);
        });

        resolve({
          headers: headers.filter((h) => h !== ""), // Retirer headers vides
          rows: validRows,
          totalRows: validRows.length,
          totalColumns: headers.filter((h) => h !== "").length,
        });
      } catch (error: any) {
        reject(new Error(`Erreur parsing Excel: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Erreur lecture du fichier"));
    };

    reader.readAsArrayBuffer(file);
  });
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
    throw new Error("Format de fichier non supporté. Utilisez .csv, .xlsx ou .xls");
  }
}

/**
 * Génère un template Excel à télécharger
 */
export function generateExcelTemplate(
  headers: string[],
  exampleRow?: Record<string, string>
): Uint8Array {
  const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    exampleRow ? headers.map((h) => exampleRow[h] || "") : [],
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Données ESG");

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

/**
 * Télécharger un fichier Excel généré
 */
export function downloadExcelTemplate(filename: string, data: Uint8Array) {
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
