import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconRoute, IconCircle, IconSquare, IconHexagon, IconOval } from "@tabler/icons-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { Rect, Circle, Ellipse, Polygon, Textbox, Group, Path, FabricObject } from "fabric";
import { toast } from "sonner";

interface PathwayBuilderToolProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

// Pathway node presets
const PATHWAY_NODES = {
  protein: {
    name: "Protein",
    shape: "roundedRect",
    fill: "#E3F2FD",
    stroke: "#1976D2",
    width: 80,
    height: 40,
  },
  gene: {
    name: "Gene",
    shape: "rect",
    fill: "#FFF3E0",
    stroke: "#F57C00",
    width: 70,
    height: 35,
  },
  receptor: {
    name: "Receptor",
    shape: "ellipse",
    fill: "#F3E5F5",
    stroke: "#7B1FA2",
    width: 60,
    height: 80,
  },
  compound: {
    name: "Compound",
    shape: "circle",
    fill: "#E8F5E9",
    stroke: "#388E3C",
    width: 50,
    height: 50,
  },
  enzyme: {
    name: "Enzyme",
    shape: "hexagon",
    fill: "#FFEBEE",
    stroke: "#D32F2F",
    width: 70,
    height: 60,
  },
  complex: {
    name: "Complex",
    shape: "octagon",
    fill: "#E0F7FA",
    stroke: "#0097A7",
    width: 80,
    height: 80,
  },
  process: {
    name: "Process",
    shape: "diamond",
    fill: "#FFF8E1",
    stroke: "#FFA000",
    width: 60,
    height: 60,
  },
  stimulus: {
    name: "Stimulus",
    shape: "arrow",
    fill: "#ECEFF1",
    stroke: "#546E7A",
    width: 80,
    height: 40,
  },
};

