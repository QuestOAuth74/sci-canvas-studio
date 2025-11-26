import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, BookOpen, Pencil, LayoutTemplate } from "lucide-react";

const FEATURED_TEMPLATES = [
  {
    id: "CELL_SIGNALING",
    name: "Cell Signaling",
    thumbnail: "/placeholder.svg",
    description: "Start with a basic cell signaling pathway"
  },
  {
    id: "WESTERN_BLOT",
    name: "Western Blot",
    thumbnail: "/placeholder.svg",
    description: "Create a western blot result figure"
  },
  {
    id: "FLOWCHART",
    name: "Experimental Flow",
    thumbnail: "/placeholder.svg",
    description: "Design your experiment workflow"
  }
];

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartWithTemplate: () => void;
  onStartTutorial: () => void;
  onStartBlank: () => void;
  onSkipTutorial: () => void;
}

export const WelcomeDialog = ({
  open,
  onOpenChange,
  onStartWithTemplate,
  onStartTutorial,
  onStartBlank,
  onSkipTutorial
}: WelcomeDialogProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleChoice = (choice: 'template' | 'tutorial' | 'blank') => {
    localStorage.setItem('canvas_welcome_completed', 'true');
    localStorage.setItem('canvas_first_choice', choice);
    
    if (choice === 'template') {
      onStartWithTemplate();
    } else if (choice === 'tutorial') {
      onStartTutorial();
    } else {
      onStartBlank();
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto paper-shadow border-2 border-[hsl(var(--pencil-gray))] bg-[hsl(var(--cream))]">
        <DialogHeader>
          <div className="flex items-center gap-2 justify-center mb-2">
            <Sparkles className="h-6 w-6 text-[hsl(var(--ink-blue))]" />
            <DialogTitle className="text-2xl font-source-serif ink-text">Welcome to BioSketch Canvas!</DialogTitle>
          </div>
          <DialogDescription className="text-center text-base font-source-serif text-[hsl(var(--pencil-gray))]">
            Choose how you'd like to start creating your first scientific figure
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Option 1: Start with Template */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-rotate-1 paper-shadow border-2 border-[hsl(var(--pencil-gray))] bg-white ${
              selectedOption === 'template' ? 'ring-2 ring-[hsl(var(--ink-blue))] rotate-0' : 'rotate-1'
            }`}
            onClick={() => setSelectedOption('template')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[hsl(var(--highlighter-yellow))]/20 flex items-center justify-center border-2 border-[hsl(var(--pencil-gray))]">
                <LayoutTemplate className="h-8 w-8 text-[hsl(var(--ink-blue))]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 font-source-serif ink-text">Start with a Template</h3>
                <p className="text-sm text-[hsl(var(--pencil-gray))]">
                  Choose from ready-made templates and customize them to your needs
                </p>
              </div>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice('template');
                }}
                variant="ink"
                className="w-full"
              >
                Browse Templates
              </Button>
            </CardContent>
          </Card>

          {/* Option 2: Interactive Tutorial */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-rotate-1 paper-shadow border-2 border-[hsl(var(--pencil-gray))] bg-white ${
              selectedOption === 'tutorial' ? 'ring-2 ring-[hsl(var(--ink-blue))] rotate-0' : '-rotate-1'
            }`}
            onClick={() => setSelectedOption('tutorial')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[hsl(var(--highlighter-yellow))]/20 flex items-center justify-center border-2 border-[hsl(var(--pencil-gray))]">
                <BookOpen className="h-8 w-8 text-[hsl(var(--ink-blue))]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 font-source-serif ink-text">Try Interactive Tutorial</h3>
                <p className="text-sm text-[hsl(var(--pencil-gray))]">
                  Learn by doing with a guided 90-second hands-on walkthrough
                </p>
              </div>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice('tutorial');
                }}
                variant="pencil"
                className="w-full"
              >
                Start Tutorial
              </Button>
            </CardContent>
          </Card>

          {/* Option 3: Start from Scratch */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-rotate-1 paper-shadow border-2 border-[hsl(var(--pencil-gray))] bg-white ${
              selectedOption === 'blank' ? 'ring-2 ring-[hsl(var(--ink-blue))] rotate-0' : 'rotate-1'
            }`}
            onClick={() => setSelectedOption('blank')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[hsl(var(--highlighter-yellow))]/20 flex items-center justify-center border-2 border-[hsl(var(--pencil-gray))]">
                <Pencil className="h-8 w-8 text-[hsl(var(--ink-blue))]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 font-source-serif ink-text">Start from Scratch</h3>
                <p className="text-sm text-[hsl(var(--pencil-gray))]">
                  Jump right in with a blank canvas for experienced users
                </p>
              </div>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice('blank');
                }}
                variant="outline"
                className="w-full border-2 border-[hsl(var(--pencil-gray))] hover:bg-[hsl(var(--cream))]"
              >
                Blank Canvas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Featured Templates Preview */}
        <div className="mt-6 pt-6 border-t-2 border-dashed border-[hsl(var(--pencil-gray))]">
          <h4 className="text-sm font-medium mb-3 text-center handwritten text-[hsl(var(--ink-blue))] text-base">
            Popular templates to get you started:
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {FEATURED_TEMPLATES.map((template) => (
              <div 
                key={template.id}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-[hsl(var(--highlighter-yellow))]/20 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-[hsl(var(--pencil-gray))] hover:rotate-1"
                onClick={() => handleChoice('template')}
              >
                <div className="h-16 w-full bg-[hsl(var(--cream))] rounded flex items-center justify-center border border-[hsl(var(--pencil-gray))]">
                  <LayoutTemplate className="h-8 w-8 text-[hsl(var(--pencil-gray))]" />
                </div>
                <span className="text-xs font-medium text-center font-source-serif">{template.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t-2 border-dashed border-[hsl(var(--pencil-gray))] flex flex-col items-center gap-2">
          <p className="text-xs text-center text-[hsl(var(--pencil-gray))] font-source-serif italic">
            You can always access templates and tutorials later from the menu
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSkipTutorial();
                onOpenChange(false);
              }}
              className="text-xs border border-[hsl(var(--pencil-gray))] hover:bg-[hsl(var(--highlighter-yellow))]/20"
            >
              Skip & Start with Guide
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.setItem('canvas_welcome_completed', 'true');
                onOpenChange(false);
              }}
              className="text-xs text-[hsl(var(--pencil-gray))] hover:text-[hsl(var(--ink-blue))]"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
