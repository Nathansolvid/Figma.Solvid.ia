// Utilitaires pour gestion fichiers (Evidence Vault)

import { EvidenceFileType, MAX_FILE_SIZE } from "@/types/evidence";

/**
 * Valide un fichier avant upload
 */
export function validateFile(file: File): {
  isValid: boolean;
  errorMessage?: string;
} {
  // Vérifier taille
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      errorMessage: `Fichier trop volumineux (${formatFileSize(file.size)}). Maximum: 10 MB`,
    };
  }

  // Vérifier que le fichier n'est pas vide
  if (file.size === 0) {
    return {
      isValid: false,
      errorMessage: "Fichier vide",
    };
  }

  return { isValid: true };
}

/**
 * Détecte le type de fichier basé sur l'extension et le MIME type
 */
export function detectFileType(file: File): EvidenceFileType {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  // PDF
  if (extension === "pdf" || mimeType === "application/pdf") {
    return "pdf";
  }

  // Excel
  if (
    ["xlsx", "xls", "csv"].includes(extension || "") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  ) {
    return "excel";
  }

  // Image
  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "") ||
    mimeType.startsWith("image/")
  ) {
    return "image";
  }

  // Word
  if (
    ["doc", "docx"].includes(extension || "") ||
    mimeType.includes("word") ||
    mimeType.includes("msword")
  ) {
    return "word";
  }

  return "other";
}

/**
 * Formate la taille d'un fichier en format lisible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Génère un nom de fichier unique
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalFilename.split(".").pop();
  const nameWithoutExt = originalFilename.replace(`.${extension}`, "");
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, "_");

  return `${sanitized}_${timestamp}_${random}.${extension}`;
}

/**
 * Simule un upload de fichier (en production, upload vers Supabase Storage)
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; filename: string }> {
  return new Promise((resolve, reject) => {
    // Validation
    const validation = validateFile(file);
    if (!validation.isValid) {
      reject(new Error(validation.errorMessage));
      return;
    }

    // Simulation upload avec progression
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (onProgress) {
        onProgress(Math.min(progress, 90));
      }

      if (progress >= 100) {
        clearInterval(interval);

        // Simulation génération URL
        const uniqueFilename = generateUniqueFilename(file.name);
        const url = `https://storage.supabase.co/evidence-vault/${uniqueFilename}`;

        if (onProgress) {
          onProgress(100);
        }

        setTimeout(() => {
          resolve({ url, filename: uniqueFilename });
        }, 300);
      }
    }, 200);
  });
}

/**
 * Vérifie si un fichier est une image
 */
export function isImageFile(file: File): boolean {
  return detectFileType(file) === "image";
}

/**
 * Vérifie si un fichier est un PDF
 */
export function isPDFFile(file: File): boolean {
  return detectFileType(file) === "pdf";
}

/**
 * Génère une prévisualisation d'image en base64
 */
export async function generateImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error("Le fichier n'est pas une image"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error("Erreur lecture fichier"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Erreur lecture fichier"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Télécharge un fichier depuis une URL
 */
export function downloadFile(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Ouvre une URL dans un nouvel onglet
 */
export function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Valide une URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extrait les métadonnées d'un fichier
 */
export async function extractFileMetadata(file: File): Promise<{
  name: string;
  size: number;
  type: string;
  fileType: EvidenceFileType;
  lastModified: Date;
}> {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    fileType: detectFileType(file),
    lastModified: new Date(file.lastModified),
  };
}
