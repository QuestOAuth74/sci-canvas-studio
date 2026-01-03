import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Gift, Share2, Zap, Clock } from 'lucide-react';
import { useAICredits } from '@/hooks/useAICredits';
import { cn } from '@/lib/utils';

interface AICreditsDisplayProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function AICreditsDisplay({ variant = 'compact', className }: AICreditsDisplayProps) {
  const { creditsInfo, isLoading, CREDITS_PER_GENERATION, PROJECTS_FOR_BONUS } = useAICredits();

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Sparkles className="h-4 w-4 animate-pulse" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!creditsInfo) return null;

  // Admin unlimited access
  if (creditsInfo.isAdmin) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          <Zap className="h-3 w-3 mr-1" />
          Unlimited (Admin)
        </Badge>
      </div>
    );
  }

  const generations = Math.floor(creditsInfo.remainingCredits / CREDITS_PER_GENERATION);
  const projectsNeeded = PROJECTS_FOR_BONUS - creditsInfo.sharedProjectsCount;

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge 
          variant={creditsInfo.canGenerate ? 'secondary' : 'destructive'}
          className={cn(
            "gap-1",
            creditsInfo.canGenerate && "bg-primary/10 text-primary border-primary/20"
          )}
        >
          <Sparkles className="h-3 w-3" />
          {creditsInfo.remainingCredits} credits ({generations} gen)
        </Badge>
        {creditsInfo.hasBonusCredits && (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
            <Gift className="h-3 w-3" />
            +{creditsInfo.bonusCredits} bonus
          </Badge>
        )}
      </div>
    );
  }

  // Full variant
  const progressValue = (creditsInfo.creditsUsed / creditsInfo.totalCredits) * 100;

  return (
    <div className={cn("p-4 bg-card rounded-lg border space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium">AI Credits</span>
        </div>
        <Badge variant={creditsInfo.canGenerate ? 'default' : 'destructive'}>
          {creditsInfo.remainingCredits} remaining
        </Badge>
      </div>

      <Progress value={100 - progressValue} className="h-2" />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Free: {creditsInfo.credits}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Gift className="h-3.5 w-3.5" />
          <span>Bonus: {creditsInfo.bonusCredits}</span>
        </div>
      </div>

      {creditsInfo.creditsResetDate && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Resets on {new Date(creditsInfo.creditsResetDate).toLocaleDateString()}
          </span>
        </div>
      )}

      {!creditsInfo.hasBonusCredits && projectsNeeded > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Gift className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Unlock +300 Bonus Credits!</p>
              <p className="text-amber-700 mt-0.5">
                Share {projectsNeeded} more project{projectsNeeded !== 1 ? 's' : ''} publicly.
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                <Share2 className="h-3 w-3" />
                <span>{creditsInfo.sharedProjectsCount}/3 shared</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!creditsInfo.canGenerate && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive font-medium">
            Not enough credits for generation (100 required)
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Each AI figure generation costs {CREDITS_PER_GENERATION} credits
      </p>
    </div>
  );
}
