/**
 * ProuvesRequises — Onglet "Preuves" dans DetailDossier
 *
 * Génère automatiquement la liste des pièces justificatives à fournir
 * à partir des codes VSME obligatoires (★ obligatoire: true dans vsme-data.ts).
 *
 * Pour chaque indicateur obligatoire :
 *   - Si valeur saisie + preuve fournie  → ✅ Complet
 *   - Si valeur saisie + preuve manquante → ⚠️ Preuve à déposer
 *   - Si aucune valeur saisie              → ⬜ À renseigner d'abord
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
  Paperclip,
  ShieldCheck,
  Info,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { MODULE_B } from '@/data/vsme-data';
import { useVSMEData } from '@/contexts/VSMEDataContext';
import { useEvidence } from '@/hooks/useEvidence';
import { toast } from 'sonner';

interface ProuvesRequisesProps {
  dossierId: string;
}

// ─── Document attendu pour chaque code obligatoire ────────────────────────────
const DOCS_ATTENDUS: Record<string, string> = {
  // B1 — Informations générales
  'B1.1': 'Bilan social, DSN annuelle ou extrait DADS',
  'B1.2': 'Liasse fiscale ou bilan comptable signé par le CAC',
  'B1.3': 'Bilan comptable — page actif total',
  'B1.4': 'Extrait Kbis ou avis de situation INSEE',
  // B3 — Énergie
  'B3.1': 'Factures énergie : électricité, gaz, fioul (12 mois)',
  'B3.2': 'Factures énergie + attestation contrat énergie verte',
  // B4 — Eau
  'B4.1': 'Factures eau (12 mois) ou relevé de compteurs',
  // B5 — Déchets
  'B5.1': 'Bordereaux de suivi déchets (BSD) ou relevé prestataire',
  'B5.2': 'BSD déchets dangereux (BSDD) ou certificat prestataire',
  // B7 — GES
  'B7.1': 'Factures carburant (12 mois) + registre flotte véhicules',
  'B7.2': 'Factures électricité + attestation contrat ou marché énergie',
  // B8 — Main d'œuvre
  'B8.1': 'Bilan social ou DSN récapitulatif annuel',
  'B8.2': 'Index égalité professionnelle ou bilan social genré',
  'B8.3': 'Index égalité professionnelle (obligatoire ≥ 50 salariés)',
  'B8.6': 'Registre accidents du travail ou déclaration CPAM / DUERP',
  // B10 — Diversité
  'B10.1': 'Organigramme direction + PV de nomination CA ou conseil',
  // B11 — Gouvernance
  'B11.1': 'Code éthique, charte ou procédure anti-corruption',
  'B11.2': 'Registre incidents ou attestation sur l\'honneur zéro incident',
};

// ─── Pilier → couleurs ─────────────────────────────────────────────────────────
const PILIER_STYLE = {
  E:       { bg: 'bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700'  },
  S:       { bg: 'bg-blue-50',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700'    },
  G:       { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700'},
  Général: { bg: 'bg-gray-50',   text: 'text-gray-700',   badge: 'bg-gray-100 text-gray-700'   },
} as const;

// ─── Composant principal ──────────────────────────────────────────────────────
export function ProuvesRequises({ dossierId }: ProuvesRequisesProps) {
  const { getValues }  = useVSMEData();
  const { evidence, loading, uploadEvidence, deleteEvidence, downloadEvidence } = useEvidence(dossierId);

  // Upload dialog
  const [uploadFor, setUploadFor]   = useState<string | null>(null); // code VSME
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🆕 Filtre par Disclosure Requirement (DR / ESRS)
  const [filterDR, setFilterDR] = useState<string>("all");

  const dossierValues = getValues(dossierId);

  // ── Liste des indicateurs obligatoires de Module B (non calculés) ─────────
  const allMandatoryDps = MODULE_B
    .flatMap(s => s.datapoints)
    .filter(dp => dp.obligatoire && !dp.computed);

  // 🆕 Extraire la liste des DR uniques
  const uniqueDRs = [...new Set(allMandatoryDps.map(dp => dp.esrs_equivalent).filter(Boolean))] as string[];

  // 🆕 Filtrer par DR
  const mandatoryDps = filterDR === "all"
    ? allMandatoryDps
    : allMandatoryDps.filter(dp => dp.esrs_equivalent === filterDR);

  // ── Pour chaque code : trouve les preuves associées ────────────────────────
  const proofsByCode = (code: string) =>
    evidence.filter(ev => ev.indicatorId === code || ev.linkedIndicators?.includes(code));

  // ── Statut de chaque indicateur ────────────────────────────────────────────
  const getStatus = (code: string): 'complete' | 'need-proof' | 'no-value' => {
    const val      = dossierValues.values[code];
    const hasValue = val !== undefined && val !== null && String(val).trim() !== '';
    const hasProof = proofsByCode(code).length > 0;
    if (hasValue && hasProof)  return 'complete';
    if (hasValue && !hasProof) return 'need-proof';
    return 'no-value';
  };

  // ── Stats globales ─────────────────────────────────────────────────────────
  const stats = mandatoryDps.reduce(
    (acc, dp) => {
      const s = getStatus(dp.code);
      acc[s]++;
      return acc;
    },
    { complete: 0, 'need-proof': 0, 'no-value': 0 } as Record<string, number>
  );
  const total        = mandatoryDps.length;
  const completePct  = total > 0 ? Math.round((stats.complete / total) * 100) : 0;

  // ── Upload handler ─────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile || !uploadFor) return;
    setUploading(true);
    try {
      const dp  = mandatoryDps.find(d => d.code === uploadFor);
      await uploadEvidence(selectedFile, {
        packId:           dossierId,
        indicatorId:      uploadFor,
        linkedIndicators: [uploadFor],
        category:         (dp?.pilier === 'E' || dp?.pilier === 'S' || dp?.pilier === 'G')
                            ? dp.pilier
                            : undefined,
        period:           String(new Date().getFullYear() - 1),
      });
      toast.success(`Preuve déposée pour ${uploadFor}`, {
        description: selectedFile.name,
      });
      setUploadFor(null);
      setSelectedFile(null);
    } catch (err) {
      toast.error('Erreur lors de l\'upload', { description: String(err) });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (evidenceId: string, code: string) => {
    try {
      await deleteEvidence(evidenceId);
      toast.success(`Preuve supprimée (${code})`);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ── Sections par pilier (avec filtre DR appliqué) ──────────────────────────
  const sections = MODULE_B
    .map(section => ({
      section,
      dps: section.datapoints.filter(dp => {
        if (!dp.obligatoire || dp.computed) return false;
        if (filterDR !== "all" && dp.esrs_equivalent !== filterDR) return false;
        return true;
      }),
    }))
    .filter(({ dps }) => dps.length > 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header + Stats ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: '#0F4C3A15' }}>
              <ShieldCheck className="h-5 w-5" style={{ color: '#0F4C3A' }} />
            </div>
            <div>
              <CardTitle className="text-base">Preuves & Pièces justificatives</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Documents à déposer pour chaque indicateur ESG obligatoire (★)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de progression globale */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{stats.complete} / {total} preuves complètes</span>
                <span className="text-muted-foreground">{completePct}%</span>
              </div>
              <Progress value={completePct} className="h-2" />
            </div>
          </div>

          {/* Chips de statut */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-full px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {stats.complete} complètes
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-full px-3 py-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {stats['need-proof']} preuves manquantes
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
              <Circle className="h-3.5 w-3.5" />
              {stats['no-value']} indicateurs non renseignés
            </div>
          </div>

          {/* 🆕 Filtre par Disclosure Requirement */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filtrer par DR :
            </div>
            <Select value={filterDR} onValueChange={setFilterDR}>
              <SelectTrigger className="w-52 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les DR ({allMandatoryDps.length})</SelectItem>
                {uniqueDRs.sort().map(dr => (
                  <SelectItem key={dr} value={dr}>
                    {dr} ({allMandatoryDps.filter(dp => dp.esrs_equivalent === dr).length} indicateurs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterDR !== "all" && (
              <button
                onClick={() => setFilterDR("all")}
                className="text-xs text-[#059669] hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Info box */}
          <div className="mt-4 flex gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Déposez les documents sources qui justifient les valeurs saisies pour chaque indicateur obligatoire.
              Ces preuves seront utilisées lors de l'audit et de la génération du rapport ESG.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Liste par section VSME ─── */}
      {sections.map(({ section, dps }) => {
        const style = PILIER_STYLE[section.pilier] ?? PILIER_STYLE['Général'];
        return (
          <Card key={section.id} className="overflow-hidden">
            {/* En-tête de section */}
            <CardHeader className={`py-3 px-5 ${style.bg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs font-mono ${style.badge} border-0`}>
                    {section.id}
                  </Badge>
                  <span className={`text-sm font-semibold ${style.text}`}>
                    {section.titre}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {dps.filter(dp => getStatus(dp.code) === 'complete').length}/{dps.length} preuves
                </span>
              </div>
            </CardHeader>

            {/* Lignes d'indicateurs */}
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {dps.map(dp => {
                  const status  = getStatus(dp.code);
                  const proofs  = proofsByCode(dp.code);
                  const docAttendu = DOCS_ATTENDUS[dp.code];
                  const valeur  = dossierValues.values[dp.code];

                  return (
                    <div key={dp.code} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">

                        {/* Icône statut */}
                        <div className="mt-0.5 flex-shrink-0">
                          {status === 'complete'   && <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />}
                          {status === 'need-proof' && <AlertCircle  className="h-4.5 w-4.5 text-amber-500" />}
                          {status === 'no-value'   && <Circle       className="h-4.5 w-4.5 text-gray-300" />}
                        </div>

                        {/* Infos indicateur */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-mono font-bold ${style.text}`}>★ {dp.code}</span>
                            {/* 🆕 DR associé (Disclosure Requirement ESRS) */}
                            {dp.esrs_equivalent && (
                              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                                DR {dp.esrs_equivalent}
                              </span>
                            )}
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {dp.intitule}
                            </span>
                            {dp.unite && (
                              <span className="text-xs text-muted-foreground">({dp.unite})</span>
                            )}
                          </div>

                          {/* Valeur saisie */}
                          {valeur ? (
                            <p className="text-xs text-emerald-700 mt-0.5">
                              Valeur : <span className="font-medium">{String(valeur)}</span>
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 mt-0.5 italic">
                              Indicateur non renseigné — saisissez la valeur d'abord
                            </p>
                          )}

                          {/* Document attendu */}
                          {docAttendu && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                              <Paperclip className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {docAttendu}
                            </p>
                          )}

                          {/* Preuves existantes */}
                          {proofs.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {proofs.map(ev => (
                                <div
                                  key={ev.id}
                                  className="flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1"
                                >
                                  <FileText className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-700 max-w-[160px] truncate">{ev.fileName}</span>
                                  <button
                                    onClick={() => downloadEvidence(ev)}
                                    className="text-emerald-500 hover:text-emerald-700 ml-0.5"
                                    title="Télécharger"
                                  >
                                    <Download className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(ev.id, dp.code)}
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

                        {/* Bouton upload */}
                        <div className="flex-shrink-0 ml-2">
                          {status === 'no-value' ? (
                            <span className="text-xs text-gray-400 italic">—</span>
                          ) : (
                            <Button
                              size="sm"
                              variant={status === 'complete' ? 'outline' : 'default'}
                              className={
                                status === 'complete'
                                  ? 'h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                  : 'h-8 text-xs'
                              }
                              onClick={() => {
                                setUploadFor(dp.code);
                                setSelectedFile(null);
                              }}
                              style={status !== 'complete' ? { background: '#0F4C3A' } : {}}
                            >
                              <Upload className="h-3.5 w-3.5 mr-1.5" />
                              {status === 'complete' ? 'Ajouter' : 'Déposer la preuve'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ── Dialog upload ─── */}
      <Dialog open={!!uploadFor} onOpenChange={open => { if (!open) { setUploadFor(null); setSelectedFile(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" style={{ color: '#059669' }} />
              Déposer une preuve — {uploadFor}
            </DialogTitle>
            <DialogDescription>
              {uploadFor && DOCS_ATTENDUS[uploadFor]
                ? `Document attendu : ${DOCS_ATTENDUS[uploadFor]}`
                : 'Sélectionnez le document justificatif à associer à cet indicateur.'}
            </DialogDescription>
          </DialogHeader>

          {/* Zone de dépôt fichier */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={e => {
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
              onChange={e => {
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
                <p className="text-sm font-medium text-gray-600">Cliquez ou glissez le fichier ici</p>
                <p className="text-xs">PDF, Excel, Word, images — max 10 Mo</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadFor(null); setSelectedFile(null); }}>
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

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Chargement des preuves...
        </div>
      )}
    </div>
  );
}
