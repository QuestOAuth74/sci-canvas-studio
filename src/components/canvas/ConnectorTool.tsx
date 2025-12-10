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
  ArrowsLeftRight,
  ArrowRight,
  LineSegment,
  FlowArrow,
  Path,
  TreeStructure,
  GitCommit,
  ArrowCircleRight,
} from "@phosphor-icons/react";

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
          <FlowArrow size={18} weight={isConnectorActive ? "duotone" : "regular"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card z-50">
        <DropdownMenuLabel>Smart Connectors</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onConnectorSelect('connector-straight')}>
            <ArrowsLeftRight size={18} weight="regular" className="mr-2" />
            <span>Straight Connector</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConnectorSelect('connector-curved')}>
            <Path size={18} weight="regular" className="mr-2" />
            <span>Curved Connector</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConnectorSelect('connector-orthogonal')}>
            <TreeStructure size={18} weight="regular" className="mr-2" />
            <span>Orthogonal Connector</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Line Styles</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onConnectorSelect('line-arrow')}>
            <ArrowRight size={18} weight="regular" className="mr-2" />
            <span>Arrow Line →</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConnectorSelect('line-double-arrow')}>
            <ArrowsLeftRight size={18} weight="regular" className="mr-2" />
            <span>Double Arrow ↔</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConnectorSelect('line-plain')}>
            <LineSegment size={18} weight="regular" className="mr-2" />
            <span>Plain Line</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConnectorSelect('line-circle-arrow')}>
            <ArrowCircleRight size={18} weight="regular" className="mr-2" />
            <span>Circle Arrow</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onConnectorSelect('line-diamond')}>
            <GitCommit size={18} weight="regular" className="mr-2" />
            <span>Diamond Line (UML)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
