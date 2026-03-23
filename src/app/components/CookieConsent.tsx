/**
 * Cookie Consent Banner — RGPD Phase 2
 *
 * Bandeau fixe en bas de page pour le consentement aux cookies.
 * Stocke le choix dans localStorage sous la cle 'solvid_cookie_consent'.
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Cookie, Shield } from "lucide-react";

interface CookieConsentProps {
  onNavigatePrivacy?: () => void;
}

export default function CookieConsent({ onNavigatePrivacy }: CookieConsentProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("solvid_cookie_consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      essential: true,
      analytics: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("solvid_cookie_consent", JSON.stringify(consent));
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    const consent = {
      essential: true,
      analytics: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("solvid_cookie_consent", JSON.stringify(consent));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="rounded-t-xl p-4 max-w-2xl w-full shadow-2xl"
        style={{
          background: "#1a1a2e",
          pointerEvents: "auto",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "rgba(5,150,105,0.2)" }}
          >
            <Cookie className="h-4 w-4" style={{ color: "#52B788" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-1">
              Gestion des cookies
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              Solvid.IA utilise des cookies essentiels pour le fonctionnement de la plateforme
              (authentification, session). Aucun cookie publicitaire n'est utilise.{" "}
              <button
                className="underline hover:text-white transition-colors"
                style={{ color: "rgba(82,183,136,0.8)" }}
                onClick={onNavigatePrivacy}
              >
                En savoir plus
              </button>
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                className="text-xs font-medium"
                style={{ background: "#059669", color: "#fff" }}
                onClick={handleAcceptAll}
              >
                Accepter tout
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-medium"
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.7)",
                  borderColor: "rgba(255,255,255,0.15)",
                }}
                onClick={handleEssentialOnly}
              >
                Essentiel uniquement
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
