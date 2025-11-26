import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Beaker, 
  GitBranch, 
  Calendar, 
  Upload, 
  PlayCircle,
  Sparkles,
  LayoutTemplate,
  FileEdit
} from "lucide-react";

interface EmptyCanvasStateProps {
  onOpenTemplates: () => void;
  onStartTutorial: () => void;
  onQuickStart: (type: 'scientific' | 'flowchart' | 'timeline') => void;
  onStartBlank: () => void;
}

export const EmptyCanvasState = ({
  onOpenTemplates,
  onStartTutorial,
  onQuickStart,
  onStartBlank
}: EmptyCanvasStateProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-full max-w-5xl px-8 pointer-events-auto">
        {/* Decorative tape at top */}
        <div className="absolute top-0 left-1/4 w-16 h-8 bg-[hsl(var(--highlighter-yellow))]/30 border-l border-r border-[hsl(var(--pencil-gray))]/30 -translate-y-4 rotate-[-5deg] z-10" />
        <div className="absolute top-0 right-1/4 w-16 h-8 bg-[hsl(var(--highlighter-yellow))]/30 border-l border-r border-[hsl(var(--pencil-gray))]/30 -translate-y-4 rotate-[5deg] z-10" />
        
        <Card className="border-2 border-[hsl(var(--pencil-gray))] bg-[hsl(var(--cream))] paper-shadow sketch-border rotate-[-0.5deg] relative">
          <CardContent className="p-6">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[hsl(var(--highlighter-yellow))]/40 border-2 border-[hsl(var(--pencil-gray))] mb-3">
                <Sparkles className="h-6 w-6 text-[hsl(var(--ink-blue))]" />
              </div>
              <h2 className="handwritten text-3xl mb-2 text-[hsl(var(--ink-blue))]">
                What would you like to create today?
              </h2>
              <p className="font-source-serif text-sm text-[hsl(var(--pencil-gray))]">
                Start with a template or create from scratch
              </p>
            </div>

            {/* Quick Start Options - Index Card Style */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Button
                variant="ghost"
                className="h-auto py-3 px-3 flex flex-col items-center gap-2 bg-white border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:bg-[hsl(var(--highlighter-yellow))]/20 transition-all rotate-[-1deg] hover:rotate-0"
                onClick={() => onQuickStart('scientific')}
              >
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--highlighter-yellow))]/40 border border-[hsl(var(--pencil-gray))] flex items-center justify-center">
                  <Beaker className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
                </div>
                <div className="text-center">
                  <div className="handwritten text-base text-[hsl(var(--ink-blue))]">Scientific</div>
                  <div className="text-xs font-source-serif text-[hsl(var(--pencil-gray))]">Cells & pathways</div>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="h-auto py-3 px-3 flex flex-col items-center gap-2 bg-white border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:bg-[hsl(var(--highlighter-yellow))]/20 transition-all rotate-[1deg] hover:rotate-0"
                onClick={() => onQuickStart('flowchart')}
              >
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--highlighter-yellow))]/40 border border-[hsl(var(--pencil-gray))] flex items-center justify-center">
                  <GitBranch className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
                </div>
                <div className="text-center">
                  <div className="handwritten text-base text-[hsl(var(--ink-blue))]">Flowchart</div>
                  <div className="text-xs font-source-serif text-[hsl(var(--pencil-gray))]">Process flows</div>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="h-auto py-3 px-3 flex flex-col items-center gap-2 bg-white border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:bg-[hsl(var(--highlighter-yellow))]/20 transition-all rotate-[-0.5deg] hover:rotate-0"
                onClick={() => onQuickStart('timeline')}
              >
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--highlighter-yellow))]/40 border border-[hsl(var(--pencil-gray))] flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
                </div>
                <div className="text-center">
                  <div className="handwritten text-base text-[hsl(var(--ink-blue))]">Timeline</div>
                  <div className="text-xs font-source-serif text-[hsl(var(--pencil-gray))]">Schedules</div>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="h-auto py-3 px-3 flex flex-col items-center gap-2 bg-white border-2 border-[hsl(var(--pencil-gray))] paper-shadow hover:bg-[hsl(var(--highlighter-yellow))]/20 transition-all rotate-[0.5deg] hover:rotate-0"
                onClick={onStartBlank}
              >
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--highlighter-yellow))]/40 border border-[hsl(var(--pencil-gray))] flex items-center justify-center">
                  <FileEdit className="h-5 w-5 text-[hsl(var(--ink-blue))]" />
                </div>
                <div className="text-center">
                  <div className="handwritten text-base text-[hsl(var(--ink-blue))]">Blank</div>
                  <div className="text-xs font-source-serif text-[hsl(var(--pencil-gray))]">Start fresh</div>
                </div>
              </Button>
            </div>

            {/* Main Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Button 
                variant="sticky"
                className="flex-1"
                onClick={onOpenTemplates}
              >
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Browse Community Templates
              </Button>
              <Button 
                variant="pencil"
                className="flex-1"
                onClick={onStartTutorial}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Watch Quick Tutorial
              </Button>
            </div>

            {/* Additional Help - Torn Paper Style */}
            <div className="flex flex-col items-center gap-2 pt-4 border-t-2 border-dashed border-[hsl(var(--pencil-gray))]">
              <p className="font-source-serif text-xs text-[hsl(var(--pencil-gray))] text-center">
                Need help getting started?
              </p>
              <div className="flex gap-3">
                <Button variant="ink" size="sm" asChild>
                  <a href="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/public/blog-media/biosketch%20video.mp4" target="_blank" rel="noopener noreferrer">
                    <PlayCircle className="h-3.5 w-3.5 mr-1" />
                    Demo Video
                  </a>
                </Button>
                <Button variant="ink" size="sm" onClick={onStartTutorial}>
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Tutorial
                </Button>
              </div>
            </div>

            {/* Keyboard Hint - Sticky Note Style */}
            <div className="mt-4 p-2 bg-[hsl(var(--highlighter-yellow))]/40 border-2 border-[hsl(var(--pencil-gray))] rounded-lg rotate-[0.5deg] paper-shadow">
              <p className="font-source-serif text-xs text-center text-[hsl(var(--ink-blue))]">
                💡 <strong className="handwritten">Tip:</strong> Press <kbd className="px-1.5 py-0.5 bg-white/80 rounded border border-[hsl(var(--pencil-gray))] text-xs">Ctrl+K</kbd> for command palette
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
