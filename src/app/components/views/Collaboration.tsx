/**
 * Espace Consultant — Notes de mission, intervenants, synthèse
 * Données réelles persistées en IndexedDB (store: mission_notes)
 */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  MessageSquare, Users, TrendingUp, Plus, Trash2,
  User, Briefcase, Building2, Calendar, Clock,
  Flag, AlertTriangle, CheckCircle2, Lightbulb, RefreshCw,
  Leaf, Heart, Shield,
} from "lucide-react";
import { useDossiers } from "@/contexts/DossierContext";
import { useUser } from "@/contexts/UserContext";
import { useVSMEData } from "@/contexts/VSMEDataContext";
import {
  idbGetNotesByDossier, idbPutNote, idbDeleteNote,
  type MissionNote,
} from "@/services/idbService";

// ─── Types ────────────────────────────────────────────────────────────────────
type PostureType = "conseil" | "pre-audit" | "audit-externe";

interface CollaborationProps {
  posture: PostureType;
  parcours: "csrd-obligatoire" | "esg-structure";
  dossierId: string;
}

// ─── Config catégories ────────────────────────────────────────────────────────
const CATEGORIES: Record<MissionNote['category'], { label: string; color: string; bg: string; icon: React.ElementType }> = {
  general:     { label: "Note générale",      color: "#6b7280", bg: "#f3f4f6", icon: MessageSquare },
  relance:     { label: "Relance client",     color: "#d97706", bg: "#fffbeb", icon: RefreshCw },
  blocage:     { label: "Point de blocage",   color: "#dc2626", bg: "#fef2f2", icon: AlertTriangle },
  decision:    { label: "Décision",           color: "#2d7a55", bg: "#f0fdf4", icon: CheckCircle2 },
  observation: { label: "Observation",        color: "#1a5f8a", bg: "#eff6ff", icon: Lightbulb },
};

const PILIER_COLOR = { E: "#2d7a55", S: "#1a5f8a", G: "#6c3483" } as const;

