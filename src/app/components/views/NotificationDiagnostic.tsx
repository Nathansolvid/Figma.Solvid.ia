// ============================================================================
// NOTIFICATION DIAGNOSTIC - Outil de débogage
// ============================================================================
// Page pour diagnostiquer les problèmes de notifications

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
const _supaUrl = import.meta.env.VITE_SUPABASE_URL as string;
const projectId = _supaUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '';
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface DiagnosticResult {
  step: string;
  status: "pending" | "success" | "error";
  message: string;
  details?: any;
}

export default function NotificationDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [running, setRunning] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    // Récupérer le currentUser depuis localStorage
    const authData = localStorage.getItem("solvid_current_user");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setCurrentUserId(parsed.id || "N/A");
      } catch (e) {
        setCurrentUserId("Erreur parsing");
      }
    } else {
      setCurrentUserId("Non connecté");
    }
  }, []);

  const addResult = (result: DiagnosticResult) => {
    setResults((prev) => [...prev, result]);
  };

  const runDiagnostic = async () => {
    setResults([]);
    setRunning(true);

    try {
      // ========================================================================
      // STEP 1: Vérifier les variables d'environnement
      // ========================================================================
      addResult({
        step: "1. Variables d'environnement",
        status: "pending",
        message: "Vérification...",
      });

      const hasProjectId = !!projectId;
      const hasAnonKey = !!publicAnonKey;

      if (hasProjectId && hasAnonKey) {
        setResults((prev) =>
          prev.map((r, i) =>
            i === prev.length - 1
              ? {
                  ...r,
                  status: "success",
                  message: "Variables OK",
                  details: {
                    projectId: projectId.substring(0, 10) + "...",
                    anonKey: publicAnonKey.substring(0, 20) + "...",
                  },
                }
              : r
          )
        );
      } else {
        setResults((prev) =>
          prev.map((r, i) =>
            i === prev.length - 1
              ? {
                  ...r,
                  status: "error",
                  message: "Variables manquantes",
                  details: { hasProjectId, hasAnonKey },
                }
              : r
          )
        );
        setRunning(false);
        return;
      }

      // ========================================================================
      // STEP 2: Vérifier l'utilisateur connecté
      // ========================================================================
      addResult({
        step: "2. Utilisateur connecté",
        status: "pending",
        message: "Vérification...",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const authData = localStorage.getItem("solvid_current_user");
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const userId = parsed.id;
          const userEmail = parsed.email;
          const userName = parsed.name;

          if (userId) {
            setResults((prev) =>
              prev.map((r, i) =>
                i === prev.length - 1
                  ? {
                      ...r,
                      status: "success",
                      message: "Utilisateur connecté",
                      details: { userId, userEmail, userName },
                    }
                  : r
              )
            );
          } else {
            setResults((prev) =>
              prev.map((r, i) =>
                i === prev.length - 1
                  ? {
                      ...r,
                      status: "error",
                      message: "Pas d'userId dans solvid_current_user",
                      details: parsed,
                    }
                  : r
              )
            );
            setRunning(false);
            return;
          }
        } catch (e) {
          setResults((prev) =>
            prev.map((r, i) =>
              i === prev.length - 1
                ? {
                    ...r,
                    status: "error",
                    message: "Erreur parsing solvid_current_user",
                    details: { error: String(e) },
                  }
                : r
            )
          );
          setRunning(false);
          return;
        }
      } else {
        setResults((prev) =>
          prev.map((r, i) =>
            i === prev.length - 1
              ? {
                  ...r,
                  status: "error",
                  message: "Aucune donnée utilisateur dans localStorage (solvid_current_user)",
                  details: {
                    solution: "Veuillez vous déconnecter et vous reconnecter",
                  },
                }
              : r
          )
        );
        setRunning(false);
        return;
      }

      // ========================================================================
      // STEP 3: Créer une notification de test
      // ========================================================================
      addResult({
        step: "3. Créer notification test",
        status: "pending",
        message: "Envoi...",
      });

      const authDataParsed = JSON.parse(localStorage.getItem("solvid_current_user") || "{}");
      const testUserId = authDataParsed.id || "user-1";

      const createResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/notifications`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: testUserId,
            type: "PACK_READY_FOR_REVIEW",
            title: "🔬 Test Diagnostic",
            message: `Notification créée à ${new Date().toLocaleTimeString()}`,
            packId: `pack-diagnostic-${Date.now()}`,
            packName: "Pack Test Diagnostic",
            dossierId: "dossier-test",
            createdBy: "diagnostic-tool",
          }),
        }
      );

      const createData = await createResponse.json();

      if (createResponse.ok) {
        setResults((prev) =>
          prev.map((r, i) =>
            i === prev.length - 1
              ? {
                  ...r,
                  status: "success",
                  message: "Notification créée",
                  details: createData,
                }
              : r
          )
        );
      } else {
        setResults((prev) =>
          prev.map((r, i) =>
            i === prev.length - 1
              ? {
                  ...r,
                  status: "error",
                  message: "Erreur création",
                  details: createData,
                }
              : r
          )
        );
        setRunning(false);
        return;
      }

      // ========================================================================
      // STEP 4: Récupérer les notifications
      // ========================================================================
      addResult({
        step: "4. Récupérer notifications",
        status: "pending",
        message: "GET...",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const getResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/notifications`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
            "X-User-Id": testUserId,
          },
        }
      );

      const getData = await getResponse.json();

      if (getResponse.ok) {
        setResults((prev) =>
          prev.map((r, i) =>
            i === prev.length - 1
              ? {
                  ...r,
                  status: "success",
                  message: `${getData.notifications?.length || 0} notification(s) trouvée(s)`,
                  details: getData,
                }
              : r
          )
        );
      } else {
        setResults((prev) =>
          prev.map((r, i) =>
            i === prev.length - 1
              ? {
                  ...r,
                  status: "error",
                  message: "Erreur récupération",
                  details: getData,
                }
              : r
          )
        );
        setRunning(false);
        return;
      }

      // ========================================================================
      // STEP 5: Vérifier le composant NotificationBell
      // ========================================================================
      addResult({
        step: "5. Vérifier NotificationBell",
        status: "pending",
        message: "Vérification DOM...",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const bellElement = document.querySelector('[data-testid="notification-bell"]') ||
                         document.querySelector('button svg.lucide-bell');
      
      const badgeElement = document.querySelector('[class*="badge"]');

      if (bellElement) {
        setResults((prev) =>
          prev.map((r, i) =>
            i === prev.length - 1
              ? {
                  ...r,
                  status: "success",
                  message: "Cloche trouvée dans le DOM",
                  details: {
                    hasBell: true,
                    hasBadge: !!badgeElement,
                    badgeText: badgeElement?.textContent,
                  },
                }
              : r
          )
        );
      } else {
        setResults((prev) =>
          prev.map((r, i) =>
            i === prev.length - 1
              ? {
                  ...r,
                  status: "error",
                  message: "Cloche introuvable dans le DOM",
                  details: { bellFound: false },
                }
              : r
          )
        );
      }

      // ========================================================================
      // STEP 6: Vérifier que NotificationBell reçoit bien les notifications
      // ========================================================================
      addResult({
        step: "6. État du NotificationBell",
        status: "success",
        message: "Vérifiez visuellement la cloche en haut à droite",
        details: {
          recommendation: "Le badge devrait afficher le nombre de notifications non lues",
          action: "Cliquez sur la cloche pour ouvrir le dropdown",
        },
      });

    } catch (error: any) {
      addResult({
        step: "Erreur globale",
        status: "error",
        message: error.message,
        details: { stack: error.stack },
      });
    } finally {
      setRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">🔬 Diagnostic Notifications</h1>
        <p className="text-muted-foreground">
          Outil de débogage pour identifier les problèmes du système de notifications
        </p>
      </div>

      {currentUserId && (
        <Alert>
          <AlertDescription>
            <strong>Utilisateur actuel :</strong> {currentUserId}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lancer le diagnostic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDiagnostic} disabled={running} className="w-full">
            {running ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Diagnostic en cours...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Lancer le diagnostic complet
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="font-semibold">Résultats :</h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0 mt-0.5">{getStatusIcon(result.status)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{result.step}</h4>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-blue-600">
                          Voir détails
                        </summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-40">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions manuelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold mb-2">1. Vérifier la console navigateur</h4>
            <p className="text-sm text-muted-foreground">
              Ouvrez les DevTools (F12) et regardez s'il y a des erreurs dans l'onglet Console
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Vérifier la cloche</h4>
            <p className="text-sm text-muted-foreground">
              Regardez en haut à droite de l'écran : l'icône cloche devrait afficher un badge rouge avec le nombre de notifications
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. Cliquer sur la cloche</h4>
            <p className="text-sm text-muted-foreground">
              Le dropdown devrait s'ouvrir et afficher les notifications
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">4. Vérifier l'onglet Network</h4>
            <p className="text-sm text-muted-foreground">
              Dans DevTools, onglet Network, vérifiez que les requêtes vers /notifications ne retournent pas d'erreurs 4xx ou 5xx
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}