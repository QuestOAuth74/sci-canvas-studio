import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { ShapesLibrary } from "@/components/canvas/ShapesLibrary";
import { TopToolbar } from "@/components/canvas/TopToolbar";
import { PropertiesPanel } from "@/components/canvas/PropertiesPanel";
import { BottomBar } from "@/components/canvas/BottomBar";
import { toast } from "sonner";

const Canvas = () => {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<string>("select");

  const handleExport = () => {
    toast("Export functionality will save your SVG file");
  };

  const handleShapeSelect = (shape: string) => {
    setActiveTool(shape);
    toast.success(`Selected ${shape}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="border-b glass-effect shadow-sm">
        <div className="px-4 py-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="hover:bg-primary/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            BioSketch
          </h1>
        </div>
      </header>

      {/* Top Toolbar */}
      <TopToolbar onExport={handleExport} />

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Shapes Library */}
        <ShapesLibrary onShapeSelect={handleShapeSelect} />

        {/* Canvas */}
        <FabricCanvas activeTool={activeTool} />

        {/* Right Properties Panel */}
        <PropertiesPanel />
      </div>

      {/* Bottom Bar */}
      <BottomBar />
    </div>
  );
};

export default Canvas;
