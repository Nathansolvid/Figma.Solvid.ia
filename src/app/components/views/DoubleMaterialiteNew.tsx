import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { 
  Upload,
  Download,
  Plus,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet,
  Grid3x3,
  Eye,
  AlertTriangle,
  Edit,
  Trash2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { toast } from "sonner";
import { useDossierData, MaterialityIssue } from "@/contexts/DossierDataContext";

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface DoubleMaterialiteNewProps {
  posture: PostureType;
  parcours: ParcoursType;
  dossierId: string;
}

export function DoubleMaterialiteNew({ posture, parcours, dossierId }: DoubleMaterialiteNewProps) {
  const { getDossierData, addMaterialityIssue, updateMaterialityIssues } = useDossierData();
  const dossierData = getDossierData(dossierId);
  const materialityIssues = dossierData?.materialityIssues || [];

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({
    name: "",
    description: "",
    impactScore: 3,
    financialScore: 3,
    stakeholders: "",
    esrsMapping: "",
  });

  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";
  const isCsrdObligatoire = parcours === "csrd-obligatoire";

  const labels = {
    title: isCsrdObligatoire ? "Double Matérialité (DMA)" : "Enjeux prioritaires",
    subtitle: isCsrdObligatoire 
      ? "Analyse de matérialité et mapping automatique vers les ESRS applicables"
      : "Identification et priorisation des enjeux ESG matériels",
    mappingLabel: isCsrdObligatoire ? "ESRS proposés" : "Thématiques",
    impactLabel: isCsrdObligatoire ? "Impact env./social" : "Impact ESG",
  };

  const handleAddIssue = () => {
    if (!newIssue.name.trim()) {
      toast.error("Erreur", { description: "Le nom de l'enjeu est requis" });
      return;
    }

    const issue: MaterialityIssue = {
      id: `issue-${Date.now()}`,
      name: newIssue.name,
      description: newIssue.description,
      impactScore: newIssue.impactScore,
      financialScore: newIssue.financialScore,
      stakeholders: newIssue.stakeholders.split(',').map(s => s.trim()).filter(Boolean),
      esrsMapping: newIssue.esrsMapping.split(',').map(s => s.trim()).filter(Boolean),
      mappingValidated: false,
    };

    addMaterialityIssue(dossierId, issue);
    toast.success("Enjeu ajouté", { description: `"${issue.name}" a été ajouté à l'analyse` });
    
    setNewIssue({
      name: "",
      description: "",
      impactScore: 3,
      financialScore: 3,
      stakeholders: "",
      esrsMapping: "",
    });
    setIsAddDialogOpen(false);
  };

  const handleImportExcel = () => {
    toast.info("Import Excel", { 
      description: "Fonctionnalité d'import en cours de développement" 
    });
  };

  const handleExport = () => {
    toast.success("Export démarré", { 
      description: "Analyse de matérialité en cours d'export..." 
    });
  };

  const handleGenerateSample = () => {
    const sampleIssues: MaterialityIssue[] = [
      {
        id: `issue-${Date.now()}-1`,
        name: "Émissions GES",
        description: "Réduction des émissions de gaz à effet de serre",
        impactScore: 4.5,
        financialScore: 4.2,
        stakeholders: ["Actionnaires", "Régulateurs", "Clients"],
        esrsMapping: ["E1"],
        mappingValidated: true,
        justification: "Enjeu stratégique lié aux objectifs climat",
        auditStatus: "valide",
      },
      {
        id: `issue-${Date.now()}-2`,
        name: "Diversité et inclusion",
        description: "Promotion de la diversité au sein de l'entreprise",
        impactScore: 3.8,
        financialScore: 2.9,
        stakeholders: ["Employés", "Syndicats", "Société civile"],
        esrsMapping: ["S1"],
        mappingValidated: true,
        justification: "Politique RH prioritaire",
        auditStatus: "valide",
      },
      {
        id: `issue-${Date.now()}-3`,
        name: "Éthique des affaires",
        description: "Prévention de la corruption et respect de l'éthique",
        impactScore: 4.1,
        financialScore: 3.8,
        stakeholders: ["Actionnaires", "Clients", "Régulateurs"],
        esrsMapping: ["G1"],
        mappingValidated: true,
        justification: "Exigence réglementaire et risque réputationnel",
        auditStatus: "valide",
      },
    ];

    updateMaterialityIssues(dossierId, sampleIssues);
    toast.success("Données de démonstration créées", {
      description: `${sampleIssues.length} enjeux ont été ajoutés`
    });
  };

  const getMaterialityClass = (impactScore: number, financialScore: number) => {
    const average = (impactScore + financialScore) / 2;
    if (average >= 4) return "bg-red-100 text-red-800 border-red-300";
    if (average >= 3) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  // État vide - Aucun enjeu défini
  if (materialityIssues.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">{labels.title}</h1>
            <p className="text-muted-foreground">{labels.subtitle}</p>
          </div>
          {isAuditExterne && (
            <Badge className="bg-orange-500 text-white">
              <Eye className="h-3 w-3 mr-1" />
              Mode Lecture seule
            </Badge>
          )}
        </div>

        {/* État vide avec options */}
        <Card className="border-2 border-dashed border-[#059669]">
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-[#E8F3F0] rounded-full flex items-center justify-center">
                <Grid3x3 className="h-8 w-8 text-[#059669]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Aucune analyse de matérialité
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Commencez par identifier et évaluer vos enjeux ESG matériels. 
                  Vous pouvez importer vos résultats depuis Excel ou créer vos enjeux manuellement.
                </p>
              </div>

              {isConseil && (
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button 
                    className="bg-[#059669] hover:bg-[#047857]"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un enjeu
                  </Button>
                  <Button variant="outline" onClick={handleImportExcel}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer depuis Excel
                  </Button>
                  <Button variant="outline" onClick={handleGenerateSample}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer un exemple
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assistant IA suggestion */}
        {isConseil && (
          <Card className="border-[#059669] bg-gradient-to-r from-[#E8F3F0] to-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-[#059669] p-3 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">
                    {isCsrdObligatoire ? "Assistant CSRD" : "Assistant ESG"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    L'IA peut vous suggérer automatiquement des enjeux matériels basés sur votre secteur d'activité et votre taille.
                  </p>
                  <Button variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Suggérer des enjeux (IA)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog d'ajout d'enjeu */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un enjeu matériel</DialogTitle>
              <DialogDescription>
                Définissez un nouvel enjeu ESG et évaluez sa matérialité
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de l'enjeu *</Label>
                <Input
                  id="name"
                  value={newIssue.name}
                  onChange={(e) => setNewIssue({ ...newIssue, name: e.target.value })}
                  placeholder="Ex: Émissions GES, Diversité et inclusion..."
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  placeholder="Décrivez l'enjeu..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="impactScore">Score d'impact (1-5)</Label>
                  <Input
                    id="impactScore"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={newIssue.impactScore}
                    onChange={(e) => setNewIssue({ ...newIssue, impactScore: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="financialScore">Score financier (1-5)</Label>
                  <Input
                    id="financialScore"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={newIssue.financialScore}
                    onChange={(e) => setNewIssue({ ...newIssue, financialScore: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="stakeholders">Parties prenantes (séparées par des virgules)</Label>
                <Input
                  id="stakeholders"
                  value={newIssue.stakeholders}
                  onChange={(e) => setNewIssue({ ...newIssue, stakeholders: e.target.value })}
                  placeholder="Actionnaires, Clients, Employés..."
                />
              </div>
              <div>
                <Label htmlFor="esrsMapping">Normes ESRS (séparées par des virgules)</Label>
                <Input
                  id="esrsMapping"
                  value={newIssue.esrsMapping}
                  onChange={(e) => setNewIssue({ ...newIssue, esrsMapping: e.target.value })}
                  placeholder="E1, S1, G1..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddIssue} className="bg-[#059669] hover:bg-[#047857]">
                Ajouter l'enjeu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // État avec données - Affichage de la matrice
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">{labels.title}</h1>
          <p className="text-muted-foreground">{labels.subtitle}</p>
        </div>
        {isConseil && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button 
              className="bg-[#059669] hover:bg-[#047857]"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un enjeu
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

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enjeux identifiés</p>
                <p className="text-3xl font-semibold">{materialityIssues.length}</p>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <Grid3x3 className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Enjeux matériels</p>
              <p className="text-3xl font-semibold">
                {materialityIssues.filter(i => (i.impactScore + i.financialScore) / 2 >= 3).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Score ≥ 3</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Mappings validés</p>
              <p className="text-3xl font-semibold">
                {materialityIssues.filter(i => i.mappingValidated).length}/{materialityIssues.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Normes ESRS</p>
              <p className="text-3xl font-semibold">
                {new Set(materialityIssues.flatMap(i => i.esrsMapping)).size}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Normes applicables</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des enjeux */}
      <Card>
        <CardHeader>
          <CardTitle>Enjeux matériels identifiés</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enjeu</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Financier</TableHead>
                <TableHead>Matérialité</TableHead>
                <TableHead>Parties prenantes</TableHead>
                <TableHead>{labels.mappingLabel}</TableHead>
                {isPreAudit && <TableHead>Statut audit</TableHead>}
                {isConseil && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialityIssues.map((issue) => {
                const avgScore = (issue.impactScore + issue.financialScore) / 2;
                return (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{issue.name}</p>
                        {issue.description && (
                          <p className="text-xs text-muted-foreground">{issue.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{issue.impactScore.toFixed(1)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{issue.financialScore.toFixed(1)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMaterialityClass(issue.impactScore, issue.financialScore)}>
                        {avgScore.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {issue.stakeholders.slice(0, 2).map((sh, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {sh}
                          </Badge>
                        ))}
                        {issue.stakeholders.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{issue.stakeholders.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {issue.esrsMapping.map((esrs, idx) => (
                          <Badge key={idx} className="bg-[#0F4C3A] text-white text-xs">
                            {esrs}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    {isPreAudit && (
                      <TableCell>
                        {issue.auditStatus === "valide" && (
                          <Badge className="bg-green-100 text-green-800">Validé</Badge>
                        )}
                        {issue.auditStatus === "reserve" && (
                          <Badge className="bg-amber-100 text-amber-800">Réserve</Badge>
                        )}
                        {issue.auditStatus === "invalide" && (
                          <Badge className="bg-red-100 text-red-800">Invalide</Badge>
                        )}
                      </TableCell>
                    )}
                    {isConseil && (
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog d'ajout d'enjeu */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un enjeu matériel</DialogTitle>
            <DialogDescription>
              Définissez un nouvel enjeu ESG et évaluez sa matérialité
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de l'enjeu *</Label>
              <Input
                id="name"
                value={newIssue.name}
                onChange={(e) => setNewIssue({ ...newIssue, name: e.target.value })}
                placeholder="Ex: Émissions GES, Diversité et inclusion..."
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                placeholder="Décrivez l'enjeu..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="impactScore">Score d'impact (1-5)</Label>
                <Input
                  id="impactScore"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={newIssue.impactScore}
                  onChange={(e) => setNewIssue({ ...newIssue, impactScore: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="financialScore">Score financier (1-5)</Label>
                <Input
                  id="financialScore"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={newIssue.financialScore}
                  onChange={(e) => setNewIssue({ ...newIssue, financialScore: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="stakeholders">Parties prenantes (séparées par des virgules)</Label>
              <Input
                id="stakeholders"
                value={newIssue.stakeholders}
                onChange={(e) => setNewIssue({ ...newIssue, stakeholders: e.target.value })}
                placeholder="Actionnaires, Clients, Employés..."
              />
            </div>
            <div>
              <Label htmlFor="esrsMapping">Normes ESRS (séparées par des virgules)</Label>
              <Input
                id="esrsMapping"
                value={newIssue.esrsMapping}
                onChange={(e) => setNewIssue({ ...newIssue, esrsMapping: e.target.value })}
                placeholder="E1, S1, G1..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddIssue} className="bg-[#059669] hover:bg-[#047857]">
              Ajouter l'enjeu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
