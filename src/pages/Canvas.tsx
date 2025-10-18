import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { ShapesLibrary } from "@/components/canvas/ShapesLibrary";
import { TopToolbar } from "@/components/canvas/TopToolbar";
import { PropertiesPanel } from "@/components/canvas/PropertiesPanel";
import { BottomBar } from "@/components/canvas/BottomBar";
import { MenuBar } from "@/components/canvas/MenuBar";
import { TooltipProvider } from "@/components/ui/tooltip";
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
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top Header with Menu */}
        <header className="border-b bg-card/50">
          <div className="px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Untitled Diagram
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <MenuBar />
              <Button variant="default" size="sm" className="h-8">
                <Share className="h-3.5 w-3.5 mr-1.5" />
                Share
              </Button>
            </div>
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
    </TooltipProvider>
  );
};

export default Canvas;
