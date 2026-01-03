import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, FileEdit, Users, Wand2 } from "lucide-react";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartWithTemplate: () => void;
  onStartTutorial: () => void;
  onStartBlank: () => void;
  onSkipTutorial: () => void;
  onStartAIAssisted?: () => void;
}

export const WelcomeDialog = ({
  open,
  onOpenChange,
  onStartWithTemplate,
  onStartBlank,
  onStartAIAssisted
}: WelcomeDialogProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleChoice = (choice: 'template' | 'blank' | 'ai') => {
    if (choice === 'template') {
      onStartWithTemplate();
    } else if (choice === 'ai') {
      onStartAIAssisted?.();
    } else {
      onStartBlank();
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border border-border bg-card shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 justify-center mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl font-semibold">Welcome to BioSketch Canvas!</DialogTitle>
          </div>
          <DialogDescription className="text-center text-base text-muted-foreground">
            Choose how you'd like to start creating your scientific figure
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Option 1: Blank Canvas */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-card ${
              selectedOption === 'blank' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedOption('blank')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <FileEdit className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Blank Canvas</h3>
                <p className="text-sm text-muted-foreground">
                  Start fresh with an empty canvas and build your figure from scratch
                </p>
              </div>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice('blank');
                }}
                variant="outline"
                className="w-full"
              >
                Start Blank
              </Button>
            </CardContent>
          </Card>

          {/* Option 2: Community Templates */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-card ${
              selectedOption === 'template' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedOption('template')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Community Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Get inspired by templates created and shared by the community
                </p>
              </div>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice('template');
                }}
                className="w-full"
              >
                Browse Templates
              </Button>
            </CardContent>
          </Card>

          {/* Option 3: AI Assisted */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-card ${
              selectedOption === 'ai' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedOption('ai')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center">
                <Wand2 className="h-8 w-8 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">AI-Assisted Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Describe your figure and let AI help you create it quickly
                </p>
              </div>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice('ai');
                }}
                variant="secondary"
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground"
          >
            Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
