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
  MoveHorizontal,
  ArrowRight,
  ArrowLeftRight,
  Workflow,
  Route,
  Network,
  GitCommit,
  Minus,
  ArrowRightCircle,
} from "lucide-react";

interface ConnectorToolProps {
  onConnectorSelect: (connectorType: string) => void;
  activeTool?: string;
}

export const ConnectorTool = ({ onConnectorSelect, activeTool }: ConnectorToolProps) => {
  const isConnectorActive = (activeTool?.startsWith('connector-') || 
    activeTool?.startsWith('line-')) && 
    !activeTool?.startsWith('straight-line');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isConnectorActive ? "default" : "ghost"} 
          size="icon" 
          className="h-8 w-8"
        >
          <Workflow className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card z-50">
        <DropdownMenuLabel>Smart Connectors</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onConnectorSelect('connector-straight')}>
            <MoveHorizontal className="mr-2 h-4 w-4" />
            <span>Straight Connector</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConnectorSelect('connector-curved')}>
            <Route className="mr-2 h-4 w-4" />
            <span>Curved Connector</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConnectorSelect('connector-orthogonal')}>
            <Network className="mr-2 h-4 w-4" />
            <span>Orthogonal Connector</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Line Styles</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onConnectorSelect('line-arrow')}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Arrow Line →</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConnectorSelect('line-double-arrow')}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            <span>Double Arrow ↔</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConnectorSelect('line-plain')}>
            <Minus className="mr-2 h-4 w-4" />
            <span>Plain Line</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConnectorSelect('line-circle-arrow')}>
            <ArrowRightCircle className="mr-2 h-4 w-4" />
            <span>Circle Arrow</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConnectorSelect('line-diamond')}>
            <GitCommit className="mr-2 h-4 w-4" />
            <span>Diamond Line (UML)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
