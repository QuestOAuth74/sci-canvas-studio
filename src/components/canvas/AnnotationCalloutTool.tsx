import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, ArrowUpRight, Minus, CornerDownRight, Underline } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AnnotationCalloutToolProps {
  onCalloutSelect: (style: string) => void;
  activeTool: string;
}

export const AnnotationCalloutTool = ({ onCalloutSelect, activeTool }: AnnotationCalloutToolProps) => {
  const isActive = activeTool.startsWith('annotation-callout');

  return (
    <Tooltip>
      <DropdownMenu>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isActive ? "default" : "ghost"}
              size="icon"
              className="relative"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Annotation Callouts</p>
          <p className="text-xs text-muted-foreground">Add labels with leader lines</p>
        </TooltipContent>
        <DropdownMenuContent align="start" side="right">
          <DropdownMenuItem onClick={() => onCalloutSelect('annotation-callout-simple-arrow')}>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Simple Arrow Callout
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCalloutSelect('annotation-callout-curved-arrow')}>
            <ArrowUpRight className="mr-2 h-4 w-4 transform -rotate-12" />
            Curved Arrow Callout
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCalloutSelect('annotation-callout-line')}>
            <Minus className="mr-2 h-4 w-4" />
            Line Callout
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCalloutSelect('annotation-callout-elbow')}>
            <CornerDownRight className="mr-2 h-4 w-4" />
            Elbow Callout
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCalloutSelect('annotation-callout-underline')}>
            <Underline className="mr-2 h-4 w-4" />
            Underline Callout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Tooltip>
  );
};
