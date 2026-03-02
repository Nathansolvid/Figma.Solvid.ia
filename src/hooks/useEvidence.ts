/**
 * HOOK: useEvidence
 * Gestion des preuves et documents (upload, liste, liens avec indicateurs)
 */

import { useState, useEffect } from 'react';
import { dataProvider, type Evidence } from '@/services/dataProvider';
import { v4 as uuidv4 } from 'uuid';

export function useEvidence(packId?: string, indicatorId?: string) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les preuves
  const loadEvidence = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let allEvidence: Evidence[];
      
      if (indicatorId) {
        // Charger les preuves d'un indicateur spécifique
        allEvidence = await dataProvider.store.listByIndex('evidence', 'indicatorId', indicatorId);
      } else if (packId) {
        // Charger les preuves d'un pack spécifique
        allEvidence = await dataProvider.store.listByIndex('evidence', 'packId', packId);
      } else {
        // Charger toutes les preuves
        allEvidence = await dataProvider.store.list('evidence');
      }
      
      setEvidence(allEvidence);
    } catch (err) {
      console.error('Error loading evidence:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des preuves');
    } finally {
      setLoading(false);
    }
  };

  // Upload d'une preuve
  const uploadEvidence = async (file: File, metadata: {
    packId: string;
    indicatorId?: string;
    linkedIndicators?: string[];
    period?: string;
    category?: 'E' | 'S' | 'G';
  }) => {
    try {
      // Convertir le fichier en base64
      const base64 = await fileToBase64(file);
      
      // Calculer un hash simple (pour déduplication)
      const hash = await simpleHash(base64);
      
      const newEvidence: Evidence = {
        id: uuidv4(),
        packId: metadata.packId,
        indicatorId: metadata.indicatorId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileBlobBase64: base64,
        fileHash: hash,
        period: metadata.period,
        category: metadata.category,
        uploadedBy: 'current-user', // TODO: Récupérer depuis le contexte auth
        uploadedAt: new Date().toISOString(),
        linkedIndicators: metadata.linkedIndicators || [],
      };

      await dataProvider.store.create('evidence', newEvidence);
      await loadEvidence(); // Recharger
      
      return newEvidence;
    } catch (err) {
      console.error('Error uploading evidence:', err);
      throw err;
    }
  };

  // Supprimer une preuve
  const deleteEvidence = async (evidenceId: string) => {
    try {
      await dataProvider.store.delete('evidence', evidenceId);
      await loadEvidence(); // Recharger
    } catch (err) {
      console.error('Error deleting evidence:', err);
      throw err;
    }
  };

  // Lier une preuve à un indicateur
  const linkToIndicator = async (evidenceId: string, indicatorCode: string) => {
    try {
      const existing = await dataProvider.store.read('evidence', evidenceId);
      if (!existing) {
        throw new Error('Preuve introuvable');
      }

      const updated: Evidence = {
        ...existing,
        linkedIndicators: [...new Set([...existing.linkedIndicators, indicatorCode])],
      };

      await dataProvider.store.update('evidence', updated);
      await loadEvidence(); // Recharger
      
      return updated;
    } catch (err) {
      console.error('Error linking evidence to indicator:', err);
      throw err;
    }
  };

  // Télécharger une preuve
  const downloadEvidence = (ev: Evidence) => {
    try {
      if (!ev.fileBlobBase64) {
        throw new Error('Fichier non disponible');
      }

      // Convertir base64 en blob
      const byteCharacters = atob(ev.fileBlobBase64.split(',')[1] || ev.fileBlobBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: ev.fileType });

      // Créer un lien de téléchargement
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = ev.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading evidence:', err);
      throw err;
    }
  };

  // Charger au montage
  useEffect(() => {
    loadEvidence();
  }, [packId, indicatorId]);

  return {
    evidence,
    loading,
    error,
    uploadEvidence,
    deleteEvidence,
    linkToIndicator,
    downloadEvidence,
    reload: loadEvidence,
  };
}

// ==================== HELPERS ====================

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function simpleHash(str: string): Promise<string> {
  // Hash simple basé sur le contenu
  const encoder = new TextEncoder();
  const data = encoder.encode(str.substring(0, 1000)); // Premiers 1000 caractères
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
