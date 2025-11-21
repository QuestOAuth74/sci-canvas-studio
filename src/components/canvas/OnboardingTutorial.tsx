import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

export const OnboardingTutorial = () => {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    previousStep,
    skipOnboarding,
  } = useOnboarding();

  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive || !currentStep.target) {
      setHighlightRect(null);
      return;
    }

    // Find the target element and get its position
    const updateHighlight = () => {
      const element = document.querySelector(currentStep.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
      } else {
        setHighlightRect(null);
      }
    };

    updateHighlight();

    // Update on scroll or resize
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [isActive, currentStep]);

  if (!isActive) return null;

  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isCenterPosition = currentStep.position === 'center';

  // Calculate tooltip position based on highlighted element
  const getTooltipPosition = () => {
    if (isCenterPosition || !highlightRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;
    const style: React.CSSProperties = {};

    switch (currentStep.position) {
      case 'bottom':
        style.top = `${highlightRect.bottom + padding}px`;
        style.left = `${highlightRect.left + highlightRect.width / 2}px`;
        style.transform = 'translateX(-50%)';
        break;
      case 'top':
        style.bottom = `${window.innerHeight - highlightRect.top + padding}px`;
        style.left = `${highlightRect.left + highlightRect.width / 2}px`;
        style.transform = 'translateX(-50%)';
        break;
      case 'right':
        style.top = `${highlightRect.top + highlightRect.height / 2}px`;
        style.left = `${highlightRect.right + padding}px`;
        style.transform = 'translateY(-50%)';
        break;
      case 'left':
        style.top = `${highlightRect.top + highlightRect.height / 2}px`;
        style.right = `${window.innerWidth - highlightRect.left + padding}px`;
        style.transform = 'translateY(-50%)';
        break;
    }

    return style;
  };

  return (
    <>
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[9998] animate-fade-in" />

      {/* Highlight spotlight */}
      {highlightRect && !isCenterPosition && (
        <>
          {/* Clear spotlight cutout area */}
          <div
            className="fixed z-[9999] pointer-events-none animate-scale-in"
            style={{
              top: highlightRect.top - 12,
              left: highlightRect.left - 12,
              width: highlightRect.width + 24,
              height: highlightRect.height + 24,
              borderRadius: '12px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            }}
          />
          {/* Highlight border */}
          <div
            className="fixed z-[10000] pointer-events-none animate-scale-in"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              border: '3px solid hsl(var(--primary))',
              borderRadius: '8px',
              boxShadow: '0 0 0 4px hsl(var(--primary) / 0.3), 0 0 48px hsl(var(--primary) / 0.6)',
            }}
          />
        </>
      )}

      {/* Tutorial card */}
      <Card
        className="fixed z-[10000] w-full max-w-md p-6 shadow-2xl animate-scale-in"
        style={getTooltipPosition()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">{currentStep.title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={skipOnboarding}
            className="h-8 w-8 -mr-2 -mt-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <p className="text-muted-foreground mb-4 leading-relaxed">
          {currentStep.description}
        </p>

        {currentStep.action && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium text-primary">
              👉 {currentStep.action}
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipOnboarding}
          >
            Skip Tutorial
          </Button>
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={previousStep}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={nextStep}
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};
