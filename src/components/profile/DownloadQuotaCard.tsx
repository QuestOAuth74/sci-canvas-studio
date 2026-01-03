import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Share2, Sparkles, Gift, ArrowRight } from 'lucide-react';
import { useCommunityDownloads } from '@/hooks/useCommunityDownloads';
import { useNavigate } from 'react-router-dom';

export function DownloadQuotaCard() {
  const { quota, isLoading } = useCommunityDownloads();
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
            <Download className="h-4 w-4 inline mr-2" />
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

  // If unlimited access
  if (quota.hasUnlimited) {
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
            Download Access
          </CardTitle>
          <CardDescription className="font-['Source_Serif_4']">
            Community contribution rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-semibold text-lg text-primary">Unlimited Downloads</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Thank you for sharing {quota.sharedProjects} project{quota.sharedProjects !== 1 ? 's' : ''}!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Download unlimited community projects. AI credits are separate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/50 rounded-lg border border-[hsl(var(--pencil-gray))]">
              <div className="flex items-center gap-2 mb-1">
                <Download className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
                <span className="text-xs text-muted-foreground font-['Source_Serif_4']">Downloaded</span>
              </div>
              <div className="text-2xl font-bold text-[hsl(var(--ink-blue))]">{quota.downloadsUsed}</div>
            </div>
            <div className="p-3 bg-white/50 rounded-lg border border-[hsl(var(--pencil-gray))]">
              <div className="flex items-center gap-2 mb-1">
                <Share2 className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
                <span className="text-xs text-muted-foreground font-['Source_Serif_4']">Shared</span>
              </div>
              <div className="text-2xl font-bold text-[hsl(var(--ink-blue))]">{quota.sharedProjects}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Free tier with quota
  const progressValue = (quota.downloadsUsed / 3) * 100;
  const remaining = quota.remainingDownloads ?? 0;

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
            <Download className="h-4 w-4" />
            Download Quota
          </span>
          <Badge 
            variant={quota.canDownload ? 'default' : 'destructive'} 
            className="text-xs"
          >
            {remaining} left
          </Badge>
        </CardTitle>
        <CardDescription className="font-['Source_Serif_4']">
          Community downloads remaining
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-['Source_Serif_4']">
              {quota.downloadsUsed} of 3 used
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
              <Download className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
              <span className="text-xs text-muted-foreground font-['Source_Serif_4']">Downloaded</span>
            </div>
            <div className="text-2xl font-bold text-[hsl(var(--ink-blue))]">{quota.downloadsUsed}</div>
          </div>
          <div className="p-3 bg-white/50 rounded-lg border border-[hsl(var(--pencil-gray))]">
            <div className="flex items-center gap-2 mb-1">
              <Share2 className="h-4 w-4 text-[hsl(var(--ink-blue))]" />
              <span className="text-xs text-muted-foreground font-['Source_Serif_4']">Shared</span>
            </div>
            <div className="text-2xl font-bold text-[hsl(var(--ink-blue))]">{quota.sharedProjects}</div>
          </div>
        </div>

        {/* Unlock Progress */}
        <div className="p-3 bg-[hsl(var(--highlighter-yellow))]/20 rounded-lg border-2 border-[hsl(var(--highlighter-yellow))]/50">
          <div className="flex items-start gap-2 mb-2">
            <Gift className="h-5 w-5 text-[hsl(var(--ink-blue))] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-caveat text-lg text-[hsl(var(--ink-blue))] mb-1">
                Unlock Unlimited!
              </p>
              <p className="text-sm text-muted-foreground font-['Source_Serif_4']">
                Share {quota.projectsUntilUnlimited} more project{quota.projectsUntilUnlimited !== 1 ? 's' : ''} to unlock unlimited downloads forever
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

        {/* Warning if quota exhausted */}
        {!quota.canDownload && (
          <div className="p-3 bg-destructive/10 border-2 border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium font-['Caveat'] mb-1">
              Download limit reached
            </p>
            <p className="text-xs text-muted-foreground font-['Source_Serif_4']">
              Share public projects to continue downloading
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
