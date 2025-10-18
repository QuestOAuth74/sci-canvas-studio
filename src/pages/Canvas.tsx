import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserMenu } from "@/components/auth/UserMenu";
import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { ShapesLibrary } from "@/components/canvas/ShapesLibrary";
import { IconLibrary } from "@/components/canvas/IconLibrary";
import { TopToolbar } from "@/components/canvas/TopToolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertiesPanel } from "@/components/canvas/PropertiesPanel";
import { BottomBar } from "@/components/canvas/BottomBar";
import { MenuBar } from "@/components/canvas/MenuBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CanvasProvider, useCanvas } from "@/contexts/CanvasContext";
import { toast } from "sonner";

const CanvasContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<string>("select");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>("");
  const {
    undo,
    redo,
    cut,
    copy,
    paste,
    deleteSelected,
    selectAll,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    projectName,
    setProjectName,
    isSaving,
    saveProject,
    loadProject,
  } = useCanvas();

  // Load project if projectId is in URL
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId) {
      loadProject(projectId);
    }
  }, [searchParams, loadProject]);

  const handleExport = () => {
    toast("Export functionality will save your SVG file");
  };

  const handleShapeSelect = (shape: string) => {
    setActiveTool(shape);
    toast.success(`Selected ${shape}`);
  };

  const startEditingName = () => {
    setTempName(projectName);
    setIsEditingName(true);
  };

  const saveName = () => {
    const trimmedName = tempName.trim();
    if (trimmedName.length === 0) {
      toast.error("Canvas name cannot be empty");
      setTempName(projectName);
      setIsEditingName(false);
      return;
    }
    if (trimmedName.length > 100) {
      toast.error("Canvas name must be less than 100 characters");
      return;
    }
    setProjectName(trimmedName);
    setIsEditingName(false);
    toast.success("Canvas renamed");
  };

  const cancelEditing = () => {
    setTempName(projectName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveName();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (modifier && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (modifier && e.key === 'x') {
        e.preventDefault();
        cut();
      } else if (modifier && e.key === 'c') {
        e.preventDefault();
        copy();
      } else if (modifier && e.key === 'v') {
        e.preventDefault();
        paste();
      } else if (modifier && e.key === 'a') {
        e.preventDefault();
        selectAll();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !modifier) {
        e.preventDefault();
        deleteSelected();
      } else if (modifier && e.shiftKey && e.key === ']') {
        e.preventDefault();
        bringToFront();
      } else if (modifier && !e.shiftKey && e.key === ']') {
        e.preventDefault();
        bringForward();
      } else if (modifier && !e.shiftKey && e.key === '[') {
        e.preventDefault();
        sendBackward();
      } else if (modifier && e.shiftKey && e.key === '[') {
        e.preventDefault();
        sendToBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, cut, copy, paste, selectAll, deleteSelected, bringToFront, sendToBack, bringForward, sendBackward]);

  return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Top Header with Menu - Glass effect */}
      <header className="glass-effect border-b border-border/40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={saveName}
                  autoFocus
                  className="h-9 text-base font-semibold tracking-tight max-w-[300px] glass-effect"
                  maxLength={100}
                />
              </div>
            ) : (
              <button
                onClick={startEditingName}
                className="text-xl font-semibold tracking-tight hover:bg-accent/50 px-3 py-1.5 rounded-md border border-transparent hover:border-border/40 transition-all"
                title="Click to rename"
              >
                {projectName}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isSaving && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            <MenuBar />
            <Button onClick={saveProject} disabled={isSaving} variant="default" size="sm" className="h-9 shadow-sm">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

        {/* Top Toolbar */}
        <TopToolbar 
          onExport={handleExport} 
          activeTool={activeTool}
          onToolChange={setActiveTool}
        />

        {/* Main Editor Area */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Sidebar - Icon Categories */}
          <div className="w-64 glass-effect border-r border-border/40 flex flex-col h-full min-h-0">
            <IconLibrary 
              selectedCategory={selectedIconCategory} 
              onCategoryChange={setSelectedIconCategory}
            />
          </div>

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

const Canvas = () => {
  return (
    <CanvasProvider>
      <TooltipProvider>
        <CanvasContent />
      </TooltipProvider>
    </CanvasProvider>
  );
};

export default Canvas;
