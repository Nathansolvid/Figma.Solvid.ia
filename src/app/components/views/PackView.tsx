import { useState, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Info,
  Download,
  Share2,
  Send,
  BarChart3,
  FolderOpen,
  MessageSquare,
  History,
  Loader2,
  Package,
  Users,
  CheckSquare,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Role, Action, can } from '@/utils/rbac';
import { exportPackToPDF } from "@/utils/pdfExport";
import { exportPackToZIP } from "@/utils/zipExport";
import { useIndicatorUpdates } from "@/hooks/useIndicatorUpdates";
import { usePackFull } from "@/hooks/usePack";
import { ExportZipModal } from "@/app/components/ExportZipModal";
import { AuditTrail } from "@/app/components/AuditTrail";
import { useBulkOperations } from "@/hooks/useBulkOperations"; // 🆕 Bulk operations hook
import { useCollaboration } from "@/hooks/useCollaboration"; // 🆕 Collaboration hook
import { CommentThread } from "@/app/components/collaboration/CommentThread"; // 🆕 Phase 8 collaboration
import { CommentBadge } from "@/app/components/collaboration/CommentBadge"; // 🆕 Phase 8 collaboration
import { useUser } from "@/contexts/UserContext"; // 🆕 Phase 8 - User context for real user info
import { EvidenceVault } from "@/app/components/views/EvidenceVault";

interface ChecklistItem {
  id: string;
  code: string;
  label: string;
  requirement_level: 'MANDATORY' | 'RECOMMENDED';
  status: 'MISSING' | 'PROVIDED' | 'NEEDS_REVIEW' | 'ACCEPTED' | 'REJECTED';
  assigned_to?: string;
  due_date?: string;
  comment?: string;
  description?: string;
}

interface KPIRequirement {
  id: string;
  indicator_code: string;
  indicator_name?: string;
  period: string;
  status: 'MISSING' | 'COMPUTED' | 'NEEDS_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'missing' | 'in-progress' | 'provided' | 'validated'; // 🆕 Ajout des statuts lowercase
  value?: number;
  unit?: string;
  has_evidence: boolean;
  evidence_count?: number;
}

interface Evidence {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  linked_indicators: string[];
  period: string;
  uploaded_by: string;
  created_at: string;
}

interface Pack {
  id: string;
  name: string;
  templateCode: string;
  templateName: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';
  completionScore: number;
  checklistItems: ChecklistItem[];
  kpiRequirements: KPIRequirement[];
  evidences?: Evidence[];
  owner: string;
  reviewer?: string;
  createdAt: string;
  updatedAt: string;
}

interface PackViewProps {
  pack?: Pack; // Optionnel maintenant
  packId?: string; // Nouveau : chargement depuis ID
  currentUserRole: Role;
  currentUserId: string;
  onUpdate?: (updatedPack: Pack) => void;
  onBack?: () => void; // Nouveau : callback pour revenir
}

// Helper functions for status mapping
function mapIndicatorStatus(status: string): ChecklistItem['status'] {
  switch (status?.toLowerCase()) {
    case 'accepted':
    case 'approved':
      return 'ACCEPTED';
    case 'rejected':
      return 'REJECTED';
    case 'needs_review':
    case 'review':
      return 'NEEDS_REVIEW';
    case 'provided':
    case 'computed':
      return 'PROVIDED';
    default:
      return 'MISSING';
  }
}

function mapPackStatus(status: string): Pack['status'] {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
    case 'DRAFT':
      return 'DRAFT';
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'READY_FOR_REVIEW':
      return 'READY_FOR_REVIEW';
    case 'CHANGES_REQUESTED':
      return 'CHANGES_REQUESTED';
    case 'APPROVED':
      return 'APPROVED';
    case 'REJECTED':
      return 'REJECTED';
    default:
      return 'DRAFT';
  }
}

