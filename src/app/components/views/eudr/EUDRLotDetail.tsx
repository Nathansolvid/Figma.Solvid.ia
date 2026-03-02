import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  File,
  Download,
  Trash2,
  MessageSquare,
  Clock,
  User,
  Eye,
  Shield
} from "lucide-react";
import { 
  LotStatus, 
  ChecklistItemStatus,
  EUDRCommodity,
  COMMODITY_LABELS, 
  STATUS_LABELS,
  EVIDENCE_TYPE_LABELS,
  EUDR_CHECKLIST_TEMPLATE
} from "@/types/eudr";

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface EUDRLotDetailProps {
  lotId: string;
  onBack: () => void;
  userRole: "client" | "consultant" | "auditor" | "admin";
  posture: PostureType;
  parcours: ParcoursType;
}

export function EUDRLotDetail({ lotId, onBack, userRole, posture, parcours }: EUDRLotDetailProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [status, setStatus] = useState<LotStatus>("In Progress");
  const [comment, setComment] = useState("");

  // Adaptations selon posture
  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";
  const isCsrdObligatoire = parcours === "csrd-obligatoire";

  // Vocabulaire adapté
  const labels = {
    backButton: isAuditExterne ? "Retour aux lots à auditer" : "Retour aux lots",
    saveButton: isPreAudit ? "Sauvegarder (en attente validation)" : "Sauvegarder",
    readyButton: isPreAudit ? "Marquer prêt pour pré-audit" : "Marquer prêt pour revue",
    approveButton: isAuditExterne ? "Valider conformité" : "Approuver",
    rejectButton: isAuditExterne ? "Non-conformité EUDR" : "Rejeter",
    requestChangesButton: isAuditExterne ? "Demander clarifications" : "Demander des modifications",
  };

  // Permissions
  const canEdit = userRole !== "auditor";
  const canApprove = userRole === "auditor" || userRole === "admin";

  // Mock data
  const lot = {
    id: lotId,
    commodity: "coffee" as EUDRCommodity,
    supplier: "Green Valley Farms",
    country: "Brazil",
    shipmentDate: "2026-01-15",
    quantity: 5000,
    unit: "kg",
    productDescription: "Arabica coffee beans, Grade A",
    geoDataType: "coordinates" as const,
    geoLat: -15.7942,
    geoLng: -47.8822,
    geoText: "Cerrado region, Minas Gerais",
    noDeforestation: "yes" as const,
    localLawCompliance: "yes" as const,
    assignedTo: "Sophie Martin",
    dueDate: "2026-02-01"
  };

  const checklistItems = EUDR_CHECKLIST_TEMPLATE.map((template, index) => ({
    ...template,
    id: `CLI-${index + 1}`,
    lot_id: lotId,
    status: (index < 6 ? "Accepted" : index < 8 ? "Provided" : "Missing") as ChecklistItemStatus,
    updated_at: new Date().toISOString(),
    comment: index === 7 ? "En attente de validation" : undefined
  }));

  const evidences = [
    {
      id: "EV-001",
      type: "invoice" as const,
      title: "Facture commerciale",
      fileName: "invoice_GVF_2026_001.pdf",
      uploadedBy: "Sophie Martin",
      uploadedAt: "2026-01-16"
    },
    {
      id: "EV-002",
      type: "attestation" as const,
      title: "Attestation fournisseur",
      fileName: "supplier_declaration_GVF.pdf",
      uploadedBy: "Sophie Martin",
      uploadedAt: "2026-01-16"
    },
    {
      id: "EV-003",
      type: "geodata" as const,
      title: "Coordonnées GPS parcelles",
      fileName: "gps_coordinates.kml",
      uploadedBy: "Sophie Martin",
      uploadedAt: "2026-01-17"
    }
  ];

  const comments = [
    {
      id: "C-001",
      author: "Sophie Martin",
      role: "Consultant",
      content: "Toutes les preuves principales ont été uploadées. En attente de validation de l'attestation.",
      timestamp: "2026-01-18 14:32"
    },
    {
      id: "C-002",
      author: "Jean Dupont",
      role: "Auditeur",
      content: "Merci. Pouvez-vous préciser la surface totale des parcelles concernées dans les notes ?",
      timestamp: "2026-01-19 09:15"
    }
  ];

  const getChecklistStatusColor = (status: ChecklistItemStatus) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Provided":
        return "bg-blue-100 text-blue-800";
      case "Needs Review":
        return "bg-purple-100 text-purple-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getChecklistStatusIcon = (status: ChecklistItemStatus) => {
    switch (status) {
      case "Accepted":
        return <CheckCircle2 className="h-4 w-4" />;
      case "Rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const mandatoryItemsCount = checklistItems.filter(i => i.requirement_level === "mandatory").length;
  const acceptedMandatoryCount = checklistItems.filter(i => 
    i.requirement_level === "mandatory" && i.status === "Accepted"
  ).length;
  const completionRate = Math.round((acceptedMandatoryCount / mandatoryItemsCount) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-3">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {labels.backButton}
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold text-foreground">Lot {lot.id}</h1>
            <Badge className="bg-purple-100 text-purple-800">
              {COMMODITY_LABELS[lot.commodity]}
            </Badge>
            <Badge className={
              status === "Approved" ? "bg-green-100 text-green-800" :
              status === "Ready for Review" ? "bg-blue-100 text-blue-800" :
              status === "Changes Requested" ? "bg-amber-100 text-amber-800" :
              status === "Rejected" ? "bg-red-100 text-red-800" :
              "bg-gray-100 text-gray-800"
            }>
              {STATUS_LABELS[status]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Fournisseur: {lot.supplier}</span>
            <span>•</span>
            <span>Origine: {lot.country}</span>
            <span>•</span>
            <span>Date: {new Date(lot.shipmentDate).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && status !== "Approved" && (
            <Button variant="outline">
              {labels.saveButton}
            </Button>
          )}
          {canApprove && status === "Ready for Review" && (
            <>
              <Button variant="outline" className="border-amber-500 text-amber-700">
                <AlertCircle className="h-4 w-4 mr-2" />
                {labels.requestChangesButton}
              </Button>
              <Button variant="outline" className="border-red-500 text-red-700">
                <XCircle className="h-4 w-4 mr-2" />
                {labels.rejectButton}
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {labels.approveButton}
              </Button>
            </>
          )}
          {canEdit && status === "In Progress" && completionRate >= 80 && (
            <Button className="bg-[#0F4C3A] hover:bg-[#0A3B2E]">
              {labels.readyButton}
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Complétude checklist obligatoire</span>
            <span className="text-sm font-semibold">{completionRate}%</span>
          </div>
          <div className="w-full bg-border rounded-full h-3">
            <div 
              className={`h-full rounded-full transition-all ${
                completionRate >= 80 ? 'bg-green-600' :
                completionRate >= 50 ? 'bg-amber-500' :
                'bg-red-500'
              }`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {acceptedMandatoryCount} / {mandatoryItemsCount} éléments obligatoires validés
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="checklist">
            Checklist ({checklistItems.filter(i => i.status === "Missing").length} manquants)
          </TabsTrigger>
          <TabsTrigger value="evidence">
            Preuves ({evidences.length})
          </TabsTrigger>
          <TabsTrigger value="comments">
            Discussion ({comments.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Informations */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails du lot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Commodity</Label>
                  <Input value={COMMODITY_LABELS[lot.commodity]} disabled={!canEdit} />
                </div>
                <div className="space-y-2">
                  <Label>Fournisseur</Label>
                  <Input value={lot.supplier} disabled={!canEdit} />
                </div>
                <div className="space-y-2">
                  <Label>Pays d'origine</Label>
                  <Input value={lot.country} disabled={!canEdit} />
                </div>
                <div className="space-y-2">
                  <Label>Date d'expédition</Label>
                  <Input type="date" value={lot.shipmentDate} disabled={!canEdit} />
                </div>
                <div className="space-y-2">
                  <Label>Quantité</Label>
                  <Input value={lot.quantity} disabled={!canEdit} />
                </div>
                <div className="space-y-2">
                  <Label>Unité</Label>
                  <Input value={lot.unit} disabled={!canEdit} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description du produit</Label>
                <Textarea value={lot.productDescription} disabled={!canEdit} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Géolocalisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type de données géographiques</Label>
                <Select value={lot.geoDataType} disabled={!canEdit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Description textuelle</SelectItem>
                    <SelectItem value="coordinates">Coordonnées GPS</SelectItem>
                    <SelectItem value="file">Fichier géographique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {lot.geoDataType === "text" && (
                <div className="space-y-2">
                  <Label>Description de la localisation</Label>
                  <Textarea value={lot.geoText} disabled={!canEdit} rows={3} />
                </div>
              )}
              {lot.geoDataType === "coordinates" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Latitude</Label>
                    <Input value={lot.geoLat} disabled={!canEdit} />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude</Label>
                    <Input value={lot.geoLng} disabled={!canEdit} />
                  </div>
                  <div className="col-span-2 bg-muted p-3 rounded-lg text-sm">
                    📍 {lot.geoLat}, {lot.geoLng}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Notes sur la localisation</Label>
                <Textarea value={lot.geoText} disabled={!canEdit} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Déclarations de conformité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Déclaration "Pas de déforestation après 31/12/2020"</Label>
                <Select value={lot.noDeforestation} disabled={!canEdit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Oui - Confirmé</SelectItem>
                    <SelectItem value="no">Non</SelectItem>
                    <SelectItem value="unknown">Inconnu / En cours</SelectItem>
                  </SelectContent>
                </Select>
                {lot.noDeforestation === "yes" && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Conforme EUDR</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Conformité aux lois locales</Label>
                <Select value={lot.localLawCompliance} disabled={!canEdit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Oui - Confirmé</SelectItem>
                    <SelectItem value="no">Non</SelectItem>
                    <SelectItem value="unknown">Inconnu / En cours</SelectItem>
                  </SelectContent>
                </Select>
                {lot.localLawCompliance === "yes" && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Conforme</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsable</Label>
                  <Input value={lot.assignedTo} disabled={!canEdit} />
                </div>
                <div className="space-y-2">
                  <Label>Date limite</Label>
                  <Input type="date" value={lot.dueDate} disabled={!canEdit} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Checklist */}
        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>Checklist EUDR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <div key={item.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-xs font-semibold bg-muted px-2 py-1 rounded">
                            {item.item_code}
                          </span>
                          <span className="font-medium">{item.item_label}</span>
                          {item.requirement_level === "mandatory" && (
                            <Badge variant="outline" className="border-red-500 text-red-700 text-xs">
                              Obligatoire
                            </Badge>
                          )}
                        </div>
                        {item.comment && (
                          <p className="text-sm text-muted-foreground mt-2">
                            💬 {item.comment}
                          </p>
                        )}
                      </div>
                      <Badge className={getChecklistStatusColor(item.status)}>
                        <div className="flex items-center gap-1">
                          {getChecklistStatusIcon(item.status)}
                          <span className="text-xs capitalize">{item.status}</span>
                        </div>
                      </Badge>
                    </div>
                    {canEdit && item.status !== "Accepted" && (
                      <div className="flex gap-2 mt-3">
                        <Select defaultValue={item.status} disabled={!canEdit}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Missing">Manquant</SelectItem>
                            <SelectItem value="Provided">Fourni</SelectItem>
                            <SelectItem value="Needs Review">À revoir</SelectItem>
                            <SelectItem value="Accepted">Accepté</SelectItem>
                            <SelectItem value="Rejected">Rejeté</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Commentaire..." className="flex-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Preuves */}
        <TabsContent value="evidence" className="space-y-4">
          {canEdit && (
            <Card>
              <CardContent className="p-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-2">Uploader une preuve</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Formats acceptés: PDF, JPG, PNG, KML, CSV (max 10 MB)
                  </p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Choisir un fichier
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Documents uploadés ({evidences.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evidences.map((evidence) => (
                  <div key={evidence.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#E8F3F0] p-3 rounded-lg">
                        <File className="h-5 w-5 text-[#0F4C3A]" />
                      </div>
                      <div>
                        <p className="font-medium">{evidence.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {evidence.fileName} • {EVIDENCE_TYPE_LABELS[evidence.type]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Uploadé par {evidence.uploadedBy} le {new Date(evidence.uploadedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Discussion */}
        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fil de discussion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.map((comm) => (
                <div key={comm.id} className="border-l-4 border-[#0F4C3A] pl-4 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{comm.author}</span>
                    <Badge variant="outline" className="text-xs">{comm.role}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {comm.timestamp}
                    </span>
                  </div>
                  <p className="text-sm">{comm.content}</p>
                </div>
              ))}

              <div className="flex gap-2 mt-6">
                <Textarea 
                  placeholder="Ajouter un commentaire..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <Button className="bg-[#0F4C3A] hover:bg-[#0A3B2E]">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Envoyer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}