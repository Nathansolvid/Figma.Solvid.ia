import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import { 
  Building2, 
  FileText, 
  Users, 
  Loader2, 
  Package, 
  CheckCircle2, 
  FolderOpen,
  Clock,
  Check,
  ArrowRight,
  Landmark,
  Search,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { packService } from '@/services/packService';
import { PackInstance, PackTemplate } from '@/services/dataProvider';
import { usePrefetch } from '@/hooks/usePrefetch'; // 🆕 Prefetch hook

interface PackSelectorProps {
  dossierId: string;
  dossierName: string;
  onPackCreated?: (pack: any) => void;
  onClose?: () => void;
}

export function PackSelector({ dossierId, dossierName, onPackCreated, onClose }: PackSelectorProps) {
  const [templates, setTemplates] = useState<PackTemplate[]>([]);
  const [existingPacks, setExistingPacks] = useState<PackInstance[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PackTemplate | null>(null);
  const [packName, setPackName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPackId, setDeletingPackId] = useState<string | null>(null);
  const { currentUser } = useUser();
  const { prefetchPack } = usePrefetch(); // 🆕 Prefetch functionality

  // Load templates and existing packs
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load templates
      const templatesData = await packService.getTemplates();
      setTemplates(templatesData);

      // Load existing packs
      if (currentUser?.organizationId) {
        const packs = await packService.listPacks(currentUser.organizationId);
        setExistingPacks(packs);
      }
    } catch (error) {
      console.error('❌ Load data error:', error);
      toast.error('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const getIconComponent = (category: string) => {
    const iconMap: Record<string, any> = {
      'banque': Landmark,
      'donneur-ordre': Building2,
      'questionnaire': FileText,
      'pre-audit': Search,
    };
    const IconComponent = iconMap[category] || Package;
    return <IconComponent className="size-8" />;
  };

  const handleSelectTemplate = (template: PackTemplate) => {
    setSelectedTemplate(template);
    setPackName(`${template.name} - ${dossierName}`);
  };

  const handleCreatePack = async () => {
    console.log('🚀 handleCreatePack - START (LOCAL MODE)');
    console.log('  - selectedTemplate:', selectedTemplate);
    console.log('  - packName:', packName);
    console.log('  - currentUser:', currentUser);
    
    if (!selectedTemplate || !packName.trim()) {
      toast.error('Veuillez sélectionner un template et saisir un nom');
      return;
    }

    if (!currentUser) {
      console.error('❌ currentUser is null/undefined!');
      toast.error('Session invalide', {
        description: 'Veuillez vous reconnecter'
      });
      return;
    }

    setIsCreating(true);

    try {
      console.log('🚀 Creating pack with packService (LOCAL):', {
        packName: packName.trim(),
        templateCode: selectedTemplate.code,
        templateName: selectedTemplate.name,
        userId: currentUser.id,
        organizationId: currentUser.organizationId
      });
      
      // Create pack using packService (LOCAL)
      const pack = await packService.createPack({
        name: packName.trim(),
        dossierId,
        templateCode: selectedTemplate.code,
        organizationId: currentUser.organizationId,
        ownerId: currentUser.id,
      });
      
      console.log('✅ Pack created successfully (LOCAL):', pack);

      // Reload packs list
      await loadData();

      // Reset form
      setSelectedTemplate(null);
      setPackName('');

      // Callback to open pack
      if (onPackCreated) {
        console.log('📤 Calling onPackCreated callback with packId:', pack.id);
        onPackCreated(pack.id);
      }
    } catch (error: any) {
      console.error('❌ Pack creation error (LOCAL):', error);
      toast.error('Erreur lors de la création du pack', {
        description: error.message
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Function to delete a pack
  const handleDeletePack = async (packId: string, packName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le pack "${packName}" ?\n\nCette action est irréversible et supprimera tous les indicateurs associés.`)) {
      return;
    }

    setDeletingPackId(packId);

    try {
      console.log('🗑️ Deleting pack:', packId);
      await packService.deletePackDirect(packId); // Use direct route
      
      // Reload packs list
      await loadData();
      
      toast.success(`Pack "${packName}" supprimé avec succès`);
    } catch (error: any) {
      console.error('❌ Pack deletion error:', error);
      toast.error('Erreur de suppression', {
        description: error.message || 'Impossible de supprimer le pack'
      });
    } finally {
      setDeletingPackId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#0A3B2E]">Créer un nouveau Pack</h2>
        <p className="text-gray-600 mt-1">
          Sélectionnez un template de pack adapté à votre besoin. Le pack générera automatiquement
          une checklist et les KPIs requis.
        </p>
      </div>

      {/* Existing Packs List */}
      {existingPacks.length > 0 && !selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Packs existants ({existingPacks.length})
            </CardTitle>
            <CardDescription>
              Gérez vos packs ou supprimez ceux qui ne sont plus nécessaires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingPacks.map((pack: any) => (
                <div
                  key={pack.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  onMouseEnter={() => prefetchPack(pack.id)} // 🆕 Prefetch on hover
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Package className="h-5 w-5 text-[#059669]" />
                    <div>
                      <p className="font-medium text-gray-900">{pack.name}</p>
                      <p className="text-sm text-gray-500">
                        Type: {pack.type} • Créé le {new Date(pack.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPackCreated?.(pack)}
                    >
                      <FolderOpen className="h-4 w-4 mr-1" />
                      Ouvrir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePack(pack.id, pack.name)}
                      disabled={deletingPackId === pack.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingPackId === pack.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Excel-First Banner */}
      <div className="bg-[#E8F3F0] border border-[#059669] rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-[#059669] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-[#0A3B2E] mb-1">
              💡 Approche Excel-first
            </h3>
            <p className="text-sm text-gray-700">
              Chaque pack supporte l'import Excel/CSV avec mapping réutilisable. 
              Importez vos données existantes, puis complétez avec les preuves pour garantir l'auditabilité.
            </p>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {!selectedTemplate && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(template => (
            <Card
              key={template.id}
              className="p-6 cursor-pointer hover:border-[#059669] hover:shadow-lg transition-all"
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#E8F3F0] rounded-lg flex items-center justify-center text-[#059669]">
                  {getIconComponent(template.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#0A3B2E] mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {template.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText className="size-3" />
                      {template.checklistTemplateItems.length} items checklist
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {template.category}
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      <Users className="size-3 inline mr-1" />
                      {template.name}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Template Selected - Configuration */}
      {selectedTemplate && (
        <div className="space-y-6">
          {/* Selected Template Summary */}
          <Card className="p-6 bg-[#E8F3F0] border-[#059669]">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center text-[#059669]">
                  {getIconComponent(selectedTemplate.category)}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0A3B2E] mb-1">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    {selectedTemplate.description}
                  </p>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white text-[#059669]">
                      {selectedTemplate.checklistTemplateItems.length} items checklist
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white text-[#059669]">
                      {selectedTemplate.checklistTemplateItems.filter(i => i.requirementLevel === 'MANDATORY').length} items obligatoires
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTemplate(null)}
              >
                Changer
              </Button>
            </div>
          </Card>

          {/* Pack Name */}
          <div className="space-y-2">
            <Label htmlFor="pack-name">Nom du Pack *</Label>
            <Input
              id="pack-name"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              placeholder="Ex: Pack Carrefour 2024"
              className="text-base"
            />
            <p className="text-sm text-gray-500">
              Ce nom sera visible dans vos dossiers et exports
            </p>
          </div>

          {/* Preview Checklist */}
          <div>
            <h4 className="font-semibold text-[#0A3B2E] mb-3">
              Checklist qui sera générée ({selectedTemplate.checklistTemplateItems.length} items)
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedTemplate.checklistTemplateItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {item.requirementLevel === 'MANDATORY' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Obligatoire
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Recommandé
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Informations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note :</strong> Les indicateurs et preuves seront générés automatiquement lors de la création du pack.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedTemplate(null);
                setPackName('');
                onClose?.();
              }} 
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreatePack}
              disabled={!packName.trim() || isCreating}
              className="bg-[#059669] hover:bg-[#048558]"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Création en cours...
                </>
              ) : (
                <>
                  Créer le Pack
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PackSelector;