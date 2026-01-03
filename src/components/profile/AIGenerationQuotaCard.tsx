import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Share2, Gift, ArrowRight, Zap, Clock, Coins } from 'lucide-react';
import { useAICredits, CREDITS_PER_GENERATION, FREE_CREDITS, BONUS_CREDITS, PROJECTS_FOR_BONUS } from '@/hooks/useAICredits';
import { useNavigate } from 'react-router-dom';

export function AIGenerationQuotaCard() {
  const { creditsInfo, isLoading } = useAICredits();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="notebook-sidebar ruled-lines bg-[#f9f6f0] border-[hsl(var(--pencil-gray))] overflow-hidden pl-8 relative">
        <div className="spiral-binding">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="spiral-hole" />
          ))}
        </div>
        <CardHeader className="pb-3 bg-[#f9f6f0]/80">
          <CardTitle className="notebook-section-header text-sm">
            <Sparkles className="h-4 w-4 inline mr-2" />
            Loading...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--ink-blue))]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Admin users have unlimited access
  if (creditsInfo?.isAdmin) {
    return (
      <Card className="notebook-sidebar ruled-lines bg-gradient-to-br from-primary/5 to-primary/10 border-[hsl(var(--pencil-gray))] border-2 overflow-hidden pl-8 relative">
        <div className="spiral-binding">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="spiral-hole" />
          ))}
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="notebook-section-header text-sm flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
            AI Generation Access
          </CardTitle>
          <CardDescription className="font-['Source_Serif_4']">
            Administrator privileges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 mb-2">
                <Zap className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
                <span className="font-caveat text-xl text-[hsl(var(--ink-blue))]">Unlimited Access</span>
              </div>
              <p className="text-sm text-muted-foreground font-['Source_Serif_4']">
                Admin access to AI figure generation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!creditsInfo) return null;

  const progressValue = (creditsInfo.creditsUsed / creditsInfo.totalCredits) * 100;
  const projectsNeeded = PROJECTS_FOR_BONUS - creditsInfo.sharedProjectsCount;

  return (
    <Card className="notebook-sidebar ruled-lines bg-[#f9f6f0] border-[hsl(var(--pencil-gray))] overflow-hidden pl-8 relative">
      <div className="spiral-binding">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="spiral-hole" />
        ))}
      </div>
      <CardHeader className="pb-3 bg-[#f9f6f0]/80">
        <CardTitle className="notebook-section-header text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            AI Credits
          </span>
          <Badge 
            variant={creditsInfo.canGenerate ? 'default' : 'destructive'} 
            className="text-xs"
          >
            {creditsInfo.remainingCredits} credits
          </Badge>
        </CardTitle>
        <CardDescription className="font-['Source_Serif_4']">
          {creditsInfo.generationsRemaining} generation{creditsInfo.generationsRemaining !== 1 ? 's' : ''} remaining
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-['Source_Serif_4']">
              {creditsInfo.creditsUsed} of {creditsInfo.totalCredits} used
            </span>
            <span className="font-medium text-[hsl(var(--ink-blue))]">{Math.round(progressValue)}%</span>
          </div>
          <Progress 
            value={progressValue} 
            className="h-2 bg-[hsl(var(--pencil-gray))]/30" 
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/50 rounded-lg border border-[hsl(var(--pencil-gray))]">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
              <span className="text-xs text-muted-foreground font-['Source_Serif_4']">Free</span>
            </div>
            <div className="text-2xl font-bold text-[hsl(var(--ink-blue))]">{FREE_CREDITS}</div>
          </div>
          <div className="p-3 bg-white/50 rounded-lg border border-[hsl(var(--pencil-gray))]">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
              <span className="text-xs text-muted-foreground font-['Source_Serif_4']">Bonus</span>
            </div>
            <div className="text-2xl font-bold text-[hsl(var(--ink-blue))]">
              {creditsInfo.hasBonusCredits ? BONUS_CREDITS : 0}
            </div>
          </div>
        </div>

        {/* Reset Info */}
        {creditsInfo.creditsResetDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-['Source_Serif_4']">
              Credits reset on {new Date(creditsInfo.creditsResetDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Bonus unlock prompt */}
        {!creditsInfo.hasBonusCredits && projectsNeeded > 0 && (
          <div className="p-3 bg-[hsl(var(--highlighter-yellow))]/20 rounded-lg border-2 border-[hsl(var(--highlighter-yellow))]/50">
            <div className="flex items-start gap-2 mb-2">
              <Gift className="h-5 w-5 text-[hsl(var(--ink-blue))] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-caveat text-lg text-[hsl(var(--ink-blue))] mb-1">
                  Unlock +{BONUS_CREDITS} Bonus Credits!
                </p>
                <p className="text-sm text-muted-foreground font-['Source_Serif_4']">
                  Share {projectsNeeded} more project{projectsNeeded !== 1 ? 's' : ''} publicly to unlock bonus credits
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Share2 className="h-3 w-3" />
                  <span>{creditsInfo.sharedProjectsCount}/{PROJECTS_FOR_BONUS} shared</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => navigate('/projects')}
              size="sm"
              className="w-full mt-2 bg-[hsl(var(--ink-blue))] hover:bg-[hsl(var(--ink-blue))]/90"
            >
              Go to My Projects
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Already unlocked bonus */}
        {creditsInfo.hasBonusCredits && (
          <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-600" />
              <p className="font-caveat text-lg text-green-700">
                Bonus Credits Unlocked!
              </p>
            </div>
            <p className="text-sm text-green-600 font-['Source_Serif_4'] mt-1">
              Thanks for sharing {creditsInfo.sharedProjectsCount} project{creditsInfo.sharedProjectsCount !== 1 ? 's' : ''}!
            </p>
          </div>
        )}

        {/* Warning if quota exhausted */}
        {!creditsInfo.canGenerate && (
          <div className="p-3 bg-destructive/10 border-2 border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium font-['Caveat'] mb-1">
              Not enough credits
            </p>
            <p className="text-xs text-muted-foreground font-['Source_Serif_4']">
              You need {CREDITS_PER_GENERATION} credits per generation. Credits reset every 30 days.
            </p>
          </div>
        )}

        {/* Cost info */}
        <p className="text-xs text-muted-foreground text-center font-['Source_Serif_4']">
          Each AI figure generation costs {CREDITS_PER_GENERATION} credits
        </p>
      </CardContent>
    </Card>
  );
}
