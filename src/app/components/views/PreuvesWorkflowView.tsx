/**
 * PreuvesWorkflowView — Vue dédiée aux preuves obligatoires par workflow
 *
 * Chaque workflow du dossier est affiché comme un onglet indépendant.
 * L'utilisateur peut naviguer entre les workflows pour voir les preuves de chacun.
 */

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { getWorkflowById, getWorkflowEvidenceCount } from "@/utils/workflowLibrary";
import type { WorkflowDefinition } from "@/utils/workflowLibrary";
import { WorkflowEvidenceChecklist } from "./WorkflowEvidenceChecklist";
import { useWorkflowValidation } from "@/hooks/useWorkflowValidation";

// ── Badge couleurs par workflow ─────────────────────────────────────────────
const WORKFLOW_COLORS: Record<string, string> = {
  'vsme': '#2D9D5F',
  'bilan-carbone-complet': '#E07B39',
  'diagnostic-energie': '#2980B9',
  'gestion-dechets': '#6c3483',
  'diagnostic-social': '#1a5f8a',
  'sante-securite-travail': '#f59e0b',
  'diagnostic-gouvernance': '#7c3aed',
  'diagnostic-esg-pme': '#2d7a55',
  'csrd-e1-climat': '#dc2626',
  'csrd-s1-personnel': '#dc2626',
  'questionnaire-banque': '#b45309',
};

// ── Mini progress pill pour les onglets ──────────────────────────────────────
function WorkflowTabPill({
  workflow,
  dossierId,
  isActive,
  onClick,
}: {
  workflow: WorkflowDefinition;
  dossierId: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const validation = useWorkflowValidation(workflow.id, dossierId);
  const color = WORKFLOW_COLORS[workflow.id] ?? '#64748b';
  const evidenceCount = getWorkflowEvidenceCount(workflow);
  const pct = validation.completionPct;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-all whitespace-nowrap flex-shrink-0"
      style={{
        background: isActive ? `${color}15` : 'white',
        border: isActive ? `2px solid ${color}` : '2px solid #e2e8f0',
        boxShadow: isActive ? `0 2px 8px ${color}20` : 'none',
      }}
    >
      {/* Badge couleur workflow */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0"
        style={{ background: color }}
      >
        {workflow.name.slice(0, 2).toUpperCase()}
      </div>

      <div className="min-w-0">
        <p
          className="text-[12px] font-semibold truncate max-w-[140px]"
          style={{ color: isActive ? color : '#374151' }}
        >
          {workflow.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Mini barre de progression */}
          <div
            className="h-1.5 rounded-full flex-1"
            style={{ background: '#e5e7eb', width: '60px' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: pct >= 100 ? '#22c55e' : color,
              }}
            />
          </div>
          <span
            className="text-[10px] font-mono"
            style={{ color: pct >= 100 ? '#16a34a' : '#9ca3af' }}
          >
            {validation.totalProvided}/{evidenceCount.mandatory}
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Composant principal ─────────────────────────────────────────────────────
interface PreuvesWorkflowViewProps {
  dossierId: string;
  dossierName: string;
  selectedWorkflows: string[];
  onSelectDossier: () => void;
}

export function PreuvesWorkflowView({
  dossierId,
  dossierName,
  selectedWorkflows,
  onSelectDossier: _onSelectDossier,
}: PreuvesWorkflowViewProps) {
  // Récupérer les workflows avec preuves
  const workflows = selectedWorkflows
    .map(id => getWorkflowById(id))
    .filter((wf): wf is WorkflowDefinition => !!wf && (wf.requiredEvidence?.length ?? 0) > 0);

  // Onglet actif — par défaut le premier workflow
  const [activeTab, setActiveTab] = useState<string>(workflows[0]?.id ?? '');

  const activeWorkflow = workflows.find(w => w.id === activeTab) ?? workflows[0];

  if (workflows.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0A3B2E' }}>
            Preuves obligatoires
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Checklist des justificatifs à fournir pour valider vos workflows — {dossierName}
          </p>
        </div>
        <div
          className="rounded-xl border-2 border-dashed p-8 text-center"
          style={{ borderColor: '#e2e8f0' }}
        >
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3" style={{ color: '#d1d5db' }} />
          <p className="font-medium" style={{ color: '#6b7280' }}>
            Aucun workflow avec preuves requises
          </p>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
            Ajoutez un référentiel à votre dossier pour voir les preuves obligatoires
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#0A3B2E' }}>
          Preuves obligatoires
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Checklist des justificatifs à fournir pour valider vos workflows — {dossierName}
        </p>
      </div>

      {/* Onglets workflows — scrollable horizontalement si >2 workflows */}
      {workflows.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {workflows.map(wf => (
            <WorkflowTabPill
              key={wf.id}
              workflow={wf}
              dossierId={dossierId}
              isActive={(activeWorkflow?.id ?? '') === wf.id}
              onClick={() => setActiveTab(wf.id)}
            />
          ))}
        </div>
      )}

      {/* Checklist du workflow actif */}
      {activeWorkflow && (
        <WorkflowEvidenceChecklist
          key={activeWorkflow.id}
          workflowId={activeWorkflow.id}
          dossierId={dossierId}
        />
      )}
    </div>
  );
}
