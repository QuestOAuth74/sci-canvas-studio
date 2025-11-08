import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spline } from "lucide-react";

interface CurvedLineToolProps {
  onLineSelect: (lineType: string) => void;
  activeTool?: string;
}

export const CurvedLineTool = ({ onLineSelect, activeTool }: CurvedLineToolProps) => {
  const isActive = activeTool?.startsWith("curved-line");

  const lineOptions = [
    { id: "curved-line", label: "Plain Curved Line", icon: "─" },
    { id: "curved-line-arrow", label: "Curved Line with Arrow →", icon: "→" },
    { id: "curved-line-double-arrow", label: "Curved Line with Double Arrow ↔", icon: "↔" },
    { id: "curved-line-dots", label: "Curved Line with Dots •—•", icon: "•" },
    { id: "curved-line-diamonds", label: "Curved Line with Diamonds ◆—◆", icon: "◆" },
    { id: "curved-line-circles", label: "Curved Line with Circles ○—○", icon: "○" },
  ];

  const dashedOptions = [
    { id: "curved-line-dashed", label: "Dashed Curved Line", icon: "┈" },
    { id: "curved-line-dashed-arrow", label: "Dashed Curved with Arrow", icon: "→" },
    { id: "curved-line-dotted-arrow", label: "Dotted Curved with Arrow", icon: "→" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isActive ? "default" : "ghost"}
          size="icon"
          className="w-10 h-10"
        >
          <Spline className="h-5 w-5" style={{ transform: "rotate(15deg)" }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-64 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {lineOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => onLineSelect(option.id)}
            className="cursor-pointer"
          >
            <span className="mr-2 text-lg">{option.icon}</span>
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {dashedOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => onLineSelect(option.id)}
            className="cursor-pointer"
          >
            <span className="mr-2 text-lg">{option.icon}</span>
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onLineSelect("curved-line-custom")}
          className="cursor-pointer"
        >
          <span className="mr-2 text-lg">✨</span>
          Custom Curved Line
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
