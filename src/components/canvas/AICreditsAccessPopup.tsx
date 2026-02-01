import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  Sparkles,
  Crown,
  ArrowRight,
  Check,
  Users,
  Zap,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAICredits, PROJECTS_FOR_BONUS, BONUS_CREDITS } from '@/hooks/useAICredits';

interface AICreditsAccessPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToCommunity?: () => void;
}

export const AICreditsAccessPopup = ({
  open,
  onOpenChange,
  onNavigateToCommunity,
}: AICreditsAccessPopupProps) => {
  const navigate = useNavigate();
  const { creditsInfo } = useAICredits();
  const [selectedOption, setSelectedOption] = useState<'share' | 'pro' | null>(null);

  const sharedCount = creditsInfo?.sharedProjectsCount || 0;
  const remaining = PROJECTS_FOR_BONUS - sharedCount;
  const progress = (sharedCount / PROJECTS_FOR_BONUS) * 100;

  const handleShareProjects = () => {
    onOpenChange(false);
    if (onNavigateToCommunity) {
      onNavigateToCommunity();
    } else {
      navigate('/projects');
    }
  };

  const handleUpgradeToPro = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Unlock AI Features</DialogTitle>
          <DialogDescription className="text-base">
            Get access to AI-powered figure generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Option 1: Share Projects */}
          <button
            onClick={() => setSelectedOption('share')}
            className={cn(
              'w-full p-4 rounded-xl border-2 text-left transition-all',
              selectedOption === 'share'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                selectedOption === 'share' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Gift className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">Share with Community</h3>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    Free
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Share {remaining > 0 ? remaining : PROJECTS_FOR_BONUS} project{remaining !== 1 ? 's' : ''} with the community to earn{' '}
                  <span className="font-semibold text-primary">{BONUS_CREDITS} AI credits</span> for free
                </p>

                {/* Progress indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {sharedCount} of {PROJECTS_FOR_BONUS} approved projects
                    </span>
                    <span className="font-medium text-primary">
                      {BONUS_CREDITS} credits
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />

                  {/* Checkmarks for progress */}
                  <div className="flex gap-2 mt-2">
                    {Array.from({ length: PROJECTS_FOR_BONUS }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex-1 h-8 rounded-md border-2 flex items-center justify-center transition-all',
                          i < sharedCount
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                            : 'border-dashed border-muted-foreground/30'
                        )}
                      >
                        {i < sharedCount ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Share2 className="h-3 w-3 text-muted-foreground/50" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Option 2: Upgrade to Pro */}
          <button
            onClick={() => setSelectedOption('pro')}
            className={cn(
              'w-full p-4 rounded-xl border-2 text-left transition-all',
              selectedOption === 'pro'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                selectedOption === 'pro' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Crown className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">Upgrade to Pro</h3>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Popular
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Get <span className="font-semibold text-primary">1,500 AI credits/month</span> plus collaboration features
                </p>

                {/* Pro features */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Sparkles, text: '1,500 credits/mo' },
                    { icon: Users, text: 'Collaboration' },
                    { icon: Zap, text: 'Priority support' },
                    { icon: Share2, text: '2 GB storage' },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <feature.icon className="h-3 w-3 text-primary" />
                      {feature.text}
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">$4.99</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {selectedOption === 'share' && (
            <Button onClick={handleShareProjects} className="w-full" size="lg">
              <Share2 className="h-4 w-4 mr-2" />
              Go to My Projects
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {selectedOption === 'pro' && (
            <Button onClick={handleUpgradeToPro} className="w-full" size="lg">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {!selectedOption && (
            <p className="text-center text-sm text-muted-foreground">
              Select an option above to continue
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AICreditsAccessPopup;
