import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { cn } from "@/lib/utils";
import { Upload, Plus, Star, BarChart3, Users, Leaf, Shield } from "lucide-react";
import { useNavigate } from "react-router";

export function VSMEFrameworks() {
  const navigate = useNavigate();

  const frameworks = [
    {
      id: "vsme-complet",
      title: "VSME Complet (B + C)",
      description: "Modules B (Base) + C (Narratif) pour une conformité totale.",
      recommended: true,
      pills: [
        { label: "E", color: "bg-[#2d7a55]" },
        { label: "S", color: "bg-[#1a5f8a]" },
        { label: "G", color: "bg-[#6c3483]" }
      ],
      progress: 0,
      total: 79,
      datapointsLabel: "79 datapoints",
    },
    {
      id: "vsme-base",
      title: "VSME Base (Module B)",
      description: "L'essentiel pour démarrer. Module B1-B11.",
      recommended: false,
      pills: [
        { label: "B1-B11", color: "bg-slate-500" }
      ],
      progress: 12, // Example progress
      total: 47,
      datapointsLabel: "47 datapoints",
    },
    {
      id: "bilan-carbone",
      title: "Bilan Carbone® ADEME",
      description: "Calcul d'empreinte carbone scope 1, 2 et 3.",
      recommended: false,
      pills: [
        { label: "E", color: "bg-[#2d7a55]" }
      ],
      progress: 45, // Example progress
      total: 100,
      datapointsLabel: "BEGES",
    },
    {
      id: "social-baseline",
      title: "Social Baseline",
      description: "Indicateurs sociaux clés et égalité pro.",
      recommended: false,
      pills: [
        { label: "S", color: "bg-[#1a5f8a]" }
      ],
      progress: 0,
      total: 25,
      datapointsLabel: "Social",
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3B2E]">Référentiels VSME</h1>
          <p className="text-muted-foreground mt-1">
            Choisissez un référentiel pour structurer votre reporting ESG selon le standard EFRAG
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-[#1a5f3f] text-[#1a5f3f] hover:bg-[#1a5f3f]/10">
            <Upload className="w-4 h-4" />
            Importer données
          </Button>
          <Button className="gap-2 bg-[#1a5f3f] hover:bg-[#0f3d28] text-white">
            <Plus className="w-4 h-4" />
            Nouveau dossier
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {frameworks.map((fw) => (
          <Card 
            key={fw.id} 
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border-2",
              fw.recommended ? "border-[#1a5f3f]/30 bg-[#1a5f3f]/5" : "border-transparent hover:border-slate-200"
            )}
            onClick={() => navigate(`/referentiels/${fw.id}`)}
          >
            <CardHeader className="pb-2 relative">
              {fw.recommended && (
                <Badge className="absolute top-4 right-4 bg-[#1a5f3f] text-white gap-1 hover:bg-[#1a5f3f]">
                  <Star className="w-3 h-3 fill-current" /> Recommandé
                </Badge>
              )}
              <CardTitle className="text-xl text-[#0A3B2E]">{fw.title}</CardTitle>
              <CardDescription>{fw.description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center gap-2 mb-4">
                {fw.pills.map((pill, i) => (
                  <span 
                    key={i} 
                    className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white",
                      pill.color
                    )}
                  >
                    {pill.label}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground ml-2">{fw.datapointsLabel}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progression</span>
                  <span>{Math.round((fw.progress / fw.total) * 100) || 0}%</span>
                </div>
                <Progress value={(fw.progress / fw.total) * 100} className="h-2 bg-slate-100 [&>div]:bg-[#1a5f3f]" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{fw.progress} complétés</span>
                  <span>Sur {fw.total}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
             
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
