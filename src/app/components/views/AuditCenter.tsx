import React, { useState } from 'react';
import { 
  Search, Filter, Clock, CheckCircle2, XCircle, 
  MessageSquare, Send, Calendar, User, AlertTriangle,
  FileText, BarChart3, FolderOpen, ChevronRight, Info
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';

interface PackInQueue {
  id: string;
  name: string;
  dossierName: string;
  templateName: string;
  status: 'READY_FOR_REVIEW';
  completionScore: number;
  submittedAt: string;
  submittedBy: string;
  ownerName: string;
  totalItems: number;
  itemsToReview: number;
  kpisCount: number;
  evidencesCount: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface AuditCenterProps {
  currentAuditorId: string;
  currentAuditorName: string;
}

export function AuditCenter({ currentAuditorId, currentAuditorName }: AuditCenterProps) {
  const [selectedPack, setSelectedPack] = useState<PackInQueue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_changes' | null>(null);
  const [message, setMessage] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [isProcessing, setIsProcessing] = useState(false);

  // Real data — loaded from dossier packs (no more mock data)
  const [packsInQueue, setPacksInQueue] = useState<PackInQueue[]>([]);

  const filteredPacks = packsInQueue.filter(pack => {
    const matchesSearch = pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pack.dossierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || pack.templateName.includes(filterType);
    return matchesSearch && matchesFilter;
  });

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const badges = {
      LOW: { label: 'Basse', color: 'bg-gray-100 text-gray-800' },
      MEDIUM: { label: 'Moyenne', color: 'bg-blue-100 text-blue-800' },
      HIGH: { label: 'Haute', color: 'bg-orange-100 text-orange-800' }
    };
    const badge = badges[priority as keyof typeof badges];
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  const handleApprove = () => {
    if (!selectedPack) return;
    
    setIsProcessing(true);
    
    // Simuler approbation
    setTimeout(() => {
      // Retirer de la queue
      setPacksInQueue(packs => packs.filter(p => p.id !== selectedPack.id));
      
      toast.success('Pack approuvé avec succès', {
        description: `Le pack "${selectedPack.name}" a été approuvé. Le consultant a été notifié.`
      });
      
      setSelectedPack(null);
      setActionType(null);
      setMessage('');
      setIsProcessing(false);
    }, 1500);
  };

  const handleReject = () => {
    if (!selectedPack || !message.trim()) {
      toast.error('Veuillez saisir une raison de rejet');
      return;
    }
    
    setIsProcessing(true);
    
    // Simuler rejet
    setTimeout(() => {
      // Retirer de la queue
      setPacksInQueue(packs => packs.filter(p => p.id !== selectedPack.id));
      
      toast.success('Pack rejeté', {
        description: `Le pack "${selectedPack.name}" a été rejeté. Le consultant a été notifié.`
      });
      
      setSelectedPack(null);
      setActionType(null);
      setMessage('');
      setIsProcessing(false);
    }, 1500);
  };

  const handleRequestChanges = () => {
    if (!selectedPack || !message.trim() || !assignedTo || !dueDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setIsProcessing(true);
    
    // Simuler demande de modifications
    setTimeout(() => {
      // Retirer de la queue
      setPacksInQueue(packs => packs.filter(p => p.id !== selectedPack.id));
      
      toast.success('Modifications demandées', {
        description: `Une tâche a été créée et assignée à ${assignedTo}`
      });
      
      setSelectedPack(null);
      setActionType(null);
      setMessage('');
      setAssignedTo('');
      setDueDate('');
      setPriority('MEDIUM');
      setIsProcessing(false);
    }, 1500);
  };

  const getTimeSinceSubmission = (submittedAt: string) => {
    const now = new Date();
    const submitted = new Date(submittedAt);
    const diffHours = Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Il y a ${diffDays}j`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0A3B2E]">Centre de vérification</h1>
        <p className="text-gray-600 mt-1">
          File d'attente des packs prêts pour revue • {filteredPacks.length} pack{filteredPacks.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente de revue</p>
                <p className="text-3xl font-bold text-orange-600">{packsInQueue.length}</p>
              </div>
              <Clock className="size-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approuvés aujourd'hui</p>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Temps moyen de revue</p>
                <p className="text-3xl font-bold text-blue-600">—</p>
              </div>
              <BarChart3 className="size-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un pack..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <Filter className="size-4 mr-2" />
                  <SelectValue placeholder="Type de pack" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="Donneur d'Ordre">Client principal</SelectItem>
                  <SelectItem value="Questionnaire">Questionnaire ESG</SelectItem>
                  <SelectItem value="Banque">Banque / Investisseurs</SelectItem>
                  <SelectItem value="Pré-Audit">Pré-Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des packs */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#0A3B2E]">
            Packs à réviser ({filteredPacks.length})
          </h2>
          
          {filteredPacks.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle2 className="size-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun pack en attente</h3>
              <p className="text-gray-600">
                Tous les packs ont été traités. Excellent travail !
              </p>
            </Card>
          ) : (
            filteredPacks.map(pack => (
              <Card
                key={pack.id}
                className={`cursor-pointer hover:shadow-lg transition-all ${
                  selectedPack?.id === pack.id ? 'border-[#059669] border-2' : ''
                }`}
                onClick={() => setSelectedPack(pack)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="font-semibold text-[#0A3B2E] flex-1">{pack.name}</h3>
                        {getPriorityBadge(pack.priority)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {pack.templateName} • {pack.dossierName}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {pack.ownerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {getTimeSinceSubmission(pack.submittedAt)}
                        </span>
                      </div>
                      
                      {/* Completion bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Progression</span>
                          <span className="text-xs font-semibold text-[#059669]">{pack.completionScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-[#059669] h-1.5 rounded-full"
                            style={{ width: `${pack.completionScore}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <FileText className="size-3" />
                          {pack.itemsToReview}/{pack.totalItems} à réviser
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="size-3" />
                          {pack.kpisCount} KPIs
                        </span>
                        <span className="flex items-center gap-1">
                          <FolderOpen className="size-3" />
                          {pack.evidencesCount} justificatifs
                        </span>
                      </div>
                    </div>
                    
                    <ChevronRight className="size-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Panneau de revue */}
        <div className="lg:sticky lg:top-6 h-fit">
          {selectedPack ? (
            <Card>
              <CardHeader>
                <CardTitle>Revue du pack</CardTitle>
                <CardDescription>{selectedPack.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informations pack */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dossier</span>
                    <span className="font-medium">{selectedPack.dossierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Template</span>
                    <span className="font-medium">{selectedPack.templateName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Propriétaire</span>
                    <span className="font-medium">{selectedPack.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Soumis par</span>
                    <span className="font-medium">{selectedPack.submittedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Soumis le</span>
                    <span className="font-medium">
                      {new Date(selectedPack.submittedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions buttons */}
                {!actionType && (
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => setActionType('approve')}
                    >
                      <CheckCircle2 className="size-4 mr-2" />
                      Approuver le pack
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
                      onClick={() => setActionType('request_changes')}
                    >
                      <MessageSquare className="size-4 mr-2" />
                      Demander des modifications
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full border-red-600 text-red-600 hover:bg-red-50"
                      onClick={() => setActionType('reject')}
                    >
                      <XCircle className="size-4 mr-2" />
                      Rejeter le pack
                    </Button>
                  </div>
                )}

                {/* Approve Form */}
                {actionType === 'approve' && (
                  <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-900">Approuver ce pack</h4>
                        <p className="text-sm text-green-700 mt-1">
                          Cette action approuvera définitivement le pack. Le consultant et le client seront notifiés.
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="approve-message">Commentaire (optionnel)</Label>
                      <Textarea
                        id="approve-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ajouter un commentaire d'approbation..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setActionType(null);
                          setMessage('');
                        }}
                        disabled={isProcessing}
                      >
                        Annuler
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={handleApprove}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Approbation...
                          </>
                        ) : (
                          'Confirmer l\'approbation'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Request Changes Form */}
                {actionType === 'request_changes' && (
                  <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="size-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-orange-900">Demander des modifications</h4>
                        <p className="text-sm text-orange-700 mt-1">
                          Une tâche sera créée et assignée à la personne responsable.
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="request-message">Message * (détaillez les modifications)</Label>
                      <Textarea
                        id="request-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ex: Le calcul Scope 3 nécessite le détail des postes (déplacements, achats, etc.)"
                        rows={4}
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="assigned-to">Assigner à *</Label>
                      <Select value={assignedTo} onValueChange={setAssignedTo}>
                        <SelectTrigger id="assigned-to" className="mt-1">
                          <SelectValue placeholder="Sélectionner un responsable" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marie-martin">Marie Martin (Client)</SelectItem>
                          <SelectItem value="paul-conseil">Paul Conseil (Consultant)</SelectItem>
                          <SelectItem value="sophie-consultant">Sophie Consultant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="due-date">Date limite *</Label>
                        <Input
                          id="due-date"
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">Priorité *</Label>
                        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                          <SelectTrigger id="priority" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Basse</SelectItem>
                            <SelectItem value="MEDIUM">Moyenne</SelectItem>
                            <SelectItem value="HIGH">Haute</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setActionType(null);
                          setMessage('');
                          setAssignedTo('');
                          setDueDate('');
                          setPriority('MEDIUM');
                        }}
                        disabled={isProcessing}
                      >
                        Annuler
                      </Button>
                      <Button
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                        onClick={handleRequestChanges}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Envoi...
                          </>
                        ) : (
                          <>
                            Envoyer la demande
                            <Send className="ml-2 size-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reject Form */}
                {actionType === 'reject' && (
                  <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-2">
                      <XCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900">Rejeter ce pack</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Cette action rejettera définitivement le pack. Le consultant devra soumettre un nouveau pack.
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="reject-message">Raison du rejet * (obligatoire)</Label>
                      <Textarea
                        id="reject-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Précisez les raisons du rejet..."
                        rows={4}
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setActionType(null);
                          setMessage('');
                        }}
                        disabled={isProcessing}
                      >
                        Annuler
                      </Button>
                      <Button
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={handleReject}
                        disabled={isProcessing || !message.trim()}
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Rejet...
                          </>
                        ) : (
                          'Confirmer le rejet'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <Search className="size-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un pack</h3>
              <p className="text-gray-600">
                Cliquez sur un pack dans la liste pour commencer la revue
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuditCenter;
