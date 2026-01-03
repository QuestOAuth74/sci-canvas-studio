import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles,
  FileEdit,
  Users,
  Wand2
} from "lucide-react";

interface EmptyCanvasStateProps {
  onOpenTemplates: () => void;
  onStartTutorial: () => void;
  onQuickStart: (type: 'scientific' | 'flowchart' | 'timeline') => void;
  onStartBlank: () => void;
  onStartAIAssisted?: () => void;
}

export const EmptyCanvasState = ({
  onOpenTemplates,
  onStartBlank,
  onStartAIAssisted
}: EmptyCanvasStateProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-full max-w-3xl px-8 pointer-events-auto">
        <Card className="bg-card shadow-xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                Create Your Scientific Figure
              </h2>
              <p className="text-muted-foreground">
                Choose how you'd like to get started
              </p>
            </div>

            {/* Three Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Blank Canvas */}
              <Card 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 bg-card"
                onClick={onStartBlank}
              >
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <FileEdit className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Blank Canvas</h3>
                    <p className="text-xs text-muted-foreground">
                      Start fresh and build from scratch
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartBlank();
                    }}
                  >
                    Start Blank
                  </Button>
                </CardContent>
              </Card>

              {/* Option 2: Community Templates */}
              <Card 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 bg-card"
                onClick={onOpenTemplates}
              >
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Community Templates</h3>
                    <p className="text-xs text-muted-foreground">
                      Get inspired by shared templates
                    </p>
                  </div>
                  <Button 
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTemplates();
                    }}
                  >
                    Browse Templates
                  </Button>
                </CardContent>
              </Card>

              {/* Option 3: AI Assisted */}
              <Card 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 bg-card"
                onClick={() => onStartAIAssisted?.()}
              >
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                    <Wand2 className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">AI-Assisted</h3>
                    <p className="text-xs text-muted-foreground">
                      Describe and generate with AI
                    </p>
                  </div>
                  <Button 
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartAIAssisted?.();
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Generate
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Keyboard Hint */}
            <div className="mt-6 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-center text-muted-foreground">
                💡 <strong>Tip:</strong> Press <kbd className="px-1.5 py-0.5 bg-background rounded border text-xs font-mono">Ctrl+K</kbd> for command palette
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
