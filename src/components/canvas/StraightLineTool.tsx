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
  Minus,
  ArrowRight,
  ArrowLeftRight,
  Circle,
  Diamond,
  Dot,
} from "lucide-react";

interface StraightLineToolProps {
  onLineSelect: (lineType: string) => void;
  activeTool?: string;
}

export const StraightLineTool = ({ onLineSelect, activeTool }: StraightLineToolProps) => {
  const isStraightLineActive = activeTool?.startsWith('straight-line');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isStraightLineActive ? "default" : "ghost"} 
          size="icon" 
          className="h-8 w-8"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card z-50">
        <DropdownMenuLabel>Straight Line Tools</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onLineSelect('straight-line')}>
            <Minus className="mr-2 h-4 w-4" />
            <span>Plain Line</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('straight-line-arrow')}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Line with Arrow →</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('straight-line-double-arrow')}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            <span>Double Arrow ↔</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('straight-line-dot')}>
            <Dot className="mr-2 h-4 w-4" />
            <span>Line with Dots •—•</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('straight-line-diamond')}>
            <Diamond className="mr-2 h-4 w-4" />
            <span>Line with Diamonds ◆—◆</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('straight-line-circle')}>
            <Circle className="mr-2 h-4 w-4" />
            <span>Line with Circles ○—○</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Dashed Variants</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onLineSelect('straight-line-dashed')}>
            <Minus className="mr-2 h-4 w-4" />
            <span>Dashed Line</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('straight-line-dashed-arrow')}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Dashed with Arrow</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLineSelect('straight-line-dotted-arrow')}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Dotted with Arrow</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
