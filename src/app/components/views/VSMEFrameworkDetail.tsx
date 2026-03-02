import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Progress } from "@/app/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, ChevronRight, Download, FileText, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useState } from "react";

export function VSMEFrameworkDetail() {
  const navigate = useNavigate();
  const { frameworkId } = useParams();

  const [activeTab, setActiveTab] = useState("module-b");

  // Mock data for Module B
  const indicators = [
    {
      id: "B3",
      title: "Consommation Énergétique & Mix",
      category: "E", // E, S, G
      color: "bg-[#2d7a55]",
      datapoints: [
        { code: "B3.1", title: "Consommation totale d'énergie (MWh)", type: "Quantitatif", status: true },
        { code: "B3.2", title: "Part des énergies renouvelables (%)", type: "Calculé", status: false },
        { code: "B3.3", title: "Intensité énergétique (MWh/M€ CA)", type: "Calculé", status: false },
      ]
    },
    {
      id: "B8",
      title: "Main d'œuvre & Égalité",
      category: "S",
      color: "bg-[#1a5f8a]",
      datapoints: [
        { code: "B8.1", title: "Effectif total (ETP)", type: "Quantitatif", status: true },
        { code: "B8.2", title: "Écart de rémunération F/H (%)", type: "Quantitatif", status: true },
      ]
    },
    {
      id: "B11",
      title: "Conduite des affaires",
      category: "G",
      color: "bg-[#6c3483]",
      datapoints: [
        { code: "B11.1", title: "Incidents de corruption signalés", type: "Quantitatif", status: false },
        { code: "B11.2", title: "Politique anti-corruption", type: "Narratif", status: false },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <span className="cursor-pointer hover:text-foreground" onClick={() => navigate("/referentiels")}>Référentiels</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="font-medium text-foreground">VSME Complet</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-[#1a5f3f]">Module B — Base</span>
      </div>

      {/* Header with Global Stats */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#0A3B2E]">VSME Complet (B + C)</h1>
            <p className="text-sm text-muted-foreground">Standard EFRAG volontaire pour PME non cotées</p>
          </div>
          
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-[#1a5f3f]">36%</span>
              <span className="text-xs text-muted-foreground">Global</span>
            </div>
            
            <div className="flex-1 md:w-64 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#2d7a55] font-medium">E (45%)</span>
                <span className="text-[#1a5f8a] font-medium">S (20%)</span>
                <span className="text-[#6c3483] font-medium">G (10%)</span>
              </div>
              <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100">
                <div className="bg-[#2d7a55] w-[45%]" />
                <div className="bg-[#1a5f8a] w-[20%]" />
                <div className="bg-[#6c3483] w-[10%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="module-b" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center border-b mb-6">
          <TabsList className="bg-transparent h-auto p-0 space-x-6">
            <TabsTrigger 
              value="module-b" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1a5f3f] data-[state=active]:text-[#1a5f3f] px-4 py-3"
            >
              📊 Module B — Base (47)
            </TabsTrigger>
            <TabsTrigger 
              value="module-c" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1a5f3f] data-[state=active]:text-[#1a5f3f] px-4 py-3"
            >
              📝 Module C — Narratif (32)
            </TabsTrigger>
            <TabsTrigger 
              value="preuves" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1a5f3f] data-[state=active]:text-[#1a5f3f] px-4 py-3"
            >
              📎 Preuves
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1a5f3f] data-[state=active]:text-[#1a5f3f] px-4 py-3"
            >
              📤 Export
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="module-b" className="space-y-6">
          {indicators.map((indicator) => (
            <div key={indicator.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
              <div className={cn("px-6 py-3 flex items-center justify-between text-white", indicator.color)}>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold bg-white/20 px-2 py-1 rounded text-sm">{indicator.id}</span>
                  <span className="font-semibold">{indicator.title}</span>
                </div>
                <Badge variant="outline" className="text-white border-white/40 bg-white/10">
                  {indicator.datapoints.filter(d => d.status).length}/{indicator.datapoints.length}
                </Badge>
              </div>
              
              <div className="divide-y">
                {indicator.datapoints.map((dp) => (
                  <div key={dp.code} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <Checkbox checked={dp.status} className="border-slate-300 data-[state=checked]:bg-[#1a5f3f] data-[state=checked]:border-[#1a5f3f]" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-500 w-12">{dp.code}</span>
                          <span className="font-medium text-slate-900">{dp.title}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs font-normal",
                          dp.type === "Quantitatif" ? "bg-blue-50 text-blue-700" :
                          dp.type === "Calculé" ? "bg-purple-50 text-purple-700" :
                          "bg-orange-50 text-orange-700"
                        )}
                      >
                        {dp.type}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/dossiers/entry/${dp.code}`)}>
                        Saisir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
        
        <TabsContent value="module-c">
          <div className="p-8 text-center text-muted-foreground">
            Module C content would go here
          </div>
        </TabsContent>

        <TabsContent value="preuves">
          <div className="p-8 text-center text-muted-foreground">
            Evidence vault content would go here
          </div>
        </TabsContent>

        <TabsContent value="export">
          <div className="p-8 text-center text-muted-foreground">
            Export options would go here
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
