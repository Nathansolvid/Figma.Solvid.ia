/**
 * WorkflowEvidenceChecklist — Checklist de preuves obligatoires par workflow
 *
 * 🆕 Phase 10 : Indépendance totale entre workflows
 *   - ✅ Fourni directement  → fichier uploadé pour CE workflow
 *   - ✅ Valeur saisie       → indicateur complété via saisie
 *   - 🔗 Cross-référence     → fourni via un AUTRE workflow (bleu)
 *   - ⚠️ Manquant           → preuve obligatoire non déposée
 *   - ⬜ Optionnel           → preuve non obligatoire
 *
 * Permet l'upload direct, la saisie de valeur, le téléchargement et la suppression.
 * Affiche les cross-références clairement.
 * Le bouton "Valider" est grisé tant que preuves mandatory manquantes.
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Circle,
  FileText,
  Download,
  Trash2,
  ShieldCheck,
  Info,
  CheckCheck,
  Paperclip,
  Link2,
  PenLine,
  AlertTriangle,
} from 'lucide-react';
import { useEvidence } from '@/hooks/useEvidence';
import {
  useWorkflowValidation,
  type EvidenceStatus,
  type EvidenceCompletionStatus,
} from '@/hooks/useWorkflowValidation';
import type { RequiredEvidence } from '@/utils/workflowLibrary';
import type { Evidence } from '@/services/dataProvider';
import { toast } from 'sonner';

// ─── Props ────────────────────────────────────────────────────────────────────
interface WorkflowEvidenceChecklistProps {
  workflowId: string;
  dossierId: string;
  onValidate?: () => void;
}

// ─── Styles par catégorie ─────────────────────────────────────────────────────
const CAT_STYLE = {
  E: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-700', label: 'Environnement' },
  S: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', label: 'Social' },
  G: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', label: 'Gouvernance' },
} as const;

// ─── Composant principal ──────────────────────────────────────────────────────
export function WorkflowEvidenceChecklist({
  workflowId,
  dossierId,
  onValidate,
}: WorkflowEvidenceChecklistProps) {
  const validation = useWorkflowValidation(workflowId, dossierId);
  const {
    workflow,
    evidenceStatuses,
    totalMandatory,
    providedMandatory,
    directlyProvided,
    crossReferenced,
    missingMandatory,
    totalAll,
    completionPct,
    canValidate,
    warnings,
    loading: validationLoading,
  } = validation;

  const { uploadEvidence, createValueEvidence, deleteEvidence, downloadEvidence, loading: evidenceLoading } =
    useEvidence(dossierId, undefined, workflowId);

  // Upload state
  const [uploadFor, setUploadFor] = useState<RequiredEvidence | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Value entry state
  const [valueEntryFor, setValueEntryFor] = useState<RequiredEvidence | null>(null);
  const [valueInput, setValueInput] = useState('');
  const [justificationInput, setJustificationInput] = useState('');
  const [savingValue, setSavingValue] = useState(false);

  const loading = validationLoading || evidenceLoading;

  // ── Upload handler ────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile || !uploadFor) return;
    setUploading(true);
    try {
      const primaryIndicator = uploadFor.linkedIndicators[0] ?? uploadFor.id;
      await uploadEvidence(selectedFile, {
        packId: dossierId,
        workflowId: workflowId, // 🆕 scope au workflow
        indicatorId: primaryIndicator,
        linkedIndicators: uploadFor.linkedIndicators,
        category: uploadFor.category,
        period: String(new Date().getFullYear() - 1),
      });
      toast.success(`Preuve déposée : ${uploadFor.label}`, {
        description: selectedFile.name,
      });
      setUploadFor(null);
      setSelectedFile(null);
    } catch (err) {
      toast.error("Erreur lors de l'upload", { description: String(err) });
    } finally {
      setUploading(false);
    }
  };

  // ── Value entry handler ───────────────────────────────────────────────────
  const handleSaveValue = async () => {
    if (!valueEntryFor || !valueInput.trim()) return;
    setSavingValue(true);
    try {
      const primaryIndicator = valueEntryFor.linkedIndicators[0] ?? valueEntryFor.id;
      await createValueEvidence({
        packId: dossierId,
        workflowId: workflowId,
        indicatorId: primaryIndicator,
        linkedIndicators: valueEntryFor.linkedIndicators,
        category: valueEntryFor.category,
        period: String(new Date().getFullYear() - 1),
        justification: justificationInput.trim() || undefined,
      });
      toast.success(`Valeur enregistrée : ${valueEntryFor.label}`, {
        description: `Indicateur ${primaryIndicator}`,
      });
      setValueEntryFor(null);
      setValueInput('');
      setJustificationInput('');
    } catch (err) {
      toast.error('Erreur lors de la saisie', { description: String(err) });
    } finally {
      setSavingValue(false);
    }
  };

  const handleDelete = async (evidenceId: string, label: string) => {
    try {
      await deleteEvidence(evidenceId);
      toast.success(`Preuve supprimée (${label})`);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ── Group by category ─────────────────────────────────────────────────────
  const groupedByCategory = (['E', 'S', 'G'] as const)
    .map(cat => ({
      category: cat,
      items: evidenceStatuses.filter(s => s.evidence.category === cat),
    }))
    .filter(g => g.items.length > 0);

  if (!workflow) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Workflow introuvable.
      </div>
    );
  }

  if ((workflow.requiredEvidence ?? []).length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Ce workflow n'a pas de preuves obligatoires définies.
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header + Stats ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: '#0F4C3A15' }}>
              <ShieldCheck className="h-5 w-5" style={{ color: '#0F4C3A' }} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">Preuves & Justificatifs obligatoires</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {workflow.icon} {workflow.name}
              </p>
            </div>
            {canValidate && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
                <CheckCheck className="h-3.5 w-3.5" />
                Complet
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">
                  {providedMandatory} / {totalMandatory} preuves obligatoires
                </span>
                <span className="text-muted-foreground">{completionPct}%</span>
              </div>
              <Progress value={completionPct} className="h-2" />
            </div>
          </div>

          {/* Status chips */}
          <div className="flex gap-3 flex-wrap">
            {directlyProvided > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-full px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {directlyProvided} fourni{directlyProvided > 1 ? 'es' : 'e'}
              </div>
            )}
            {crossReferenced > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 rounded-full px-3 py-1">
                <Link2 className="h-3.5 w-3.5" />
                {crossReferenced} partagée{crossReferenced > 1 ? 's' : ''}
              </div>
            )}
            {missingMandatory.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-full px-3 py-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {missingMandatory.length} manquante{missingMandatory.length > 1 ? 's' : ''}
              </div>
            )}
            {totalAll - totalMandatory > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                <Circle className="h-3.5 w-3.5" />
                {totalAll - totalMandatory} optionnelle{(totalAll - totalMandatory) > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 mb-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {warnings.length} point{warnings.length > 1 ? 's' : ''} d'attention
              </div>
              <ul className="space-y-1">
                {warnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                    <span className="mt-0.5">•</span>
                    <span>{w.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Info box */}
          <div className="mt-4 flex gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Déposez les pièces justificatives requises pour ce workflow.
              Les preuves marquées ★ sont obligatoires — le workflow ne pourra pas être validé sans elles.
              {crossReferenced > 0 && (
                <span className="block mt-1">
                  🔗 Les preuves partagées proviennent d'un autre référentiel du même dossier.
                </span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Liste par catégorie ESG ─── */}
      {groupedByCategory.map(({ category, items }) => {
        const style = CAT_STYLE[category];
        const provided = items.filter(s => s.provided).length;
        return (
          <Card key={category} className="overflow-hidden">
            {/* Section header */}
            <CardHeader className={`py-3 px-5 ${style.bg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${style.text}`}>
                  {style.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {provided}/{items.length} preuves
                </span>
              </div>
            </CardHeader>

            {/* Evidence rows */}
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {items.map((status) => (
                  <EvidenceRow
                    key={status.evidence.id}
                    status={status}
                    style={style}
                    onUpload={() => {
                      setUploadFor(status.evidence);
                      setSelectedFile(null);
                    }}
                    onValueEntry={() => {
                      setValueEntryFor(status.evidence);
                      setValueInput('');
                      setJustificationInput('');
                    }}
                    onDownload={downloadEvidence}
                    onDelete={(evId) => handleDelete(evId, status.evidence.label)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ── Bouton valider ─── */}
      <div className="flex justify-center pt-2">
        <Button
          size="lg"
          className="gap-2 font-semibold px-8"
          style={{
            background: canValidate ? '#0F4C3A' : '#d1d5db',
            color: canValidate ? 'white' : '#6b7280',
          }}
          disabled={!canValidate}
          onClick={() => {
            if (canValidate && onValidate) {
              onValidate();
              toast.success('Workflow validé !', {
                description: `Toutes les ${totalMandatory} preuves obligatoires sont fournies.`,
              });
            }
          }}
        >
          <CheckCheck className="h-5 w-5" />
          {canValidate
            ? 'Valider le workflow'
            : `${missingMandatory.length} preuve${missingMandatory.length > 1 ? 's' : ''} manquante${missingMandatory.length > 1 ? 's' : ''}`}
        </Button>
      </div>

      {/* ── Dialog upload fichier ─── */}
      <Dialog
        open={!!uploadFor}
        onOpenChange={(open) => {
          if (!open) {
            setUploadFor(null);
            setSelectedFile(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" style={{ color: '#059669' }} />
              Déposer une preuve
            </DialogTitle>
            <DialogDescription>
              {uploadFor?.label}
              {uploadFor?.description && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  {uploadFor.description}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) setSelectedFile(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
              }}
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="font-medium text-sm text-gray-800">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">
                  Cliquez ou glissez le fichier ici
                </p>
                <p className="text-xs">
                  {uploadFor?.fileTypes?.length
                    ? `Formats acceptés : ${uploadFor.fileTypes.join(', ').toUpperCase()}`
                    : 'PDF, Excel, Word, images — max 10 Mo'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadFor(null);
                setSelectedFile(null);
              }}
            >
              Annuler
            </Button>
            <Button
              disabled={!selectedFile || uploading}
              onClick={handleUpload}
              style={{ background: '#0F4C3A' }}
            >
              {uploading ? 'Upload en cours...' : 'Valider et déposer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog saisie valeur ─── */}
      <Dialog
        open={!!valueEntryFor}
        onOpenChange={(open) => {
          if (!open) {
            setValueEntryFor(null);
            setValueInput('');
            setJustificationInput('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-4 w-4" style={{ color: '#2563eb' }} />
              Saisir une valeur
            </DialogTitle>
            <DialogDescription>
              {valueEntryFor?.label}
              {valueEntryFor?.linkedIndicators && (
                <span className="block mt-1">
                  <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                    {valueEntryFor.linkedIndicators.join(', ')}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Champ valeur */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Valeur / Donnée
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={3}
                placeholder="Saisissez la valeur ou la donnée..."
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
              />
            </div>

            {/* Champ justification */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Justification <span className="text-muted-foreground font-normal">(optionnel)</span>
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={2}
                placeholder="Source ou explication de la donnée..."
                value={justificationInput}
                onChange={(e) => setJustificationInput(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setValueEntryFor(null);
                setValueInput('');
                setJustificationInput('');
              }}
            >
              Annuler
            </Button>
            <Button
              disabled={!valueInput.trim() || savingValue}
              onClick={handleSaveValue}
              style={{ background: '#2563eb' }}
            >
              {savingValue ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Chargement des preuves...
        </div>
      )}
    </div>
  );
}

// ─── Sous-composant : ligne de preuve ────────────────────────────────────────

interface EvidenceRowProps {
  status: EvidenceStatus;
  style: { text: string };
  onUpload: () => void;
  onValueEntry: () => void;
  onDownload: (ev: Evidence) => void;
  onDelete: (evidenceId: string) => void;
}

function EvidenceRow({ status, style, onUpload, onValueEntry, onDownload, onDelete }: EvidenceRowProps) {
  const { evidence: req, provided, status: completionStatus, crossRefSource, directEvidence } = status;
  const isMandatory = req.mandatory;

  // Icône et couleur selon le statut
  const { icon, statusLabel, statusBg, statusText } = getStatusVisuals(completionStatus, isMandatory, crossRefSource);

  return (
    <div className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 flex-shrink-0">{icon}</div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isMandatory && (
              <span className={`text-xs font-bold ${style.text}`}>★</span>
            )}
            <span className="text-sm font-medium text-gray-800">{req.label}</span>
            {!isMandatory && (
              <Badge variant="outline" className="text-[10px] py-0">optionnel</Badge>
            )}
            {/* Status badge */}
            {completionStatus !== 'missing' && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBg} ${statusText}`}>
                {statusLabel}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
            <Paperclip className="h-3 w-3 mt-0.5 flex-shrink-0" />
            {req.description}
          </p>

          {/* Linked indicators */}
          {req.linkedIndicators.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {req.linkedIndicators.map(code => (
                <Badge
                  key={code}
                  variant="outline"
                  className="text-[10px] py-0 font-mono"
                >
                  {code}
                </Badge>
              ))}
            </div>
          )}

          {/* Cross-reference banner */}
          {completionStatus === 'cross_referenced' && crossRefSource && (
            <div className="mt-2 flex items-center gap-2 text-xs bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5">
              <Link2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
              <span className="text-blue-700">
                Fourni via <strong>{crossRefSource.workflowName}</strong>
              </span>
            </div>
          )}

          {/* Direct evidence files */}
          {directEvidence.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {directEvidence.map((ev) => (
                <div
                  key={ev.id}
                  className={`flex items-center gap-1.5 text-xs rounded-md px-2 py-1 ${
                    ev.completionType === 'value'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  {ev.completionType === 'value' ? (
                    <PenLine className="h-3 w-3 text-blue-600" />
                  ) : (
                    <FileText className="h-3 w-3 text-emerald-600" />
                  )}
                  <span className={`max-w-[160px] truncate ${
                    ev.completionType === 'value' ? 'text-blue-700' : 'text-emerald-700'
                  }`}>
                    {ev.completionType === 'value'
                      ? `Valeur saisie${ev.justification ? ` — ${ev.justification.slice(0, 30)}` : ''}`
                      : ev.fileName}
                  </span>
                  {ev.completionType !== 'value' && (
                    <button
                      onClick={() => onDownload(ev)}
                      className="text-emerald-500 hover:text-emerald-700 ml-0.5"
                      title="Télécharger"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(ev.id)}
                    className="text-red-400 hover:text-red-600"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 ml-2 flex flex-col gap-1.5">
          {/* Bouton Déposer fichier */}
          <Button
            size="sm"
            variant={provided ? 'outline' : 'default'}
            className={
              provided
                ? 'h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                : 'h-8 text-xs'
            }
            onClick={onUpload}
            style={!provided && isMandatory ? { background: '#0F4C3A' } : {}}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {provided ? 'Ajouter' : 'Déposer'}
          </Button>

          {/* Bouton Saisir valeur — affiché si manquant ou pour compléter */}
          {(completionStatus === 'missing' || completionStatus === 'cross_referenced') && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={onValueEntry}
            >
              <PenLine className="h-3.5 w-3.5 mr-1.5" />
              Saisir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper : visuels par statut ──────────────────────────────────────────────

function getStatusVisuals(
  status: EvidenceCompletionStatus,
  isMandatory: boolean,
  crossRefSource?: { workflowId: string; workflowName: string },
) {
  switch (status) {
    case 'provided':
      return {
        icon: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />,
        statusLabel: 'Fichier fourni',
        statusBg: 'bg-emerald-50',
        statusText: 'text-emerald-700',
      };
    case 'value_entered':
      return {
        icon: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />,
        statusLabel: 'Valeur saisie',
        statusBg: 'bg-blue-50',
        statusText: 'text-blue-700',
      };
    case 'cross_referenced':
      return {
        icon: <Link2 className="h-4.5 w-4.5 text-blue-500" />,
        statusLabel: `Via ${crossRefSource?.workflowName ?? 'autre'}`,
        statusBg: 'bg-blue-50',
        statusText: 'text-blue-700',
      };
    case 'missing':
    default:
      return {
        icon: isMandatory
          ? <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
          : <Circle className="h-4.5 w-4.5 text-gray-300" />,
        statusLabel: '',
        statusBg: '',
        statusText: '',
      };
  }
}
