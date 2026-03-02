import { Progress } from "@/app/components/ui/progress";

interface DataProgressBarProps {
  label: string;
  complete: number;
  validated: number;
  missing: number;
}

export function DataProgressBar({ label, complete, validated, missing }: DataProgressBarProps) {
  const total = complete + validated + missing;
  const completePercent = (complete / total) * 100;
  const validatedPercent = (validated / total) * 100;
  const missingPercent = (missing / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {Math.round(completePercent + validatedPercent)}% complété
        </span>
      </div>
      <div className="h-3 w-full bg-[#F1F5F9] rounded-full overflow-hidden flex">
        <div 
          className="bg-[#059669] h-full transition-all" 
          style={{ width: `${validatedPercent}%` }}
        />
        <div 
          className="bg-[#10B981] h-full transition-all" 
          style={{ width: `${completePercent}%` }}
        />
        <div 
          className="bg-[#DC2626] h-full transition-all" 
          style={{ width: `${missingPercent}%` }}
        />
      </div>
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#059669]" />
          <span>{validated} validé{validated > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#10B981]" />
          <span>{complete} complet{complete > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#DC2626]" />
          <span>{missing} manquant{missing > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
