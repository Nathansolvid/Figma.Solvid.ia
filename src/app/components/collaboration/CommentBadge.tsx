// ============================================================================
// COMMENT BADGE - Phase 8
// ============================================================================
// Badge affichant le nombre de commentaires pour une entité

import { useState, useEffect } from "react";
import { Badge } from "@/app/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface CommentBadgeProps {
  entityType: "indicator" | "pack" | "dossier" | "evidence" | "checklist-item";
  entityId: string;
  showIcon?: boolean;
  variant?: "default" | "secondary" | "outline";
}

export function CommentBadge({
  entityType,
  entityId,
  showIcon = true,
  variant = "secondary",
}: CommentBadgeProps) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommentCount();
  }, [entityType, entityId]);

  const loadCommentCount = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/comments/${entityType}/${entityId}/count`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCount(data.count || 0);
      }
    } catch (err) {
      console.error("Error loading comment count:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || count === 0) {
    return null;
  }

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      {showIcon && <MessageSquare className="h-3 w-3" />}
      {count}
    </Badge>
  );
}
