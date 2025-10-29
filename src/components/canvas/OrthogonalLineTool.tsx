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
  Sparkles,
} from "lucide-react";

interface OrthogonalLineToolProps {
  onLineSelect: (lineType: string) => void;
  activeTool?: string;
}

export const OrthogonalLineTool = ({ onLineSelect, activeTool }: OrthogonalLineToolProps) => {
  const isOrthogonalLineActive = activeTool?.startsWith('orthogonal-line');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isOrthogonalLineActive ? "default" : "ghost"} 
          size="icon" 
          className="h-8 w-8"
        >
          <GitBranch className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card z-50">
        <DropdownMenuLabel>Orthogonal Line Tools (90°)</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onLineSelect('orthogonal-line')}>
            <GitBranch className="mr-2 h-4 w-4" />
            <span>Orthogonal Line</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('orthogonal-line-arrow')}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Orthogonal with Arrow →</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('orthogonal-line-double-arrow')}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            <span>Orthogonal Double Arrow ↔</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('orthogonal-line-dot')}>
            <Dot className="mr-2 h-4 w-4" />
            <span>Orthogonal with Dots •—•</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('orthogonal-line-diamond')}>
            <Diamond className="mr-2 h-4 w-4" />
            <span>Orthogonal with Diamonds ◆—◆</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('orthogonal-line-circle')}>
            <Circle className="mr-2 h-4 w-4" />
            <span>Orthogonal with Circles ○—○</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Custom</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onLineSelect('orthogonal-line-custom')}>
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Custom Orthogonal Line</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Dashed Variants</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onLineSelect('orthogonal-line-dashed')}>
            <GitBranch className="mr-2 h-4 w-4" />
            <span>Dashed Orthogonal</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('orthogonal-line-dashed-arrow')}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Dashed with Arrow</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('orthogonal-line-dotted-arrow')}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Dotted with Arrow</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
