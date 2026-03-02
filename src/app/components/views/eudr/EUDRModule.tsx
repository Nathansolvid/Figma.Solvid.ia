import { useState } from "react";
import { EUDROverview } from "./EUDROverview";
import { EUDRAssessment } from "./EUDRAssessment";
import { EUDRLotDetail } from "./EUDRLotDetail";
import { EUDRAuditCenter } from "./EUDRAuditCenter";

type EUDRView = "overview" | "assessment" | "lot-detail" | "audit-center";
type UserRole = "client" | "consultant" | "auditor" | "admin";
type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface EUDRModuleProps {
  posture?: PostureType;
  parcours?: ParcoursType;
}

export function EUDRModule({ posture = "conseil", parcours = "csrd-obligatoire" }: EUDRModuleProps) {
  const [currentView, setCurrentView] = useState<EUDRView>("overview");
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  // Mapper la posture vers le rôle utilisateur
  const getUserRole = (): UserRole => {
    if (posture === "conseil") return "consultant";
    if (posture === "pre-audit") return "consultant"; // Pré-audit = consultant avec plus de contraintes
    if (posture === "audit-externe") return "auditor";
    return "consultant";
  };

  const userRole = getUserRole();

  const handleCreateLot = () => {
    // TODO: Ouvrir modal de création de lot
    alert("Création de lot - À implémenter");
  };

  const handleRunAssessment = () => {
    setCurrentView("assessment");
  };

  const handleOpenLot = (lotId: string) => {
    setSelectedLotId(lotId);
    setCurrentView("lot-detail");
  };

  const handleExport = () => {
    // TODO: Générer export
    alert("Export dossier EUDR - À implémenter");
  };

  const handleBackToOverview = () => {
    setCurrentView("overview");
    setSelectedLotId(null);
  };

  const handleSaveAssessment = () => {
    alert("Assessment enregistré avec succès !");
    setCurrentView("overview");
  };

  return (
    <div>
      {currentView === "overview" && (
        <EUDROverview
          onCreateLot={handleCreateLot}
          onRunAssessment={handleRunAssessment}
          onOpenLot={handleOpenLot}
          onExport={handleExport}
          posture={posture}
          parcours={parcours}
        />
      )}

      {currentView === "assessment" && (
        <EUDRAssessment
          onBack={handleBackToOverview}
          onSave={handleSaveAssessment}
          posture={posture}
          parcours={parcours}
        />
      )}

      {currentView === "lot-detail" && selectedLotId && (
        <EUDRLotDetail
          lotId={selectedLotId}
          onBack={handleBackToOverview}
          userRole={userRole}
          posture={posture}
          parcours={parcours}
        />
      )}

      {currentView === "audit-center" && (
        <EUDRAuditCenter
          onOpenLot={handleOpenLot}
          posture={posture}
          parcours={parcours}
        />
      )}
    </div>
  );
}