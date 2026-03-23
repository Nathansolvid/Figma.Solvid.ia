/**
 * 📚 BIBLIOTHÈQUE TEMPLATES
 * 
 * Catalogue complet de tous les templates Excel disponibles :
 * - Filtres par catégorie E/S/G
 * - Recherche
 * - Preview de structure
 * - Téléchargement individuel
 * - Tags et métadonnées
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Download,
  Search,
  FileSpreadsheet,
  Leaf,
  Users,
  Scale,
  Eye,
  X,
  ArrowRight,
  Upload,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { getTemplateByName, downloadExcelTemplate } from "@/utils/excelTemplates";
import { getWorkflowById } from "@/utils/workflowLibrary";

type TemplateCategory = 'Environnement' | 'Social' | 'Gouvernance' | 'Transverse';

interface TemplateInfo {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  fields: string[];
  workflows: string[];
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  estimatedTime: string;
  mandatory?: boolean;
}

const TEMPLATE_LIBRARY: TemplateInfo[] = [
  // ENVIRONNEMENT
  {
    id: 'emissions-scope1',
    name: 'Émissions GES Scope 1',
    category: 'Environnement',
    description: 'Collecte des émissions directes de GES (combustion, procédés industriels)',
    fields: ['Type de source', 'Quantité consommée', 'Unité', 'Facteur d\'émission', 'Émissions tCO2e'],
    workflows: ['Bilan Carbone', 'CSRD'],
    difficulty: 'Intermédiaire',
    estimatedTime: '2-3 heures',
    mandatory: true,
  },
  {
    id: 'emissions-scope2',
    name: 'Émissions GES Scope 2',
    category: 'Environnement',
    description: 'Collecte des émissions indirectes liées à l\'énergie (électricité, chaleur)',
    fields: ['Type d\'énergie', 'Consommation', 'Unité', 'Fournisseur', 'Mix énergétique', 'Émissions tCO2e'],
    workflows: ['Bilan Carbone', 'CSRD'],
    difficulty: 'Intermédiaire',
    estimatedTime: '1-2 heures',
    mandatory: true,
  },
  {
    id: 'emissions-scope3',
    name: 'Émissions GES Scope 3',
    category: 'Environnement',
    description: 'Collecte des émissions indirectes de la chaîne de valeur (achats, transport, déchets)',
    fields: ['Catégorie Scope 3', 'Données d\'activité', 'Unité', 'Facteur d\'émission', 'Émissions tCO2e'],
    workflows: ['Bilan Carbone', 'CSRD'],
    difficulty: 'Avancé',
    estimatedTime: '4-6 heures',
  },
  {
    id: 'consommation-energie',
    name: 'Consommations énergétiques',
    category: 'Environnement',
    description: 'Relevé détaillé des consommations d\'énergie par site et type',
    fields: ['Site', 'Type d\'énergie', 'Période', 'Consommation', 'Coût', 'Part renouvelable'],
    workflows: ['Bilan Carbone', 'CSRD', 'ESG PME'],
    difficulty: 'Débutant',
    estimatedTime: '1-2 heures',
  },
  {
    id: 'consommation-eau',
    name: 'Consommation et rejets d\'eau',
    category: 'Environnement',
    description: 'Volumes d\'eau prélevés et rejetés par source et usage',
    fields: ['Source', 'Usage', 'Volume prélevé (m³)', 'Volume rejeté (m³)', 'Qualité rejet'],
    workflows: ['CSRD', 'ESG PME'],
    difficulty: 'Débutant',
    estimatedTime: '1 heure',
  },
  {
    id: 'dechets',
    name: 'Gestion des déchets',
    category: 'Environnement',
    description: 'Production, tri et valorisation des déchets par catégorie',
    fields: ['Type de déchet', 'Tonnage', 'Mode de traitement', 'Taux de valorisation', 'Destination finale'],
    workflows: ['CSRD', 'Bilan Carbone', 'ESG PME'],
    difficulty: 'Intermédiaire',
    estimatedTime: '2 heures',
  },
  {
    id: 'biodiversite',
    name: 'Impact biodiversité',
    category: 'Environnement',
    description: 'Évaluation des impacts sur les écosystèmes et zones protégées',
    fields: ['Localisation', 'Type d\'écosystème', 'Statut protection', 'Nature impact', 'Mesures compensation'],
    workflows: ['CSRD'],
    difficulty: 'Avancé',
    estimatedTime: '3-4 heures',
  },

  // SOCIAL
  {
    id: 'effectifs',
    name: 'Effectifs et caractéristiques',
    category: 'Social',
    description: 'Données sur les effectifs : répartition, contrats, diversité',
    fields: ['Type de contrat', 'Catégorie', 'Genre', 'Âge', 'Ancienneté', 'Effectif'],
    workflows: ['CSRD', 'ESG PME', 'Due Diligence'],
    difficulty: 'Débutant',
    estimatedTime: '1-2 heures',
    mandatory: true,
  },
  {
    id: 'formation',
    name: 'Formation et développement',
    category: 'Social',
    description: 'Heures de formation, types de formation, budget',
    fields: ['Type formation', 'Nombre participants', 'Heures totales', 'Coût', 'Catégorie bénéficiaires'],
    workflows: ['CSRD', 'ESG PME'],
    difficulty: 'Débutant',
    estimatedTime: '1 heure',
  },
  {
    id: 'sante-securite',
    name: 'Santé et sécurité au travail',
    category: 'Social',
    description: 'Accidents du travail, maladies professionnelles, absentéisme',
    fields: ['Type d\'incident', 'Gravité', 'Nombre', 'Jours perdus', 'Taux de fréquence', 'Mesures correctives'],
    workflows: ['CSRD', 'ESG PME', 'Due Diligence'],
    difficulty: 'Intermédiaire',
    estimatedTime: '2 heures',
    mandatory: true,
  },
  {
    id: 'remuneration',
    name: 'Rémunération et équité salariale',
    category: 'Social',
    description: 'Écarts salariaux, rémunération moyenne, équité H/F',
    fields: ['Catégorie', 'Genre', 'Salaire moyen', 'Écart vs médiane', 'Évolution annuelle'],
    workflows: ['CSRD', 'ESG PME'],
    difficulty: 'Intermédiaire',
    estimatedTime: '2-3 heures',
  },
  {
    id: 'dialogue-social',
    name: 'Dialogue social',
    category: 'Social',
    description: 'Instances représentatives, accords collectifs, grèves',
    fields: ['Type d\'instance', 'Nombre de réunions', 'Accords signés', 'Taux de couverture', 'Conflits'],
    workflows: ['CSRD', 'ESG PME'],
    difficulty: 'Débutant',
    estimatedTime: '1 heure',
  },

  // GOUVERNANCE
  {
    id: 'structure-gouvernance',
    name: 'Structure de gouvernance',
    category: 'Gouvernance',
    description: 'Composition du conseil, comités, diversité, indépendance',
    fields: ['Instance', 'Nombre de membres', 'Genre', 'Âge', 'Indépendance', 'Expertise ESG'],
    workflows: ['CSRD', 'Questionnaire Banque', 'Due Diligence'],
    difficulty: 'Débutant',
    estimatedTime: '1-2 heures',
  },
  {
    id: 'ethique-conformite',
    name: 'Éthique et conformité',
    category: 'Gouvernance',
    description: 'Code de conduite, politique anti-corruption, contrôles internes',
    fields: ['Type de politique', 'Date adoption', 'Périmètre', 'Formation', 'Incidents signalés'],
    workflows: ['CSRD', 'Questionnaire Banque', 'Due Diligence'],
    difficulty: 'Intermédiaire',
    estimatedTime: '2 heures',
  },
  {
    id: 'risques-esg',
    name: 'Cartographie risques ESG',
    category: 'Gouvernance',
    description: 'Identification et évaluation des risques ESG matériels',
    fields: ['Catégorie risque', 'Description', 'Probabilité', 'Impact', 'Mesures atténuation', 'Responsable'],
    workflows: ['CSRD', 'Questionnaire Banque'],
    difficulty: 'Avancé',
    estimatedTime: '3-4 heures',
  },
  {
    id: 'chaine-valeur',
    name: 'Chaîne de valeur et fournisseurs',
    category: 'Gouvernance',
    description: 'Mapping fournisseurs, évaluation ESG, due diligence',
    fields: ['Fournisseur', 'Pays', 'Catégorie achat', 'Montant', 'Évaluation ESG', 'Risques identifiés'],
    workflows: ['CSRD', 'Due Diligence'],
    difficulty: 'Avancé',
    estimatedTime: '4-5 heures',
  },

  // TRANSVERSE
  {
    id: 'strategie-esg',
    name: 'Stratégie et objectifs ESG',
    category: 'Transverse',
    description: 'Objectifs ESG, plans d\'action, KPIs de suivi',
    fields: ['Axe stratégique', 'Objectif', 'Échéance', 'KPI', 'Valeur cible', 'Avancement'],
    workflows: ['CSRD', 'Questionnaire Banque', 'ESG PME'],
    difficulty: 'Intermédiaire',
    estimatedTime: '2-3 heures',
  },
  {
    id: 'parties-prenantes',
    name: 'Engagement parties prenantes',
    category: 'Transverse',
    description: 'Dialogue avec parties prenantes, attentes, actions',
    fields: ['Type de partie prenante', 'Modalité d\'engagement', 'Fréquence', 'Attentes principales', 'Actions prises'],
    workflows: ['CSRD', 'ESG PME'],
    difficulty: 'Intermédiaire',
    estimatedTime: '2 heures',
  },

  // VSME — Templates consolidés EFRAG
  {
    id: 'vsme-environnement',
    name: 'VSME — Pilier Environnement',
    category: 'Environnement',
    description: 'Template consolidé VSME couvrant énergie (B3), pollution (B4), déchets (B5), eau (B6) et biodiversité (B7)',
    fields: ['Indicateur VSME', 'Code', 'Valeur', 'Unité', 'Année N', 'Année N-1', 'Source / Justification'],
    workflows: ['VSME'],
    difficulty: 'Intermédiaire',
    estimatedTime: '3-4 heures',
    mandatory: true,
  },
  {
    id: 'vsme-social',
    name: 'VSME — Pilier Social',
    category: 'Social',
    description: 'Template consolidé VSME couvrant effectifs (B8) et santé-sécurité (B9)',
    fields: ['Indicateur VSME', 'Code', 'Valeur', 'Unité', 'Année N', 'Année N-1', 'Source / Justification'],
    workflows: ['VSME'],
    difficulty: 'Intermédiaire',
    estimatedTime: '2-3 heures',
    mandatory: true,
  },
  {
    id: 'vsme-gouvernance',
    name: 'VSME — Pilier Gouvernance',
    category: 'Gouvernance',
    description: 'Template consolidé VSME couvrant gouvernance (B2), conduite des affaires (B10) et chaîne de valeur (B11)',
    fields: ['Indicateur VSME', 'Code', 'Valeur', 'Unité', 'Année N', 'Année N-1', 'Source / Justification'],
    workflows: ['VSME'],
    difficulty: 'Intermédiaire',
    estimatedTime: '2-3 heures',
    mandatory: true,
  },
  {
    id: 'vsme-general',
    name: 'VSME — Informations générales',
    category: 'Transverse',
    description: 'Template VSME pour les bases de la préparation (B1) : stratégie, modèle économique, matérialité',
    fields: ['Indicateur VSME', 'Code', 'Réponse textuelle', 'Justification', 'Référence documentaire'],
    workflows: ['VSME'],
    difficulty: 'Débutant',
    estimatedTime: '1-2 heures',
  },
];

interface BibliothequeTemplatesProps {
  onDownloadTemplate?: (templateId: string) => void;
  onNavigate?: (view: string) => void;
  workflowId?: string | null; // 🆕 Phase 11 : filtrer par workflow actif
}

export function BibliothequeTemplates({ onDownloadTemplate, onNavigate, workflowId }: BibliothequeTemplatesProps) {
  // 🆕 Phase 11 : résoudre le workflow actif
  const activeWorkflow = workflowId ? getWorkflowById(workflowId) : null;
  const workflowTemplateIds = activeWorkflow
    ? [...activeWorkflow.templatesRequired, ...activeWorkflow.templatesOptional]
    : null;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'Tous'>('Tous');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateInfo | null>(null);

  const categories: Array<{ id: TemplateCategory | 'Tous'; label: string; icon: any; color: string }> = [
    { id: 'Tous', label: 'Tous', icon: FileSpreadsheet, color: 'bg-gray-500' },
    { id: 'Environnement', label: 'Environnement', icon: Leaf, color: 'bg-green-500' },
    { id: 'Social', label: 'Social', icon: Users, color: 'bg-blue-500' },
    { id: 'Gouvernance', label: 'Gouvernance', icon: Scale, color: 'bg-purple-500' },
    { id: 'Transverse', label: 'Transverse', icon: FileSpreadsheet, color: 'bg-orange-500' },
  ];

  // Filtrage — 🆕 Phase 11 : filtrer par workflow si actif
  const filteredTemplates = TEMPLATE_LIBRARY.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || template.category === selectedCategory;
    const matchesWorkflow = workflowTemplateIds ? workflowTemplateIds.includes(template.id) : true;
    return matchesSearch && matchesCategory && matchesWorkflow;
  });

  // Stats par catégorie
  const categoryStats = categories.map(cat => ({
    ...cat,
    count: cat.id === 'Tous' 
      ? TEMPLATE_LIBRARY.length 
      : TEMPLATE_LIBRARY.filter(t => t.category === cat.id).length,
  }));

  const handleDownload = async (template: TemplateInfo) => {
    // Mapper l'ID vers le nom de template réel
    const templateNameMapping: { [key: string]: string } = {
      'emissions-scope1':      'Émissions GES Scope 1 - Combustibles',
      'emissions-scope2':      'Émissions GES Scope 2 - Électricité',
      'emissions-scope3':      'Émissions GES Scope 3 - Achats',
      'consommation-energie':  'Consommation d\'Énergie',
      'consommation-eau':      'Consommation d\'Eau',
      'dechets':               'Production de Déchets',
      'biodiversite':          'Impact biodiversité',
      'effectifs':             'Effectifs et Données RH',
      'formation':             'Formation et Développement',
      'sante-securite':        'Santé et sécurité au travail',
      'remuneration':          'Rémunération et équité salariale',
      'dialogue-social':       'Dialogue social',
      'structure-gouvernance': 'Gouvernance et Conformité',
      'ethique-conformite':    'Gouvernance et Conformité',
      'risques-esg':           'Gouvernance et Conformité',
      'chaine-valeur':         'Chaîne de valeur et fournisseurs',
      'strategie-esg':         'Plan d\'Actions ESG',
      'parties-prenantes':     'Engagement parties prenantes',
    };

    const templateName = templateNameMapping[template.id];

    if (templateName) {
      const config = getTemplateByName(templateName);
      if (config) {
        await downloadExcelTemplate(config);
        toast.success(`Modèle "${template.name}" téléchargé !`, {
          description: `Complétez-le et importez-le dans votre dossier`,
        });
      } else {
        toast.error(`Modèle non trouvé`, {
          description: `Le modèle "${templateName}" n'est pas disponible`,
        });
      }
    } else {
      toast.error(`Modèle non disponible`, {
        description: `Mapping manquant pour "${template.id}"`,
      });
    }

    if (onDownloadTemplate) {
      onDownloadTemplate(template.id);
    }
  };

  const getCategoryColor = (category: TemplateCategory) => {
    const cat = categories.find(c => c.id === category);
    return cat?.color || 'bg-gray-500';
  };

  const getCategoryIcon = (category: TemplateCategory) => {
    const cat = categories.find(c => c.id === category);
    return cat?.icon || FileSpreadsheet;
  };

  return (
    <div className="space-y-6">
      {/* 🆕 Phase 11 : Bannière workflow actif */}
      {activeWorkflow && (
        <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm">
                {activeWorkflow.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">
                  Modèles pour : {activeWorkflow.name}
                </p>
                <p className="text-xs text-blue-600">
                  {activeWorkflow.templatesRequired.length} requis
                  {activeWorkflow.templatesOptional.length > 0 && ` · ${activeWorkflow.templatesOptional.length} optionnel(s)`}
                  {' · '}{filteredTemplates.length} modèle(s) affiché(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bandeau de guidance */}
      {onNavigate && (
        <Card className="border-2 border-[#10B981] bg-gradient-to-r from-[#E8F3F0] to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#0A3B2E] mb-1">
                    Étape 3 : Télécharger, compléter et déposer vos modèles
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Téléchargez les modèles Excel, remplissez-les avec vos données, puis importez-les dans votre dossier
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('import')}
                  className="border-[#10B981] text-[#0A3B2E] hover:bg-[#E8F3F0]"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importer mes fichiers
                </Button>
                <Button
                  size="sm"
                  className="bg-[#10B981] hover:bg-[#059669]"
                  onClick={() => onNavigate('evidence-vault')}
                >
                  Étape suivante : Justificatifs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Bibliothèque de Modèles</h1>
        <p className="text-muted-foreground">
          Explorez et téléchargez les {TEMPLATE_LIBRARY.length} modèles Excel disponibles
        </p>
      </div>

      {/* Filtres catégories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categoryStats.map(cat => {
          const Icon = cat.icon;
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? `${cat.color} text-white hover:opacity-90` : ''}
            >
              <Icon className="h-4 w-4 mr-2" />
              {cat.label}
              <Badge variant="secondary" className="ml-2">
                {cat.count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un modèle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Résultats */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {filteredTemplates.length} modèle{filteredTemplates.length > 1 ? 's' : ''} trouvé{filteredTemplates.length > 1 ? 's' : ''}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => {
            const Icon = getCategoryIcon(template.category);
            
            return (
              <Card
                key={template.id}
                className="border-2 hover:border-[#059669] transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-5 w-5 text-white p-1 rounded ${getCategoryColor(template.category)}`} />
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                        {activeWorkflow && activeWorkflow.templatesRequired.includes(template.id) && (
                          <Badge className="bg-red-500 text-xs text-white">Requis</Badge>
                        )}
                        {activeWorkflow && activeWorkflow.templatesOptional.includes(template.id) && (
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">Optionnel</Badge>
                        )}
                        {!activeWorkflow && template.mandatory && (
                          <Badge className="bg-orange-500 text-xs">
                            Obligatoire
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">
                        {template.name}
                      </CardTitle>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Métadonnées */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Difficulté :</span>
                      <p className="font-medium">{template.difficulty}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Temps :</span>
                      <p className="font-medium">{template.estimatedTime}</p>
                    </div>
                  </div>

                  {/* Workflows liés */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Utilisé dans :</p>
                    <div className="flex flex-wrap gap-1">
                      {template.workflows.map(wf => (
                        <Badge key={wf} variant="secondary" className="text-xs">
                          {wf}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      className="w-full bg-[#059669] hover:bg-[#047857]"
                      onClick={() => handleDownload(template)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun modèle trouvé</h3>
              <p className="text-muted-foreground">
                Essayez de modifier vos critères de recherche
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modale Preview */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{previewTemplate.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {previewTemplate.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Infos */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                <div>
                  <p className="text-xs text-muted-foreground">Catégorie</p>
                  <p className="font-medium">{previewTemplate.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Difficulté</p>
                  <p className="font-medium">{previewTemplate.difficulty}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Temps estimé</p>
                  <p className="font-medium">{previewTemplate.estimatedTime}</p>
                </div>
              </div>

              {/* Champs du template */}
              <div>
                <h4 className="font-semibold mb-2">Champs à renseigner :</h4>
                <div className="space-y-2">
                  {previewTemplate.fields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <div className="bg-[#059669] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="text-sm">{field}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflows */}
              <div>
                <h4 className="font-semibold mb-2">Utilisé dans les parcours ESG :</h4>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.workflows.map(wf => (
                    <Badge key={wf} variant="secondary">
                      {wf}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Button
                className="w-full bg-[#059669] hover:bg-[#047857]"
                onClick={() => {
                  handleDownload(previewTemplate);
                  setPreviewTemplate(null);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger ce modèle
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}