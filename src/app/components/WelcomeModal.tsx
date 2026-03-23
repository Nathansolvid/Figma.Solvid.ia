import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog";

interface WelcomeModalProps {
  onClose: () => void;
  onNavigateGuide?: () => void;
}

const CONCEPTS = [
  {
    icon: "📂",
    title: "Dossier",
    description: "Espace de travail pour un client et une année de reporting",
  },
  {
    icon: "🔧",
    title: "Parcours ESG",
    description: "Standard ESG pré-configuré (ex\u00A0: VSME Complet)",
  },
  {
    icon: "📝",
    title: "Donnée",
    description: "Donnée ESG à renseigner (quantitative ou qualitative)",
  },
  {
    icon: "📎",
    title: "Justificatif",
    description: "Document justificatif à joindre",
  },
] as const;

export function WelcomeModal({ onClose, onNavigateGuide }: WelcomeModalProps) {
  const handleCommencer = () => {
    localStorage.setItem("solvid-onboarding-done", "true");
    onClose();
  };

  const handleGuide = () => {
    localStorage.setItem("solvid-onboarding-done", "true");
    onNavigateGuide?.();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleCommencer(); }}>
      <DialogContent className="sm:max-w-lg rounded-xl border-0 shadow-2xl p-0 overflow-hidden">
        {/* Header band */}
        <div
          className="px-6 pt-6 pb-4"
          style={{ background: "linear-gradient(135deg, #E8F3F0 0%, #d1ede4 100%)" }}
        >
          <DialogHeader className="gap-1">
            <DialogTitle
              className="text-xl font-bold"
              style={{ color: "#1a5f3f" }}
            >
              Bienvenue sur Solvid.IA {"\u{1F33F}"}
            </DialogTitle>
            <DialogDescription
              className="text-sm"
              style={{ color: "#3d7a5f" }}
            >
              Voici les concepts clés pour bien démarrer.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Concept cards */}
        <div className="px-6 py-4 grid grid-cols-2 gap-3">
          {CONCEPTS.map((concept) => (
            <div
              key={concept.title}
              className="rounded-xl p-3.5 transition-shadow hover:shadow-md"
              style={{
                background: "#f8fdfb",
                border: "1px solid #d6ece3",
              }}
            >
              <div className="text-xl mb-1.5">{concept.icon}</div>
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: "#1a5f3f" }}
              >
                {concept.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#5a7d6c" }}>
                {concept.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-5 pt-1 flex flex-col gap-2 sm:flex-col sm:items-stretch">
          <button
            onClick={handleCommencer}
            className="w-full rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
            style={{ background: "#059669" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#047857"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#059669"; }}
          >
            Commencer
          </button>
          {onNavigateGuide && (
            <button
              onClick={handleGuide}
              className="w-full text-center text-sm font-medium transition-colors cursor-pointer bg-transparent border-0 py-1.5"
              style={{ color: "#059669" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#047857"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#059669"; }}
            >
              Voir le guide complet &rarr;
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
