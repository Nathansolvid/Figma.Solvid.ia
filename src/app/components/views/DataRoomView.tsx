import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { ImportCenter } from "@/app/components/views/ImportCenter";
import { EvidenceVault } from "@/app/components/views/EvidenceVault";
import { Database, Upload, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";

interface DataRoomViewProps {
  dossierId: string | null;
}

export function DataRoomView({ dossierId }: DataRoomViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Room & Preuves</h1>
        <p className="text-muted-foreground">
          Centralisez vos données ESG : importez vos fichiers et gérez vos preuves auditables.
        </p>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Données
          </TabsTrigger>
          <TabsTrigger value="evidence" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Coffre-fort (Preuves)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <ImportCenter dossierId={dossierId || "default-dossier"} />
        </TabsContent>

        <TabsContent value="evidence">
          <EvidenceVault />
        </TabsContent>
      </Tabs>
    </div>
  );
}
