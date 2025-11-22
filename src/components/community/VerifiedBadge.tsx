import { ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  size?: 'sm' | 'md';
  showTooltip?: boolean;
  className?: string;
}

export const VerifiedBadge = ({ 
  size = 'sm', 
  showTooltip = true,
  className 
}: VerifiedBadgeProps) => {
  const iconSize = size === 'sm' ? 16 : 20;
  
  const badge = (
    <div 
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white",
        size === 'sm' ? "w-4 h-4" : "w-5 h-5",
        className
      )}
    >
      <ShieldCheck className={cn(
        size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"
      )} />
    </div>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Verified Creator - 3+ approved projects</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
