import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MousePointer2, 
  Square, 
  Type, 
  Image,
  Undo,
  Save,
  Keyboard,
  Lightbulb
} from "lucide-react";

const WELCOME_DIALOG_KEY = "biosketch_welcome_dialog_seen";

export const WelcomeDialog = () => {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenDialog = localStorage.getItem(WELCOME_DIALOG_KEY);
    if (!hasSeenDialog) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_DIALOG_KEY, "true");
    }
    setOpen(false);
  };

  const steps = [
    {
      title: "Welcome to BioSketch! 👋",
      icon: Lightbulb,
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            BioSketch is a powerful vector graphics editor designed for creating beautiful biological and medical illustrations.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <MousePointer2 className="h-5 w-5 mt-0.5 text-accent shrink-0" />
              <div>
                <p className="font-semibold text-sm">Select & Transform</p>
                <p className="text-sm text-muted-foreground">Click and drag objects to move, resize, or rotate them</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Square className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-sm">Shapes & Icons</p>
                <p className="text-sm text-muted-foreground">Use the left toolbar to add shapes, or drag icons from the library</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
              <Type className="h-5 w-5 mt-0.5 text-secondary shrink-0" />
              <div>
                <p className="font-semibold text-sm">Add Text</p>
                <p className="text-sm text-muted-foreground">Click anywhere on the canvas to add and style text</p>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      title: "Icon Library 🎨",
      icon: Image,
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            Browse thousands of biological and medical icons organized by category.
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span><strong>Search:</strong> Use the search bar to quickly find specific icons</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <span><strong>Drag & Drop:</strong> Simply drag icons from the library onto your canvas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-secondary" />
              <span><strong>Pin Categories:</strong> Pin your favorite categories for quick access</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span><strong>Upload Custom:</strong> Add your own SVG icons to the library</span>
            </div>
          </div>
        </>
      ),
    },
    {
      title: "Keyboard Shortcuts ⌨️",
      icon: Keyboard,
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            Speed up your workflow with keyboard shortcuts:
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Undo</span>
                <kbd className="px-2 py-1 bg-card border rounded text-xs font-mono">Ctrl+Z</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Redo</span>
                <kbd className="px-2 py-1 bg-card border rounded text-xs font-mono">Ctrl+Shift+Z</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Copy</span>
                <kbd className="px-2 py-1 bg-card border rounded text-xs font-mono">Ctrl+C</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Paste</span>
                <kbd className="px-2 py-1 bg-card border rounded text-xs font-mono">Ctrl+V</kbd>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Delete</span>
                <kbd className="px-2 py-1 bg-card border rounded text-xs font-mono">Del</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Select All</span>
                <kbd className="px-2 py-1 bg-card border rounded text-xs font-mono">Ctrl+A</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Save</span>
                <kbd className="px-2 py-1 bg-card border rounded text-xs font-mono">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Help</span>
                <kbd className="px-2 py-1 bg-card border rounded text-xs font-mono">?</kbd>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">?</kbd> anytime to see all shortcuts
          </p>
        </>
      ),
    },
    {
      title: "Tips for Success 💡",
      icon: Save,
      content: (
        <>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
              <Undo className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-sm mb-1">Auto-save is Enabled</p>
                <p className="text-sm text-muted-foreground">
                  Your work is automatically saved every few seconds. You can also manually save with Ctrl+S or the Save button.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
              <Keyboard className="h-5 w-5 mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="font-semibold text-sm mb-1">Use Keyboard Shortcuts</p>
                <p className="text-sm text-muted-foreground">
                  Most tools have single-letter shortcuts (R for rectangle, C for circle, T for text). Hover over any tool to see its shortcut.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
              <MousePointer2 className="h-5 w-5 mt-0.5 shrink-0 text-secondary" />
              <div>
                <p className="font-semibold text-sm mb-1">Right Panel Properties</p>
                <p className="text-sm text-muted-foreground">
                  Select any object to see its properties in the right panel. Adjust colors, sizes, borders, and more.
                </p>
              </div>
            </div>
          </div>
        </>
      ),
    },
  ];

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && dontShowAgain) {
      localStorage.setItem(WELCOME_DIALOG_KEY, "true");
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <StepIcon className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-2xl">{currentStep.title}</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Welcome tutorial step {step + 1} of {steps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {currentStep.content}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="dont-show" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <label 
              htmlFor="dont-show" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Don't show this again
            </label>
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next ({step + 1}/{steps.length})
              </Button>
            ) : (
              <Button onClick={handleClose}>
                Get Started
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 justify-center pt-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setStep(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === step 
                  ? "w-6 bg-primary" 
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
