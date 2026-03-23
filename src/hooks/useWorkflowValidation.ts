/**
 * useWorkflowValidation — Hook de validation des preuves obligatoires par workflow
 *
 * 🆕 Phase 10 : Indépendance totale entre workflows
 *  - Chaque preuve est scoped par workflowId
 *  - Cross-référence : si un autre workflow a la même preuve → affiché en bleu "Fourni via X"
 *  - Intègre aussi les valeurs VSME saisies (completionType: 'value')
 *  - Génère des warnings (cohérence période, valeurs nulles, doublons)
 */

import { useMemo } from 'react';
import { useEvidence } from '@/hooks/useEvidence';
import {
  getWorkflowById,
  type RequiredEvidence,
  type WorkflowDefinition,
} from '@/utils/workflowLibrary';
import type { Evidence } from '@/services/dataProvider';

// ── Types ────────────────────────────────────────────────────────────────────

export type EvidenceCompletionStatus = 'provided' | 'value_entered' | 'cross_referenced' | 'missing';

export interface EvidenceStatus {
  evidence: RequiredEvidence;
  /** Statut détaillé */
  status: EvidenceCompletionStatus;
  /** Nombre de preuves directes liées */
  count: number;
  /** true si status !== 'missing' (rétro-compatible) */
  provided: boolean;
  /** Si cross-référencé : d'où ça vient */
  crossRefSource?: { workflowId: string; workflowName: string };
  /** Preuves directes correspondantes */
  directEvidence: Evidence[];
  /** Preuves cross-référencées */
  crossEvidence: Evidence[];
}

export interface ValidationWarning {
  type: 'period_mismatch' | 'zero_value' | 'duplicate_files' | 'cross_ref_only';
  message: string;
  indicatorCodes: string[];
}

export interface WorkflowValidation {
  workflow: WorkflowDefinition | undefined;
  /** Statut de chaque preuve requise */
  evidenceStatuses: EvidenceStatus[];
  /** Nombre total de preuves obligatoires */
  totalMandatory: number;
  /** Nombre de preuves obligatoires fournies (directe + value + cross) */
  providedMandatory: number;
  /** Nombre fournies directement (sans cross-ref) */
  directlyProvided: number;
  /** Nombre via cross-référence */
  crossReferenced: number;
  /** Preuves obligatoires manquantes */
  missingMandatory: RequiredEvidence[];
  /** Nombre total de preuves (mandatory + optional) */
  totalAll: number;
  /** Nombre total fournies */
  providedAll: number;
  /** Alias rétro-compatible */
  totalProvided: number;
  /** Pourcentage de complétion (obligatoires uniquement) */
  completionPct: number;
  /** Pourcentage de complétion (toutes preuves) */
  completionPctAll: number;
  /** true si TOUTES les preuves mandatory sont fournies */
  canValidate: boolean;
  /** Warnings de validation */
  warnings: ValidationWarning[];
  /** Chargement en cours */
  loading: boolean;
}

// ── Helper : matcher une preuve avec un RequiredEvidence ────────────────────

function evidenceMatchesRequired(ev: Evidence, req: RequiredEvidence): boolean {
  // Match par indicatorId direct
  if (req.linkedIndicators.includes(ev.indicatorId ?? '')) return true;
  // Match par linkedIndicators sur l'evidence
  if (ev.linkedIndicators?.some(li => req.linkedIndicators.includes(li))) return true;
  return false;
}

// ── Hook principal ─────────────────────────────────────────────────────────

