import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Beaker, 
  GitBranch, 
  Calendar, 
  Upload, 
  PlayCircle,
  Sparkles,
  LayoutTemplate
} from "lucide-react";

interface EmptyCanvasStateProps {
  onOpenTemplates: () => void;
  onStartTutorial: () => void;
  onQuickStart: (type: 'scientific' | 'flowchart' | 'timeline') => void;
}

export const EmptyCanvasState = ({
  onOpenTemplates,
  onStartTutorial,
  onQuickStart
}: EmptyCanvasStateProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-full max-w-3xl px-8 pointer-events-auto">
        <Card className="border-2 border-dashed border-muted-foreground/20 bg-background/95 backdrop-blur">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                What would you like to create today?
              </h2>
              <p className="text-muted-foreground">
                Start with a template or create from scratch
              </p>
            </div>

            {/* Quick Start Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Button
                variant="outline"
                className="h-auto py-4 px-4 flex flex-col items-center gap-3 hover:bg-primary/5 hover:border-primary/50 transition-all"
                onClick={() => onQuickStart('scientific')}
              >
                <Beaker className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Scientific Figure</div>
                  <div className="text-xs text-muted-foreground">Cells, pathways, diagrams</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 px-4 flex flex-col items-center gap-3 hover:bg-primary/5 hover:border-primary/50 transition-all"
                onClick={() => onQuickStart('flowchart')}
              >
                <GitBranch className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Flowchart</div>
                  <div className="text-xs text-muted-foreground">Process, workflow, logic</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 px-4 flex flex-col items-center gap-3 hover:bg-primary/5 hover:border-primary/50 transition-all"
                onClick={() => onQuickStart('timeline')}
              >
                <Calendar className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Timeline</div>
                  <div className="text-xs text-muted-foreground">Schedule, plan, roadmap</div>
                </div>
              </Button>
            </div>

            {/* Main Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button 
                className="flex-1 h-12"
                onClick={onOpenTemplates}
              >
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Browse Community Templates
              </Button>
              <Button 
                variant="secondary"
                className="flex-1 h-12"
                onClick={onStartTutorial}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Watch Quick Tutorial
              </Button>
            </div>

            {/* Additional Help */}
            <div className="flex flex-col items-center gap-3 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Need help getting started?
              </p>
              <div className="flex gap-4">
                <Button variant="link" size="sm" asChild>
                  <a href="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/public/blog-media/biosketch%20video.mp4" target="_blank" rel="noopener noreferrer">
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Watch Demo Video
                  </a>
                </Button>
                <Button variant="link" size="sm" onClick={onStartTutorial}>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Interactive Tutorial
                </Button>
              </div>
            </div>

            {/* Keyboard Hint */}
            <div className="mt-6 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-center text-muted-foreground">
                💡 <strong>Quick tip:</strong> Press <kbd className="px-1.5 py-0.5 bg-background rounded border text-xs">Ctrl+K</kbd> anytime to access the command palette
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
