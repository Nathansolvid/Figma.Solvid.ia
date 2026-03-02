// ============================================================================
// CHECKLIST & WORKFLOW - Excel-First Approach (FONCTIONNEL)
// ============================================================================

import { useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
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
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Download,
  Upload,
  CheckSquare,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  FileSpreadsheet,
  PlayCircle,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { useTasks } from "@/hooks/useTasks";
import { type Task } from "@/services/dataProvider";
import { downloadExcelTemplate, getAllTemplates } from "@/utils/excelTemplates";
import { toast } from "sonner";

interface ChecklistWorkflowProps {
  posture?: string;
  packId?: string;
}

export function ChecklistWorkflow({ posture, packId }: ChecklistWorkflowProps) {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks(packId);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  // Dialog création/édition
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    category: "General" as Task['category'],
    status: "pending" as Task['status'],
    priority: "medium" as Task['priority'],
    assignedTo: "",
    dueDate: "",
    linkedIndicators: [] as string[],
    hasExcelTemplate: false,
    tags: [] as string[],
  });

  // Dialog templates Excel
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);

  // Empty state si aucune tâche
  if (!loading && tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Checklist & Workflow</h1>
            <p className="text-muted-foreground">
              Suivi des tâches de collecte et consolidation des données ESG - Approche Excel-first
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Aucune tâche créée</h3>
              <p className="text-muted-foreground mb-6">
                Organisez votre collecte de données ESG en créant des tâches avec templates Excel, 
                assignations et suivi de validation. Idéal pour piloter votre workflow avec vos équipes.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => {
                  setEditingTask(null);
                  setTaskForm({
                    title: "",
                    description: "",
                    category: "General",
                    status: "pending",
                    priority: "medium",
                    assignedTo: "",
                    dueDate: "",
                    linkedIndicators: [],
                    hasExcelTemplate: false,
                    tags: [],
                  });
                  setTaskDialogOpen(true);
                }}>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Créer ma première tâche
                </Button>
                <Button variant="outline" onClick={() => setTemplatesDialogOpen(true)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Voir les templates Excel
                </Button>
              </div>
              <div className="mt-8 pt-8 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Fonctionnalités disponibles :</strong>
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground text-left">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Templates Excel prêts à l'emploi</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Assignation et deadlines</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Suivi de statut (En cours, Validé)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Lien vers indicateurs ESG</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog templates Excel */}
        <TemplatesDialog open={templatesDialogOpen} onOpenChange={setTemplatesDialogOpen} />
      </div>
    );
  }

  // Filtres
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some((tag) => tag.includes(query));
      if (!matchesSearch) return false;
    }

    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

    return true;
  });

  // Statistiques
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
    withExcel: tasks.filter((t) => t.hasExcelTemplate).length,
  };

  const completionRate = tasks.length > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Handlers
  const handleCreateTask = async () => {
    try {
      await createTask(taskForm);
      toast.success("Tâche créée avec succès");
      setTaskDialogOpen(false);
    } catch (error) {
      toast.error("Erreur lors de la création de la tâche");
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    try {
      await updateTask(editingTask.id, taskForm);
      toast.success("Tâche mise à jour");
      setTaskDialogOpen(false);
      setEditingTask(null);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    
    try {
      await deleteTask(taskId);
      toast.success("Tâche supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      category: task.category,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo || "",
      dueDate: task.dueDate || "",
      linkedIndicators: task.linkedIndicators,
      hasExcelTemplate: task.hasExcelTemplate,
      tags: task.tags,
    });
    setTaskDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Checklist & Workflow</h1>
          <p className="text-muted-foreground">
            Suivi des tâches de collecte et consolidation des données ESG - Approche Excel-first
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTemplatesDialogOpen(true)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Templates Excel
          </Button>
          <Button onClick={() => {
            setEditingTask(null);
            setTaskForm({
              title: "",
              description: "",
              category: "General",
              status: "pending",
              priority: "medium",
              assignedTo: "",
              dueDate: "",
              linkedIndicators: [],
              hasExcelTemplate: false,
              tags: [],
            });
            setTaskDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bloquées</p>
                <p className="text-2xl font-bold">{stats.blocked}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
              <Circle className="h-8 w-8 text-primary" />
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
                  placeholder="Rechercher une tâche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="in-progress">En cours</SelectItem>
                <SelectItem value="review">À réviser</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="blocked">Bloquées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="E">Environnement</SelectItem>
                <SelectItem value="S">Social</SelectItem>
                <SelectItem value="G">Gouvernance</SelectItem>
                <SelectItem value="General">Général</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des tâches */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onStatusChange={(newStatus) => updateTask(task.id, { status: newStatus })}
          />
        ))}
      </div>

      {/* Dialogs */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        formData={taskForm}
        onFormChange={setTaskForm}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
      />

      <TemplatesDialog open={templatesDialogOpen} onOpenChange={setTemplatesDialogOpen} />
    </div>
  );
}

// ============================================================================
// TASK CARD
// ============================================================================

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (status: Task['status']) => void;
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const statusConfig = {
    pending: { icon: Clock, color: "text-orange-500 bg-orange-50 border-orange-200", label: "En attente" },
    "in-progress": { icon: PlayCircle, color: "text-blue-500 bg-blue-50 border-blue-200", label: "En cours" },
    review: { icon: AlertCircle, color: "text-purple-500 bg-purple-50 border-purple-200", label: "À réviser" },
    completed: { icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 border-emerald-200", label: "Terminée" },
    blocked: { icon: XCircle, color: "text-red-500 bg-red-50 border-red-200", label: "Bloquée" },
  };

  const priorityConfig = {
    critical: { color: "bg-red-500", label: "Critique" },
    high: { color: "bg-orange-500", label: "Haute" },
    medium: { color: "bg-blue-500", label: "Moyenne" },
    low: { color: "bg-gray-400", label: "Basse" },
  };

  const categoryConfig = {
    E: { color: "bg-green-100 text-green-700", label: "E" },
    S: { color: "bg-blue-100 text-blue-700", label: "S" },
    G: { color: "bg-purple-100 text-purple-700", label: "G" },
    General: { color: "bg-gray-100 text-gray-700", label: "Général" },
  };

  const config = statusConfig[task.status];
  const StatusIcon = config.icon;
  const priorityConf = priorityConfig[task.priority];
  const categoryConf = categoryConfig[task.category];

  return (
    <Card className={`border-l-4 ${config.color}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`h-10 w-10 rounded-lg ${config.color} flex items-center justify-center`}>
            <StatusIcon className="h-5 w-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">{task.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onStatusChange("in-progress")}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Marquer en cours
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange("completed")}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marquer terminée
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Badge className={categoryConf.color}>{categoryConf.label}</Badge>
              <Badge variant="outline">{config.label}</Badge>
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${priorityConf.color}`} />
                <span>{priorityConf.label}</span>
              </div>
              {task.assignedTo && (
                <span>👤 {task.assignedTo}</span>
              )}
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                </span>
              )}
              {task.hasExcelTemplate && (
                <Badge variant="outline" className="bg-green-50">
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Template Excel
                </Badge>
              )}
            </div>

            {task.tags.length > 0 && (
              <div className="flex gap-2 mt-2">
                {task.tags.map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TASK DIALOG
// ============================================================================

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  formData: any;
  onFormChange: (data: any) => void;
  onSave: () => void;
}

function TaskDialog({ open, onOpenChange, task, formData, onFormChange, onSave }: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
          <DialogDescription>
            Organisez votre collecte de données ESG avec des tâches assignées et suivies
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Titre *</Label>
            <Input
              value={formData.title}
              onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
              placeholder="Ex: Import consommations énergétiques 2025"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              placeholder="Détails de la tâche..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => onFormChange({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="E">Environnement</SelectItem>
                  <SelectItem value="S">Social</SelectItem>
                  <SelectItem value="G">Gouvernance</SelectItem>
                  <SelectItem value="General">Général</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priorité</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => onFormChange({ ...formData, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assigné à</Label>
              <Input
                value={formData.assignedTo}
                onChange={(e) => onFormChange({ ...formData, assignedTo: e.target.value })}
                placeholder="Nom de la personne"
              />
            </div>

            <div>
              <Label>Date limite</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => onFormChange({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasTemplate"
              checked={formData.hasExcelTemplate}
              onChange={(e) => onFormChange({ ...formData, hasExcelTemplate: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="hasTemplate" className="cursor-pointer">
              Cette tâche nécessite un template Excel
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={onSave}>
            {task ? "Mettre à jour" : "Créer la tâche"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// TEMPLATES DIALOG
// ============================================================================

interface TemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TemplatesDialog({ open, onOpenChange }: TemplatesDialogProps) {
  const templates = getAllTemplates();

  const handleDownload = (template: any) => {
    downloadExcelTemplate(template);
    toast.success(`Template "${template.templateName}" téléchargé`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Templates Excel disponibles</DialogTitle>
          <DialogDescription>
            Téléchargez des templates prêts à l'emploi pour collecter vos données ESG
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold mb-1">{template.templateName}</h4>
                    <Badge className={
                      template.category === 'E' ? 'bg-green-100 text-green-700' :
                      template.category === 'S' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }>
                      {template.category === 'E' ? 'Environnement' : 
                       template.category === 'S' ? 'Social' : 'Gouvernance'}
                    </Badge>
                  </div>
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {template.instructions.substring(0, 100)}...
                </p>
                <Button onClick={() => handleDownload(template)} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
