/**
 * 📚 BIBLIOTHÈQUE DE WORKFLOWS
 * 
 * Catalogue complet de tous les workflows disponibles.
 * Chaque workflow = ensemble de templates à compléter pour un objectif précis.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Target,
  Users,
  X,
  Eye,
  Play,
  Leaf,
  Scale,
  Zap,
  BarChart3,
  Shield,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import {
  WORKFLOW_LIBRARY,
  WorkflowDefinition,
  WorkflowCategory,
  getWorkflowTemplateCount,
} from "@/utils/workflowLibrary";
import { getTemplateByName, downloadExcelTemplate } from "@/utils/excelTemplates";

interface BibliothequeWorkflowsProps {
  onSelectWorkflow?: (workflowId: string) => void;
  onNavigate?: (view: string) => void;
}

export function BibliothequeWorkflows({ onSelectWorkflow, onNavigate }: BibliothequeWorkflowsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<WorkflowCategory | 'Tous'>('Tous');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Tous' | 'Débutant' | 'Intermédiaire' | 'Avancé'>('Tous');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null); // 🆕 Selected workflow for detail view
  const [showOnlyRegulatory, setShowOnlyRegulatory] = useState(false);
  const [downloadingTemplates, setDownloadingTemplates] = useState<Set<string>>(new Set()); // 🆕 Track downloading templates

  const categories: Array<{ id: WorkflowCategory | 'Tous'; label: string; icon: any; color: string }> = [
    { id: 'Tous', label: 'Tous', icon: BarChart3, color: 'bg-gray-500' },
    { id: 'Environnement', label: 'Environnement', icon: Leaf, color: 'bg-green-500' },
    { id: 'Social', label: 'Social', icon: Users, color: 'bg-blue-500' },
    { id: 'Gouvernance', label: 'Gouvernance', icon: Scale, color: 'bg-purple-500' },
    { id: 'Transverse', label: 'Transverse', icon: Zap, color: 'bg-orange-500' },
    { id: 'Réglementaire', label: 'Réglementaire', icon: Shield, color: 'bg-red-500' },
  ];

  // Filtrage
  const filteredWorkflows = WORKFLOW_LIBRARY.filter(workflow => {
    const matchesSearch = 
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'Tous' || workflow.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'Tous' || workflow.difficulty === selectedDifficulty;
    const matchesRegulatory = !showOnlyRegulatory || workflow.regulatory;
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesRegulatory;
  });

  // Stats par catégorie
  const categoryStats = categories.map(cat => ({
    ...cat,
    count: cat.id === 'Tous' 
      ? WORKFLOW_LIBRARY.length 
      : WORKFLOW_LIBRARY.filter(w => w.category === cat.id).length,
  }));

  // Télécharger tous les templates d'un workflow
  const handleDownloadAllTemplates = (workflow: WorkflowDefinition) => {
    const allTemplateIds = [...workflow.templatesRequired, ...workflow.templatesOptional];
    let downloaded = 0;
    let failed = 0;

    allTemplateIds.forEach(templateId => {
      // Mapping des IDs vers les vrais noms de templates
      const templateNameMapping: { [key: string]: string } = {
        'emissions-scope1': 'Émissions GES Scope 1 - Combustibles',
        'emissions-scope2': 'Émissions GES Scope 2 - Électricité',
        'emissions-scope3': 'Émissions GES Scope 3 - Achats',
        'consommation-energie': 'Consommation d\'Énergie',
        'consommation-eau': 'Consommation d\'Eau',
        'dechets': 'Production de Déchets',
        'effectifs': 'Effectifs et Données RH',
        'formation': 'Formation et Développement',
        'sante-securite': 'Effectifs et Données RH', // Fallback
        'remuneration': 'Effectifs et Données RH', // Fallback
        'dialogue-social': 'Effectifs et Données RH', // Fallback
        'structure-gouvernance': 'Gouvernance et Conformité',
        'ethique-conformite': 'Gouvernance et Conformité',
        'risques-esg': 'Gouvernance et Conformité',
        'chaine-valeur': 'Gouvernance et Conformité',
        'strategie-esg': 'Plan d\'Actions ESG',
        'parties-prenantes': 'Gouvernance et Conformité',
        'biodiversite': 'Émissions GES', // Fallback
      };

      const templateName = templateNameMapping[templateId];
      if (templateName) {
        const config = getTemplateByName(templateName);
        if (config) {
          downloadExcelTemplate(config);
          downloaded++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    });

    if (downloaded > 0) {
      toast.success(`${downloaded} template(s) téléchargé(s) !`, {
        description: 'Complétez-les dans Excel et importez-les dans votre dossier',
        duration: 5000,
      });
    }
    
    if (failed > 0) {
      toast.warning(`${failed} template(s) non disponible(s)`, {
        description: 'Certains templates ne sont pas encore implémentés',
      });
    }
  };

  // 🆕 Télécharger un template individuel
  const handleDownloadSingleTemplate = (templateId: string) => {
    // Prevent multiple simultaneous downloads
    if (downloadingTemplates.has(templateId)) {
      toast.warning('Téléchargement en cours...', {
        description: 'Veuillez patienter que le téléchargement se termine',
      });
      return;
    }

    setDownloadingTemplates(prev => new Set(prev).add(templateId));

    const templateNameMapping: { [key: string]: string } = {
      'emissions-scope1': 'Émissions GES Scope 1 - Combustibles',
      'emissions-scope2': 'Émissions GES Scope 2 - Électricité',
      'emissions-scope3': 'Émissions GES Scope 3 - Achats',
      'consommation-energie': 'Consommation d\'Énergie',
      'consommation-eau': 'Consommation d\'Eau',
      'dechets': 'Production de Déchets',
      'effectifs': 'Effectifs et Données RH',
      'formation': 'Formation et Développement',
      'sante-securite': 'Effectifs et Données RH',
      'remuneration': 'Effectifs et Données RH',
      'dialogue-social': 'Effectifs et Données RH',
      'structure-gouvernance': 'Gouvernance et Conformité',
      'ethique-conformite': 'Gouvernance et Conformité',
      'risques-esg': 'Gouvernance et Conformité',
      'chaine-valeur': 'Gouvernance et Conformité',
      'strategie-esg': 'Plan d\'Actions ESG',
      'parties-prenantes': 'Gouvernance et Conformité',
      'biodiversite': 'Émissions GES',
    };

    const templateName = templateNameMapping[templateId];
    
    setTimeout(() => {
      if (templateName) {
        const config = getTemplateByName(templateName);
        if (config) {
          downloadExcelTemplate(config);
          toast.success(`Template "${config.name}" téléchargé !`, {
            description: 'Complétez-le dans Excel et importez-le dans votre dossier',
            duration: 3000,
          });
        } else {
          toast.error('Template non disponible', {
            description: `Le template "${templateName}" n'existe pas encore`,
          });
        }
      } else {
        toast.error('Template non trouvé', {
          description: `Mapping manquant pour l'ID "${templateId}"`,
        });
      }
      
      setDownloadingTemplates(prev => {
        const next = new Set(prev);
        next.delete(templateId);
        return next;
      });
    }, 500); // Small delay to simulate download
  };

  const getCategoryColor = (category: WorkflowCategory) => {
    const cat = categories.find(c => c.id === category);
    return cat?.color || 'bg-gray-500';
  };

  const getCategoryIcon = (category: WorkflowCategory) => {
    const cat = categories.find(c => c.id === category);
    return cat?.icon || BarChart3;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Débutant': return 'bg-green-500';
      case 'Intermédiaire': return 'bg-yellow-500';
      case 'Avancé': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // 🆕 If a workflow is selected, show detail view
  if (selectedWorkflow) {
    const templateCount = getWorkflowTemplateCount(selectedWorkflow);
    const Icon = getCategoryIcon(selectedWorkflow.category);
    
    return (
      <div className="space-y-6">
        {/* Back button */}
        <Button
          variant="outline"
          onClick={() => setSelectedWorkflow(null)}
          className="mb-4"
        >
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          Retour à la liste
        </Button>

        {/* Workflow header */}
        <Card className="border-2 border-[#059669]">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#E8F3F0] flex items-center justify-center text-3xl flex-shrink-0">
                {selectedWorkflow.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${getCategoryColor(selectedWorkflow.category)} text-white`}>
                    {selectedWorkflow.category}
                  </Badge>
                  {selectedWorkflow.regulatory && (
                    <Badge className="bg-red-500 text-white">
                      Réglementaire
                    </Badge>
                  )}
                  <Badge className={`${getDifficultyColor(selectedWorkflow.difficulty)} text-white`}>
                    {selectedWorkflow.difficulty}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold mb-2">{selectedWorkflow.name}</h1>
                <p className="text-muted-foreground">{selectedWorkflow.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Durée estimée</p>
                <p className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {selectedWorkflow.estimatedDuration}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Templates</p>
                <p className="font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-[#059669]" />
                  {templateCount.total} au total
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Audience</p>
                <div className="flex flex-wrap gap-1">
                  {selectedWorkflow.audience.slice(0, 2).map(aud => (
                    <Badge key={aud} variant="secondary" className="text-xs">
                      {aud}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {selectedWorkflow.objectives && selectedWorkflow.objectives.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Objectifs
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {selectedWorkflow.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedWorkflow.tags && selectedWorkflow.tags.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedWorkflow.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Templates obligatoires */}
        {selectedWorkflow.templatesRequired.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#059669]" />
                Templates obligatoires ({selectedWorkflow.templatesRequired.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ces templates sont indispensables pour compléter ce workflow
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedWorkflow.templatesRequired.map(templateId => {
                  const isDownloading = downloadingTemplates.has(templateId);
                  return (
                    <div 
                      key={templateId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-[#059669]" />
                        <div>
                          <p className="font-medium">{templateId}</p>
                          <p className="text-xs text-muted-foreground">Format Excel (.xlsx)</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-[#059669] hover:bg-[#047857]"
                        onClick={() => handleDownloadSingleTemplate(templateId)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <>
                            <Clock className="h-3 w-3 mr-1 animate-spin" />
                            Téléchargement...
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3 mr-1" />
                            Télécharger
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates optionnels */}
        {selectedWorkflow.templatesOptional.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Templates optionnels ({selectedWorkflow.templatesOptional.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ces templates peuvent enrichir votre analyse mais ne sont pas obligatoires
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedWorkflow.templatesOptional.map(templateId => {
                  const isDownloading = downloadingTemplates.has(templateId);
                  return (
                    <div 
                      key={templateId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{templateId}</p>
                          <p className="text-xs text-muted-foreground">Format Excel (.xlsx)</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadSingleTemplate(templateId)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <>
                            <Clock className="h-3 w-3 mr-1 animate-spin" />
                            Téléchargement...
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3 mr-1" />
                            Télécharger
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bandeau de guidance */}
      {onNavigate && (
        <Card className="border-2 border-[#10B981] bg-gradient-to-r from-[#E8F3F0] to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#0A3B2E] mb-1">
                    Étape 2 : Sélectionner vos workflows
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choisissez les thématiques ESG à traiter et téléchargez les templates correspondants
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('bibliotheque-templates')}
                  className="border-[#10B981] text-[#0A3B2E] hover:bg-[#E8F3F0]"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Voir tous les templates
                </Button>
                <Button
                  size="sm"
                  className="bg-[#10B981] hover:bg-[#059669]"
                  onClick={() => onNavigate('bibliotheque-templates')}
                >
                  Étape suivante : Templates
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Bibliothèque de Workflows</h1>
        <p className="text-muted-foreground">
          Explorez les {WORKFLOW_LIBRARY.length} workflows disponibles. Chaque workflow = ensemble de templates à compléter.
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

      {/* Filtres secondaires */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2">
          <Badge 
            variant={selectedDifficulty === 'Tous' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedDifficulty('Tous')}
          >
            Tous
          </Badge>
          <Badge 
            variant={selectedDifficulty === 'Débutant' ? 'default' : 'outline'}
            className="cursor-pointer bg-green-500 text-white"
            onClick={() => setSelectedDifficulty('Débutant')}
          >
            Débutant
          </Badge>
          <Badge 
            variant={selectedDifficulty === 'Intermédiaire' ? 'default' : 'outline'}
            className="cursor-pointer bg-yellow-500 text-white"
            onClick={() => setSelectedDifficulty('Intermédiaire')}
          >
            Intermédiaire
          </Badge>
          <Badge 
            variant={selectedDifficulty === 'Avancé' ? 'default' : 'outline'}
            className="cursor-pointer bg-red-500 text-white"
            onClick={() => setSelectedDifficulty('Avancé')}
          >
            Avancé
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="regulatory-only"
            checked={showOnlyRegulatory}
            onChange={(e) => setShowOnlyRegulatory(e.target.checked)}
            className="cursor-pointer"
          />
          <label htmlFor="regulatory-only" className="text-sm cursor-pointer">
            Réglementaires uniquement
          </label>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un workflow..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Résultats */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {filteredWorkflows.length} workflow{filteredWorkflows.length > 1 ? 's' : ''} trouvé{filteredWorkflows.length > 1 ? 's' : ''}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map(workflow => {
            const Icon = getCategoryIcon(workflow.category);
            const templateCount = getWorkflowTemplateCount(workflow);
            
            return (
              <Card
                key={workflow.id}
                className="border-2 hover:border-[#059669] transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{workflow.icon}</span>
                        <Badge variant="outline" className="text-xs">
                          {workflow.category}
                        </Badge>
                        {workflow.regulatory && (
                          <Badge className="bg-red-500 text-xs">
                            Réglementaire
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">
                        {workflow.name}
                      </CardTitle>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {workflow.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Métadonnées */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Difficulté :</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge className={`${getDifficultyColor(workflow.difficulty)} text-white text-xs`}>
                          {workflow.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Durée :</span>
                      <p className="font-medium flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {workflow.estimatedDuration}
                      </p>
                    </div>
                  </div>

                  {/* Templates */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Templates :</p>
                    <div className="flex items-center gap-2 text-sm">
                      <FileSpreadsheet className="h-4 w-4 text-[#059669]" />
                      <span className="font-bold text-[#059669]">{templateCount.required}</span>
                      <span className="text-muted-foreground">obligatoires</span>
                      {templateCount.optional > 0 && (
                        <>
                          <span className="text-muted-foreground">+</span>
                          <span className="font-bold text-blue-500">{templateCount.optional}</span>
                          <span className="text-muted-foreground">optionnels</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Audience */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Audience :</p>
                    <div className="flex flex-wrap gap-1">
                      {workflow.audience.map(aud => (
                        <Badge key={aud} variant="secondary" className="text-xs">
                          {aud}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {workflow.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {workflow.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{workflow.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir détails
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-[#059669] hover:bg-[#047857]"
                      onClick={() => handleDownloadAllTemplates(workflow)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Tous ({templateCount.total})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredWorkflows.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun workflow trouvé</h3>
              <p className="text-muted-foreground">
                Essayez de modifier vos critères de recherche
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}