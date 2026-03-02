import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { 
  Users,
  Search,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Eye,
  FileCheck,
  AlertTriangle,
  UserPlus
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface CollaborationProps {
  posture: PostureType;
  parcours: ParcoursType;
}

const users = [
  { 
    id: 1, 
    name: "Sophie Martin", 
    email: "s.martin@entreprise.fr", 
    role: "consultant", 
    status: "active",
    lastActivity: "Il y a 2h",
    permissions: ["edit", "validate", "comment"]
  },
  { 
    id: 2, 
    name: "Thomas Dubois", 
    email: "t.dubois@entreprise.fr", 
    role: "client", 
    status: "active",
    lastActivity: "Il y a 30min",
    permissions: ["edit", "comment"]
  },
  { 
    id: 3, 
    name: "Marie Laurent", 
    email: "m.laurent@auditeur.fr", 
    role: "auditeur", 
    status: "active",
    lastActivity: "Il y a 1 jour",
    permissions: ["read", "comment"]
  },
  { 
    id: 4, 
    name: "Pierre Durand", 
    email: "p.durand@entreprise.fr", 
    role: "client", 
    status: "active",
    lastActivity: "Il y a 3h",
    permissions: ["read", "comment"]
  },
];

const pendingTasks = [
  {
    id: 1,
    dataPoint: "ENV-04.3 - Émissions Scope 3",
    assignedTo: "Thomas Dubois",
    requestedBy: "Sophie Martin",
    type: "data-missing",
    priority: "high",
    dueDate: "25 Jan 2026",
    status: "pending"
  },
  {
    id: 2,
    dataPoint: "SOC-09.3 - Travailleurs handicapés",
    assignedTo: "Pierre Durand",
    requestedBy: "Marie Laurent",
    type: "clarification",
    priority: "medium",
    dueDate: "28 Jan 2026",
    status: "pending"
  },
  {
    id: 3,
    dataPoint: "GOV-01 - Politique anti-corruption",
    assignedTo: "Sophie Martin",
    requestedBy: "Thomas Dubois",
    type: "validation",
    priority: "high",
    dueDate: "22 Jan 2026",
    status: "in-progress"
  },
];

const recentComments = [
  {
    id: 1,
    dataPoint: "ENV-04.1 - Combustion gaz",
    author: "Marie Laurent",
    role: "auditeur",
    content: "Pouvez-vous fournir les relevés mensuels détaillés ?",
    timestamp: "20 Jan 2026, 14:30",
    status: "resolved"
  },
  {
    id: 2,
    dataPoint: "SOC-01.1 - Politique RH",
    author: "Sophie Martin",
    role: "consultant",
    content: "Section validée, conforme aux bonnes pratiques ESG",
    timestamp: "19 Jan 2026, 16:45",
    status: "resolved"
  },
  {
    id: 3,
    dataPoint: "ENV-03.2 - Consommation eau",
    author: "Thomas Dubois",
    role: "client",
    content: "Données mises à jour avec les factures de décembre",
    timestamp: "18 Jan 2026, 11:20",
    status: "resolved"
  },
];

export function Collaboration({ posture, parcours }: CollaborationProps) {
  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";

  const labels = {
    title: isAuditExterne ? "Demandes d'informations" : "Collaboration",
    subtitle: isAuditExterne 
      ? "Gestion des demandes de preuves et échanges avec l'entité auditée"
      : "Gestion des accès, tâches et workflows entre client, consultant et auditeur",
    taskLabel: isAuditExterne ? "Demandes en attente" : "Tâches en attente",
    newTaskButton: isAuditExterne ? "Nouvelle demande" : "Nouvelle tâche",
  };

  const activeUsers = users.filter(u => u.status === "active").length;
  const pendingTasksCount = pendingTasks.filter(t => t.status === "pending").length;
  const activeComments = recentComments.length;

  const getTaskTypeLabel = (type: string) => {
    if (isAuditExterne) {
      switch (type) {
        case "data-missing": return "Données manquantes";
        case "clarification": return "Clarification";
        case "validation": return "Validation";
        default: return type;
      }
    }
    switch (type) {
      case "data-missing": return "Données manquantes";
      case "clarification": return "Clarification";
      case "validation": return "Validation";
      default: return type;
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case "data-missing": return "bg-red-100 text-red-900 border-red-300";
      case "clarification": return "bg-amber-100 text-amber-900 border-amber-300";
      case "validation": return "bg-blue-100 text-blue-900 border-blue-300";
      default: return "bg-gray-100 text-gray-900";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-600 text-white text-xs">Urgent</Badge>;
      case "medium":
        return <Badge className="bg-amber-500 text-white text-xs">Normal</Badge>;
      case "low":
        return <Badge className="bg-blue-500 text-white text-xs">Faible</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">-</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500 text-white text-xs"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500 text-white text-xs">En cours</Badge>;
      case "resolved":
        return <Badge className="bg-[#059669] text-white text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Résolu</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">-</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "consultant":
        return <Badge className="bg-[#059669] text-white text-xs">Consultant</Badge>;
      case "client":
        return <Badge className="bg-blue-500 text-white text-xs">Client</Badge>;
      case "auditeur":
        return <Badge className="bg-orange-600 text-white text-xs">Auditeur</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">{labels.title}</h1>
          <p className="text-muted-foreground">{labels.subtitle}</p>
        </div>
        {(isConseil || isPreAudit) && (
          <Button className="bg-[#0F4C3A] hover:bg-[#0A3B2E]">
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter un utilisateur
          </Button>
        )}
        {isAuditExterne && (
          <Badge className="bg-orange-600 text-white">
            <Eye className="h-3 w-3 mr-1" />
            Mode Auditeur
          </Badge>
        )}
      </div>

      {/* Alertes Pré-audit */}
      {isPreAudit && pendingTasksCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              {pendingTasksCount} tâche{pendingTasksCount > 1 ? "s" : ""} en attente avant audit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-900">
              Ces demandes doivent être résolues avant la phase d'audit externe pour éviter les blocages.
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
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                <p className="text-2xl font-semibold">{activeUsers}</p>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <Users className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{labels.taskLabel}</p>
                <p className="text-2xl font-semibold">{pendingTasksCount}</p>
              </div>
              <div className={`p-3 rounded-lg ${pendingTasksCount > 0 ? "bg-amber-50" : "bg-[#E8F3F0]"}`}>
                <Clock className={`h-5 w-5 ${pendingTasksCount > 0 ? "text-amber-600" : "text-[#0F4C3A]"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commentaires actifs</p>
                <p className="text-2xl font-semibold">{activeComments}</p>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <MessageSquare className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validations effectuées</p>
                <p className="text-2xl font-semibold">42</p>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">{labels.taskLabel}</TabsTrigger>
          <TabsTrigger value="users">
            {isAuditExterne ? "Interlocuteurs" : "Utilisateurs"}
          </TabsTrigger>
        </TabsList>

        {/* Tâches et demandes */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tâches et demandes</CardTitle>
                {isAuditExterne && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300">
                    {pendingTasksCount} {isAuditExterne ? "demande" : "tâche"}{pendingTasksCount > 1 ? "s" : ""} en attente
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data point</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Assigné à</TableHead>
                    <TableHead>Demandé par</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.dataPoint}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getTaskTypeColor(task.type)}`}>
                          {getTaskTypeLabel(task.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{task.assignedTo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{task.requestedBy}</TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{task.dueDate}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Commentaires récents */}
          <Card>
            <CardHeader>
              <CardTitle>Commentaires récents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentComments.map((comment) => (
                <div key={comment.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{comment.author}</span>
                      {getRoleBadge(comment.role)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{comment.dataPoint}</p>
                  <p className="text-sm">{comment.content}</p>
                  {comment.status === "resolved" && (
                    <Badge className="bg-[#059669] text-white text-xs mt-2">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Résolu
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilisateurs */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input placeholder="Rechercher un utilisateur..." className="max-w-md" />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Dernière activité</TableHead>
                    <TableHead>Statut</TableHead>
                    {!isAuditExterne && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.map((perm, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {perm === "edit" && "Édition"}
                              {perm === "validate" && "Validation"}
                              {perm === "comment" && "Commentaires"}
                              {perm === "read" && "Lecture"}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.lastActivity}</TableCell>
                      <TableCell>
                        <Badge className="bg-[#059669] text-white text-xs">Actif</Badge>
                      </TableCell>
                      {!isAuditExterne && (
                        <TableCell>
                          <Button variant="outline" size="sm">Gérer</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}