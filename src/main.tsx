import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from '@/app/App'
import '@/styles/index.css'

// ── Sentry Error Monitoring ──────────────────────────────────────────────────
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: 'solvid-ia@1.0.0',
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.2 : 1.0,
    beforeSend(event) {
      // RGPD: never send emails to Sentry
      if (event.user?.email) event.user.email = '[REDACTED]';
      // Filter out HMR-related context errors in development
      const msg = event.exception?.values?.[0]?.value || '';
      if (import.meta.env.MODE === 'development' && msg.includes('must be used within')) {
        return null; // Drop HMR false positives
      }
      return event;
    },
  });
}

console.log('🚀 Solvid.IA - Plateforme ESG - v1.0');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)