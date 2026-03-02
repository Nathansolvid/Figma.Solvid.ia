import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App'
import '@/styles/index.css'

// Initialisation
console.log('🚀 Solvid.IA - ESG Audit-Ready Data Room - v1.0');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)