export function useWorkflowValidation(
  workflowId: string,
  dossierId: string
): WorkflowValidation {
  const workflow = getWorkflowById(workflowId);
  const { evidence, crossWorkflowEvidence, loading } = useEvidence(dossierId, undefined, workflowId);

  const result = useMemo<Omit<WorkflowValidation, 'workflow' | 'loading'>>(() => {
    if (!workflow) {
      return {
        evidenceStatuses: [],
        totalMandatory: 0,
        providedMandatory: 0,
        directlyProvided: 0,
        crossReferenced: 0,
        missingMandatory: [],
        totalAll: 0,
        providedAll: 0,
        totalProvided: 0,
        completionPct: 0,
        completionPctAll: 0,
        canValidate: false,
        warnings: [],
      };
    }

    const warnings: ValidationWarning[] = [];
    const allPeriods = new Set<string>();

    const evidenceStatuses: EvidenceStatus[] = (workflow.requiredEvidence ?? []).map(req => {
      // 1. Preuves directes de CE workflow
      const directEvidence = evidence.filter(ev => evidenceMatchesRequired(ev, req));

      // 2. Preuves cross-workflow (autres workflows)
      const crossEvidence = crossWorkflowEvidence.filter(ev => evidenceMatchesRequired(ev, req));

      // Collecter les périodes pour validation
      [...directEvidence, ...crossEvidence].forEach(ev => {
        if (ev.period) allPeriods.add(ev.period);
      });

      // Déterminer le statut
      let status: EvidenceCompletionStatus = 'missing';
      let crossRefSource: { workflowId: string; workflowName: string } | undefined;

      if (directEvidence.length > 0) {
        // Vérifier si c'est une saisie de valeur ou un fichier
        const hasValueEntry = directEvidence.some(e => e.completionType === 'value');
        status = hasValueEntry && directEvidence.every(e => e.completionType === 'value')
          ? 'value_entered'
          : 'provided';
      } else if (crossEvidence.length > 0) {
        // Cross-référence depuis un autre workflow
        status = 'cross_referenced';
        const sourceWfId = crossEvidence[0].workflowId;
        const sourceWf = sourceWfId ? getWorkflowById(sourceWfId) : undefined;
        crossRefSource = {
          workflowId: sourceWfId ?? 'unknown',
          workflowName: sourceWf?.name ?? 'Autre référentiel',
        };
      }

      // Warning : doublons (>2 fichiers pour le même indicateur)
      if (directEvidence.filter(e => e.completionType !== 'value').length > 2) {
        warnings.push({
          type: 'duplicate_files',
          message: `${req.label} : ${directEvidence.length} fichiers déposés — vérifier si redondants`,
          indicatorCodes: req.linkedIndicators,
        });
      }

      // Warning : cross-ref uniquement (pas de preuve propre)
      if (status === 'cross_referenced' && req.mandatory) {
        warnings.push({
          type: 'cross_ref_only',
          message: `${req.label} — fourni via un autre référentiel, vous pouvez ajouter votre propre justificatif`,
          indicatorCodes: req.linkedIndicators,
        });
      }

      return {
        evidence: req,
        status,
        count: directEvidence.length + crossEvidence.length,
        provided: status !== 'missing',
        crossRefSource,
        directEvidence,
        crossEvidence,
      };
    });

    // Warning global : cohérence périodes
    if (allPeriods.size > 1) {
      warnings.push({
        type: 'period_mismatch',
        message: `Périodes incohérentes détectées : ${[...allPeriods].join(', ')}`,
        indicatorCodes: [],
      });
    }

    // Calculs agrégés
    const mandatoryStatuses = evidenceStatuses.filter(s => s.evidence.mandatory);
    const totalMandatory = mandatoryStatuses.length;
    const providedMandatory = mandatoryStatuses.filter(s => s.provided).length;
    const directlyProvided = mandatoryStatuses.filter(s => s.status === 'provided' || s.status === 'value_entered').length;
    const crossReferenced = mandatoryStatuses.filter(s => s.status === 'cross_referenced').length;
    const missingMandatory = mandatoryStatuses.filter(s => !s.provided).map(s => s.evidence);

    const totalAll = evidenceStatuses.length;
    const providedAll = evidenceStatuses.filter(s => s.provided).length;

    return {
      evidenceStatuses,
      totalMandatory,
      providedMandatory,
      directlyProvided,
      crossReferenced,
      missingMandatory,
      totalAll,
      providedAll,
      totalProvided: providedAll,
      completionPct: totalMandatory > 0 ? Math.round((providedMandatory / totalMandatory) * 100) : 100,
      completionPctAll: totalAll > 0 ? Math.round((providedAll / totalAll) * 100) : 100,
      canValidate: missingMandatory.length === 0,
      warnings,
    };
  }, [workflow, evidence, crossWorkflowEvidence]);

  return { workflow, loading, ...result };
}