export function PackView({ pack: propPack, packId, currentUserRole, currentUserId, onUpdate, onBack }: PackViewProps) {
  // State management
  const [activeTab, setActiveTab] = useState('checklist');
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🆕 Bulk operations state
  const [selectedIndicators, setSelectedIndicators] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  
  // ZIP export modal state
  const [zipModalOpen, setZipModalOpen] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipMessage, setZipMessage] = useState('');
  const [zipError, setZipError] = useState<string | null>(null);
  const [zipComplete, setZipComplete] = useState(false);
  
  // 🆕 Phase 8 - User context for real user name
  const { currentUser } = useUser();
  
  // React Query: Load pack data with caching
  const { 
    data: backendPack, 
    isLoading, 
    isError, 
    error: queryError,
    refetch
  } = usePackFull(packId || null);
  
  // Hook for indicator updates with persistence
  const {
    markAsProvided,
    markAsMissing,
    updateCommentImmediate,
    isUpdating,
  } = useIndicatorUpdates({
    onSuccess: () => {
      // Refetch pack data to get fresh state
      refetch();
    },
  });
  
  // 🆕 Bulk Operations hooks
  const {
    bulkMarkAsProvided,
    bulkMarkAsMissing,
    bulkDelete,
  } = useBulkOperations();
  
  // 🆕 Collaboration hooks
  const {
    activeUsers,
    recentEvents,
    notifyIndicatorUpdate,
    notifyCommentUpdate,
  } = useCollaboration(packId); // 🆕 Collaboration hook

  // Transform backend pack data to frontend format using useMemo for performance
  const pack = useMemo(() => {
    console.log('🔄 PackView useMemo - Transforming pack data...');
    console.log('  - propPack:', propPack);
    console.log('  - backendPack:', backendPack);
    
    if (propPack) {
      console.log('✅ Using propPack (passed as prop)');
      return propPack; // Use prop if provided
    }
    if (!backendPack) {
      console.log('⚠️ No backendPack available');
      return null;
    }
    
    console.log('📦 backendPack structure:', {
      id: backendPack.id,
      name: backendPack.name,
      foldersCount: backendPack.folders?.length || 0,
      folders: backendPack.folders?.map((f: any) => ({
        id: f.id,
        name: f.name,
        indicatorsCount: f.indicators?.length || 0
      }))
    });
    
    // Extract all indicators from all folders
    const allIndicators = backendPack.folders?.flatMap((folder: any) => 
      folder.indicators || []
    ) || [];
    
    console.log('📊 Total indicators extracted:', allIndicators.length);
    console.log('📊 First few indicators:', allIndicators.slice(0, 3));
    
    // Extract all evidence from all indicators
    const allEvidence = allIndicators.flatMap((indicator: any) => 
      (indicator.evidence || []).map((ev: any) => ({
        id: ev.id,
        file_name: ev.fileName,
        file_type: ev.fileType,
        file_size: ev.fileSize,
        linked_indicators: [indicator.code],
        period: new Date(ev.uploadedAt).getFullYear().toString(),
        uploaded_by: ev.uploadedBy,
        created_at: ev.uploadedAt,
      }))
    );
    
    // Transform indicators to checklist items
    const checklistItems: ChecklistItem[] = allIndicators.map((ind: any) => ({
      id: ind.id,
      code: ind.code,
      label: ind.name,
      requirement_level: 'MANDATORY', // TODO: determine from indicator metadata
      status: mapIndicatorStatus(ind.status),
      description: ind.methodology || ind.source,
      comment: ind.comment || '',
    }));
    
    console.log('✅ Checklist items created:', checklistItems.length);
    
    // Transform indicators to KPI requirements
    const kpiRequirements: KPIRequirement[] = allIndicators.map((ind: any) => ({
      id: ind.id,
      indicator_code: ind.code,
      indicator_name: ind.name,
      period: new Date(ind.createdAt).getFullYear().toString(),
      status: ind.status, // 🆕 Utiliser le statut brut plutôt que mappé
      value: ind.value,
      unit: ind.unit,
      has_evidence: (ind.evidence || []).length > 0,
      evidence_count: (ind.evidence || []).length,
    }));
    
    // Calculate completion score
    const totalMandatory = checklistItems.filter(i => i.requirement_level === 'MANDATORY').length;
    const completedMandatory = checklistItems.filter(i => 
      i.requirement_level === 'MANDATORY' && 
      ['PROVIDED', 'ACCEPTED'].includes(i.status)
    ).length;
    const completionScore = totalMandatory > 0 
      ? Math.round((completedMandatory / totalMandatory) * 100) 
      : 0;
    
    // Transform backend data to frontend format
    const transformedPack: Pack = {
      id: backendPack.id,
      name: backendPack.name,
      templateCode: backendPack.templateCode || backendPack.type || '',
      templateName: backendPack.templateName || (backendPack.type?.replace(/_/g, ' ')) || '',
      status: mapPackStatus(backendPack.status),
      completionScore,
      checklistItems,
      kpiRequirements,
      evidences: allEvidence,
      owner: backendPack.createdBy,
      createdAt: backendPack.createdAt,
      updatedAt: backendPack.updatedAt,
    };
    
    return transformedPack;
  }, [backendPack, propPack]);

  // Loading state
  if (isLoading && !propPack) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="size-12 animate-spin text-[#059669]" />
        <p className="text-gray-600">Chargement du pack...</p>
      </div>
    );
  }

  // Error state
  if (isError && !propPack) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertCircle className="size-12 text-red-500" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{queryError?.message || 'Impossible de charger le pack'}</p>
          <div className="flex gap-2 justify-center">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Retour
              </Button>
            )}
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No pack state
  if (!pack) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Package className="size-16 text-gray-300" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Pack introuvable</h2>
          <p className="text-gray-600 mb-4">
            {packId 
              ? `Le pack avec l'ID "${packId}" n'existe pas ou a été supprimé.` 
              : "Aucun pack n'a été sélectionné."}
          </p>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Retour à la liste des packs
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Calculs
  const mandatoryItems = pack.checklistItems.filter(i => i.requirement_level === 'MANDATORY');
  const mandatoryCompleted = mandatoryItems.filter(i => ['PROVIDED', 'ACCEPTED'].includes(i.status)).length;
  const canSubmitForReview = mandatoryCompleted === mandatoryItems.length;

  const getStatusBadge = (status: Pack['status']) => {
    const badges = {
      DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
      IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
      READY_FOR_REVIEW: { label: 'Prêt pour revue', color: 'bg-orange-100 text-orange-800' },
      CHANGES_REQUESTED: { label: 'Modifications demandées', color: 'bg-red-100 text-red-800' },
      APPROVED: { label: 'Approuvé', color: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-800' }
    };
    const badge = badges[status];
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  const getItemStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircle2 className="size-5 text-green-600" />;
      case 'PROVIDED': return <CheckCircle2 className="size-5 text-blue-600" />;
      case 'NEEDS_REVIEW': return <Clock className="size-5 text-orange-600" />;
      case 'REJECTED': return <AlertCircle className="size-5 text-red-600" />;
      case 'MISSING': return <Circle className="size-5 text-gray-400" />;
    }
  };

  const getKPIStatusBadge = (status: KPIRequirement['status'], hasEvidence: boolean) => {
    const badges = {
      MISSING: { label: 'Manquant', color: 'bg-gray-100 text-gray-800' },
      COMPUTED: { label: 'Calculé', color: 'bg-blue-100 text-blue-800' },
      NEEDS_REVIEW: { label: 'À réviser', color: 'bg-orange-100 text-orange-800' },
      ACCEPTED: { label: 'Accepté', color: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
      // 🆕 Ajout des statuts manquants utilisés par les indicateurs
      missing: { label: 'Manquant', color: 'bg-gray-100 text-gray-800' },
      'in-progress': { label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
      provided: { label: 'Fourni', color: 'bg-green-100 text-green-800' },
      validated: { label: 'Validé', color: 'bg-emerald-100 text-emerald-800' }
    };
    const badge = badges[status] || { label: status, color: 'bg-gray-100 text-gray-800' }; // Fallback si statut inconnu
    
    return (
      <div className="flex items-center gap-2">
        <Badge className={badge.color}>{badge.label}</Badge>
        {!hasEvidence && status !== 'MISSING' && status !== 'missing' && (
          <Badge className="bg-red-50 text-red-700 border border-red-200">
            ⚠️ Sans preuve
          </Badge>
        )}
      </div>
    );
  };

  const handleMarkProvided = (itemId: string) => {
    markAsProvided(itemId);
  };

  const handleMarkMissing = (itemId: string) => {
    markAsMissing(itemId);
  };

  const handleAddComment = (itemId: string) => {
    if (!comment.trim()) return;
    
    updateCommentImmediate(itemId, comment.trim());
    setComment('');
    setSelectedItem(null);
    toast.success('Commentaire ajouté');
  };

  const handleSubmitForReview = () => {
    if (!canSubmitForReview) {
      toast.error('Impossible de soumettre pour revue', {
        description: `${mandatoryItems.length - mandatoryCompleted} items obligatoires manquants`
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simuler soumission
    setTimeout(() => {
      onUpdate?.({ ...pack, status: 'READY_FOR_REVIEW' });
      setIsSubmitting(false);
      toast.success('Pack soumis pour revue', {
        description: 'L\'auditeur sera notifié'
      });
    }, 1500);
  };

  const handleExportPDF = async () => {
    try {
      toast.info('Génération du PDF en cours...', {
        description: 'Veuillez patienter'
      });
      
      await exportPackToPDF(pack);
      
      toast.success('PDF généré avec succès', {
        description: 'Le fichier a été téléchargé'
      });
    } catch (error: any) {
      console.error('Export PDF error:', error);
      toast.error('Erreur lors de l\'export', {
        description: error.message || 'Une erreur est survenue'
      });
    }
  };

  const handleExportZIP = async () => {
    setZipModalOpen(true);
    setZipProgress(0);
    setZipMessage('Démarrage...');
    setZipError(null);
    setZipComplete(false);
    
    try {
      await exportPackToZIP(
        pack,
        undefined, // organizationName
        (progress, message) => {
          setZipProgress(progress);
          setZipMessage(message);
        }
      );
      
      setZipComplete(true);
    } catch (error: any) {
      console.error('Export ZIP error:', error);
      setZipError(error.message || 'Une erreur est survenue');
    }
  };

  const canMarkReadyForReview = can(currentUserRole, Action.MARK_READY_FOR_REVIEW);
  const canEditChecklist = can(currentUserRole, Action.CREATE_PACK); // CLIENT ou CONSULTANT

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[#0A3B2E]">{pack.name}</h1>
            {getStatusBadge(pack.status)}
            
            {/* 🆕 Active Users Badge */}
            {activeUsers.length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1.5 bg-blue-50 border-blue-200 text-blue-700">
                <Users className="size-3" />
                {activeUsers.length} actif{activeUsers.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            {pack.templateName} • Créé le {new Date(pack.createdAt).toLocaleDateString('fr-FR')}
          </p>
          
          {/* 🆕 Active Users Avatars */}
          {activeUsers.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Utilisateurs actifs :</span>
              <div className="flex -space-x-2">
                {activeUsers.slice(0, 5).map((user, index) => (
                  <div
                    key={user.id}
                    className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold border-2 border-white shadow-md"
                    title={user.name}
                    style={{ zIndex: 10 - index }}
                  >
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                ))}
                {activeUsers.length > 5 && (
                  <div className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold border-2 border-white shadow-md">
                    +{activeUsers.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 🆕 Bulk Mode Toggle */}
          <Button 
            variant={bulkMode ? "default" : "outline"} 
            size="sm"
            onClick={() => {
              setBulkMode(!bulkMode);
              if (bulkMode) {
                setSelectedIndicators(new Set()); // Clear selection when exiting bulk mode
              }
            }}
            className={bulkMode ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <CheckSquare className="size-4 mr-2" />
            {bulkMode ? 'Quitter sélection' : 'Mode sélection'}
          </Button>
          
          <Button variant="outline" size="sm">
            <Share2 className="size-4 mr-2" />
            Partager
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="size-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportZIP}>
            <Download className="size-4 mr-2" />
            Exporter ZIP
          </Button>
        </div>
      </div>

      {/* 🆕 Bulk Actions Bar */}
      {bulkMode && selectedIndicators.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-900">
                  {selectedIndicators.size} indicateur{selectedIndicators.size > 1 ? 's' : ''} sélectionné{selectedIndicators.size > 1 ? 's' : ''}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedIndicators(new Set())}
                  className="h-7 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                >
                  Tout désélectionner
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await bulkMarkAsProvided(Array.from(selectedIndicators));
                    setSelectedIndicators(new Set());
                    refetch();
                  }}
                  className="border-green-600 text-green-700 hover:bg-green-50"
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  Marquer fourni
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await bulkMarkAsMissing(Array.from(selectedIndicators));
                    setSelectedIndicators(new Set());
                    refetch();
                  }}
                  className="border-orange-600 text-orange-700 hover:bg-orange-50"
                >
                  <AlertCircle className="size-4 mr-2" />
                  Marquer manquant
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIndicators.size} indicateur(s) ?`)) {
                      await bulkDelete(Array.from(selectedIndicators));
                      setSelectedIndicators(new Set());
                      refetch();
                    }
                  }}
                  className="border-red-600 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Completion Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Score de complétude</span>
              <Info className="size-4 text-gray-400" />
            </div>
            <span className="text-2xl font-bold text-[#059669]">{pack.completionScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#059669] h-2 rounded-full transition-all duration-500"
              style={{ width: `${pack.completionScore}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{mandatoryCompleted}/{mandatoryItems.length} items obligatoires complétés</span>
            {canSubmitForReview ? (
              <span className="text-green-600 font-medium">✓ Prêt pour revue</span>
            ) : (
              <span className="text-orange-600">{mandatoryItems.length - mandatoryCompleted} items manquants</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="checklist">
            <FileText className="size-4 mr-2" />
            Checklist ({pack.checklistItems.length})
          </TabsTrigger>
          <TabsTrigger value="kpis">
            <BarChart3 className="size-4 mr-2" />
            KPIs ({pack.kpiRequirements.length})
          </TabsTrigger>
          <TabsTrigger value="evidences">
            <FolderOpen className="size-4 mr-2" />
            Preuves ({pack.evidences?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="discussion">
            <MessageSquare className="size-4 mr-2" />
            Discussion
            <CommentBadge entityType="pack" entityId={pack.id} showIcon={false} />
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="size-4 mr-2" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* ONGLET 1 : CHECKLIST */}
        <TabsContent value="checklist" className="space-y-4">
          {/* Empty state for newly created packs */}
          {pack.checklistItems.length === 0 && (
            <Card className="p-8 bg-blue-50 border-blue-200">
              <div className="text-center space-y-3">
                <Loader2 className="size-12 text-blue-600 mx-auto animate-spin" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Chargement des indicateurs...
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Le pack a été créé avec succès. Les indicateurs E/S/G sont en cours de chargement depuis le template.
                </p>
                <p className="text-sm text-red-600 mt-4">
                  ⚠️ Si le chargement prend plus de 5 secondes, cliquez sur "Actualiser" ci-dessous.
                </p>
                <div className="flex gap-3 justify-center mt-4">
                  {onBack && (
                    <Button variant="outline" onClick={onBack}>
                      Retour aux packs
                    </Button>
                  )}
                  <Button onClick={() => refetch()} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Actualisation...
                      </>
                    ) : (
                      'Actualiser'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          {/* Mandatory items first */}
          {pack.checklistItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="size-4 text-red-600" />
                Items obligatoires ({mandatoryCompleted}/{mandatoryItems.length})
              </h3>
              <div className="space-y-2">
                {pack.checklistItems
                  .filter(item => item.requirement_level === 'MANDATORY')
                  .map(item => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* 🆕 Checkbox for bulk selection */}
                          {bulkMode && (
                            <div className="flex-shrink-0 mt-1">
                              <Checkbox
                                checked={selectedIndicators.has(item.id)}
                                onCheckedChange={(checked) => {
                                  const newSelection = new Set(selectedIndicators);
                                  if (checked) {
                                    newSelection.add(item.id);
                                  } else {
                                    newSelection.delete(item.id);
                                  }
                                  setSelectedIndicators(newSelection);
                                }}
                              />
                            </div>
                          )}
                          
                          <div className="flex-shrink-0 mt-1">
                            {getItemStatusIcon(item.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">{item.label}</h4>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                )}
                                {item.comment && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700">
                                    <MessageSquare className="size-3 inline mr-1" />
                                    {item.comment}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {canEditChecklist && item.status === 'MISSING' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkProvided(item.id)}
                                    disabled={isUpdating(item.id)}
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                  >
                                    {isUpdating(item.id) ? (
                                      <Loader2 className="size-4 mr-1 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="size-4 mr-1" />
                                    )}
                                    Fourni
                                  </Button>
                                )}
                                {canEditChecklist && item.status === 'PROVIDED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkMissing(item.id)}
                                    disabled={isUpdating(item.id)}
                                  >
                                    {isUpdating(item.id) && <Loader2 className="size-4 mr-1 animate-spin" />}
                                    Marquer manquant
                                  </Button>
                                )}
                                {canEditChecklist && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setComment(item.comment || '');
                                    }}
                                    disabled={isUpdating(item.id)}
                                  >
                                    <MessageSquare className="size-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Recommended items */}
          {pack.checklistItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="size-4 text-blue-600" />
                Items recommandés ({pack.checklistItems.filter(i => i.requirement_level === 'RECOMMENDED' && ['PROVIDED', 'ACCEPTED'].includes(i.status)).length}/{pack.checklistItems.filter(i => i.requirement_level === 'RECOMMENDED').length})
              </h3>
              <div className="space-y-2">
                {pack.checklistItems
                  .filter(item => item.requirement_level === 'RECOMMENDED')
                  .map(item => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow border-blue-100">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {getItemStatusIcon(item.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">{item.label}</h4>
                                {item.description && (
                                  <p className="text-sm text-gray-600">{item.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {canEditChecklist && item.status === 'MISSING' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkProvided(item.id)}
                                  >
                                    <CheckCircle2 className="size-4 mr-1" />
                                    Fourni
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ONGLET 2 : KPIs */}
        <TabsContent value="kpis" className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {pack.kpiRequirements.map(kpi => (
              <Card key={kpi.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {kpi.indicator_code}
                        </code>
                        {getKPIStatusBadge(kpi.status, kpi.has_evidence)}
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {kpi.indicator_name || kpi.indicator_code}
                      </h4>
                      {kpi.value !== null && kpi.value !== undefined && (
                        <div className="text-2xl font-bold text-[#059669] mt-2">
                          {kpi.value.toLocaleString('fr-FR')} {kpi.unit}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <span>Période : {kpi.period}</span>
                        {kpi.evidence_count && kpi.evidence_count > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <FolderOpen className="size-3" />
                            {kpi.evidence_count} preuve{kpi.evidence_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline">
                        <Info className="size-4 mr-1" />
                        Transparence
                      </Button>
                      {!kpi.has_evidence && kpi.status !== 'MISSING' && (
                        <Button size="sm" variant="outline" className="text-red-600 border-red-600">
                          <AlertCircle className="size-4 mr-1" />
                          Ajouter preuve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ONGLET 3 : PREUVES */}
        <TabsContent value="evidences" className="space-y-4">
          <EvidenceVault packId={pack.id} />
        </TabsContent>

        {/* ONGLET 4 : DISCUSSION - Phase 8 */}
        <TabsContent value="discussion" className="space-y-4">
          <CommentThread
            entityType="pack"
            entityId={pack.id}
            currentUserId={currentUserId}
            currentUserName={currentUser?.name || "Current User"}
            currentUserAvatar={currentUser?.avatar}
            onCommentAdded={() => {
              toast.success("Commentaire ajouté");
              refetch();
            }}
          />
        </TabsContent>

        {/* ONGLET 5 : HISTORIQUE */}
        <TabsContent value="history" className="space-y-4">
          <AuditTrail entityType="pack" entityId={pack.id} />
        </TabsContent>
      </Tabs>

      {/* Actions Footer */}
      {canMarkReadyForReview && pack.status === 'IN_PROGRESS' && (
        <Card className="bg-[#E8F3F0] border-[#059669]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#0A3B2E] mb-1">
                  Prêt à soumettre pour revue ?
                </h3>
                <p className="text-sm text-gray-700">
                  {canSubmitForReview
                    ? 'Tous les items obligatoires sont complétés. Vous pouvez soumettre ce pack à l\'auditeur.'
                    : `Il manque ${mandatoryItems.length - mandatoryCompleted} item(s) obligatoire(s) avant de pouvoir soumettre.`
                  }
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleSubmitForReview}
                disabled={!canSubmitForReview || isSubmitting}
                className="bg-[#059669] hover:bg-[#048558]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Soumission...
                  </>
                ) : (
                  <>
                    Soumettre pour revue
                    <Send className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Add Comment */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Ajouter un commentaire</CardTitle>
              <CardDescription>{selectedItem.label}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="comment">Commentaire</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ajoutez vos remarques..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                  Annuler
                </Button>
                <Button onClick={() => handleAddComment(selectedItem.id)}>
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* ZIP Export Modal */}
      <ExportZipModal
        isOpen={zipModalOpen}
        onClose={() => setZipModalOpen(false)}
        progress={zipProgress}
        message={zipMessage}
        error={zipError}
        isComplete={zipComplete}
      />
    </div>
  );
}

export default PackView;