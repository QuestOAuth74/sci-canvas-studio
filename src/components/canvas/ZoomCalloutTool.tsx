import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ZoomIn } from "lucide-react";

interface ZoomCalloutToolProps {
  onCalloutSelect: (type: string) => void;
  activeTool?: string;
}

export const ZoomCalloutTool = ({ onCalloutSelect, activeTool }: ZoomCalloutToolProps) => {
  const isActive = activeTool?.startsWith('zoom-callout-');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isActive ? "default" : "ghost"} 
          size="icon" 
          className="w-10 h-10"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card z-50" side="right">
        <DropdownMenuLabel>Zoom Callouts</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onCalloutSelect("zoom-callout-dotted")}>
            <ZoomIn className="mr-2 h-4 w-4" />
            <span>Dotted Lines Callout</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCalloutSelect("zoom-callout-trapezoid")}>
            <ZoomIn className="mr-2 h-4 w-4" />
            <span>Trapezoid Callout</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
