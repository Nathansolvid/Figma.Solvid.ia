import { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';

// ============================================================================
// TOOLTIP WRAPPER - Phase 10 Polish
// ============================================================================
// Composant wrapper pour ajouter des tooltips facilement

interface TooltipWrapperProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
  disabled?: boolean;
}

export function TooltipWrapper({
  content,
  children,
  side = 'top',
  delayDuration = 300,
  disabled = false,
}: TooltipWrapperProps) {
  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side}>
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
