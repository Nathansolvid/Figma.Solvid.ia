import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { ExportsLivrables } from "@/app/components/views/ExportsLivrables";
import { AuditCenter } from "@/app/components/views/AuditCenter";
import { ChecklistWorkflow } from "@/app/components/views/ChecklistWorkflow";
import { Shield, Search, CheckSquare, Download } from "lucide-react";

interface AuditExportsViewProps {
  currentAuditorId: string;
  currentAuditorName: string;
  posture?: string;
}

export function AuditExportsView({ currentAuditorId, currentAuditorName, posture }: AuditExportsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Audit & Exports</h1>
        <p className="text-muted-foreground">
          Générez vos livrables, suivez l'avancement et validez vos données.
        </p>
      </div>

      <Tabs defaultValue="exports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="exports" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exports & Livrables
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Checklist & Suivi
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Audit Center
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exports">
          <ExportsLivrables posture={posture} />
        </TabsContent>

        <TabsContent value="checklist">
          <ChecklistWorkflow />
        </TabsContent>

        <TabsContent value="audit">
          <AuditCenter 
            currentAuditorId={currentAuditorId}
            currentAuditorName={currentAuditorName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
