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
  Square, 
  Circle, 
  Triangle, 
  Hexagon, 
  Diamond,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  Minus,
  Shapes,
  CornerDownRight,
  CornerDownLeft,
  CornerUpRight,
  CornerUpLeft,
  TrendingUp,
  TrendingDown,
  MoveRight,
  GitBranch,
  GitFork,
  Network,
} from "lucide-react";

interface ShapesDropdownProps {
  onShapeSelect: (shape: string) => void;
  activeTool?: string;
}

export const ShapesDropdown = ({ onShapeSelect, activeTool }: ShapesDropdownProps) => {
  // Define tools that should NOT activate the shapes dropdown
  const nonShapeTools = ['select', 'text', 'pen', 'freeform-line', 'eraser', 'image'];
  const nonShapeToolPrefixes = ['connector-'];
  
  const isShapeActive = activeTool 
    ? !nonShapeTools.includes(activeTool) && 
      !nonShapeToolPrefixes.some(prefix => activeTool.startsWith(prefix))
    : false;

  const handleShapeClick = (shape: string) => {
    onShapeSelect(shape);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isShapeActive ? "default" : "ghost"} 
          size="icon" 
          className="h-8 w-8"
        >
          <Shapes className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 max-h-[500px] overflow-y-auto bg-card z-50">
        <DropdownMenuLabel>Basic Shapes</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleShapeClick("rectangle")}>
            <Square className="mr-2 h-4 w-4" />
            <span>Rectangle</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("square")}>
            <Square className="mr-2 h-4 w-4" />
            <span>Square</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("rounded-rect")}>
            <Square className="mr-2 h-4 w-4" />
            <span>Rounded Rectangle</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("circle")}>
            <Circle className="mr-2 h-4 w-4" />
            <span>Circle</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("ellipse")}>
            <Circle className="mr-2 h-4 w-4" />
            <span>Ellipse</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("triangle")}>
            <Triangle className="mr-2 h-4 w-4" />
            <span>Triangle</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("right-triangle")}>
            <Triangle className="mr-2 h-4 w-4" />
            <span>Right Triangle</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Polygons</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleShapeClick("pentagon")}>
            <Hexagon className="mr-2 h-4 w-4" />
            <span>Pentagon</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("hexagon")}>
            <Hexagon className="mr-2 h-4 w-4" />
            <span>Hexagon</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("octagon")}>
            <Hexagon className="mr-2 h-4 w-4" />
            <span>Octagon</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("star")}>
            <span className="mr-2 text-sm">⭐</span>
            <span>Star</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("rhombus")}>
            <Diamond className="mr-2 h-4 w-4" />
            <span>Rhombus</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("parallelogram")}>
            <Diamond className="mr-2 h-4 w-4" />
            <span>Parallelogram</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("trapezoid")}>
            <Diamond className="mr-2 h-4 w-4" />
            <span>Trapezoid</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Arrows</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleShapeClick("arrow-right")}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Arrow Right</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("arrow-left")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Arrow Left</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("arrow-up")}>
            <ArrowUp className="mr-2 h-4 w-4" />
            <span>Arrow Up</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("arrow-down")}>
            <ArrowDown className="mr-2 h-4 w-4" />
            <span>Arrow Down</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("arrow-double-h")}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            <span>Double Arrow (Horizontal)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("arrow-thick")}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Thick Arrow</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Flowchart Shapes</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleShapeClick("process")}>
            <Square className="mr-2 h-4 w-4" />
            <span>Process</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("decision")}>
            <Diamond className="mr-2 h-4 w-4" />
            <span>Decision</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("data")}>
            <Diamond className="mr-2 h-4 w-4" />
            <span>Data</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("terminator")}>
            <Circle className="mr-2 h-4 w-4" />
            <span>Terminator</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("document")}>
            <span className="mr-2 text-sm">📄</span>
            <span>Document</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("database")}>
            <span className="mr-2 text-sm">🗄️</span>
            <span>Database</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Lines & Connectors</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleShapeClick("line")}>
            <Minus className="mr-2 h-4 w-4" />
            <span>Line</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("line-arrow-right")}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Line Arrow →</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("line-arrow-left")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Line Arrow ←</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("line-arrow-both")}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            <span>Line Arrow ↔</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("dashed-line")}>
            <Minus className="mr-2 h-4 w-4" />
            <span>Dashed Line</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("dashed-line-arrow")}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Dashed Arrow →</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Parenthesis & Brackets</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleShapeClick("paren-left")}>
            <span className="mr-2 text-lg">(</span>
            <span>Left Parenthesis (</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("paren-right")}>
            <span className="mr-2 text-lg">)</span>
            <span>Right Parenthesis )</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("paren-top")}>
            <span className="mr-2 text-lg">⌢</span>
            <span>Top Parenthesis ⌢</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("paren-bottom")}>
            <span className="mr-2 text-lg">⌣</span>
            <span>Bottom Parenthesis ⌣</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("bracket-left")}>
            <span className="mr-2 text-lg">[</span>
            <span>Left Bracket [</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("bracket-right")}>
            <span className="mr-2 text-lg">]</span>
            <span>Right Bracket ]</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("bracket-top")}>
            <span className="mr-2 text-lg">⊤</span>
            <span>Top Bracket ⊤</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("bracket-bottom")}>
            <span className="mr-2 text-lg">⊥</span>
            <span>Bottom Bracket ⊥</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("paren-left-arrow")}>
            <span className="mr-2 text-lg">(→</span>
            <span>Left Paren Arrow (→</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeClick("paren-right-arrow")}>
            <span className="mr-2 text-lg">)→</span>
            <span>Right Paren Arrow )→</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

      </DropdownMenuContent>
    </DropdownMenu>
  );
};