export const PathwayBuilderTool = ({ activeTool, onToolChange }: PathwayBuilderToolProps) => {
  const { canvas, saveState } = useCanvas();
  const [isOpen, setIsOpen] = useState(false);

  const btnBase = "w-9 h-9 rounded-lg transition-all duration-150 hover:scale-105";
  const btnActive = `${btnBase} bg-blue-500 text-white shadow-md`;
  const btnInactive = `${btnBase} text-slate-600 hover:text-slate-900 hover:bg-slate-100`;

  const isPathwayToolActive = activeTool.startsWith("pathway-");

  // Create a pathway node on canvas
  const createPathwayNode = (nodeType: keyof typeof PATHWAY_NODES) => {
    if (!canvas) return;

    const config = PATHWAY_NODES[nodeType];
    const centerX = (canvas.width || 800) / 2;
    const centerY = (canvas.height || 600) / 2;

    let shape: FabricObject;

    // Create shape based on type
    switch (config.shape) {
      case "roundedRect":
        shape = new Rect({
          width: config.width,
          height: config.height,
          fill: config.fill,
          stroke: config.stroke,
          strokeWidth: 2,
          rx: 10,
          ry: 10,
          originX: "center",
          originY: "center",
        });
        break;
      case "rect":
        shape = new Rect({
          width: config.width,
          height: config.height,
          fill: config.fill,
          stroke: config.stroke,
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        });
        break;
      case "ellipse":
        shape = new Ellipse({
          rx: config.width / 2,
          ry: config.height / 2,
          fill: config.fill,
          stroke: config.stroke,
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        });
        break;
      case "circle":
        shape = new Circle({
          radius: config.width / 2,
          fill: config.fill,
          stroke: config.stroke,
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        });
        break;
      case "hexagon":
        const hexPoints = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          hexPoints.push({
            x: (config.width / 2) * Math.cos(angle),
            y: (config.height / 2) * Math.sin(angle),
          });
        }
        shape = new Polygon(hexPoints, {
          fill: config.fill,
          stroke: config.stroke,
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        });
        break;
      case "octagon":
        const octPoints = [];
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i - Math.PI / 8;
          octPoints.push({
            x: (config.width / 2) * Math.cos(angle),
            y: (config.height / 2) * Math.sin(angle),
          });
        }
        shape = new Polygon(octPoints, {
          fill: config.fill,
          stroke: config.stroke,
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        });
        break;
      case "diamond":
        const diamondPoints = [
          { x: 0, y: -config.height / 2 },
          { x: config.width / 2, y: 0 },
          { x: 0, y: config.height / 2 },
          { x: -config.width / 2, y: 0 },
        ];
        shape = new Polygon(diamondPoints, {
          fill: config.fill,
          stroke: config.stroke,
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        });
        break;
      case "arrow":
        const arrowPoints = [
          { x: -config.width / 2, y: -config.height / 3 },
          { x: config.width / 4, y: -config.height / 3 },
          { x: config.width / 4, y: -config.height / 2 },
          { x: config.width / 2, y: 0 },
          { x: config.width / 4, y: config.height / 2 },
          { x: config.width / 4, y: config.height / 3 },
          { x: -config.width / 2, y: config.height / 3 },
        ];
        shape = new Polygon(arrowPoints, {
          fill: config.fill,
          stroke: config.stroke,
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        });
        break;
      default:
        shape = new Rect({
          width: config.width,
          height: config.height,
          fill: config.fill,
          stroke: config.stroke,
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        });
    }

    // Create label
    const label = new Textbox(config.name, {
      fontSize: 12,
      fontFamily: "Inter, sans-serif",
      fill: "#333333",
      textAlign: "center",
      originX: "center",
      originY: "center",
      width: config.width - 10,
    });

    // Create group
    const group = new Group([shape, label], {
      left: centerX,
      top: centerY,
      originX: "center",
      originY: "center",
    });

    // Add custom data
    (group as any).pathwayNodeType = nodeType;
    (group as any).isPathwayNode = true;

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    saveState();

    toast.success(`Added ${config.name} node`);
    setIsOpen(false);
  };

  // Create editable pathway connector using SVG path
  const createPathwayConnector = (
    type: "activation" | "inhibition" | "conversion" | "phosphorylation" | "binding" | "transport" | "catalysis" | "reversible"
  ) => {
    if (!canvas) return;

    const centerX = (canvas.width || 800) / 2;
    const centerY = (canvas.height || 600) / 2;
    const lineLength = 100;

    const configs: Record<string, { stroke: string; strokeWidth: number; dash?: number[]; name: string }> = {
      activation: { stroke: "#4CAF50", strokeWidth: 2, name: "Activation" },
      inhibition: { stroke: "#F44336", strokeWidth: 2, name: "Inhibition" },
      conversion: { stroke: "#2196F3", strokeWidth: 2, name: "Conversion" },
      phosphorylation: { stroke: "#00BCD4", strokeWidth: 2, name: "Phosphorylation" },
      binding: { stroke: "#FF9800", strokeWidth: 2, name: "Binding" },
      transport: { stroke: "#795548", strokeWidth: 2, dash: [8, 4], name: "Transport" },
      catalysis: { stroke: "#9C27B0", strokeWidth: 2, name: "Catalysis" },
      reversible: { stroke: "#607D8B", strokeWidth: 2, name: "Reversible" },
    };

    const config = configs[type];
    const startX = centerX - lineLength / 2;
    const endX = centerX + lineLength / 2;

    // Create main line as editable Path
    const linePath = new Path(`M ${startX} ${centerY} L ${endX} ${centerY}`, {
      stroke: config.stroke,
      strokeWidth: config.strokeWidth,
      fill: "",
      strokeDashArray: config.dash,
      strokeLineCap: "round",
    });

    // Create arrow head or end marker based on type
    let endMarker: FabricObject;

    switch (type) {
      case "activation":
      case "conversion":
      case "transport":
        // Standard arrow head
        endMarker = new Path(`M ${endX - 12} ${centerY - 6} L ${endX} ${centerY} L ${endX - 12} ${centerY + 6}`, {
          stroke: config.stroke,
          strokeWidth: config.strokeWidth,
          fill: "",
          strokeLineCap: "round",
          strokeLineJoin: "round",
        });
        break;

      case "inhibition":
        // T-bar (perpendicular line)
        endMarker = new Path(`M ${endX} ${centerY - 10} L ${endX} ${centerY + 10}`, {
          stroke: config.stroke,
          strokeWidth: 3,
          fill: "",
          strokeLineCap: "round",
        });
        break;

      case "phosphorylation":
        // Arrow with circled P
        const pArrow = new Path(`M ${endX - 12} ${centerY - 6} L ${endX} ${centerY} L ${endX - 12} ${centerY + 6}`, {
          stroke: config.stroke,
          strokeWidth: config.strokeWidth,
          fill: "",
          strokeLineCap: "round",
          strokeLineJoin: "round",
        });
        const pCircle = new Circle({
          radius: 10,
          fill: "white",
          stroke: config.stroke,
          strokeWidth: 2,
          left: startX + lineLength / 2,
          top: centerY - 20,
          originX: "center",
          originY: "center",
        });
        const pText = new Textbox("P", {
          fontSize: 12,
          fontFamily: "Inter, sans-serif",
          fontWeight: "bold",
          fill: config.stroke,
          textAlign: "center",
          left: startX + lineLength / 2,
          top: centerY - 20,
          originX: "center",
          originY: "center",
          width: 20,
        });
        endMarker = new Group([pArrow, pCircle, pText], {
          originX: "center",
          originY: "center",
        });
        break;

      case "binding":
        // Double-headed arrow
        const leftHead = new Path(`M ${startX + 12} ${centerY - 6} L ${startX} ${centerY} L ${startX + 12} ${centerY + 6}`, {
          stroke: config.stroke,
          strokeWidth: config.strokeWidth,
          fill: "",
          strokeLineCap: "round",
          strokeLineJoin: "round",
        });
        const rightHead = new Path(`M ${endX - 12} ${centerY - 6} L ${endX} ${centerY} L ${endX - 12} ${centerY + 6}`, {
          stroke: config.stroke,
          strokeWidth: config.strokeWidth,
          fill: "",
          strokeLineCap: "round",
          strokeLineJoin: "round",
        });
        endMarker = new Group([leftHead, rightHead], {
          originX: "center",
          originY: "center",
        });
        break;

      case "catalysis":
        // Circle at start, arrow at end
        const catCircle = new Circle({
          radius: 5,
          fill: "white",
          stroke: config.stroke,
          strokeWidth: 2,
          left: startX + 15,
          top: centerY,
          originX: "center",
          originY: "center",
        });
        const catArrow = new Path(`M ${endX - 12} ${centerY - 6} L ${endX} ${centerY} L ${endX - 12} ${centerY + 6}`, {
          stroke: config.stroke,
          strokeWidth: config.strokeWidth,
          fill: "",
          strokeLineCap: "round",
          strokeLineJoin: "round",
        });
        endMarker = new Group([catCircle, catArrow], {
          originX: "center",
          originY: "center",
        });
        break;

      case "reversible":
        // Double arrows (equilibrium)
        const topArrow = new Path(`M ${endX - 12} ${centerY - 5} L ${endX} ${centerY - 5}`, {
          stroke: config.stroke,
          strokeWidth: config.strokeWidth,
          fill: "",
        });
        const topHead = new Path(`M ${endX - 8} ${centerY - 9} L ${endX} ${centerY - 5} L ${endX - 8} ${centerY - 1}`, {
          stroke: config.stroke,
          strokeWidth: config.strokeWidth - 0.5,
          fill: "",
          strokeLineCap: "round",
        });
        const bottomArrow = new Path(`M ${startX + 12} ${centerY + 5} L ${startX} ${centerY + 5}`, {
          stroke: config.stroke,
          strokeWidth: config.strokeWidth,
          fill: "",
        });
        const bottomHead = new Path(`M ${startX + 8} ${centerY + 1} L ${startX} ${centerY + 5} L ${startX + 8} ${centerY + 9}`, {
          stroke: config.stroke,
          strokeWidth: config.strokeWidth - 0.5,
          fill: "",
          strokeLineCap: "round",
        });
        // Modify main line to be two parallel lines
        linePath.set({ path: undefined });
        endMarker = new Group([
          new Path(`M ${startX} ${centerY - 5} L ${endX} ${centerY - 5}`, {
            stroke: config.stroke,
            strokeWidth: config.strokeWidth,
            fill: "",
          }),
          new Path(`M ${startX} ${centerY + 5} L ${endX} ${centerY + 5}`, {
            stroke: config.stroke,
            strokeWidth: config.strokeWidth,
            fill: "",
          }),
          topHead,
          bottomHead,
        ], {
          originX: "center",
          originY: "center",
        });
        // Remove the original line since we're using the group
        canvas.remove(linePath);
        canvas.add(endMarker);
        endMarker.set({ left: centerX, top: centerY });
        (endMarker as any).isPathwayConnector = true;
        (endMarker as any).pathwayConnectorType = type;
        canvas.setActiveObject(endMarker);
        canvas.renderAll();
        saveState();
        toast.success(`Added ${config.name} connector`);
        setIsOpen(false);
        return;

      default:
        endMarker = new Path(`M ${endX - 12} ${centerY - 6} L ${endX} ${centerY} L ${endX - 12} ${centerY + 6}`, {
          stroke: config.stroke,
          strokeWidth: config.strokeWidth,
          fill: "",
          strokeLineCap: "round",
          strokeLineJoin: "round",
        });
    }

    // Group line and marker for easy manipulation
    const connector = new Group([linePath, endMarker], {
      left: centerX,
      top: centerY,
      originX: "center",
      originY: "center",
    });

    (connector as any).isPathwayConnector = true;
    (connector as any).pathwayConnectorType = type;

    canvas.add(connector);
    canvas.setActiveObject(connector);
    canvas.renderAll();
    saveState();

    toast.success(`Added ${config.name} connector`);
    setIsOpen(false);
  };

  // Add pathway symbol
  const addPathwaySymbol = (symbol: string, color: string, size: "small" | "medium" = "small") => {
    if (!canvas) return;

    const centerX = (canvas.width || 800) / 2;
    const centerY = (canvas.height || 600) / 2;
    const radius = size === "small" ? 12 : 18;
    const fontSize = size === "small" ? 10 : 13;

    const circle = new Circle({
      radius: radius,
      fill: "white",
      stroke: color,
      strokeWidth: 2,
      originX: "center",
      originY: "center",
    });

    const text = new Textbox(symbol, {
      fontSize: fontSize,
      fontFamily: "Inter, sans-serif",
      fontWeight: "bold",
      fill: color,
      textAlign: "center",
      originX: "center",
      originY: "center",
      width: radius * 2 - 4,
    });

    const group = new Group([circle, text], {
      left: centerX,
      top: centerY,
      originX: "center",
      originY: "center",
    });

    (group as any).isPathwaySymbol = true;
    (group as any).pathwaySymbol = symbol;

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    saveState();

    toast.success(`Added ${symbol}`);
    setIsOpen(false);
  };

  // Add text label (no circle)
  const addTextLabel = (text: string, color: string, fontSize: number = 14) => {
    if (!canvas) return;

    const centerX = (canvas.width || 800) / 2;
    const centerY = (canvas.height || 600) / 2;

    const label = new Textbox(text, {
      left: centerX,
      top: centerY,
      fontSize: fontSize,
      fontFamily: "Inter, sans-serif",
      fontWeight: "600",
      fill: color,
      textAlign: "center",
      originX: "center",
      originY: "center",
      width: 100,
    });

    (label as any).isPathwayLabel = true;

    canvas.add(label);
    canvas.setActiveObject(label);
    canvas.renderAll();
    saveState();

    toast.success(`Added ${text} label`);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={isPathwayToolActive ? btnActive : btnInactive}
            >
              <IconRoute size={18} stroke={isPathwayToolActive ? 2 : 1.5} />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="text-xs font-medium bg-slate-900 text-white border-0 shadow-lg z-[100]">
          Pathway Builder
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent side="right" align="start" className="w-64 max-h-[80vh] overflow-y-auto">
        {/* NODES */}
        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
          Pathway Nodes
        </DropdownMenuLabel>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconSquare size={14} className="mr-2 text-blue-500" />
            <span>Molecules</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => createPathwayNode("protein")}>
              <div className="w-5 h-3 rounded bg-blue-100 border-2 border-blue-500 mr-2" />
              Protein
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => createPathwayNode("gene")}>
              <div className="w-5 h-3 bg-orange-100 border-2 border-orange-500 mr-2" />
              Gene
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => createPathwayNode("compound")}>
              <div className="w-3 h-3 rounded-full bg-green-100 border-2 border-green-500 mr-2" />
              Compound
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => createPathwayNode("enzyme")}>
              <IconHexagon size={14} className="mr-2 text-red-500" />
              Enzyme
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconOval size={14} className="mr-2 text-purple-500" />
            <span>Structures</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => createPathwayNode("receptor")}>
              <IconOval size={14} className="mr-2 text-purple-500" />
              Receptor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => createPathwayNode("complex")}>
              <IconHexagon size={14} className="mr-2 text-cyan-500" />
              Complex
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => createPathwayNode("process")}>
              <div className="w-3 h-3 rotate-45 bg-amber-100 border-2 border-amber-500 mr-2" />
              Process
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => createPathwayNode("stimulus")}>
              <span className="mr-2 text-slate-500">▶</span>
              Stimulus
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* CONNECTORS */}
        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
          Connectors
        </DropdownMenuLabel>

        <DropdownMenuItem onClick={() => createPathwayConnector("activation")} className="flex justify-between">
          <span className="flex items-center">
            <span className="w-8 h-0.5 bg-green-500 mr-2 relative">
              <span className="absolute right-0 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-6 border-transparent border-l-green-500" />
            </span>
            Activation
          </span>
          <span className="text-green-500">→</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => createPathwayConnector("inhibition")} className="flex justify-between">
          <span className="flex items-center">
            <span className="w-8 h-0.5 bg-red-500 mr-2 relative">
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-red-500" />
            </span>
            Inhibition
          </span>
          <span className="text-red-500">⊣</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => createPathwayConnector("phosphorylation")} className="flex justify-between">
          <span className="flex items-center">
            <span className="w-4 h-4 rounded-full border-2 border-cyan-500 text-[8px] font-bold text-cyan-500 flex items-center justify-center mr-1">P</span>
            Phosphorylation
          </span>
          <span className="text-cyan-500">Ⓟ→</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => createPathwayConnector("binding")} className="flex justify-between">
          <span className="flex items-center">
            <span className="text-orange-500 mr-2">↔</span>
            Binding
          </span>
          <span className="text-orange-500">↔</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => createPathwayConnector("catalysis")} className="flex justify-between">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full border-2 border-purple-500 mr-1" />
            <span className="text-purple-500 mr-1">→</span>
            Catalysis
          </span>
          <span className="text-purple-500">○→</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => createPathwayConnector("reversible")} className="flex justify-between">
          <span className="flex items-center">
            <span className="text-slate-500 mr-2">⇌</span>
            Reversible
          </span>
          <span className="text-slate-500">⇌</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => createPathwayConnector("transport")} className="flex justify-between">
          <span className="flex items-center">
            <span className="w-8 border-t-2 border-dashed border-amber-700 mr-2" />
            Transport
          </span>
          <span className="text-amber-700">⇢</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* ENERGY & COFACTORS */}
        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
          Energy & Cofactors
        </DropdownMenuLabel>
        <div className="grid grid-cols-4 gap-1 px-2 py-1.5">
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-green-600 border-green-300" onClick={() => addPathwaySymbol("ATP", "#4CAF50")}>ATP</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-orange-600 border-orange-300" onClick={() => addPathwaySymbol("ADP", "#FF9800")}>ADP</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-blue-600 border-blue-300" onClick={() => addPathwaySymbol("GTP", "#2196F3")}>GTP</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-slate-600 border-slate-300" onClick={() => addPathwaySymbol("GDP", "#607D8B")}>GDP</Button>
        </div>
        <div className="grid grid-cols-4 gap-1 px-2 py-1">
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-indigo-600 border-indigo-300" onClick={() => addPathwaySymbol("NAD⁺", "#3F51B5", "medium")}>NAD⁺</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-indigo-400 border-indigo-200" onClick={() => addPathwaySymbol("NADH", "#7986CB", "medium")}>NADH</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-teal-600 border-teal-300" onClick={() => addPathwaySymbol("FAD", "#009688", "medium")}>FAD</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-teal-400 border-teal-200" onClick={() => addPathwaySymbol("FADH₂", "#4DB6AC", "medium")}>FADH₂</Button>
        </div>
        <div className="grid grid-cols-4 gap-1 px-2 py-1">
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-pink-600 border-pink-300" onClick={() => addPathwaySymbol("cAMP", "#E91E63", "medium")}>cAMP</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-amber-600 border-amber-300" onClick={() => addPathwaySymbol("CoA", "#FF8F00", "medium")}>CoA</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-lime-600 border-lime-300" onClick={() => addPathwaySymbol("Pi", "#7CB342")}>Pi</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-lime-700 border-lime-400" onClick={() => addPathwaySymbol("PPi", "#558B2F")}>PPi</Button>
        </div>

        <DropdownMenuSeparator />

        {/* IONS */}
        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
          Ions & Small Molecules
        </DropdownMenuLabel>
        <div className="grid grid-cols-5 gap-1 px-2 py-1.5">
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-purple-600 border-purple-300" onClick={() => addPathwaySymbol("Ca²⁺", "#9C27B0")}>Ca²⁺</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-blue-600 border-blue-300" onClick={() => addPathwaySymbol("Na⁺", "#1976D2")}>Na⁺</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-violet-600 border-violet-300" onClick={() => addPathwaySymbol("K⁺", "#7C4DFF")}>K⁺</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-green-600 border-green-300" onClick={() => addPathwaySymbol("Mg²⁺", "#43A047")}>Mg²⁺</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-yellow-600 border-yellow-300" onClick={() => addPathwaySymbol("Cl⁻", "#FDD835")}>Cl⁻</Button>
        </div>
        <div className="grid grid-cols-5 gap-1 px-2 py-1">
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-red-600 border-red-300" onClick={() => addPathwaySymbol("H⁺", "#E53935")}>H⁺</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-cyan-600 border-cyan-300" onClick={() => addPathwaySymbol("Zn²⁺", "#00ACC1")}>Zn²⁺</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-orange-600 border-orange-300" onClick={() => addPathwaySymbol("Fe²⁺", "#FB8C00")}>Fe²⁺</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-blue-400 border-blue-200" onClick={() => addPathwaySymbol("H₂O", "#42A5F5")}>H₂O</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-slate-500 border-slate-300" onClick={() => addPathwaySymbol("CO₂", "#78909C")}>CO₂</Button>
        </div>
        <div className="grid grid-cols-4 gap-1 px-2 py-1">
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-red-400 border-red-200" onClick={() => addPathwaySymbol("O₂", "#EF5350")}>O₂</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-cyan-500 border-cyan-300" onClick={() => addPathwaySymbol("NO", "#00BCD4")}>NO</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-amber-500 border-amber-300" onClick={() => addPathwaySymbol("ROS", "#FFC107")}>ROS</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-emerald-600 border-emerald-300" onClick={() => addPathwaySymbol("GSH", "#059669")}>GSH</Button>
        </div>

        <DropdownMenuSeparator />

        {/* MODIFICATION SYMBOLS */}
        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
          Modifications
        </DropdownMenuLabel>
        <div className="grid grid-cols-5 gap-1 px-2 py-1.5">
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-cyan-600 border-cyan-300" onClick={() => addPathwaySymbol("P", "#00BCD4")}>Ⓟ</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-pink-600 border-pink-300" onClick={() => addPathwaySymbol("Ub", "#E91E63")}>Ub</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-purple-600 border-purple-300" onClick={() => addPathwaySymbol("Ac", "#9C27B0")}>Ac</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-blue-600 border-blue-300" onClick={() => addPathwaySymbol("Me", "#2196F3")}>Me</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-orange-600 border-orange-300" onClick={() => addPathwaySymbol("SUMO", "#FF9800", "medium")}>SUMO</Button>
        </div>

        <DropdownMenuSeparator />

        {/* REACTION SYMBOLS */}
        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
          Reaction Labels
        </DropdownMenuLabel>
        <div className="grid grid-cols-4 gap-1 px-2 py-1.5">
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-green-600 border-green-300" onClick={() => addPathwaySymbol("+", "#4CAF50")}>+</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-red-600 border-red-300" onClick={() => addPathwaySymbol("−", "#F44336")}>−</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-amber-600 border-amber-300" onClick={() => addPathwaySymbol("?", "#FF9800")}>?</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-[10px] font-bold text-slate-600 border-slate-300" onClick={() => addPathwaySymbol("*", "#607D8B")}>*</Button>
        </div>

        <DropdownMenuSeparator />

        {/* COMPARTMENT LABELS */}
        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
          Compartment Labels
        </DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-1 px-2 py-1.5">
          <Button variant="outline" size="sm" className="h-7 text-[10px] text-slate-700" onClick={() => addTextLabel("Nucleus", "#5C6BC0")}>Nucleus</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] text-slate-700" onClick={() => addTextLabel("Cytoplasm", "#26A69A")}>Cytoplasm</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] text-slate-700" onClick={() => addTextLabel("ER", "#AB47BC")}>ER</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] text-slate-700" onClick={() => addTextLabel("Golgi", "#FFA726")}>Golgi</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] text-slate-700" onClick={() => addTextLabel("Mitochondria", "#EF5350")}>Mitochondria</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] text-slate-700" onClick={() => addTextLabel("Membrane", "#78909C")}>Membrane</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] text-slate-700" onClick={() => addTextLabel("Extracellular", "#8D6E63")}>Extracellular</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] text-slate-700" onClick={() => addTextLabel("Lysosome", "#7E57C2")}>Lysosome</Button>
        </div>

        <DropdownMenuSeparator />

        {/* GREEK LETTERS */}
        <DropdownMenuLabel className="text-xs text-slate-500 uppercase tracking-wider">
          Greek Letters
        </DropdownMenuLabel>
        <div className="grid grid-cols-6 gap-1 px-2 py-1.5">
          <Button variant="outline" size="sm" className="h-7 px-1 text-xs text-slate-700" onClick={() => addTextLabel("α", "#333", 16)}>α</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-xs text-slate-700" onClick={() => addTextLabel("β", "#333", 16)}>β</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-xs text-slate-700" onClick={() => addTextLabel("γ", "#333", 16)}>γ</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-xs text-slate-700" onClick={() => addTextLabel("δ", "#333", 16)}>δ</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-xs text-slate-700" onClick={() => addTextLabel("ε", "#333", 16)}>ε</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-xs text-slate-700" onClick={() => addTextLabel("κ", "#333", 16)}>κ</Button>
        </div>
        <div className="grid grid-cols-6 gap-1 px-2 py-1 mb-1">
          <Button variant="outline" size="sm" className="h-7 px-1 text-xs text-slate-700" onClick={() => addTextLabel("λ", "#333", 16)}>λ</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-xs text-slate-700" onClick={() => addTextLabel("μ", "#333", 16)}>μ</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-xs text-slate-700" onClick={() => addTextLabel("π", "#333", 16)}>π</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-xs text-slate-700" onClick={() => addTextLabel("σ", "#333", 16)}>σ</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-xs text-slate-700" onClick={() => addTextLabel("τ", "#333", 16)}>τ</Button>
          <Button variant="outline" size="sm" className="h-7 px-1 text-xs text-slate-700" onClick={() => addTextLabel("ω", "#333", 16)}>ω</Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
