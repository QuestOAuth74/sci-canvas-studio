import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Share2, Gift, ArrowRight, Zap } from 'lucide-react';
import { useAIGenerationUsage } from '@/hooks/useAIGenerationUsage';
import { useNavigate } from 'react-router-dom';

export function AIGenerationQuotaCard() {
  const { usage, isLoading } = useAIGenerationUsage();
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
  if (usage?.isAdmin) {
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
                Admin access to AI icon generation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Premium users with access
  if (usage?.hasPremium) {
    const progressValue = usage.limit ? (usage.used / usage.limit) * 100 : 0;
    const remaining = usage.remaining ?? 0;

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
              <Sparkles className="h-4 w-4" />
              AI Generations
            </span>
            <Badge 
              variant={usage.canGenerate ? 'default' : 'destructive'} 
              className="text-xs"
            >
              {remaining} left
            </Badge>
          </CardTitle>
          <CardDescription className="font-['Source_Serif_4']">
            Monthly AI icon generations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-['Source_Serif_4']">
                {usage.used} of {usage.limit} used
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
                <span className="text-xs text-muted-foreground font-['Source_Serif_4']">Generated</span>
              </div>
              <div className="text-2xl font-bold text-[hsl(var(--ink-blue))]">{usage.used}</div>
            </div>
            <div className="p-3 bg-white/50 rounded-lg border border-[hsl(var(--pencil-gray))]">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
                <span className="text-xs text-muted-foreground font-['Source_Serif_4']">Remaining</span>
              </div>
              <div className="text-2xl font-bold text-[hsl(var(--ink-blue))]">{remaining}</div>
            </div>
          </div>

          {/* Reset Info */}
          <div className="p-3 bg-[hsl(var(--highlighter-yellow))]/20 rounded-lg border-2 border-[hsl(var(--highlighter-yellow))]/50">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-[hsl(var(--ink-blue))] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-caveat text-lg text-[hsl(var(--ink-blue))] mb-1">
                  Premium Feature Unlocked!
                </p>
                <p className="text-sm text-muted-foreground font-['Source_Serif_4']">
                  You get 3 AI generations per month (shared across Biosketch Icons, Figures, and PowerPoint). Resets on the 1st of each month.
                </p>
              </div>
            </div>
          </div>

          {/* Warning if quota exhausted */}
          {!usage.canGenerate && (
            <div className="p-3 bg-destructive/10 border-2 border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium font-['Caveat'] mb-1">
                Generation limit reached
              </p>
              <p className="text-xs text-muted-foreground font-['Source_Serif_4']">
                Limit resets on {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Non-premium users (locked)
  const approvedCount = usage?.approvedCount ?? 0;
  const needsApproved = usage?.needsApproved ?? 3;

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
            <Sparkles className="h-4 w-4" />
            AI Generations
          </span>
          <Badge variant="secondary" className="text-xs">
            🔒 Locked
          </Badge>
        </CardTitle>
        <CardDescription className="font-['Source_Serif_4']">
          Unlock premium AI features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lock Message */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 to-amber-500/5 rounded-lg border-2 border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <p className="font-caveat text-lg text-amber-600">
              Premium Feature
            </p>
          </div>
          <p className="text-sm text-muted-foreground font-['Source_Serif_4']">
            AI icon generation requires 3+ approved public projects
          </p>
        </div>

        {/* Progress toward unlock */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-['Source_Serif_4']">
              Progress to unlock
            </span>
            <span className="font-medium text-[hsl(var(--ink-blue))]">{approvedCount}/3</span>
          </div>
          <Progress 
            value={(approvedCount / 3) * 100} 
            className="h-2 bg-[hsl(var(--pencil-gray))]/30" 
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/50 rounded-lg border border-[hsl(var(--pencil-gray))]">
            <div className="flex items-center gap-2 mb-1">
              <Share2 className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
              <span className="text-xs text-muted-foreground font-['Source_Serif_4']">Approved</span>
            </div>
            <div className="text-2xl font-bold text-[hsl(var(--ink-blue))]">{approvedCount}</div>
          </div>
          <div className="p-3 bg-white/50 rounded-lg border border-[hsl(var(--pencil-gray))]">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
              <span className="text-xs text-muted-foreground font-['Source_Serif_4']">Needed</span>
            </div>
            <div className="text-2xl font-bold text-[hsl(var(--ink-blue))]">{needsApproved}</div>
          </div>
        </div>

        {/* Call to action */}
        <div className="p-3 bg-[hsl(var(--highlighter-yellow))]/20 rounded-lg border-2 border-[hsl(var(--highlighter-yellow))]/50">
          <div className="flex items-start gap-2 mb-2">
            <Gift className="h-5 w-5 text-[hsl(var(--ink-blue))] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-caveat text-lg text-[hsl(var(--ink-blue))] mb-1">
                Unlock AI Features!
              </p>
              <p className="text-sm text-muted-foreground font-['Source_Serif_4']">
                Share {needsApproved} more project{needsApproved !== 1 ? 's' : ''} to unlock 3 free AI generations per month
              </p>
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
      </CardContent>
    </Card>
  );
}
