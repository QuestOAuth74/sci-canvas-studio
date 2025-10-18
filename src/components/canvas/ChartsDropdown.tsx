import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart3, PieChart, BarChart2 } from "lucide-react";

interface ChartsDropdownProps {
  onChartSelect: (chartType: string) => void;
  activeTool?: string;
}

export const ChartsDropdown = ({ onChartSelect, activeTool }: ChartsDropdownProps) => {
  const isChartToolActive = activeTool?.startsWith('chart-');

  const handleChartClick = (chartType: string) => {
    onChartSelect(`chart-${chartType}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isChartToolActive ? "default" : "ghost"} 
          size="icon" 
          className="h-8 w-8"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => handleChartClick('bar')}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Bar Chart
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleChartClick('pie')}>
          <PieChart className="h-4 w-4 mr-2" />
          Pie Chart
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleChartClick('histogram')}>
          <BarChart2 className="h-4 w-4 mr-2" />
          Histogram
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
