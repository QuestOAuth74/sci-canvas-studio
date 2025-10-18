import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { IconLibrary } from "@/components/canvas/IconLibrary";
import { Toolbar } from "@/components/canvas/Toolbar";
import { TopToolbar } from "@/components/canvas/TopToolbar";
import { PropertiesPanel } from "@/components/canvas/PropertiesPanel";
import { LayersPanel } from "@/components/canvas/LayersPanel";
import { toast } from "sonner";

const Canvas = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTool, setActiveTool] = useState<string>("select");
  const [showIconLibrary, setShowIconLibrary] = useState(false);

  const handleExport = () => {
    toast("Export functionality will save your SVG file");
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowIconLibrary(!showIconLibrary)}
            className="hover:bg-primary/10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Top Toolbar */}
      <TopToolbar onExport={handleExport} />

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />

        {/* Icon Library Sidebar (Collapsible) */}
        {showIconLibrary && (
          <aside className="w-64 border-r bg-card overflow-y-auto">
            <IconLibrary
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </aside>
        )}

        {/* Canvas */}
        <FabricCanvas activeTool={activeTool} />

        {/* Right Panels */}
        <div className="flex">
          <PropertiesPanel />
          <LayersPanel />
        </div>
      </div>
    </div>
  );
};

export default Canvas;
