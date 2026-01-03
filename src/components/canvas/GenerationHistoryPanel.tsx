import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  History, 
  RotateCcw, 
  Trash2, 
  Star, 
  StarOff,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIGeneration, useAIGenerationHistory } from '@/hooks/useAIGenerationHistory';
import { format, formatDistanceToNow } from 'date-fns';

interface GenerationHistoryPanelProps {
  onReusePrompt: (generation: AIGeneration) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const GenerationHistoryPanel: React.FC<GenerationHistoryPanelProps> = ({
  onReusePrompt,
  isExpanded,
  onToggleExpand,
}) => {
  const { generations, loading, deleteGeneration, markSavedToLibrary } = useAIGenerationHistory();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const formatFullDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  const truncatePrompt = (prompt: string, maxLength: number = 80) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength).trim() + '...';
  };

  if (generations.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="border-t border-border bg-muted/10">
      {/* Header - Always visible */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <History className="h-4 w-4" />
          <span>Generation History</span>
          {generations.length > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {generations.length}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-6 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
              <Sparkles className="h-4 w-4 animate-pulse mr-2" />
              Loading history...
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {generations.map((generation) => (
                  <div
                    key={generation.id}
                    className={cn(
                      'group relative p-3 rounded-lg border transition-all cursor-pointer',
                      hoveredId === generation.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50'
                    )}
                    onMouseEnter={() => setHoveredId(generation.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      {generation.generated_image_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={generation.generated_image_url}
                            alt="Generated"
                            className="w-14 h-14 object-cover rounded-md border border-border"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-2 leading-snug">
                          {truncatePrompt(generation.prompt, 100)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {generation.style}
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimeAgo(generation.created_at)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {formatFullDate(generation.created_at)}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {generation.is_saved_to_library && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary">
                              <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                              Saved
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions - Show on hover */}
                      <div className={cn(
                        'flex flex-col gap-1 transition-opacity',
                        hoveredId === generation.id ? 'opacity-100' : 'opacity-0'
                      )}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="default"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReusePrompt(generation);
                                }}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reuse this prompt</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!generation.is_saved_to_library) {
                                    markSavedToLibrary(generation.id);
                                  }
                                }}
                              >
                                {generation.is_saved_to_library ? (
                                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                                ) : (
                                  <StarOff className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {generation.is_saved_to_library ? 'Saved to favorites' : 'Save to favorites'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteGeneration(generation.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete from history</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};

export default GenerationHistoryPanel;
