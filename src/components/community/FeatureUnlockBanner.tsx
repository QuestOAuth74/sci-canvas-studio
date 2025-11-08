import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Button } from '@/components/ui/button';
import { X, Lock, Sparkles } from 'lucide-react';

export const FeatureUnlockBanner = () => {
  const navigate = useNavigate();
  const { hasAccess, approvedCount, remaining, isLoading } = useFeatureAccess();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check localStorage for dismissal
    const dismissedUntil = localStorage.getItem('feature-banner-dismissed');
    if (dismissedUntil) {
      const dismissedTime = parseInt(dismissedUntil);
      const now = Date.now();
      if (now < dismissedTime) {
        setIsDismissed(true);
      } else {
        // Clear expired dismissal
        localStorage.removeItem('feature-banner-dismissed');
      }
    }
  }, []);

  const handleDismiss = () => {
    const dismissUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    localStorage.setItem('feature-banner-dismissed', dismissUntil.toString());
    setIsDismissed(true);
  };

  // Don't show if user has access, banner is dismissed, or still loading
  if (hasAccess || isDismissed || isLoading) return null;

  const getProgressStars = () => {
    return Array.from({ length: 3 }, (_, i) => (
      <span key={i} className={i < approvedCount ? 'text-yellow-500' : 'text-muted-foreground/30'}>
        ⭐
      </span>
    ));
  };

  const getMessage = () => {
    if (approvedCount === 0) {
      return "🚀 Share 3 projects to the community to unlock premium features!";
    } else if (approvedCount < 3) {
      return `🎯 Almost there! Share ${remaining} more project${remaining !== 1 ? 's' : ''} to unlock premium features`;
    }
    return "";
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-y border-border/50">
      <div className="container mx-auto px-4 py-3">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4">
        {/* Left: Message & Progress */}
        <div className="flex items-center gap-3 w-full lg:flex-1">
          <Lock className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {getMessage()}
            </p>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Progress:</span>
              <div className="flex gap-0.5">
                {getProgressStars()}
              </div>
              <span className="text-muted-foreground ml-1">
                ({approvedCount}/3)
              </span>
            </div>
          </div>
        </div>

        {/* Center: Features List (Desktop only) */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium">Get:</span>
          <span>🎨 AI Figure Generator</span>
          <span>•</span>
          <span>📊 PowerPoint Maker</span>
          <span>•</span>
          <span>🎨 Icon Generator</span>
        </div>

        {/* Right: CTA & Dismiss */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          <Button 
            size="sm" 
            variant="default"
            onClick={() => navigate('/projects')}
            className="gap-1.5"
          >
            Share Projects
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 flex-shrink-0"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Features List */}
      <div className="lg:hidden mt-2 pt-2 border-t border-border/30 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-medium">Unlock:</span>
        <span>🎨 AI Figure Generator</span>
        <span>•</span>
        <span>📊 PowerPoint Maker</span>
        <span>•</span>
        <span>🎨 Icon Generator</span>
      </div>
      </div>

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-[slide-in-right_3s_ease-in-out_infinite] pointer-events-none" />
    </div>
  );
};
