import { Badge } from "@/app/components/ui/badge";

type StatusType = "complete" | "validated" | "partial" | "missing" | "in-progress" | "draft" | "compliant" | "non-compliant";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig = {
  complete: { label: "Complet", className: "bg-[#059669] text-white hover:bg-[#047857]" },
  validated: { label: "Validé", className: "bg-[#059669] text-white hover:bg-[#047857]" },
  partial: { label: "Partiel", className: "bg-[#F59E0B] text-white hover:bg-[#D97706]" },
  missing: { label: "Manquant", className: "bg-[#DC2626] text-white hover:bg-[#B91C1C]" },
  "in-progress": { label: "En cours", className: "bg-[#F59E0B] text-white hover:bg-[#D97706]" },
  draft: { label: "Brouillon", className: "bg-[#64748B] text-white hover:bg-[#475569]" },
  compliant: { label: "Conforme", className: "bg-[#059669] text-white hover:bg-[#047857]" },
  "non-compliant": { label: "Non conforme", className: "bg-[#DC2626] text-white hover:bg-[#B91C1C]" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge className={config.className}>
      {label || config.label}
    </Badge>
  );
}
