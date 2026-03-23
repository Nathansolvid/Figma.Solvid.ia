/**
 * GuideAide — Onglet Guide & Aide
 * Glossaire ESG, parcours guidé, légende des statuts, FAQ
 */
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
  Lightbulb,
  HelpCircle,
  FolderOpen,
  PenLine,
  FileSpreadsheet,
  Upload,
  Sparkles,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import {
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  searchGlossary,
  type GlossaryEntry,
} from "@/data/glossary";

// ─── Props ────────────────────────────────────────────────────────────────────
interface GuideAideProps {
  onNavigate?: (view: string) => void;
  defaultTab?: string;
}

// ─── Composant terme du glossaire ─────────────────────────────────────────────
function GlossaryCard({ entry, defaultOpen = false }: { entry: GlossaryEntry; defaultOpen?: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const cat = GLOSSARY_CATEGORIES[entry.category];

  return (
    <div
      className="border rounded-xl overflow-hidden transition-all"
      style={{ borderColor: expanded ? cat.color + '40' : '#e5e7eb' }}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-semibold text-sm" style={{ color: '#1a2e24' }}>
            {entry.term}
          </span>
          {entry.acronym && entry.acronym !== entry.term && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#f1f5f9', color: '#64748b' }}>
              {entry.acronym}
            </span>
          )}
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: cat.bg, color: cat.color }}
          >
            {cat.label}
          </span>
        </div>
        <ChevronRight
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
          style={{ color: '#9ca3af', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Résumé toujours visible */}
      <div className="px-4 pb-2 -mt-1">
        <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
          {entry.shortDef}
        </p>
      </div>

      {/* Détails expandables */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: '#f1f5f9', background: '#fafbfc' }}>
          <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#374151' }}>
            {entry.fullDef.split('\n').map((line, i) => {
              if (line.startsWith('• **')) {
                const match = line.match(/^• \*\*(.+?)\*\*(.*)$/);
                if (match) {
                  return (
                    <div key={i} className="flex gap-2 ml-2 mt-1">
                      <span className="text-xs flex-shrink-0" style={{ color: cat.color }}>•</span>
                      <p className="text-xs">
                        <strong style={{ color: '#1a2e24' }}>{match[1]}</strong>
                        <span style={{ color: '#6b7280' }}>{match[2]}</span>
                      </p>
                    </div>
                  );
                }
              }
              if (line.startsWith('⚠️')) {
                return (
                  <div key={i} className="mt-2 p-2 rounded-lg text-xs" style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                    {line}
                  </div>
                );
              }
              if (line.trim() === '') return <div key={i} className="h-1.5" />;
              return <p key={i} className="text-xs mt-1" style={{ color: '#374151' }}>{line}</p>;
            })}
          </div>

          {entry.related && entry.related.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>Voir aussi :</span>
              {entry.related.map(r => (
                <span
                  key={r}
                  className="text-[10px] px-1.5 py-0.5 rounded cursor-default"
                  style={{ background: '#f1f5f9', color: '#475569' }}
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Étape du parcours ────────────────────────────────────────────────────────
function ParcoursStep({
  step,
  title,
  description,
  icon,
  tips,
  onClick,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips?: string[];
  onClick?: () => void;
}) {
  return (
    <Card
      className={`overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-stretch">
        <div
          className="w-16 flex items-center justify-center flex-shrink-0"
          style={{ background: '#0A3B2E' }}
        >
          <span className="text-white font-bold text-lg">{step}</span>
        </div>
        <CardContent className="p-4 flex-1">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg flex-shrink-0" style={{ background: '#E8F3F0' }}>
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm" style={{ color: '#1a2e24' }}>{title}</h4>
                {onClick && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9ca3af' }} />}
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{description}</p>
              {tips && tips.length > 0 && (
                <div className="mt-2 space-y-1">
                  {tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                      <span className="text-[11px]" style={{ color: '#92400e' }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function GuideAide({ onNavigate, defaultTab }: GuideAideProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || "parcours");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Glossaire filtré
  const filteredGlossary = useMemo(() => {
    let results = searchQuery ? searchGlossary(searchQuery) : GLOSSARY;
    if (filterCategory) {
      results = results.filter(e => e.category === filterCategory);
    }
    return results;
  }, [searchQuery, filterCategory]);

  // Grouper par catégorie
  const groupedGlossary = useMemo(() => {
    const groups: Record<string, GlossaryEntry[]> = {};
    for (const entry of filteredGlossary) {
      if (!groups[entry.category]) groups[entry.category] = [];
      groups[entry.category].push(entry);
    }
    return groups;
  }, [filteredGlossary]);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#0A3B2E' }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0A3B2E' }}>Guide & Aide</h1>
            <p className="text-xs" style={{ color: '#6b7280' }}>
              Comprendre le reporting ESG et la plateforme Solvid.IA
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border rounded-xl p-1 gap-1 h-auto" style={{ borderColor: '#E2EDE7' }}>
          <TabsTrigger
            value="parcours"
            className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[#0A3B2E] data-[state=active]:text-white flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Parcours guidé
          </TabsTrigger>
          <TabsTrigger
            value="glossaire"
            className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[#0A3B2E] data-[state=active]:text-white flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Glossaire ESG ({GLOSSARY.length})
          </TabsTrigger>
          <TabsTrigger
            value="legende"
            className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[#0A3B2E] data-[state=active]:text-white flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            Légende & Icônes
          </TabsTrigger>
          <TabsTrigger
            value="faq"
            className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[#0A3B2E] data-[state=active]:text-white flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            FAQ
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════
            PARCOURS GUIDÉ
        ═══════════════════════════════════════════ */}
        <TabsContent value="parcours" className="space-y-4 mt-4">
          {/* Intro */}
          <Card className="border-2" style={{ borderColor: '#0A3B2E', background: 'linear-gradient(135deg, #E8F3F0 0%, #f0fdf4 100%)' }}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🚀</div>
                <div>
                  <h3 className="font-bold" style={{ color: '#0A3B2E' }}>
                    Bienvenue sur Solvid.IA
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#374151' }}>
                    Solvid.IA vous accompagne dans la collecte et le reporting de vos données ESG
                    (Environnement, Social, Gouvernance). Voici les étapes pour démarrer votre
                    premier dossier.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hiérarchie des concepts */}
          <Card>
            <CardContent className="p-5">
              <h4 className="font-semibold text-sm mb-3" style={{ color: '#1a2e24' }}>
                📋 Comment est organisée la plateforme ?
              </h4>
              <div className="space-y-2 ml-2">
                {[
                  { icon: '📂', label: 'Dossier', desc: 'Enveloppe de travail pour un client + exercice fiscal', indent: 0 },
                  { icon: '🔧', label: 'Parcours ESG', desc: 'Standard ESG sélectionné (ex: VSME Complet)', indent: 1 },
                  { icon: '📊', label: 'Modèle', desc: 'Fichier Excel à remplir par vos équipes', indent: 2 },
                  { icon: '📝', label: 'Indicateur', desc: 'Donnée ESG individuelle à renseigner (ex: B3.1)', indent: 2 },
                  { icon: '📎', label: 'Justificatif', desc: 'Document justificatif (facture, certificat...)', indent: 2 },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ marginLeft: item.indent * 24, background: '#f8fafc' }}
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <span className="font-medium text-sm" style={{ color: '#1a2e24' }}>{item.label}</span>
                    <span className="text-xs" style={{ color: '#6b7280' }}>— {item.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Étapes */}
          <div className="space-y-3">
            <ParcoursStep
              step={1}
              title="Créer un dossier client"
              description="Définissez le client, l'année fiscale, le type de mission (Conseil ou Audit) et la fréquence de saisie."
              icon={<FolderOpen className="w-5 h-5" style={{ color: '#0A3B2E' }} />}
              tips={[
                "Annuel = saisie unique par exercice (le plus simple pour commencer)",
                "Conseil = vous accompagnez, Audit = vous vérifiez (ne peut pas être les deux)",
              ]}
              onClick={() => onNavigate?.("creation-dossier")}
            />

            <div className="flex justify-center">
              <div className="w-0.5 h-6" style={{ background: '#d1d5db' }} />
            </div>

            <ParcoursStep
              step={2}
              title="Sélectionner les parcours ESG"
              description="Choisissez un ou plusieurs standards adaptés à votre client (VSME, Bilan Carbone, etc.)."
              icon={<BarChart3 className="w-5 h-5" style={{ color: '#0A3B2E' }} />}
              tips={[
                "VSME = standard PME simplifié (~47 indicateurs)",
                "Chaque parcours ESG inclut des modèles Excel pré-formatés",
              ]}
              onClick={() => onNavigate?.("bibliotheque-workflows")}
            />

            <div className="flex justify-center">
              <div className="w-0.5 h-6" style={{ background: '#d1d5db' }} />
            </div>

            <ParcoursStep
              step={3}
              title="Collecter les données"
              description="Deux options : saisie directe dans la plateforme ou import d'un fichier Excel pré-rempli."
              icon={<PenLine className="w-5 h-5" style={{ color: '#0A3B2E' }} />}
              tips={[
                "Téléchargez les modèles Excel pour vos équipes métier",
                "Les champs IA ✨ peuvent pré-rédiger les indicateurs qualitatifs",
              ]}
            />

            <div className="flex justify-center">
              <div className="w-0.5 h-6" style={{ background: '#d1d5db' }} />
            </div>

            <ParcoursStep
              step={4}
              title="Importer des fichiers"
              description="Réimportez les modèles remplis — la plateforme reconnaît automatiquement le format VSME."
              icon={<Upload className="w-5 h-5" style={{ color: '#0A3B2E' }} />}
              tips={[
                "Format VSME détecté automatiquement → import direct sans configuration",
              ]}
              onClick={() => onNavigate?.("import")}
            />

            <div className="flex justify-center">
              <div className="w-0.5 h-6" style={{ background: '#d1d5db' }} />
            </div>

            <ParcoursStep
              step={5}
              title="Générer le rapport IA"
              description="Claude IA analyse vos données et rédige un rapport ESG professionnel en quelques secondes."
              icon={<Sparkles className="w-5 h-5" style={{ color: '#6c3483' }} />}
              tips={[
                "Nécessite au moins quelques indicateurs remplis",
                "Le rapport est exportable en copier-coller",
              ]}
            />
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════
            GLOSSAIRE
        ═══════════════════════════════════════════ */}
        <TabsContent value="glossaire" className="space-y-4 mt-4">
          {/* Barre de recherche + filtres */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
              <Input
                placeholder="Rechercher un terme (VSME, GES, indicateur…)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
                style={{ borderColor: '#E2EDE7' }}
              />
            </div>
          </div>

          {/* Filtres catégorie */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
              style={{
                background: filterCategory === null ? '#0A3B2E' : '#f1f5f9',
                color: filterCategory === null ? 'white' : '#64748b',
              }}
              onClick={() => setFilterCategory(null)}
            >
              Tous ({GLOSSARY.length})
            </button>
            {Object.entries(GLOSSARY_CATEGORIES).map(([key, cat]) => {
              const count = GLOSSARY.filter(e => e.category === key).length;
              return (
                <button
                  key={key}
                  className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                  style={{
                    background: filterCategory === key ? cat.color : cat.bg,
                    color: filterCategory === key ? 'white' : cat.color,
                  }}
                  onClick={() => setFilterCategory(filterCategory === key ? null : key)}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Résultats */}
          {filteredGlossary.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-25" style={{ color: '#6b7280' }} />
                <p className="font-medium text-sm" style={{ color: '#6b7280' }}>
                  Aucun terme trouvé pour "{searchQuery}"
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filterCategory
                ? /* Vue filtrée : liste plate */
                  filteredGlossary.map(entry => (
                    <GlossaryCard key={entry.term} entry={entry} />
                  ))
                : /* Vue groupée par catégorie */
                  Object.entries(groupedGlossary).map(([catKey, entries]) => {
                    const cat = GLOSSARY_CATEGORIES[catKey];
                    return (
                      <div key={catKey}>
                        <div className="flex items-center gap-2 mb-2 mt-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: cat.color }}>
                            {cat.label}
                          </span>
                          <Badge className="text-[10px]" style={{ background: cat.bg, color: cat.color, border: 'none' }}>
                            {entries.length}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {entries.map(entry => (
                            <GlossaryCard key={entry.term} entry={entry} />
                          ))}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════
            LÉGENDE & ICÔNES
        ═══════════════════════════════════════════ */}
        <TabsContent value="legende" className="space-y-4 mt-4">
          {/* Statuts de saisie */}
          <Card>
            <CardContent className="p-5">
              <h4 className="font-semibold text-sm mb-4" style={{ color: '#1a2e24' }}>
                Statuts de saisie des indicateurs
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#2d7a55' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2d7a55' }}>Rempli</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      L'indicateur a été renseigné avec une valeur. Il sera inclus dans le rapport IA.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <Clock className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>Partiel</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      L'indicateur a été commencé mais la valeur est incomplète ou en brouillon.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}>
                  <Circle className="w-5 h-5 flex-shrink-0" style={{ color: '#d1d5db' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#9ca3af' }}>Vide</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      L'indicateur n'a pas encore été renseigné. La valeur est attendue.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Couleurs des piliers */}
          <Card>
            <CardContent className="p-5">
              <h4 className="font-semibold text-sm mb-4" style={{ color: '#1a2e24' }}>
                Couleurs des piliers ESG
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl p-4 text-center" style={{ background: '#f0fdf4' }}>
                  <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: '#2d7a55' }}>
                    <span className="text-white font-bold text-sm">E</span>
                  </div>
                  <p className="font-semibold text-sm" style={{ color: '#2d7a55' }}>Environnement</p>
                  <p className="text-[11px] mt-1" style={{ color: '#6b7280' }}>
                    Énergie, émissions carbone, eau, déchets, biodiversité
                  </p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: '#eff6ff' }}>
                  <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: '#1a5f8a' }}>
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <p className="font-semibold text-sm" style={{ color: '#1a5f8a' }}>Social</p>
                  <p className="text-[11px] mt-1" style={{ color: '#6b7280' }}>
                    Emploi, formation, santé-sécurité, diversité, droits humains
                  </p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: '#faf5ff' }}>
                  <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: '#6c3483' }}>
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <p className="font-semibold text-sm" style={{ color: '#6c3483' }}>Gouvernance</p>
                  <p className="text-[11px] mt-1" style={{ color: '#6b7280' }}>
                    Éthique, conformité, anti-corruption, structure de direction
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Types d'indicateurs */}
          <Card>
            <CardContent className="p-5">
              <h4 className="font-semibold text-sm mb-4" style={{ color: '#1a2e24' }}>
                Types d'indicateurs
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#f8fafc' }}>
                  <Badge className="text-[10px] flex-shrink-0" style={{ background: '#dbeafe', color: '#1a5f8a', border: 'none' }}>
                    Quantitatif
                  </Badge>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    Valeur numérique avec unité (ex: 1 250 MWh, 42 tCO₂e, 15 %)
                  </p>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#f8fafc' }}>
                  <Badge className="text-[10px] flex-shrink-0" style={{ background: '#fef3c7', color: '#92400e', border: 'none' }}>
                    Qualitatif
                  </Badge>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    Texte court : politique, description d'une pratique, choix Oui/Non
                  </p>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#f8fafc' }}>
                  <Badge className="text-[10px] flex-shrink-0" style={{ background: '#ede9fe', color: '#6c3483', border: 'none' }}>
                    Narratif
                  </Badge>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    Description détaillée : stratégie, plan d'action, analyse des risques. L'IA ✨ peut aider à rédiger.
                  </p>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#f8fafc' }}>
                  <Badge className="text-[10px] flex-shrink-0" style={{ background: '#f1f5f9', color: '#64748b', border: 'none' }}>
                    Calculé (auto)
                  </Badge>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    Calculé automatiquement à partir d'autres indicateurs. Non modifiable, affiché en gris clair.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fréquences de saisie */}
          <Card>
            <CardContent className="p-5">
              <h4 className="font-semibold text-sm mb-4" style={{ color: '#1a2e24' }}>
                Fréquences de saisie
              </h4>
              <div className="space-y-2">
                {[
                  { icon: '📅', label: 'Annuel', desc: 'Une seule saisie par exercice fiscal — idéal pour débuter' },
                  { icon: '📊', label: 'Trimestriel', desc: '4 périodes (T1 à T4) — permet le suivi des tendances' },
                  { icon: '📈', label: 'Mensuel', desc: '12 périodes — suivi détaillé mois par mois' },
                  { icon: '⚙️', label: 'Personnalisé', desc: 'Périodes libres (semestres, bimestres…) — pour des besoins spécifiques' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#f8fafc' }}>
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1a2e24' }}>{item.label}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════
            FAQ
        ═══════════════════════════════════════════ */}
        <TabsContent value="faq" className="space-y-3 mt-4">
          {[
            {
              q: "Mon entreprise est-elle soumise à la CSRD ?",
              a: "La CSRD s'applique progressivement : grandes entreprises cotées (2024), grandes entreprises non cotées (2025), PME cotées (2026). Si votre entreprise n'est pas concernée, le reporting reste volontaire mais recommandé (norme VSME).",
            },
            {
              q: "Quelle différence entre VSME et ESRS ?",
              a: "Les ESRS sont le standard complet (~1 200 indicateurs) destiné aux grandes entreprises. Le VSME est une version simplifiée (~47 indicateurs) conçue spécifiquement pour les PME. Solvid.IA supporte les deux standards.",
            },
            {
              q: "Quelle fréquence de saisie choisir ?",
              a: "Annuel est le plus simple et suffisant pour un premier reporting. Trimestriel est recommandé si vous souhaitez suivre les évolutions dans l'année. Mensuel est utile pour les grandes organisations avec des données fréquentes (énergie, déchets).",
            },
            {
              q: "Qu'est-ce qu'un parcours ESG ?",
              a: "Un parcours ESG est un standard ESG pré-configuré. Il définit quels indicateurs remplir, quels modèles Excel télécharger et quels justificatifs fournir. Exemple : le parcours 'VSME Complet' couvre les 47 indicateurs du standard.",
            },
            {
              q: "Comment fonctionne l'IA ?",
              a: "L'IA (Claude par Anthropic) aide à deux niveaux : 1) Rédaction assistée des indicateurs qualitatifs/narratifs via le bouton ✨ dans la saisie. 2) Génération d'un rapport ESG complet à partir des données renseignées. Elle nécessite une clé API configurée dans les Réglages.",
            },
            {
              q: "Mes données sont-elles sécurisées ?",
              a: "Les données sont stockées localement dans votre navigateur (IndexedDB) et ne sont pas envoyées à un serveur externe, sauf lors de l'appel IA (via l'API Anthropic avec votre clé personnelle). Aucune donnée n'est stockée par des tiers.",
            },
            {
              q: "Que signifient les codes B3.1, B7.2, etc. ?",
              a: "Ce sont les codes du standard VSME. 'B' = Module B (indicateurs de base), le chiffre avant le point = numéro de section (B3 = Énergie, B7 = Émissions), le chiffre après = numéro d'indicateur dans la section.",
            },
            {
              q: "Puis-je modifier la fréquence de saisie après la création ?",
              a: "Oui, la fréquence est modifiable à tout moment depuis l'écran de saisie (icône ⚙️ à côté du sélecteur de période). Les données déjà saisies dans d'autres périodes sont conservées.",
            },
          ].map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-sm"
      onClick={() => setOpen(!open)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#2d7a55' }} />
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: '#1a2e24' }}>{question}</p>
            {open && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: '#6b7280' }}>
                {answer}
              </p>
            )}
          </div>
          <ChevronRight
            className="w-4 h-4 flex-shrink-0 mt-0.5 transition-transform duration-200"
            style={{ color: '#9ca3af', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
