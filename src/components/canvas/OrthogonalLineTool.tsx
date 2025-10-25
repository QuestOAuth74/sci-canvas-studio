import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  GitBranch,
  ArrowRight,
  ArrowLeftRight,
  Circle,
  Diamond,
  Dot,
} from "lucide-react";

interface OrthogonalLineToolProps {
  onLineSelect: (lineType: string) => void;
  activeTool?: string;
}

export const OrthogonalLineTool = ({ onLineSelect, activeTool }: OrthogonalLineToolProps) => {
  const isElbowLineActive = activeTool?.startsWith('elbow-');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isElbowLineActive ? "default" : "ghost"} 
          size="icon" 
          className="h-8 w-8"
        >
          <GitBranch className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card z-50">
        <DropdownMenuLabel>Elbow Connectors (Simple)</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onLineSelect('elbow-arrow')}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Elbow Arrow →</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('elbow-diamond')}>
            <Diamond className="mr-2 h-4 w-4" />
            <span>Elbow Diamond ◆</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('elbow-dot')}>
            <Dot className="mr-2 h-4 w-4" />
            <span>Elbow Dot •</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
