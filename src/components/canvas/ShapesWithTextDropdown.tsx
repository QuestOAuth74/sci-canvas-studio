import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Square, Circle, Type } from "lucide-react";

interface ShapesWithTextDropdownProps {
  onShapeSelect: (shape: string) => void;
  activeTool?: string;
}

export const ShapesWithTextDropdown = ({ onShapeSelect, activeTool }: ShapesWithTextDropdownProps) => {
  const shapesWithTextTools = ['circle-with-text', 'rectangle-with-text', 'rounded-rect-with-text', 'square-with-text'];
  const isActive = activeTool ? shapesWithTextTools.includes(activeTool) : false;

  const handleShapeClick = (shape: string) => {
    onShapeSelect(shape);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isActive ? "default" : "ghost"} 
          size="icon" 
          className="h-8 w-8"
        >
          <div className="relative">
            <Square className="h-4 w-4" />
            <Type className="h-2 w-2 absolute top-1 left-1" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card z-50">
        <DropdownMenuLabel>Labeled Shapes</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleShapeClick("circle-with-text")}>
            <Circle className="mr-2 h-4 w-4" />
            <span>Circle with Text</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("rectangle-with-text")}>
            <Square className="mr-2 h-4 w-4" />
            <span>Rectangle with Text</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("rounded-rect-with-text")}>
            <Square className="mr-2 h-4 w-4" />
            <span>Rounded Rectangle with Text</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("square-with-text")}>
            <Square className="mr-2 h-4 w-4" />
            <span>Square with Text</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};