import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Lightbulb,
  ArrowRight,
  Zap
} from "lucide-react";
import { Progress } from "@/app/components/ui/progress";

const risks = [
  {
    id: 1,
    title: "Dépendance énergétique aux énergies fossiles",
    severity: "high",
    impact: "Fort impact réglementaire et financier",
    recommendation: "Développer un plan de transition énergétique sur 3 ans",
    csrdRef: "ESRS E1",
  },
  {
    id: 2,
    title: "Manque de données Scope 3 amont",
    severity: "medium",
    impact: "Incomplet pour reporting CSRD",
    recommendation: "Enquêter auprès des 20 principaux fournisseurs",
    csrdRef: "ESRS E1",
  },
  {
    id: 3,
    title: "Absence de politique eau formalisée",
    severity: "medium",
    impact: "Non-conformité ESRS E3",
    recommendation: "Formaliser la politique de gestion de l'eau",
    csrdRef: "ESRS E3",
  },
];

const opportunities = [
  {
    id: 1,
    title: "Optimisation du poste Transport",
    potential: "Réduction de 340 tCO₂e/an",
    actions: [
      "Optimiser les tournées de livraison",
      "Développer le télétravail",
      "Favoriser le covoiturage"
    ],
    effort: "Moyen",
    timeline: "6-12 mois",
  },
  {
    id: 2,
    title: "Verdissement du mix énergétique",
    potential: "Réduction de 420 tCO₂e/an",
    actions: [
      "Passer à 100% d'électricité renouvelable",
      "Installer des panneaux solaires",
    ],
    effort: "Élevé",
    timeline: "12-24 mois",
  },
  {
    id: 3,
    title: "Engagement fournisseurs",
    potential: "Réduction de 890 tCO₂e/an",
    actions: [
      "Intégrer critères carbone dans les appels d'offres",
      "Co-développer des plans d'action avec top 10 fournisseurs",
    ],
    effort: "Moyen",
    timeline: "12 mois",
  },
];

const priorities = [
  {
    id: 1,
    category: "Données manquantes",
    items: [
      { name: "Compléter Scope 3.8 (Transport aval)", urgency: "high", impact: "high" },
      { name: "Documenter la politique biodiversité", urgency: "medium", impact: "medium" },
      { name: "Enquête mobilité employés", urgency: "low", impact: "medium" },
    ]
  },
  {
    id: 2,
    category: "Conformité CSRD",
    items: [
      { name: "Finaliser ESRS E1 (Changement climatique)", urgency: "high", impact: "high" },
      { name: "Compléter ESRS S1 (Main d'œuvre)", urgency: "high", impact: "high" },
      { name: "Documenter ESRS E4 (Biodiversité)", urgency: "medium", impact: "low" },
    ]
  },
];

export function AnalyseIA() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Analyse IA</h1>
          <p className="text-muted-foreground">
            Insights et recommandations pilotés par l'intelligence artificielle
          </p>
        </div>
        <Button className="bg-[#0F4C3A] hover:bg-[#0A3B2E]">
          <Sparkles className="h-4 w-4 mr-2" />
          Nouvelle analyse
        </Button>
      </div>

      {/* Synthèse IA */}
      <Card className="border-[#059669] bg-gradient-to-br from-[#E8F3F0] via-white to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-[#059669] p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            Synthèse intelligente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground leading-relaxed">
              Votre entreprise affiche <strong>une empreinte carbone de 6 630 tCO₂e</strong>, dominée par le Scope 3 (69%). 
              Le poste <strong>"Transport"</strong> représente à lui seul 35% des émissions totales et constitue le principal levier d'action.
            </p>
            <p className="text-foreground leading-relaxed mt-3">
              Sur le plan réglementaire, vous êtes à <strong>78% de conformité CSRD</strong>. Les principales lacunes concernent 
              les indicateurs ESRS E1 (climat) et ESRS S1 (personnel). <strong>7 actions critiques</strong> sont à mener dans les 3 prochains mois.
            </p>
            <p className="text-foreground leading-relaxed mt-3">
              En priorisant les 3 leviers identifiés ci-dessous, vous pouvez réduire votre empreinte de <strong>25% d'ici 2027</strong> 
              tout en atteignant <strong>100% de conformité CSRD</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grille d'analyse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risques identifiés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#F59E0B]" />
              Risques identifiés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {risks.map((risk) => (
              <div 
                key={risk.id} 
                className={`p-4 border rounded-lg ${
                  risk.severity === 'high' 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{risk.title}</h4>
                  <Badge 
                    variant={risk.severity === 'high' ? 'destructive' : 'secondary'}
                    className={risk.severity === 'high' ? '' : 'bg-[#F59E0B] text-white'}
                  >
                    {risk.severity === 'high' ? 'Critique' : 'Modéré'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{risk.impact}</p>
                <div className="flex items-start gap-2 mt-3 p-3 bg-white rounded border border-border">
                  <Lightbulb className="h-4 w-4 text-[#059669] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#059669] mb-1">Recommandation</p>
                    <p className="text-sm">{risk.recommendation}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{risk.csrdRef}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Opportunités de réduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#059669]" />
              Leviers de réduction carbone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {opportunities.map((opp) => (
              <div key={opp.id} className="p-4 border border-[#059669]/20 rounded-lg bg-[#E8F3F0]/30">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-sm">{opp.title}</h4>
                  <Badge className="bg-[#059669] text-white">
                    {opp.potential}
                  </Badge>
                </div>
                <ul className="space-y-1.5 mb-3">
                  {opp.actions.map((action, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-[#059669] mt-1">→</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3 text-xs mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Effort : {opp.effort}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Délai : {opp.timeline}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Matrice de priorisation */}
      <Card>
        <CardHeader>
          <CardTitle>Priorisation des actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {priorities.map((priority) => (
              <div key={priority.id} className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {priority.category}
                </h4>
                <div className="space-y-2">
                  {priority.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-[#059669] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex gap-2">
                          <Badge 
                            variant={item.urgency === 'high' ? 'destructive' : item.urgency === 'medium' ? 'secondary' : 'outline'}
                            className={
                              item.urgency === 'medium' 
                                ? 'bg-[#F59E0B] text-white' 
                                : item.urgency === 'low'
                                ? 'text-muted-foreground'
                                : ''
                            }
                          >
                            {item.urgency === 'high' ? 'Urgent' : item.urgency === 'medium' ? 'Moyen' : 'Faible'}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={
                              item.impact === 'high'
                                ? 'border-[#059669] text-[#059669]'
                                : 'text-muted-foreground'
                            }
                          >
                            Impact {item.impact === 'high' ? 'fort' : item.impact === 'medium' ? 'moyen' : 'faible'}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Score de maturité */}
      <Card>
        <CardHeader>
          <CardTitle>Score de maturité ESG</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Collecte de données</span>
                <span className="text-sm font-semibold">75%</span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground">Bonne couverture, quelques lacunes Scope 3</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Analyse & pilotage</span>
                <span className="text-sm font-semibold">62%</span>
              </div>
              <Progress value={62} className="h-2" />
              <p className="text-xs text-muted-foreground">Processus en place, à structurer davantage</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Reporting & conformité</span>
                <span className="text-sm font-semibold">78%</span>
              </div>
              <Progress value={78} className="h-2" />
              <p className="text-xs text-muted-foreground">Bon niveau, finaliser ESRS E1 et S1</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}