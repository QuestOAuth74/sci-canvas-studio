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
}

export const WelcomeDialog = ({
  open,
  onOpenChange,
  onStartWithTemplate,
  onStartTutorial,
  onStartBlank
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 justify-center mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Welcome to BioSketch Canvas!</DialogTitle>
          </div>
          <DialogDescription className="text-center text-base">
            Choose how you'd like to start creating your first scientific figure
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Option 1: Start with Template */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
              selectedOption === 'template' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedOption('template')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <LayoutTemplate className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Start with a Template</h3>
                <p className="text-sm text-muted-foreground">
                  Choose from ready-made templates and customize them to your needs
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

          {/* Option 2: Interactive Tutorial */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
              selectedOption === 'tutorial' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedOption('tutorial')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Try Interactive Tutorial</h3>
                <p className="text-sm text-muted-foreground">
                  Learn by doing with a guided 90-second hands-on walkthrough
                </p>
              </div>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice('tutorial');
                }}
                variant="secondary"
                className="w-full"
              >
                Start Tutorial
              </Button>
            </CardContent>
          </Card>

          {/* Option 3: Start from Scratch */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
              selectedOption === 'blank' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedOption('blank')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Pencil className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Start from Scratch</h3>
                <p className="text-sm text-muted-foreground">
                  Jump right in with a blank canvas for experienced users
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
                Blank Canvas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Featured Templates Preview */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-3 text-center text-muted-foreground">
            Popular templates to get you started:
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {FEATURED_TEMPLATES.map((template) => (
              <div 
                key={template.id}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleChoice('template')}
              >
                <div className="h-16 w-full bg-muted rounded flex items-center justify-center">
                  <LayoutTemplate className="h-8 w-8 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-center">{template.name}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          You can always access templates and tutorials later from the menu
        </p>
      </DialogContent>
    </Dialog>
  );
};
