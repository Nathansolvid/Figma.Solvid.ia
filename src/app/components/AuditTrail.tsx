import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { 
  History,
  FileEdit,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  useIndicatorAuditTrail,
  usePackAuditTrail,
  formatAuditTimestamp,
  getActionLabel,
  getActionColor,
} from "@/hooks/useAuditTrail";

interface AuditTrailProps {
  entityType: 'indicator' | 'pack';
  entityId: string;
  compact?: boolean;
  showTitle?: boolean;
}

const actionConfig = {
  create: { icon: FileEdit },
  update: { icon: FileEdit },
  validate: { icon: CheckCircle2 },
  reject: { icon: AlertCircle },
  delete: { icon: AlertTriangle },
  evidence_added: { icon: FileEdit },
  evidence_removed: { icon: AlertTriangle },
};

export function AuditTrail({ 
  entityType, 
  entityId, 
  compact = false,
  showTitle = true 
}: AuditTrailProps) {
  // Chargement conditionnel selon le type
  const {
    data: entries = [],
    isLoading,
    isError,
    error,
    refetch
  } = entityType === 'indicator'
    ? useIndicatorAuditTrail(entityId)
    : usePackAuditTrail(entityId);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-5 w-5" />
              Piste d'audit
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-5 w-5" />
              Piste d'audit
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || 'Erreur lors du chargement de l\'historique'}
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-5 w-5" />
              Piste d'audit
              <Badge variant="outline" className="ml-2">
                {entries.length} entrée{entries.length > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun historique
            </p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border" />
              
              {entries.map((entry) => {
                const config = actionConfig[entry.action as keyof typeof actionConfig] || actionConfig.update;
                const Icon = config.icon;
                
                return (
                  <div key={entry.id} className="relative pl-12 pb-6 last:pb-0">
                    {/* Timeline dot */}
                    <div className="absolute left-3 top-1 w-4 h-4 rounded-full bg-white border-2 border-[#059669] z-10" />
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getActionColor(entry.action)}>
                            <Icon className="h-3 w-3 mr-1" />
                            {getActionLabel(entry.action)}
                          </Badge>
                          <span className="text-sm font-medium">{entry.user}</span>
                          {entry.role && (
                            <Badge variant="outline" className="text-xs">
                              {entry.role === 'client' ? 'Client' : 
                               entry.role === 'consultant' ? 'Consultant' : 
                               entry.role === 'auditeur' ? 'Auditeur' : entry.role}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatAuditTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      
                      {!compact && (
                        <>
                          {entry.field && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Champ modifié : </span>
                              <span className="font-medium">{entry.field}</span>
                            </div>
                          )}
                          
                          {(entry.oldValue !== undefined || entry.newValue !== undefined) && (
                            <div className="text-sm space-y-1 bg-muted/50 p-3 rounded-lg">
                              {entry.oldValue !== undefined && (
                                <div>
                                  <span className="text-muted-foreground">Ancienne valeur : </span>
                                  <span className="line-through text-red-600">{String(entry.oldValue)}</span>
                                </div>
                              )}
                              {entry.newValue !== undefined && (
                                <div>
                                  <span className="text-muted-foreground">Nouvelle valeur : </span>
                                  <span className="font-medium text-green-600">{String(entry.newValue)}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {entry.justification && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Justification : </span>
                              <span className="italic">{entry.justification}</span>
                            </div>
                          )}

                          {entry.comment && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Commentaire : </span>
                              <span className="italic">{entry.comment}</span>
                            </div>
                          )}

                          {entry.affectedFields && entry.affectedFields.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Champs modifiés: {entry.affectedFields.join(', ')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
