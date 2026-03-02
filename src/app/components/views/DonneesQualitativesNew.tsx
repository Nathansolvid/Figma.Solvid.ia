import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import { 
  FileEdit,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Eye,
  AlertTriangle,
  Upload,
  Download,
  Plus,
  FileText
} from "lucide-react";
import { Separator } from "@/app/components/ui/separator";
import { toast } from "sonner";

type PostureType = "conseil" | "pre-audit" | "audit-externe";

interface DonneesQualitativesProps {
  posture?: PostureType;
  dossierId?: string;
}

// Exemple de sections qualitatives ESG
const qualitativeSections = [
  {
    id: "gov-politique-ethique",
    code: "GOV-01",
    name: "Politique d'éthique et de conformité",
    category: "G",
    required: true,
    status: "draft" as const,
    wordCount: 420,
    lastUpdated: "2026-01-28",
    evidenceCount: 2,
  },
  {
    id: "env-politique-climat",
    code: "ENV-01",
    name: "Politique climat et énergie",
    category: "E",
    required: true,
    status: "validated" as const,
    wordCount: 680,
    lastUpdated: "2026-01-25",
    evidenceCount: 5,
  },
  {
    id: "soc-politique-diversite",
    code: "SOC-01",
    name: "Politique diversité et inclusion",
    category: "S",
    required: true,
    status: "draft" as const,
    wordCount: 320,
    lastUpdated: "2026-01-27",
    evidenceCount: 1,
  },
  {
    id: "env-dechets-economie-circulaire",
    code: "ENV-05",
    name: "Démarche économie circulaire",
    category: "E",
    required: false,
    status: "missing" as const,
    wordCount: 0,
    lastUpdated: null,
    evidenceCount: 0,
  },
];

