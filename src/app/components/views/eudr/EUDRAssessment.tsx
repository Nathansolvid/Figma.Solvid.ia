import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  FileCheck,
  Info,
  Eye,
  Shield,
  Users
} from "lucide-react";
import { EUDRRole, EUDRCommodity, COMMODITY_LABELS, ROLE_LABELS } from "@/types/eudr";

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface EUDRAssessmentProps {
  onBack: () => void;
  onSave: () => void;
  posture: PostureType;
  parcours: ParcoursType;
}

export function EUDRAssessment({ onBack, onSave, posture, parcours }: EUDRAssessmentProps) {
  const [selectedRoles, setSelectedRoles] = useState<EUDRRole[]>([]);
  const [selectedCommodities, setSelectedCommodities] = useState<EUDRCommodity[]>([]);
  const [countries, setCountries] = useState<string>("");
  const [estimatedVolume, setEstimatedVolume] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Adaptations selon posture et parcours
  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";
  const isCsrdObligatoire = parcours === "csrd-obligatoire";

  // Vocabulaire adapté
  const labels = {
    title: isCsrdObligatoire 
      ? "EUDR Assessment — Évaluation conformité réglementaire"
      : "EUDR Assessment — Évaluation exposition déforestation",
    subtitle: isAuditExterne 
      ? "Revue de l'évaluation EUDR (mode lecture seule)"
      : isPreAudit 
      ? "Mise à jour de l'assessment EUDR pour préparation audit"
      : "Évaluez votre exposition au Règlement UE Déforestation",
    saveButton: isAuditExterne 
      ? "Fermer" 
      : isPreAudit 
      ? "Enregistrer et préparer pour validation" 
      : "Enregistrer l'assessment",
    infoText: isCsrdObligatoire
      ? "Le Règlement UE Déforestation (EUDR) impose une obligation de diligence raisonnée pour toute entreprise mettant sur le marché de l'UE des produits issus de zones à risque de déforestation."
      : "L'EUDR concerne les entreprises qui manipulent des matières premières à risque de déforestation. Cette évaluation permet d'identifier votre niveau d'exposition."
  };

  // Permissions
  const canEdit = !isAuditExterne;

  const toggleRole = (role: EUDRRole) => {
    if (!canEdit) return;
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleCommodity = (commodity: EUDRCommodity) => {
    if (!canEdit) return;
    setSelectedCommodities(prev =>
      prev.includes(commodity) ? prev.filter(c => c !== commodity) : [...prev, commodity]
    );
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    // Simulation sauvegarde
    setTimeout(() => {
      onSave();
    }, 500);
  };

  const isInScope = selectedCommodities.length > 0 && selectedRoles.length > 0;

  const allRoles: EUDRRole[] = ["importer", "exporter", "producer", "trader", "manufacturer", "retailer"];
  const primaryCommodities: EUDRCommodity[] = ["wood", "cocoa", "coffee", "soy", "beef", "palm_oil", "rubber"];
  const derivedCommodities: EUDRCommodity[] = ["wood_derived", "cocoa_derived", "coffee_derived", "soy_derived", "beef_derived", "palm_oil_derived", "rubber_derived"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-3">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-semibold text-foreground mb-2">{labels.title}</h1>
          <p className="text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>
      </div>

      {/* Alert Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-1">Qu'est-ce que l'EUDR ?</p>
              <p className="text-sm text-blue-800">
                {labels.infoText}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questionnaire */}
      <Card>
        <CardHeader>
          <CardTitle>Questionnaire d'exposition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rôle */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              1. Quel est votre rôle dans la chaîne d'approvisionnement ? 
              <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Sélectionnez tous les rôles applicables
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allRoles.map((role) => (
                <div
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`
                    p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedRoles.includes(role) 
                      ? 'border-[#0F4C3A] bg-[#E8F3F0]' 
                      : 'border-border hover:border-[#0F4C3A]/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <span className="font-medium">{ROLE_LABELS[role]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commodities principales */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              2. Quelles matières premières concernées manipulez-vous ?
              <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Commodités principales EUDR
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {primaryCommodities.map((commodity) => (
                <div
                  key={commodity}
                  onClick={() => toggleCommodity(commodity)}
                  className={`
                    p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedCommodities.includes(commodity) 
                      ? 'border-[#0F4C3A] bg-[#E8F3F0]' 
                      : 'border-border hover:border-[#0F4C3A]/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedCommodities.includes(commodity)}
                      onCheckedChange={() => toggleCommodity(commodity)}
                    />
                    <span className="font-medium text-sm">{COMMODITY_LABELS[commodity]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Produits dérivés */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Produits dérivés concernés (optionnel)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {derivedCommodities.map((commodity) => (
                <div
                  key={commodity}
                  onClick={() => toggleCommodity(commodity)}
                  className={`
                    p-3 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedCommodities.includes(commodity) 
                      ? 'border-[#0F4C3A] bg-[#E8F3F0]' 
                      : 'border-border hover:border-[#0F4C3A]/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedCommodities.includes(commodity)}
                      onCheckedChange={() => toggleCommodity(commodity)}
                    />
                    <span className="text-sm">{COMMODITY_LABELS[commodity]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pays d'origine */}
          <div className="space-y-3">
            <Label htmlFor="countries" className="text-base font-semibold">
              3. Principaux pays d'origine
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="countries"
              placeholder="Ex: Brésil, Indonésie, Côte d'Ivoire..."
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              rows={2}
            />
          </div>

          {/* Volume estimé */}
          <div className="space-y-3">
            <Label htmlFor="volume" className="text-base font-semibold">
              4. Volume annuel estimé (optionnel)
            </Label>
            <Textarea
              id="volume"
              placeholder="Ex: 5000 tonnes de café, 200 m³ de bois..."
              value={estimatedVolume}
              onChange={(e) => setEstimatedVolume(e.target.value)}
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-semibold">
              Notes complémentaires
            </Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires sur votre exposition..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Résultat Assessment */}
      {isInScope && (
        <Card className="border-[#0F4C3A] bg-[#E8F3F0]">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                {isInScope ? (
                  <CheckCircle2 className="h-12 w-12 text-[#059669]" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-amber-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {isInScope ? "✓ Vous êtes concerné par l'EUDR" : "Exposition EUDR incertaine"}
                </h3>
                <p className="text-sm mb-4">
                  {isInScope 
                    ? "Sur la base de vos réponses, votre organisation est soumise aux obligations de diligence raisonnée EUDR."
                    : "Veuillez remplir les champs obligatoires pour obtenir une évaluation."
                  }
                </p>
                
                {isInScope && (
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        Obligations principales :
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-[#059669] mt-0.5">•</span>
                          <span><strong>Traçabilité complète</strong> : géolocalisation des parcelles de production</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#059669] mt-0.5">•</span>
                          <span><strong>Déclaration de non-déforestation</strong> : aucune déforestation après le 31/12/2020</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#059669] mt-0.5">•</span>
                          <span><strong>Conformité aux lois locales</strong> : respect du droit du pays de production</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#059669] mt-0.5">•</span>
                          <span><strong>Déclaration de diligence raisonnée</strong> : soumission via le système EUDR</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#059669] mt-0.5">•</span>
                          <span><strong>Conservation des preuves</strong> : 5 ans minimum après mise sur le marché</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Prochaines étapes recommandées :</h4>
                      <ol className="space-y-2 text-sm list-decimal list-inside">
                        <li>Créer vos lots/expéditions dans le système</li>
                        <li>Collecter les géolocalisations auprès de vos fournisseurs</li>
                        <li>Obtenir les déclarations de conformité</li>
                        <li>Constituer votre dossier documentaire audit-ready</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>
          Annuler
        </Button>
        <Button 
          className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
          onClick={handleSubmit}
          disabled={!isInScope || isSubmitted}
        >
          {isSubmitted ? "Enregistrement..." : labels.saveButton}
        </Button>
      </div>
    </div>
  );
}