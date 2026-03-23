// ============================================================================
// EVIDENCE VAULT - Gestion des preuves et documents
// ============================================================================

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Upload,
  File,
  FileText,
  Image,
  FileSpreadsheet,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  Paperclip,
  Plus,
  FolderOpen,
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
import { Label } from "@/app/components/ui/label";
import { useEvidence } from "@/hooks/useEvidence";
import { useAllIndicators } from "@/hooks/useAllIndicators";
import { type Evidence } from "@/services/dataProvider";
import { toast } from "sonner";

interface EvidenceVaultProps {
  packId?: string;
}

export function EvidenceVault({ packId }: EvidenceVaultProps) {
  const { evidence, loading, uploadEvidence, deleteEvidence, downloadEvidence } = useEvidence(packId);
  const { indicators } = useAllIndicators();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    category: "" as 'E' | 'S' | 'G' | '',
    period: "",
    linkedIndicators: [] as string[],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Empty state
  if (!loading && evidence.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Justificatifs & Documents</h1>
            <p className="text-muted-foreground">
              Centralisez vos justificatifs : factures, contrats, rapports, photos...
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Paperclip className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Aucun justificatif uploadé</h3>
              <p className="text-muted-foreground mb-6">
                Uploadez vos documents justificatifs pour garantir l'auditabilité de vos données ESG.
                Formats acceptés : PDF, Excel, images, etc.
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Uploader mon premier justificatif
              </Button>
              <div className="mt-8 pt-8 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Fonctionnalités :</strong>
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground text-left">
                  <div className="flex items-start gap-2">
                    <Paperclip className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Lien automatique aux indicateurs</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Support multi-formats</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Horodatage et traçabilité</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Téléchargement à tout moment</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <UploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          formData={uploadForm}
          onFormChange={setUploadForm}
          indicators={indicators}
          onUpload={async () => {
            if (!selectedFile || !packId) {
              toast.error("Fichier ou pack manquant");
              return;
            }

            try {
              await uploadEvidence(selectedFile, {
                packId,
                category: uploadForm.category || undefined,
                period: uploadForm.period || undefined,
                linkedIndicators: uploadForm.linkedIndicators,
              });
              toast.success("Justificatif uploadé avec succès");
              setUploadDialogOpen(false);
              setSelectedFile(null);
              setUploadForm({ category: '', period: '', linkedIndicators: [] });
            } catch (error) {
              toast.error("Erreur lors de l'upload");
            }
          }}
        />
      </div>
    );
  }

  // Filtres
  const filteredEvidence = evidence.filter((ev) => {
    if (searchQuery && !ev.fileName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== "all" && ev.category !== categoryFilter) {
      return false;
    }
    if (typeFilter !== "all") {
      const fileExt = ev.fileName.split('.').pop()?.toLowerCase();
      if (typeFilter === "pdf" && fileExt !== "pdf") return false;
      if (typeFilter === "excel" && !['xlsx', 'xls', 'csv'].includes(fileExt || '')) return false;
      if (typeFilter === "image" && !['jpg', 'jpeg', 'png', 'gif'].includes(fileExt || '')) return false;
    }
    return true;
  });

  // Stats
  const stats = {
    total: evidence.length,
    pdf: evidence.filter(ev => ev.fileName.endsWith('.pdf')).length,
    excel: evidence.filter(ev => ['xlsx', 'xls', 'csv'].some(ext => ev.fileName.endsWith(`.${ext}`))).length,
    images: evidence.filter(ev => ['jpg', 'jpeg', 'png', 'gif'].some(ext => ev.fileName.endsWith(`.${ext}`))).length,
    totalSize: evidence.reduce((sum, ev) => sum + ev.fileSize, 0),
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Justificatifs & Documents</h1>
          <p className="text-muted-foreground">
            Centralisez vos justificatifs : factures, contrats, rapports, photos...
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Uploader un justificatif
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <File className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">PDF</p>
                <p className="text-2xl font-bold">{stats.pdf}</p>
              </div>
              <FileText className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Excel</p>
                <p className="text-2xl font-bold">{stats.excel}</p>
              </div>
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Images</p>
                <p className="text-2xl font-bold">{stats.images}</p>
              </div>
              <Image className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taille Totale</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un document..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="E">Environnement</SelectItem>
                <SelectItem value="S">Social</SelectItem>
                <SelectItem value="G">Gouvernance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="image">Images</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table des preuves */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredEvidence.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fichier</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Indicateurs liés</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Date d'upload</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvidence.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(ev.fileName)}
                      <span className="font-medium">{ev.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {ev.category ? (
                      <Badge className={
                        ev.category === 'E' ? 'bg-green-100 text-green-700' :
                        ev.category === 'S' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }>
                        {ev.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{ev.period || '-'}</TableCell>
                  <TableCell>
                    {ev.linkedIndicators.length > 0 ? (
                      <Badge variant="outline">{ev.linkedIndicators.length} indicateur(s)</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFileSize(ev.fileSize)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(ev.uploadedAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadEvidence(ev)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!confirm("Supprimer ce justificatif ?")) return;
                          try {
                            await deleteEvidence(ev.id);
                            toast.success("Justificatif supprimé");
                          } catch (error) {
                            toast.error("Erreur lors de la suppression");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        selectedFile={selectedFile}
        onFileSelect={setSelectedFile}
        formData={uploadForm}
        onFormChange={setUploadForm}
        indicators={indicators}
        onUpload={async () => {
          if (!selectedFile || !packId) {
            toast.error("Fichier ou pack manquant");
            return;
          }

          try {
            await uploadEvidence(selectedFile, {
              packId,
              category: uploadForm.category || undefined,
              period: uploadForm.period || undefined,
              linkedIndicators: uploadForm.linkedIndicators,
            });
            toast.success("Justificatif uploadé avec succès");
            setUploadDialogOpen(false);
            setSelectedFile(null);
            setUploadForm({ category: '', period: '', linkedIndicators: [] });
          } catch (error) {
            toast.error("Erreur lors de l'upload");
          }
        }}
      />
    </div>
  );
}

// ============================================================================
// UPLOAD DIALOG
// ============================================================================

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  formData: any;
  onFormChange: (data: any) => void;
  indicators: any[];
  onUpload: () => void;
}

function UploadDialog({
  open,
  onOpenChange,
  selectedFile,
  onFileSelect,
  formData,
  onFormChange,
  indicators,
  onUpload,
}: UploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Uploader un justificatif</DialogTitle>
          <DialogDescription>
            Ajoutez un document justificatif à votre base de justificatifs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File picker */}
          <div>
            <Label>Fichier *</Label>
            <div className="mt-2">
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 border rounded-md">
                  {getFileIcon(selectedFile.name)}
                  <div className="flex-1">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileSelect(null)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Sélectionner un fichier
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onFileSelect(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => onFormChange({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="E">Environnement</SelectItem>
                  <SelectItem value="S">Social</SelectItem>
                  <SelectItem value="G">Gouvernance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Période</Label>
              <Input
                placeholder="Ex: 2025"
                value={formData.period}
                onChange={(e) => onFormChange({ ...formData, period: e.target.value })}
              />
            </div>
          </div>

          {/* Linked indicators (simplified for now) */}
          <div>
            <Label>Indicateurs liés (optionnel)</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {formData.linkedIndicators.length} indicateur(s) sélectionné(s)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={onUpload} disabled={!selectedFile}>
            Uploader
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (ext === 'pdf') {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  }
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
    return <Image className="h-5 w-5 text-blue-500" />;
  }
  
  return <File className="h-5 w-5 text-muted-foreground" />;
}