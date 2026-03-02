import { lazy, Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// ============================================================================
// LAZY COMPONENTS - Phase 10 Performance
// ============================================================================
// Lazy loading des composants lourds pour améliorer les performances

// Loading fallback
function LoadingFallback({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Helper pour créer un composant lazy avec fallback
function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallbackMessage?: string
) {
  const LazyComponent = lazy(importFn);
  
  return (props: any) => (
    <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// ============================================================================
// LAZY COMPONENTS EXPORTS
// ============================================================================

// Views
export const LazyPackView = createLazyComponent(
  () => import('@/app/components/views/PackView'),
  'Chargement du pack...'
);

export const LazyTransparencyModal = createLazyComponent(
  () => import('@/app/components/TransparencyModal'),
  'Chargement de la transparence...'
);

export const LazyExportsLivrables = createLazyComponent(
  () => import('@/app/components/views/ExportsLivrables'),
  'Chargement des exports...'
);

export const LazyProfessionalReportsView = createLazyComponent(
  () => import('@/app/components/views/ProfessionalReportsView'),
  'Chargement des rapports...'
);

export const LazyEvidenceVault = createLazyComponent(
  () => import('@/app/components/views/EvidenceVault'),
  'Chargement des preuves...'
);

export const LazyChecklistWorkflow = createLazyComponent(
  () => import('@/app/components/views/ChecklistWorkflow'),
  'Chargement du workflow...'
);

export const LazyAnalyticsDashboard = createLazyComponent(
  () => import('@/app/components/views/AnalyticsDashboard'),
  'Chargement du dashboard...'
);

export const LazyDashboardUniversal = createLazyComponent(
  () => import('@/app/components/views/DashboardUniversal'),
  'Chargement du dashboard...'
);

export const LazyImportCenter = createLazyComponent(
  () => import('@/app/components/views/ImportCenter'),
  'Chargement de l\'import...'
);

export const LazyAuditCenter = createLazyComponent(
  () => import('@/app/components/views/AuditCenter'),
  'Chargement de l\'audit...'
);

// ============================================================================
// EXPORTS
// ============================================================================

export { LoadingFallback };
