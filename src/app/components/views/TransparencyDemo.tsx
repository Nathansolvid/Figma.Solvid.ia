import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { CalculationTransparency } from '@/app/components/CalculationTransparency';
import { Leaf, Users, Shield, TrendingUp, AlertCircle, Lock, Eye, FileCheck } from 'lucide-react';

interface TransparencyDemoProps {
  posture: 'conseil' | 'pre-audit' | 'audit-externe';
  parcours: 'csrd-obligatoire' | 'esg-structure';
}

export function TransparencyDemo({ posture, parcours }: TransparencyDemoProps) {
  const isCsrd = parcours === 'csrd-obligatoire';
  
  // Vocabulaire adapté selon parcours et posture
  const labels = {
    title: isCsrd 
      ? "Transparence des Calculs — Indicateurs CSRD/ESRS"
      : "Transparence des Calculs — Indicateurs ESG",
    subtitle: posture === 'conseil'
      ? "Construction et documentation des indicateurs pour le rapport"
      : posture === 'pre-audit'
      ? "Vérification de la traçabilité des calculs avant audit"
      : "Revue audit des méthodologies et sources documentaires",
    envTitle: isCsrd ? "Pilier Environnemental (E) — ESRS E" : "Pilier Environnemental",
    envDesc: isCsrd 
      ? "Indicateurs climat (E1) conformes CSRD avec méthodologie GHG Protocol"
      : "Indicateurs carbone et environnementaux avec traçabilité complète",
    socialTitle: isCsrd ? "Pilier Social (S) — ESRS S1" : "Pilier Social",
    socialDesc: isCsrd
      ? "Indicateurs effectif et diversité conformes ESRS S1"
      : "Indicateurs RH et conditions de travail",
    govTitle: isCsrd ? "Pilier Gouvernance (G) — ESRS 2-GOV" : "Pilier Gouvernance",
    govDesc: isCsrd
      ? "Indicateurs de gouvernance d'entreprise (ESRS 2)"
      : "Indicateurs de gouvernance et éthique",
  };
  
  return (
    <div className="flex-1 overflow-auto bg-[#E8F3F0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header adapté selon posture */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-[#0F4C3A]" />
            <h1 className="text-3xl font-bold text-[#0F4C3A]">
              {labels.title}
            </h1>
          </div>
          <p className="text-gray-600 mb-3">
            {labels.subtitle}
          </p>
          
          {/* Badges contextuels */}
          <div className="flex items-center gap-2">
            <Badge className={isCsrd ? "bg-[#0F4C3A] text-white" : "bg-[#059669] text-white"}>
              {isCsrd ? "CSRD Obligatoire" : "ESG Structuré"}
            </Badge>
            <Badge variant="outline" className="gap-1">
              {posture === 'conseil' && (
                <>
                  <FileCheck className="w-3 h-3" />
                  Mode Conseil
                </>
              )}
              {posture === 'pre-audit' && (
                <>
                  <Eye className="w-3 h-3" />
                  Mode Pré-audit
                </>
              )}
              {posture === 'audit-externe' && (
                <>
                  <Lock className="w-3 h-3" />
                  Mode Audit externe
                </>
              )}
            </Badge>
            {posture === 'audit-externe' && (
              <Badge className="bg-orange-100 text-orange-800">
                Lecture seule
              </Badge>
            )}
          </div>
        </div>
        
        {/* Exemple 1: Indicateurs environnementaux */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">{labels.envTitle}</CardTitle>
            </div>
            <CardDescription>
              {labels.envDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Émissions Scope 1 */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm text-gray-600">Émissions directes (Scope 1)</div>
                    <CalculationTransparency 
                      indicatorCode="E1_CO2_SCOPE1" 
                      displayedValue={152.3}
                      posture={posture}
                      size="md"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#0F4C3A]">152.3</span>
                    <span className="text-lg text-gray-500">tCO2e</span>
                  </div>
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      📊 Données mesurées
                    </Badge>
                    <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                      CSRD ESRS E1-6
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">vs 2023</div>
                  <div className="text-sm font-semibold text-green-600">-8.2%</div>
                </div>
              </div>
            </div>
            
            {/* Émissions totales */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm text-gray-600">Émissions totales (Scopes 1+2+3)</div>
                    <CalculationTransparency 
                      indicatorCode="E1_CO2_TOTAL" 
                      displayedValue={8547}
                      posture={posture}
                      size="md"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#0F4C3A]">8,547</span>
                    <span className="text-lg text-gray-500">tCO2e</span>
                  </div>
                  <div className="mt-2">
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      📊📐 Données mixtes
                    </Badge>
                    <Badge className="ml-2 bg-purple-100 text-purple-800 text-xs">
                      Matériel
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Intensité carbone */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm text-gray-600">Intensité carbone</div>
                    <CalculationTransparency 
                      indicatorCode="E1_INTENSITY" 
                      displayedValue={42.7}
                      posture={posture}
                      size="md"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#0F4C3A]">42.7</span>
                    <span className="text-lg text-gray-500">tCO2e/M€</span>
                  </div>
                  <div className="mt-2">
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      🧮 Calculé
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Objectif 2030</div>
                  <div className="text-sm font-semibold text-orange-600">-50%</div>
                </div>
              </div>
            </div>
            
          </CardContent>
        </Card>
        
        {/* Exemple 2: Indicateurs sociaux */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">{labels.socialTitle}</CardTitle>
            </div>
            <CardDescription>
              {labels.socialDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Effectif */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm text-gray-600">Effectif total (ETP)</div>
                    <CalculationTransparency 
                      indicatorCode="S1_HEADCOUNT" 
                      displayedValue={325}
                      posture={posture}
                      size="md"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#0F4C3A]">325</span>
                    <span className="text-lg text-gray-500">ETP</span>
                  </div>
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      📊 Données SIRH
                    </Badge>
                    <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                      CSRD ESRS S1-6
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">vs 2023</div>
                  <div className="text-sm font-semibold text-green-600">+12%</div>
                </div>
              </div>
            </div>
            
            {/* Taux de féminisation */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm text-gray-600">Taux de féminisation</div>
                    <CalculationTransparency 
                      indicatorCode="S1_GENDER_RATIO" 
                      displayedValue={43.8}
                      posture={posture}
                      size="md"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#0F4C3A]">43.8</span>
                    <span className="text-lg text-gray-500">%</span>
                  </div>
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      📊 Données mesurées
                    </Badge>
                    <Badge className="ml-2 bg-purple-100 text-purple-800 text-xs">
                      Obligatoire
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Objectif parité</div>
                  <div className="text-sm font-semibold text-blue-600">50%</div>
                </div>
              </div>
            </div>
            
          </CardContent>
        </Card>
        
        {/* Exemple 3: Indicateurs de gouvernance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">{labels.govTitle}</CardTitle>
            </div>
            <CardDescription>
              {labels.govDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Indépendance du conseil */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm text-gray-600">Indépendance du conseil d'administration</div>
                    <CalculationTransparency 
                      indicatorCode="G1_BOARD_INDEPENDENCE" 
                      displayedValue={58.3}
                      posture={posture}
                      size="md"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#0F4C3A]">58.3</span>
                    <span className="text-lg text-gray-500">%</span>
                  </div>
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      📊 Données mesurées
                    </Badge>
                    <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                      CSRD ESRS 2-GOV1
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Recommandation AFEP-MEDEF</div>
                  <div className="text-sm font-semibold text-green-600">✓ ≥50%</div>
                </div>
              </div>
            </div>
            
          </CardContent>
        </Card>
        
        {/* Instructions d'utilisation */}
        <Card className="border-[#0F4C3A] border-2">
          <CardHeader>
            <CardTitle className="text-lg text-[#0F4C3A]">
              💡 Comment utiliser la transparence des calculs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#0F4C3A]">1.</span>
                <span>
                  <strong>Cliquez sur l'icône "i"</strong> à côté de chaque indicateur pour ouvrir le panneau de transparence
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#0F4C3A]">2.</span>
                <span>
                  <strong>Explorez les 5 onglets</strong> : Vue d'ensemble, Méthode, Données, Facteurs, Audit
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#0F4C3A]">3.</span>
                <span>
                  <strong>Consultez les preuves</strong> en cliquant sur les liens "Voir" dans l'onglet Données
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#0F4C3A]">4.</span>
                <span>
                  <strong>Vérifiez les facteurs</strong> et leurs sources officielles (ADEME, GHG Protocol, etc.)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#0F4C3A]">5.</span>
                <span>
                  <strong>Suivez l'historique</strong> des modifications dans l'onglet Audit
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#0F4C3A]">6.</span>
                <span>
                  <strong>Exportez en PDF</strong> pour joindre au dossier d'audit
                </span>
              </li>
            </ol>
            
            <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
              <div className="text-sm font-medium text-green-900 mb-1">
                ✅ Avantages de la transparence des calculs
              </div>
              <ul className="text-xs text-green-800 space-y-1">
                <li>• Auditabilité maximale : chaque chiffre est documenté et traçable</li>
                <li>• Conformité CSRD : méthodologies conformes aux normes ESRS</li>
                <li>• Confiance renforcée : preuves et sources officielles accessibles</li>
                <li>• Gain de temps audit : dossier pré-constitué pour les CAC</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}