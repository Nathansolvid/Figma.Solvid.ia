# Solvid.IA — Plateforme ESG & CSRD Audit-Ready

## Tech Stack
- React 18.3 + TypeScript 5 (strict mode)
- Vite 6.3.5 (bundler, HMR)
- Tailwind CSS v4 (@tailwindcss/vite plugin, no PostCSS)
- Radix UI + shadcn/ui (50+ components in src/app/components/ui/)
- Supabase (optional cloud sync)
- IndexedDB via `idb` v8 (primary local storage)
- GSAP (animations), Recharts (data viz)
- pnpm (package manager)

## Dev Server
```bash
# Node v25+ compatibility workaround:
node node_modules/vite/bin/vite.js --port 3007
# OR use the configured launch.json via Claude Preview
```

## Architecture

### Directory Structure
```
src/
  app/
    App.tsx              # Root: provider stack
    AppContent.tsx       # View router + sidebar (23 views)
    AuthPageLocal.tsx    # Demo mode auth
    components/
      ui/               # 50+ shadcn/ui primitives (DO NOT EDIT)
      views/            # 57 feature views (Dashboard, DetailDossier, SaisieDossier, etc.)
      features/         # Excel import, sync status
      collaboration/    # CommentThread, CommentInput, CommentBadge
  contexts/
    UserContext.tsx      # Auth, user profile, demo mode
    DossierContext.tsx   # Dossier CRUD (IndexedDB + Supabase sync)
    VSMEDataContext.tsx  # VSME datapoint values, formulas, period support
    DossierDataContext.tsx # Materiality issues, ESRS, team members
  services/             # 24 modules (auth, sync, ERP, AI, export, etc.)
  hooks/                # 19 custom hooks
  types/                # TypeScript interfaces (compliance, ERP, evidence)
  data/                 # VSME referential, templates, compliance data
  lib/                  # Query client, Supabase config
  utils/                # Calculations, export helpers, parsing
```

### Provider Stack (App.tsx)
```
ErrorBoundary > QueryClientProvider > UserProvider > DossierProvider
  > DossierDataProvider > VSMEDataProvider > AppContent
```

### Data Flow
1. **IndexedDB** = primary cache (offline-first)
   - Stores: `dossiers`, `vsme_values` (v3 schema), `mission_notes`
2. **Supabase** = optional cloud sync (fire-and-forget via syncEngine)
3. **LocalStorage** = session, credentials (PBKDF2), onboarding flags

## Conventions

### Code Style
- French UI text, English code/comments
- Use lucide-react icons exclusively (no emoji in production UI)
- Colors: primary green `#059669`, dark `#0F4C3A`, bg `#E8F3F0`
- All components use shadcn/ui primitives from `@/app/components/ui/`

### State Management
- React Context for global state (4 contexts)
- @tanstack/react-query for server state
- IndexedDB for persistence (via services)
- NO Redux, NO Zustand

### Feature Flags
- Defined in `src/featureFlags.ts`
- Check with `isFeatureEnabled('flagName')` or `shouldShowFeature('flagName', context)`
- Currently enabled: packs, aiAssistant, connectors, advancedDash, completenessScore, realTimeNotifications, autoMapping

### RBAC (src/permissions.ts)
- 6 roles: ADMIN, CLIENT_OWNER, CLIENT_CONTRIBUTOR, CONSULTANT, AUDITOR, VIEWER
- Check with `can(role, Action.XXX, resource?, context?)`
- ADMIN bypasses all checks
- Demo mode: hardcoded user nathan.glatt@icloud.com with ADMIN role

### Important Patterns
- **Posture**: "conseil" | "pre-audit" | "audit-externe" (changes UI behavior)
- **Parcours**: "csrd-obligatoire" | "esg-structure" (changes labels & features)
- **Period support**: "2025" (annual), "2025-T1" to "2025-T4" (quarterly)
- **Computed VSME fields**: B3.3, B3.4, B5.4, B7.4, B7.5, B8.4 auto-calculate from other values

## Key Services

| Service | Purpose |
|---------|---------|
| `authService.ts` | PBKDF2 auth, session tokens, admin seed |
| `dataProvider.ts` | Abstract LocalProvider/ApiProvider |
| `idbService.ts` | IndexedDB CRUD, migrations (v1-v3) |
| `syncEngine.ts` | Write-through to Supabase, offline queue |
| `packService.ts` | Pack/deliverable CRUD & templates |
| `erpConnectorService.ts` | ERP catalog, connections, mapping, sync |
| `erpCategorizationEngine.ts` | 3-tier supplier classification |
| `erpESGAggregator.ts` | Emission factors, ESG indicator aggregation |
| `aiQualitativeService.ts` | Claude API integration for reports |
| `exportService.ts` | Excel/PDF generation |
| `smartImportMatcher.ts` | ML-based column matching for Excel |

## Testing
- No tests yet (TODO: add vitest + @testing-library/react)
- No E2E tests (TODO: add Playwright)

## Security
- No secrets in code or logs
- API keys stored in sessionStorage (obfuscated, not encrypted)
- Supabase public key only (publishable)
- PBKDF2 SHA-256 with 100k iterations for password hashing
