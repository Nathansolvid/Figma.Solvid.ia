import { AppContent } from "./AppContent";
import { UserProvider } from "@/contexts/UserContext";
import { DossierProvider } from "@/contexts/DossierContext";
import { DossierDataProvider } from "@/contexts/DossierDataContext";
import { VSMEDataProvider } from "@/contexts/VSMEDataContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <DossierProvider>
            <DossierDataProvider>
              <VSMEDataProvider>
                <AppContent />
              </VSMEDataProvider>
            </DossierDataProvider>
          </DossierProvider>
          <Toaster position="top-right" />
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
