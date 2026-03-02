import { AppContent } from "./AppContent";
import { UserProvider } from "@/contexts/UserContext";
import { DossierProvider } from "@/contexts/DossierContext"; // 🆕 Import DossierProvider
import { DossierDataProvider } from "@/contexts/DossierDataContext"; // 🆕 Import DossierDataProvider
import { seedTestData } from "@/utils/seedData";
import { seedPhase6Data } from "@/utils/seedPhase6Data";
import { debugPhase6 } from "@/utils/debugPhase6";
import {
  seedPhase8Comments,
  debugPhase8,
} from "@/utils/seedPhase8Data";
import { debugPhase9 } from "@/utils/debugPhase9"; // 🆕 Phase 9
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./ErrorBoundary";

function App() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Clean up old backend tokens (if any exist from previous backend-based version)
      localStorage.removeItem("accessToken");
      localStorage.removeItem("JWT_TOKEN");

      // Expose debug functions globally
      (window as any).seedTestData = seedTestData;
      (window as any).seedPhase6Data = seedPhase6Data;
      (window as any).debugPhase6 = debugPhase6;
      (window as any).seedPhase8Comments = seedPhase8Comments;
      (window as any).debugPhase8 = debugPhase8;
      (window as any).debugPhase9 = debugPhase9; // 🆕 Phase 9
      console.log(
        "💡 Fonction seedTestData() disponible dans la console pour peupler les données de test",
      );
      console.log(
        "🌱 Fonction seedPhase6Data() disponible dans la console pour peupler les données Phase 6",
      );
      console.log(
        "🔧 Fonction debugPhase6 disponible dans la console pour debug Phase 6 (debugPhase6.help())",
      );
      console.log(
        "💬 Fonction seedPhase8Comments() disponible dans la console pour peupler les commentaires",
      );
      console.log(
        "🔧 Fonction debugPhase8 disponible dans la console pour debug Phase 8 (debugPhase8.help())",
      );
      console.log(
        "📦 Fonction debugPhase9 disponible dans la console pour debug Phase 9 (debugPhase9.help())",
      ); // 🆕 Phase 9
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <DossierProvider>
            <DossierDataProvider>
              <AppContent />
            </DossierDataProvider>
          </DossierProvider>
          <Toaster />{" "}
          {/* 🔧 Move Toaster outside DossierProvider */}
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;