/**
 * Server Status Banner - Shows backend deployment status
 */

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function ServerStatusBanner() {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'deploying' | 'error'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const checkServerHealth = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        setStatus('healthy');
        setMessage('');
      } else {
        setStatus('deploying');
        setMessage('Le serveur est en cours de redémarrage. Fonctionnalités limitées temporairement.');
      }
    } catch (error) {
      setStatus('deploying');
      setMessage('Le serveur est en cours de déploiement. Réessayez dans 30-60 secondes.');
    }
  };

  if (status === 'healthy') {
    return null; // Don't show banner when everything is OK
  }

  if (status === 'checking') {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-900">
          Vérification de l'état du serveur...
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'deploying') {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900">
          <strong>Déploiement en cours :</strong> {message}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
