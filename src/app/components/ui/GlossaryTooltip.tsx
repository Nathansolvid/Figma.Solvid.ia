/**
 * GlossaryTooltip — Tooltip contextuel lié au glossaire ESG
 * Affiche la shortDef d'un terme du glossaire au survol
 */
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/app/components/ui/tooltip";
import { findGlossaryEntry } from "@/data/glossary";

interface GlossaryTooltipProps {
  /** Terme à chercher dans le glossaire (ex: "VSME", "GES", "Indicateur") */
  term: string;
  /** Texte à afficher (par défaut: le terme lui-même) */
  children?: React.ReactNode;
  /** Afficher l'icône ℹ️ à côté du texte */
  showIcon?: boolean;
  /** Variante: "inline" (dans le flux) ou "icon" (juste l'icône) */
  variant?: "inline" | "icon";
}

export function GlossaryTooltip({
  term,
  children,
  showIcon = true,
  variant = "inline",
}: GlossaryTooltipProps) {
  const entry = findGlossaryEntry(term);
  if (!entry) return <>{children ?? term}</>;

  const content = (
    <div className="max-w-xs space-y-1">
      <p className="font-semibold text-xs">
        {entry.term}
        {entry.acronym && entry.acronym !== entry.term && (
          <span className="font-normal opacity-70 ml-1">({entry.acronym})</span>
        )}
      </p>
      <p className="text-xs leading-relaxed opacity-90">{entry.shortDef}</p>
    </div>
  );

  if (variant === "icon") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full opacity-40 hover:opacity-70 transition-opacity"
            aria-label={`Aide : ${entry.term}`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-white text-slate-800 border shadow-lg px-3 py-2 max-w-xs"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help">
          {children ?? term}
          {showIcon && (
            <HelpCircle className="h-3 w-3 opacity-40 hover:opacity-70 transition-opacity flex-shrink-0" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-white text-slate-800 border shadow-lg px-3 py-2 max-w-xs"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
