import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { 
  FileText,
  Download,
  Eye,
  Upload,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

interface Source {
  id: number;
  type: "facture" | "erp" | "enquete" | "fournisseur" | "estimation" | "autre";
  name: string;
  fileName?: string;
  uploadDate: string;
  validated: boolean;
}

interface SourceJustificationProps {
  dataPointName: string;
  sources: Source[];
  onUpload?: () => void;
}

const sourceTypeConfig = {
  facture: { label: "Facture", color: "bg-blue-100 text-blue-800" },
  erp: { label: "ERP", color: "bg-purple-100 text-purple-800" },
  enquete: { label: "Enquête", color: "bg-cyan-100 text-cyan-800" },
  fournisseur: { label: "Fournisseur", color: "bg-indigo-100 text-indigo-800" },
  estimation: { label: "Estimation", color: "bg-amber-100 text-amber-800" },
  autre: { label: "Autre", color: "bg-gray-100 text-gray-800" },
};

export function SourceJustification({ dataPointName, sources, onUpload }: SourceJustificationProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Sources & Justifications — {dataPointName}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onUpload}
          >
            <Upload className="h-4 w-4 mr-2" />
            Ajouter une source
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">Aucune source documentée</p>
              <p className="text-xs text-muted-foreground mb-4">
                Cette donnée n'est pas auditable sans justification
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onUpload}
              >
                <Upload className="h-4 w-4 mr-2" />
                Ajouter une source
              </Button>
            </div>
          ) : (
            sources.map((source) => {
              const config = sourceTypeConfig[source.type];
              
              return (
                <div 
                  key={source.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-[#059669] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-[#E8F3F0] p-2 rounded">
                      <FileText className="h-5 w-5 text-[#0F4C3A]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{source.name}</p>
                        <Badge className={config.color}>
                          {config.label}
                        </Badge>
                        {source.validated && (
                          <Badge className="bg-[#059669] text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Validé
                          </Badge>
                        )}
                      </div>
                      {source.fileName && (
                        <p className="text-xs text-muted-foreground">
                          {source.fileName} • Ajouté le {source.uploadDate}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" title="Prévisualiser">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Télécharger">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {sources.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">Sources documentées</p>
                <p className="text-xs text-green-700 mt-1">
                  {sources.length} source{sources.length > 1 ? 's' : ''} disponible{sources.length > 1 ? 's' : ''} pour audit
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