// ─── Composant principal ──────────────────────────────────────────────────────
export function Collaboration({ posture, dossierId }: CollaborationProps) {
  const { getDossier } = useDossiers();
  const { currentUser } = useUser();
  const { getStats, getStatsByPilier, loadDossier } = useVSMEData();

  const [notes, setNotes]           = useState<MissionNote[]>([]);
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState<MissionNote['category']>("general");
  const [saving, setSaving]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const dossier = getDossier(dossierId);

  // Charger notes + données VSME
  useEffect(() => {
    loadDossier(dossierId);
    idbGetNotesByDossier(dossierId).then(setNotes);
  }, [dossierId]); // eslint-disable-line react-hooks/exhaustive-deps

  const vsmeStats   = getStats(dossierId, "B");
  const pilierStats = getStatsByPilier(dossierId);

  // ── Ajouter une note ────────────────────────────────────────────────────────
  const handleAddNote = useCallback(async () => {
    if (!noteContent.trim()) return;
    setSaving(true);
    const note: MissionNote = {
      id: `${dossierId}::note::${Date.now()}`,
      dossierId,
      content: noteContent.trim(),
      author: currentUser?.name ?? "Consultant",
      category: noteCategory,
      createdAt: new Date().toISOString(),
    };
    await idbPutNote(note);
    const updated = await idbGetNotesByDossier(dossierId);
    setNotes(updated);
    setNoteContent("");
    setSaving(false);
  }, [dossierId, noteContent, noteCategory, currentUser]);

  // ── Supprimer une note ──────────────────────────────────────────────────────
  const handleDeleteNote = useCallback(async (id: string) => {
    await idbDeleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    setConfirmDelete(null);
  }, []);

  if (!dossier) return null;

  const missionDays = dossier.startDate
    ? Math.ceil((Date.now() - new Date(dossier.startDate).getTime()) / 86400000)
    : null;

  return (
    <div className="space-y-6">
      {/* ── En-tête ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Espace Consultant</h2>
          <p className="text-sm text-muted-foreground">
            Notes de mission, suivi des intervenants et synthèse de l'avancement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className="text-white"
            style={{ background: posture === "conseil" ? "#059669" : posture === "pre-audit" ? "#0F4C3A" : "#dc2626" }}
          >
            {posture === "conseil" ? "Mode Conseil" : posture === "pre-audit" ? "Pré-Audit" : "Audit Externe"}
          </Badge>
        </div>
      </div>

      {/* ── 3 KPI cards ── */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Avancement</p>
              <TrendingUp className="h-4 w-4 text-[#2d7a55]" />
            </div>
            <p className="text-3xl font-bold" style={{ color: vsmeStats.pct >= 50 ? "#2d7a55" : "#9ca3af" }}>
              {vsmeStats.pct}%
            </p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#2d7a55] transition-all" style={{ width: `${vsmeStats.pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{vsmeStats.filled}/{vsmeStats.total} indicateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Notes de mission</p>
              <MessageSquare className="h-4 w-4 text-[#1a5f8a]" />
            </div>
            <p className="text-3xl font-bold text-foreground">{notes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {notes.length === 0 ? "Aucune note" : `Dernière : ${new Date(notes[0]?.createdAt).toLocaleDateString("fr-FR")}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Durée mission</p>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {missionDays !== null ? `J+${missionDays}` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {dossier.startDate ? `Démarré le ${new Date(dossier.startDate).toLocaleDateString("fr-FR")}` : "Date non définie"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notes">
            <MessageSquare className="h-4 w-4 mr-2" />
            Notes de mission
            {notes.length > 0 && (
              <span className="ml-1.5 bg-[#0F4C3A] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {notes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="intervenants">
            <Users className="h-4 w-4 mr-2" />
            Intervenants
          </TabsTrigger>
          <TabsTrigger value="synthese">
            <TrendingUp className="h-4 w-4 mr-2" />
            Synthèse ESG
          </TabsTrigger>
        </TabsList>

        {/* ══ TAB NOTES ══════════════════════════════════════════════════════════ */}
        <TabsContent value="notes" className="space-y-4">
          {/* Formulaire d'ajout */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#0F4C3A]" />
                Nouvelle note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Sélecteur de catégorie */}
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(CATEGORIES) as [MissionNote['category'], typeof CATEGORIES[keyof typeof CATEGORIES]][]).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const active = noteCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setNoteCategory(key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                      style={{
                        background: active ? cfg.bg : "white",
                        color: active ? cfg.color : "#6b7280",
                        borderColor: active ? cfg.color : "#e5e7eb",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              {/* Textarea */}
              <textarea
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Saisissez votre note de mission…"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleAddNote(); }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">⌘ + Entrée pour enregistrer</p>
                <Button
                  onClick={handleAddNote}
                  disabled={!noteContent.trim() || saving}
                  className="bg-[#0F4C3A] hover:bg-[#0A3B2E] text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Ajouter la note
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des notes */}
          {notes.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-muted-foreground">Aucune note pour cette mission</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ajoutez des notes, relances, décisions ou points de blocage ci-dessus.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notes.map(note => {
                const cfg = CATEGORIES[note.category];
                const Icon = cfg.icon;
                return (
                  <Card key={note.id} className="border" style={{ borderLeftWidth: 3, borderLeftColor: cfg.color }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className="p-1.5 rounded-md flex-shrink-0 mt-0.5"
                            style={{ background: cfg.bg }}
                          >
                            <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: cfg.bg, color: cfg.color }}
                              >
                                {cfg.label}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {note.author}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                                  day: "2-digit", month: "short", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                          </div>
                        </div>
                        {/* Bouton supprimer */}
                        {confirmDelete === note.id ? (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              className="text-xs text-red-600 font-semibold px-2 py-1 rounded hover:bg-red-50"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              Confirmer
                            </button>
                            <button
                              className="text-xs text-muted-foreground px-2 py-1 rounded hover:bg-gray-50"
                              onClick={() => setConfirmDelete(null)}
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0 mt-1"
                            onClick={() => setConfirmDelete(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ══ TAB INTERVENANTS ══════════════════════════════════════════════════ */}
        <TabsContent value="intervenants" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Côté cabinet */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0F4C3A]" />
                  Cabinet / Prestataire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F0FDF4]">
                  <div className="w-9 h-9 rounded-full bg-[#0F4C3A] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {dossier.leadConsultant?.charAt(0) ?? "C"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{dossier.leadConsultant || "Non défini"}</p>
                    <p className="text-xs text-muted-foreground">Consultant référent</p>
                  </div>
                  <Badge className="ml-auto bg-[#059669] text-white text-xs">Consultant</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <div className="w-9 h-9 rounded-full bg-slate-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {dossier.providerOrg?.charAt(0) ?? "S"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{dossier.providerOrg || "Non défini"}</p>
                    <p className="text-xs text-muted-foreground">Organisation prestataire</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Côté client */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#1a5f8a]" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <div className="w-9 h-9 rounded-full bg-[#1a5f8a] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {dossier.clientOrg?.charAt(0) ?? "E"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{dossier.clientOrg || dossier.name}</p>
                    <p className="text-xs text-muted-foreground">Entreprise cliente</p>
                  </div>
                  <Badge className="ml-auto bg-[#1a5f8a] text-white text-xs">Client</Badge>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-muted-foreground">Contact client non renseigné</p>
                  <p className="text-xs text-muted-foreground mt-0.5">À compléter dans la fiche dossier</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Détails de la mission */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Flag className="h-4 w-4 text-[#6c3483]" />
                Détails de la mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Type de mission", value: dossier.missionType, icon: Briefcase },
                  { label: "Exercice fiscal", value: dossier.fiscalYear, icon: Calendar },
                  { label: "Parcours",
                    value: dossier.pathwayType === "CSRD_Mandatory" ? "CSRD Obligatoire" : "ESG Volontaire",
                    icon: Flag },
                  { label: "Statut", value: dossier.status === "active" ? "En cours" : dossier.status === "draft" ? "Brouillon" : "Complété", icon: CheckCircle2 },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                      <p className="font-semibold text-sm">{item.value}</p>
                    </div>
                  );
                })}
              </div>
              {dossier.startDate && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Démarré le <strong className="text-foreground">{new Date(dossier.startDate).toLocaleDateString("fr-FR")}</strong></span>
                    </div>
                    {dossier.endDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Fin prévue le <strong className="text-foreground">{new Date(dossier.endDate).toLocaleDateString("fr-FR")}</strong></span>
                      </div>
                    )}
                    {missionDays !== null && (
                      <div className="flex items-center gap-2 text-[#2d7a55] font-medium">
                        <Clock className="h-4 w-4" />
                        <span>J+{missionDays} jour{missionDays > 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ TAB SYNTHÈSE ESG ══════════════════════════════════════════════════ */}
        <TabsContent value="synthese" className="space-y-4">
          {/* Avancement global */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0F4C3A]" />
                Avancement global
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vsmeStats.total === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">Aucune donnée saisie pour ce dossier</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Barre globale */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium">Progression totale</span>
                      <span className="text-sm font-bold" style={{ color: vsmeStats.pct >= 80 ? "#2d7a55" : vsmeStats.pct >= 40 ? "#f59e0b" : "#9ca3af" }}>
                        {vsmeStats.pct}% — {vsmeStats.filled}/{vsmeStats.total} données
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${vsmeStats.pct}%`,
                          background: vsmeStats.pct >= 80 ? "#2d7a55" : vsmeStats.pct >= 40 ? "#f59e0b" : "#9ca3af",
                        }}
                      />
                    </div>
                  </div>

                  {/* Piliers E / S / G */}
                  <div className="grid grid-cols-3 gap-3">
                    {(["E", "S", "G"] as const).map(p => {
                      const s = pilierStats[p];
                      const labels = { E: "Environnement", S: "Social", G: "Gouvernance" };
                      const icons = { E: Leaf, S: Heart, G: Shield };
                      const Icon = icons[p];
                      return (
                        <div key={p} className="p-4 rounded-xl border" style={{ borderColor: PILIER_COLOR[p] + "30", background: PILIER_COLOR[p] + "08" }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4" style={{ color: PILIER_COLOR[p] }} />
                            <span className="text-xs font-semibold" style={{ color: PILIER_COLOR[p] }}>{labels[p]}</span>
                          </div>
                          <p className="text-2xl font-bold mb-1" style={{ color: PILIER_COLOR[p] }}>{s.pct}%</p>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: PILIER_COLOR[p] }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{s.filled}/{s.total}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Notes par catégorie */}
                  {notes.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Répartition des notes</p>
                      <div className="flex flex-wrap gap-2">
                        {(Object.entries(CATEGORIES) as [MissionNote['category'], typeof CATEGORIES[keyof typeof CATEGORIES]][]).map(([key, cfg]) => {
                          const count = notes.filter(n => n.category === key).length;
                          if (count === 0) return null;
                          const Icon = cfg.icon;
                          return (
                            <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: cfg.bg, color: cfg.color }}>
                              <Icon className="h-3 w-3" />
                              <span className="font-medium">{cfg.label}</span>
                              <span className="font-bold">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points d'attention si des blocages existent */}
          {notes.filter(n => n.category === "blocage").length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Points de blocage actifs ({notes.filter(n => n.category === "blocage").length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {notes.filter(n => n.category === "blocage").map(note => (
                  <div key={note.id} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800">{note.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Décisions prises */}
          {notes.filter(n => n.category === "decision").length > 0 && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Décisions prises ({notes.filter(n => n.category === "decision").length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {notes.filter(n => n.category === "decision").map(note => (
                  <div key={note.id} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-800">{note.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
