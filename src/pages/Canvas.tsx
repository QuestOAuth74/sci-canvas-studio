import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, HelpCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserMenu } from "@/components/auth/UserMenu";
import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { IconLibrary } from "@/components/canvas/IconLibrary";
import { UserAssetsLibrary } from "@/components/canvas/UserAssetsLibrary";
import { TopToolbar } from "@/components/canvas/TopToolbar";
import { Toolbar } from "@/components/canvas/Toolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertiesPanel } from "@/components/canvas/PropertiesPanel";
import { LayersPanel } from "@/components/canvas/LayersPanel";
import { BottomBar } from "@/components/canvas/BottomBar";
import { MenuBar } from "@/components/canvas/MenuBar";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CanvasProvider, useCanvas } from "@/contexts/CanvasContext";
import { toast } from "sonner";
import { WelcomeDialog } from "@/components/canvas/WelcomeDialog";
import { KeyboardShortcutsDialog } from "@/components/canvas/KeyboardShortcutsDialog";
import { SaveUploadHandler } from "@/components/canvas/SaveUploadHandler";
import { AIFigureGenerator } from "@/components/canvas/AIFigureGenerator";
import { CropTool } from "@/components/canvas/CropTool";
import { useAuth } from "@/contexts/AuthContext";
import { FabricImage } from "fabric";

const CanvasContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTool, setActiveTool] = useState<string>("select");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>("");
  const [isIconLibraryCollapsed, setIsIconLibraryCollapsed] = useState(false);
  const [isPropertiesPanelCollapsed, setIsPropertiesPanelCollapsed] = useState(false);
  const [leftSidebarTab, setLeftSidebarTab] = useState<"icons" | "assets">("icons");
  const [rightSidebarTab, setRightSidebarTab] = useState<"properties" | "layers">("properties");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const { isAdmin } = useAuth();
  const {
    canvas,
    selectedObject,
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
    togglePin,
    cropMode,
    setCropMode,
    cropImage,
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

  const handleShapeCreated = useCallback(() => {
    setActiveTool("select");
  }, []);

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

      // Check if user is editing text - either canvas text OR HTML inputs
      const activeObject = canvas?.getActiveObject();
      const isEditingCanvasText = activeObject && 
        (activeObject.type === 'textbox' || activeObject.type === 'i-text' || activeObject.type === 'text') && 
        (activeObject as any).isEditing;

      // Check if focus is on any HTML input element
      const activeElement = document.activeElement;
      const isEditingHTMLInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      const isEditingText = isEditingCanvasText || isEditingHTMLInput;

      // Show shortcuts dialog with ?
      if (e.key === '?' && !modifier && !isEditingText) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

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
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !modifier && !isEditingText) {
        // Only delete the object if not currently editing text
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
      } else if (modifier && e.key === 'l') {
        e.preventDefault();
        togglePin();
      } else if (!modifier && e.key.toLowerCase() === 'l' && !isEditingText) {
        e.preventDefault();
        setActiveTool("straight-line");
        toast.info("Straight line tool activated");
      } else if (!modifier && e.key.toLowerCase() === 'c' && !isEditingText) {
        e.preventDefault();
        const activeObject = canvas?.getActiveObject();
        if (activeObject && activeObject.type === 'image') {
          setCropMode(true);
          toast.info("Crop mode activated");
        }
      } else if (e.key === 'Escape' && cropMode) {
        e.preventDefault();
        setCropMode(false);
        toast.info("Crop mode cancelled");
      } else if (e.key === 'Enter' && cropMode && !isEditingText) {
        e.preventDefault();
        // Crop will be applied via CropTool's Apply button
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, undo, redo, cut, copy, paste, selectAll, deleteSelected, bringToFront, sendToBack, bringForward, sendBackward, togglePin, cropMode, setCropMode]);

  return (
      <div className="h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Welcome Dialog */}
      <WelcomeDialog />
      
      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog 
        open={showShortcuts} 
        onOpenChange={setShowShortcuts}
      />

      {/* Save Upload Handler */}
      <SaveUploadHandler />
      
      {/* AI Figure Generator */}
      <AIFigureGenerator 
        canvas={canvas}
        open={aiGeneratorOpen} 
        onOpenChange={setAiGeneratorOpen} 
      />
      
      {/* Crop Tool */}
      {cropMode && canvas && (() => {
        // Check selectedObject first, fallback to canvas active object
        const imageToEdit = selectedObject?.type === 'image' 
          ? selectedObject 
          : canvas.getActiveObject()?.type === 'image' 
            ? canvas.getActiveObject() 
            : null;
        
        return imageToEdit && (
          <CropTool
            canvas={canvas}
            selectedImage={imageToEdit as FabricImage}
            onApply={cropImage}
            onCancel={() => setCropMode(false)}
          />
        );
      })()}

      {/* Top Header with Menu - Glass effect */}
      <header className="glass-effect border-b border-border/40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODgyOTg3LCJleHAiOjIwNzYyNDI5ODd9.Z1uz-_XoJro6NP3bm6Ehexf5wAqUMfg03lRo73WPr1g"
              alt="BioSketch" 
              className="h-8 object-contain"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to Projects</TooltipContent>
            </Tooltip>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowShortcuts(true)}
                  className="h-9 w-9"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard Shortcuts (?)</TooltipContent>
            </Tooltip>
            {isAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiGeneratorOpen(true)}
                    className="h-9"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Generate
                    <Badge variant="secondary" className="ml-2">Admin</Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>AI Figure Generator</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={saveProject} disabled={isSaving} variant="default" size="sm" className="h-9 shadow-sm">
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Project (Ctrl+S)</TooltipContent>
            </Tooltip>
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
        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar - Icon Categories & Assets */}
          <div className={`glass-effect border-r border-border/40 flex flex-col overflow-hidden min-h-0 h-full transition-all duration-300 ${isIconLibraryCollapsed ? 'w-12' : 'w-64'}`}>
            {isIconLibraryCollapsed ? (
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsIconLibraryCollapsed(false)}
                  className="w-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="p-2 border-b flex items-center justify-between">
                  <Tabs value={leftSidebarTab} onValueChange={(v) => setLeftSidebarTab(v as "icons" | "assets")} className="flex-1">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                      <TabsTrigger value="icons" className="text-xs">Icons</TabsTrigger>
                      <TabsTrigger value="assets" className="text-xs">My Assets</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsIconLibraryCollapsed(true)}
                    className="ml-1 h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {leftSidebarTab === "icons" ? (
                    <IconLibrary 
                      selectedCategory={selectedIconCategory} 
                      onCategoryChange={setSelectedIconCategory}
                      isCollapsed={false}
                      onToggleCollapse={() => {}}
                    />
                  ) : (
                    <UserAssetsLibrary 
                      onAssetSelect={async (assetId, content) => {
                        // Dispatch event to add asset to canvas
                        window.dispatchEvent(new CustomEvent('addAssetToCanvas', {
                          detail: { content, assetId }
                        }));
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vertical Toolbar */}
          <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />

        {/* Canvas */}
        <div className="flex-1 relative min-h-0">
          <FabricCanvas activeTool={activeTool} onShapeCreated={handleShapeCreated} onToolChange={setActiveTool} />
        </div>

        {/* Right Sidebar - Properties & Layers */}
        <div className={`glass-effect border-l border-border/40 flex flex-col overflow-hidden min-h-0 transition-all duration-300 ${isPropertiesPanelCollapsed ? 'w-12' : 'w-64'}`}>
          {isPropertiesPanelCollapsed ? (
            <div className="p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPropertiesPanelCollapsed(false)}
                className="w-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-2 border-b flex items-center justify-between">
                <Tabs value={rightSidebarTab} onValueChange={(v) => setRightSidebarTab(v as "properties" | "layers")} className="flex-1">
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
                    <TabsTrigger value="layers" className="text-xs">Layers</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPropertiesPanelCollapsed(true)}
                  className="ml-1 h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                {rightSidebarTab === "properties" ? (
                  <PropertiesPanel 
                    isCollapsed={false}
                    onToggleCollapse={() => {}}
                    activeTool={activeTool}
                  />
                ) : (
                  <LayersPanel />
                )}
              </div>
            </div>
          )}
        </div>
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