export function DonneesQualitativesNew({ posture = "conseil", dossierId }: DonneesQualitativesProps) {
  const [selectedSection, setSelectedSection] = useState(qualitativeSections[0]);
  const [content, setContent] = useState("Notre entreprise s'engage à respecter les principes d'éthique et de conformité les plus stricts. La politique anti-corruption s'applique à l'ensemble des collaborateurs...");

  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";

  const handleImportWord = () => {
    toast.info("Import Word", {
      description: "Sélectionnez vos documents Word/PDF pour les importer"
    });
  };

  const handleExportWord = () => {
    toast.success("Export Word généré", {
      description: "Toutes les sections qualitatives ont été exportées"
    });
  };

  const handleValidateSection = () => {
    toast.success("Section validée", {
      description: `"${selectedSection.name}" a été marquée comme validée`
    });
  };

  const handleAddEvidence = () => {
    toast.info("Ajouter une preuve", {
      description: "Téléchargez un document justificatif"
    });
  };

  // État vide - aucune section
  if (qualitativeSections.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              Données qualitatives
            </h1>
            <p className="text-muted-foreground">
              Politiques, démarches et engagements ESG narratifs
            </p>
          </div>
        </div>

        <Card className="border-2 border-dashed border-[#059669]">
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-[#E8F3F0] rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-[#059669]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Aucune section qualitative définie
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Commencez par définir les sections narratives à documenter 
                  (politiques, démarches, engagements, etc.).
                </p>
              </div>

              {isConseil && (
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button className="bg-[#059669] hover:bg-[#047857]">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une section
                  </Button>
                  <Button variant="outline" onClick={handleImportWord}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer depuis Word
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Suggestion */}
        <Card className="border-[#059669] bg-gradient-to-r from-[#E8F3F0] to-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#059669] p-3 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Importez vos documents existants</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Si vous avez déjà des documents Word/PDF contenant vos politiques ESG, 
                  importez-les directement. Le système les structurera automatiquement.
                </p>
                <Button variant="outline" size="sm" onClick={handleImportWord}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer mes documents
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // État avec données
  const completedSections = qualitativeSections.filter(s => s.status === "validated").length;
  const draftSections = qualitativeSections.filter(s => s.status === "draft").length;
  const missingSections = qualitativeSections.filter(s => s.status === "missing").length;
  const totalWords = qualitativeSections.reduce((acc, s) => acc + s.wordCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Données qualitatives
          </h1>
          <p className="text-muted-foreground">
            Politiques, démarches et engagements ESG narratifs
          </p>
        </div>
        {isConseil && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportWord}>
              <Download className="h-4 w-4 mr-2" />
              Export Word
            </Button>
            <Button variant="outline" onClick={handleImportWord}>
              <Upload className="h-4 w-4 mr-2" />
              Import Word
            </Button>
          </div>
        )}
        {isAuditExterne && (
          <Badge className="bg-orange-500 text-white">
            <Eye className="h-3 w-3 mr-1" />
            Mode Lecture seule
          </Badge>
        )}
      </div>

      {/* Alertes Pré-audit */}
      {isPreAudit && missingSections > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              {missingSections} section{missingSections > 1 ? "s" : ""} manquante{missingSections > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-900">
              Ces sections doivent être complétées pour garantir l'auditabilité du dossier
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sections totales</p>
                <p className="text-3xl font-semibold">{qualitativeSections.length}</p>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <FileText className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Validées</p>
              <p className="text-3xl font-semibold">{completedSections}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((completedSections / qualitativeSections.length) * 100)}% complétées
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">En cours</p>
              <p className="text-3xl font-semibold">{draftSections}</p>
              <p className="text-xs text-muted-foreground mt-1">Brouillons</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Mots totaux</p>
              <p className="text-3xl font-semibold">{totalWords.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Contenu rédigé</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vue principale : 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des sections */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Sections à documenter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {qualitativeSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedSection.id === section.id
                    ? "border-[#059669] bg-[#E8F3F0]"
                    : "border-border hover:bg-accent"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {section.code}
                  </Badge>
                  {section.status === "validated" && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {section.status === "draft" && (
                    <FileEdit className="h-4 w-4 text-blue-600" />
                  )}
                  {section.status === "missing" && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <p className="font-medium text-sm mb-1">{section.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{section.wordCount} mots</span>
                  {section.evidenceCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{section.evidenceCount} preuve{section.evidenceCount > 1 ? "s" : ""}</span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Éditeur */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-[#0F4C3A] text-white font-mono">
                    {selectedSection.code}
                  </Badge>
                  {selectedSection.required && (
                    <Badge className="bg-amber-500 text-white">Obligatoire</Badge>
                  )}
                  {selectedSection.status === "validated" && (
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Validé
                    </Badge>
                  )}
                  {selectedSection.status === "draft" && (
                    <Badge className="bg-blue-500 text-white">
                      <FileEdit className="h-3 w-3 mr-1" />
                      En cours
                    </Badge>
                  )}
                  {selectedSection.status === "missing" && (
                    <Badge className="bg-red-500 text-white">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Manquant
                    </Badge>
                  )}
                </div>
                <CardTitle>{selectedSection.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Catégorie {selectedSection.category} • Section narrative
                </p>
              </div>
              {isConseil && selectedSection.status === "draft" && (
                <Button 
                  className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
                  onClick={handleValidateSection}
                >
                  Valider
                </Button>
              )}
              {selectedSection.status === "validated" && (
                <Badge className="bg-[#059669] text-white text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Validé
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Assistant IA - Mode Conseil uniquement */}
            {isConseil && selectedSection.status === "missing" && (
              <Card className="border-[#059669] bg-gradient-to-r from-[#E8F3F0] to-white">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-[#059669] p-2 rounded-lg">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">Assistant rédactionnel IA</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        Générez un premier jet basé sur vos données existantes
                      </p>
                      <Button size="sm" variant="outline">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Générer un brouillon
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contenu de la section */}
            <div>
              <label className="text-sm font-medium mb-2 block">Contenu de la section</label>
              {!isAuditExterne ? (
                <Textarea 
                  className="min-h-[300px]" 
                  placeholder="Décrivez votre politique, vos engagements et vos démarches..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isPreAudit || isAuditExterne}
                />
              ) : (
                <div className="p-4 border border-border rounded-lg bg-muted/30 min-h-[300px]">
                  <p className="text-sm">{content}</p>
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {isPreAudit && "⚠️ Section en lecture seule pour vérification"}
                  {isConseil && `${content.split(" ").length} mots`}
                </p>
                {isConseil && (
                  <Button variant="ghost" size="sm" onClick={handleAddEvidence}>
                    <Upload className="h-3 w-3 mr-1" />
                    Ajouter une preuve ({selectedSection.evidenceCount})
                  </Button>
                )}
              </div>
            </div>

            {/* Preuves associées */}
            {selectedSection.evidenceCount > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Preuves associées</label>
                <div className="space-y-2">
                  {[...Array(selectedSection.evidenceCount)].map((_, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border border-border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#0F4C3A]" />
                        <span className="text-sm">politique_ethique_v2.pdf</span>
                      </div>
                      <Badge variant="outline" className="text-xs">Document</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isPreAudit && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-900">
                      <strong>Point de vérification :</strong> La section doit mentionner explicitement 
                      les processus de diligence raisonnable et les indicateurs de suivi
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}