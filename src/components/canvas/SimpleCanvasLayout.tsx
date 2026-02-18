import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconLoader2,
  IconChevronLeft,
  IconChevronRight,
  IconSettings,
  IconDownload,
  IconSearch,
  IconPlus,
  IconMinus,
  IconMaximize,
  IconGrid4x4,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { UserMenu } from "@/components/auth/UserMenu";
import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { IconLibrary } from "@/components/canvas/IconLibrary";
import { Toolbar } from "@/components/canvas/Toolbar";
import { SimplePropertiesPanel } from "@/components/canvas/SimplePropertiesPanel";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useCanvas } from "@/contexts/CanvasContext";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ExportDialog } from "@/components/canvas/ExportDialog";
import { CanvasContextMenu } from "@/components/canvas/CanvasContextMenu";

interface SimpleCanvasLayoutProps {
  onLayoutChange: () => void;
}

export const SimpleCanvasLayout = ({ onLayoutChange }: SimpleCanvasLayoutProps) => {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<string>("select");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasClipboard, setHasClipboard] = useState(false);
  const [hasHiddenObjects, setHasHiddenObjects] = useState(false);

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
    groupSelected,
    ungroupSelected,
    projectName,
    setProjectName,
    isSaving,
    saveProject,
    zoomIn,
    zoomOut,
    resetZoom,
    duplicateSelected,
    toggleLockSelected,
    hideSelected,
    showAllHidden,
    exportDialogOpen,
    setExportDialogOpen,
    exportAsPNG,
    exportAsPNGTransparent,
    exportAsJPG,
    canvasDimensions,
  } = useCanvas();

  // Get zoom level from canvas
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!canvas) return;
    const updateZoom = () => setZoomLevel(canvas.getZoom());
    updateZoom();
    canvas.on('mouse:wheel' as any, updateZoom);
    return () => { canvas.off('mouse:wheel' as any, updateZoom); };
  }, [canvas]);

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
    setProjectName(trimmedName);
    setIsEditingName(false);
    toast.success("Canvas renamed");
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveName();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setTempName(projectName);
      setIsEditingName(false);
    }
  };

  const handleExportImage = (format: 'png' | 'png-transparent' | 'jpg', dpi: 150 | 300 | 600, selectionOnly?: boolean) => {
    if (format === 'png') {
      exportAsPNG(dpi, selectionOnly);
    } else if (format === 'png-transparent') {
      exportAsPNGTransparent(dpi, selectionOnly);
    } else if (format === 'jpg') {
      exportAsJPG(dpi, selectionOnly);
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExportImage}
        canvasWidth={canvasDimensions.width}
        canvasHeight={canvasDimensions.height}
        hasSelection={!!selectedObject}
      />

      {/* Minimal Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="h-9 w-9 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <IconArrowLeft size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to Projects</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-slate-200" />

          {isEditingName ? (
            <Input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={saveName}
              autoFocus
              className="h-8 text-sm font-medium w-48 bg-slate-50 border-slate-200"
              maxLength={100}
            />
          ) : (
            <button
              onClick={startEditingName}
              className="text-sm font-medium text-slate-800 hover:bg-slate-100 px-2 py-1 rounded"
            >
              {projectName}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs flex items-center gap-1.5 px-2 py-1 text-slate-500">
              <IconLoader2 size={14} className="animate-spin" />
              Saving...
            </span>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLayoutChange}
                className="h-9 w-9 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <IconGrid4x4 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Switch to Classic Layout</TooltipContent>
          </Tooltip>

          <Button
            onClick={() => saveProject(true)}
            disabled={isSaving}
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-slate-600 hover:bg-slate-100 gap-1.5"
          >
            <IconDeviceFloppy size={16} />
            Save
          </Button>

          <Button
            onClick={() => setExportDialogOpen(true)}
            variant="default"
            size="sm"
            className="h-9 px-4 bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5"
          >
            <IconDownload size={16} />
            Export
          </Button>

          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Icons */}
        <div className={`bg-white border-r border-slate-200 transition-all duration-200 flex flex-col ${isSidebarOpen ? 'w-72' : 'w-12'}`}>
          {isSidebarOpen ? (
            <>
              {/* Sidebar Header */}
              <div className="h-12 border-b border-slate-100 flex items-center justify-between px-3">
                <span className="text-sm font-semibold text-slate-700">Elements</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <IconChevronLeft size={16} />
                </Button>
              </div>

              {/* Search */}
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search elements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 bg-slate-50 border-slate-200 text-sm"
                  />
                </div>
              </div>

              {/* Icon Library */}
              <div className="flex-1 overflow-hidden">
                <IconLibrary
                  selectedCategory={selectedIconCategory}
                  onCategoryChange={setSelectedIconCategory}
                  isCollapsed={false}
                  onToggleCollapse={() => {}}
                  onAIIconGenerate={() => {}}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center pt-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="h-9 w-9 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <IconChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>

        {/* Center - Toolbar + Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Horizontal Toolbar */}
          <div className="h-12 bg-white border-b border-slate-200 flex items-center px-3 gap-1">
            <Toolbar activeTool={activeTool} onToolChange={setActiveTool} isHorizontal />
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative bg-slate-100">
            <ScrollArea className="h-full w-full">
              <div className="p-8 min-h-full flex items-center justify-center">
                <CanvasContextMenu
                  selectedObject={selectedObject}
                  hasClipboard={hasClipboard}
                  canUndo={true}
                  canRedo={true}
                  hasHiddenObjects={hasHiddenObjects}
                  onCopy={() => { copy(); setHasClipboard(true); }}
                  onCut={() => { cut(); setHasClipboard(true); }}
                  onPaste={paste}
                  onDuplicate={duplicateSelected}
                  onDelete={deleteSelected}
                  onLock={toggleLockSelected}
                  onHide={hideSelected}
                  onBringToFront={bringToFront}
                  onBringForward={bringForward}
                  onSendBackward={sendBackward}
                  onSendToBack={sendToBack}
                  onGroup={groupSelected}
                  onUngroup={ungroupSelected}
                  onSelectAll={selectAll}
                  onUndo={undo}
                  onRedo={redo}
                  onShowAllHidden={showAllHidden}
                  onOpenProperties={() => setIsPropertiesOpen(true)}
                >
                  <FabricCanvas
                    activeTool={activeTool}
                    onShapeCreated={handleShapeCreated}
                    onToolChange={setActiveTool}
                  />
                </CanvasContextMenu>
              </div>
              <ScrollBar orientation="horizontal" />
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* Floating Zoom Controls */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white rounded-lg border border-slate-200 shadow-sm p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomOut}
                className="h-8 w-8 rounded text-slate-600 hover:bg-slate-100"
              >
                <IconMinus size={16} />
              </Button>
              <button
                onClick={resetZoom}
                className="h-8 px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded min-w-[50px]"
              >
                {Math.round((zoomLevel || 1) * 100)}%
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomIn}
                className="h-8 w-8 rounded text-slate-600 hover:bg-slate-100"
              >
                <IconPlus size={16} />
              </Button>
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (canvas) {
                    const vpt = canvas.viewportTransform;
                    if (vpt) {
                      vpt[4] = 0;
                      vpt[5] = 0;
                      canvas.setViewportTransform(vpt);
                      canvas.renderAll();
                    }
                  }
                }}
                className="h-8 w-8 rounded text-slate-600 hover:bg-slate-100"
              >
                <IconMaximize size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {isPropertiesOpen && (
          <div className="w-64 bg-white border-l border-slate-200 flex flex-col">
            <div className="h-12 border-b border-slate-100 flex items-center justify-between px-3">
              <span className="text-sm font-semibold text-slate-700">Properties</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPropertiesOpen(false)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <IconChevronRight size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SimplePropertiesPanel />
            </div>
          </div>
        )}

        {/* Properties Toggle when closed */}
        {!isPropertiesOpen && (
          <div className="w-12 bg-white border-l border-slate-200 flex flex-col items-center pt-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPropertiesOpen(true)}
                  className="h-9 w-9 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <IconSettings size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Properties</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};
