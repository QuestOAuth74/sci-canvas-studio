import { useEffect, useState } from "react";
import { X, Sparkles, AlignCenter, Grid3x3, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvas } from "@/contexts/CanvasContext";

interface Suggestion {
  id: string;
  icon: any;
  title: string;
  message: string;
  action?: () => void;
  actionLabel?: string;
}

export const SmartSuggestions = () => {
  const { canvas, selectedObject, gridEnabled } = useCanvas();
  const [currentSuggestion, setCurrentSuggestion] = useState<Suggestion | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('dismissedSuggestions') || '[]'))
  );

  useEffect(() => {
    if (!canvas) return;

    const checkForSuggestions = () => {
      const objects = canvas.getObjects().filter((obj: any) => 
        !obj.isControlHandle && !obj.isHandleLine && !obj.isGuideLine
      );

      // Suggestion: Use alignment guides when multiple objects exist
      if (objects.length >= 3 && !gridEnabled && !dismissedSuggestions.has('alignment-guides')) {
        setCurrentSuggestion({
          id: 'alignment-guides',
          icon: Grid3x3,
          title: 'Enable Alignment Guides',
          message: 'You have multiple objects. Turn on the grid to align them perfectly.',
          actionLabel: 'Show Grid',
          action: () => {
            const gridBtn = document.querySelector('[data-grid-toggle]') as HTMLButtonElement;
            gridBtn?.click();
          }
        });
        return;
      }

      // Suggestion: Use layers panel when many objects
      if (objects.length >= 5 && !dismissedSuggestions.has('use-layers')) {
        setCurrentSuggestion({
          id: 'use-layers',
          icon: Layers,
          title: 'Organize with Layers',
          message: 'Your canvas has many objects. Use the Layers panel to manage them easily.',
        });
        return;
      }

      // Suggestion: Use alignment tools with selection
      if (selectedObject?.type === 'activeSelection' && !dismissedSuggestions.has('align-selection')) {
        setCurrentSuggestion({
          id: 'align-selection',
          icon: AlignCenter,
          title: 'Align Multiple Objects',
          message: 'Selected multiple objects? Use the alignment tools in the top toolbar.',
        });
        return;
      }

      setCurrentSuggestion(null);
    };

    checkForSuggestions();
    
    canvas.on('object:added', checkForSuggestions);
    canvas.on('selection:created', checkForSuggestions);
    canvas.on('selection:updated', checkForSuggestions);
    canvas.on('selection:cleared', checkForSuggestions);

    return () => {
      canvas.off('object:added', checkForSuggestions);
      canvas.off('selection:created', checkForSuggestions);
      canvas.off('selection:updated', checkForSuggestions);
      canvas.off('selection:cleared', checkForSuggestions);
    };
  }, [canvas, gridEnabled, dismissedSuggestions, selectedObject]);

  const handleDismiss = () => {
    if (currentSuggestion) {
      const newDismissed = new Set(dismissedSuggestions);
      newDismissed.add(currentSuggestion.id);
      setDismissedSuggestions(newDismissed);
      localStorage.setItem('dismissedSuggestions', JSON.stringify([...newDismissed]));
      setCurrentSuggestion(null);
    }
  };

  if (!currentSuggestion) return null;

  const Icon = currentSuggestion.icon;

  return (
    <div className="fixed bottom-16 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="glass-effect-premium rounded-lg shadow-lg border border-primary/20 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {currentSuggestion.title}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-5 w-5 p-0 hover:bg-destructive/10"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {currentSuggestion.message}
            </p>
            {currentSuggestion.action && currentSuggestion.actionLabel && (
              <Button
                size="sm"
                onClick={() => {
                  currentSuggestion.action?.();
                  handleDismiss();
                }}
                className="h-7 text-xs"
              >
                {currentSuggestion.actionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
