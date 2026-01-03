import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useCanvas } from "@/contexts/CanvasContext";
import { toast } from "sonner";
import { AboutDialog } from "./AboutDialog";
import { IconSubmissionDialog } from "@/components/community/IconSubmissionDialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeCanvasTextFonts } from "@/lib/fontLoader";
import {
  TextT,
  Clock,
  GraduationCap,
  Palette,
  ArrowsClockwise,
  MagicWand,
} from "@phosphor-icons/react";
import { useOnboarding } from "@/contexts/OnboardingContext";

interface MenuBarProps {
  onTemplatesClick?: () => void;
  onPanelLabelClick?: () => void;
  onVersionHistoryClick?: () => void;
  onScaleBarClick?: () => void;
  onStyleTransferClick?: () => void;
  onAIFigureStudioClick?: () => void;
}

export const MenuBar = ({ onTemplatesClick, onPanelLabelClick, onVersionHistoryClick, onScaleBarClick, onStyleTransferClick, onAIFigureStudioClick }: MenuBarProps = {}) => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [iconSubmissionOpen, setIconSubmissionOpen] = useState(false);
  const [iconCategories, setIconCategories] = useState<{ id: string; name: string }[]>([]);
  const { startOnboarding } = useOnboarding();
  
  const {
    canvas,
    undo,
    redo,
    cut,
    copy,
    paste,
    deleteSelected,
    selectAll,
    gridEnabled,
    setGridEnabled,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomToFit,
    alignLeft,
    alignCenter,
    alignRight,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    exportAsSVG,
    saveProject,
    setExportDialogOpen,
  } = useCanvas();

  const handleNew = () => {
    if (confirm("Create new diagram? Unsaved changes will be lost.")) {
      window.location.href = "/canvas";
    }
  };

  const handleOpen = () => {
    window.location.href = "/projects";
  };

  const handleSave = () => {
    saveProject();
  };

  const handleExportPDF = () => {
    toast.info("Export as PDF coming soon");
  };

  const handleOpenExportDialog = () => {
    setExportDialogOpen(true);
  };

  const handleNormalizeFonts = () => {
    if (!canvas) {
      toast.error("No canvas available");
      return;
    }
    normalizeCanvasTextFonts(canvas);
    toast.success("Text fonts normalized for special character support");
  };

  const handleRepairCurvedLines = async () => {
    if (!canvas) {
      toast.error("No canvas available");
      return;
    }
    
    try {
      const { cleanupOrphanHandles, reconnectCurvedLines } = await import('@/lib/curvedLineTool');
      cleanupOrphanHandles(canvas);
      reconnectCurvedLines(canvas);
      toast.success("Curved lines repaired successfully");
    } catch (error) {
      console.error('Failed to repair curved lines:', error);
      toast.error("Failed to repair curved lines");
    }
  };

  const handleClearIconCache = async () => {
    try {
      const { iconCache } = await import('@/lib/iconCache');
      await iconCache.clear();
      toast.success("Icon cache cleared! Icons will reload fresh from database on next use.");
    } catch (error) {
      console.error('Failed to clear icon cache:', error);
      toast.error("Failed to clear icon cache");
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('icon_categories')
        .select('id, name')
        .order('name');
      if (data) setIconCategories(data);
    };
    fetchCategories();
  }, []);

  return (
    <>
      <Menubar className="border-none bg-transparent shadow-none" data-onboarding="menu-bar">
        <MenubarMenu>
          <MenubarTrigger className="font-medium hover:bg-blue-200/60 transition-all duration-200 hover:border-b-2 hover:border-primary">File</MenubarTrigger>
          <MenubarContent className="bg-gradient-to-br from-background to-muted/30 shadow-2xl border-2 border-border/50 backdrop-blur-xl">
            <MenubarItem onClick={handleNew}>
              New <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleOpen}>
              Open <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onTemplatesClick}>Templates...</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleSave}>
              Save <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleSave}>Save As...</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onVersionHistoryClick}>
              <Clock size={16} weight="regular" className="mr-2" />
              Version History <MenubarShortcut>⌘H</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleOpenExportDialog}>Export Image...</MenubarItem>
            <MenubarItem onClick={() => exportAsSVG()}>Export as SVG</MenubarItem>
            <MenubarItem onClick={handleExportPDF}>Export as PDF</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="font-medium hover:bg-blue-200/60 transition-all duration-200 hover:border-b-2 hover:border-primary">Edit</MenubarTrigger>
          <MenubarContent className="bg-gradient-to-br from-background to-muted/30 shadow-2xl border-2 border-border/50 backdrop-blur-xl">
            <MenubarItem onClick={undo}>
              Undo <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={redo}>
              Redo <MenubarShortcut>⌘⇧Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={cut}>
              Cut <MenubarShortcut>⌘X</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={copy}>
              Copy <MenubarShortcut>⌘C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={paste}>
              Paste <MenubarShortcut>⌘V</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={deleteSelected}>
              Delete <MenubarShortcut>⌫</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={selectAll}>Select All</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="font-medium hover:bg-blue-200/60 transition-all duration-200 hover:border-b-2 hover:border-primary">Insert</MenubarTrigger>
          <MenubarContent className="bg-gradient-to-br from-background to-muted/30 shadow-2xl border-2 border-border/50 backdrop-blur-xl">
            <MenubarItem onClick={onPanelLabelClick}>
              Figure Panel Labels (A, B, C...)
            </MenubarItem>
            <MenubarItem onClick={onScaleBarClick}>
              Scale Bar
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onTemplatesClick}>
              Templates
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="font-medium hover:bg-blue-200/60 transition-all duration-200 hover:border-b-2 hover:border-primary">Tools</MenubarTrigger>
          <MenubarContent className="bg-gradient-to-br from-background to-muted/30 shadow-2xl border-2 border-border/50 backdrop-blur-xl">
            <MenubarItem onClick={onAIFigureStudioClick}>
              <MagicWand size={16} weight="regular" className="mr-2" />
              AI Figure Studio
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onStyleTransferClick}>
              <Palette size={16} weight="regular" className="mr-2" />
              Style Transfer
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="font-medium hover:bg-blue-200/60 transition-all duration-200 hover:border-b-2 hover:border-primary">View</MenubarTrigger>
          <MenubarContent className="bg-gradient-to-br from-background to-muted/30 shadow-2xl border-2 border-border/50 backdrop-blur-xl">
            <MenubarItem onClick={() => setGridEnabled(!gridEnabled)}>
              {gridEnabled ? "✓ " : ""}Grid
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleNormalizeFonts}>
              <TextT size={16} weight="regular" className="mr-2" />
              Normalize Fonts
            </MenubarItem>
            <MenubarItem onClick={handleRepairCurvedLines}>
              Repair Curved Lines
            </MenubarItem>
            <MenubarItem onClick={handleClearIconCache}>
              <ArrowsClockwise size={16} weight="regular" className="mr-2" />
              Clear Icon Cache
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={zoomIn}>Zoom In</MenubarItem>
            <MenubarItem onClick={zoomOut}>Zoom Out</MenubarItem>
            <MenubarItem onClick={resetZoom}>Actual Size</MenubarItem>
            <MenubarItem onClick={zoomToFit}>Fit to Screen</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="font-medium hover:bg-blue-200/60 transition-all duration-200 hover:border-b-2 hover:border-primary">Arrange</MenubarTrigger>
          <MenubarContent className="bg-gradient-to-br from-background to-muted/30 shadow-2xl border-2 border-border/50 backdrop-blur-xl">
            <MenubarItem onClick={bringToFront}>Bring to Front</MenubarItem>
            <MenubarItem onClick={sendToBack}>Send to Back</MenubarItem>
            <MenubarItem onClick={bringForward}>Bring Forward</MenubarItem>
            <MenubarItem onClick={sendBackward}>Send Backward</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={alignLeft}>Align Left</MenubarItem>
            <MenubarItem onClick={alignCenter}>Align Center</MenubarItem>
            <MenubarItem onClick={alignRight}>Align Right</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="font-medium hover:bg-blue-200/60 transition-all duration-200 hover:border-b-2 hover:border-primary">Help</MenubarTrigger>
          <MenubarContent className="bg-gradient-to-br from-background to-muted/30 shadow-2xl border-2 border-border/50 backdrop-blur-xl">
            <MenubarItem onClick={startOnboarding}>
              <GraduationCap size={16} weight="regular" className="mr-2" />
              Restart Tutorial
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => setIconSubmissionOpen(true)}>Suggest Icon/Feature</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => setAboutOpen(true)}>Documentation</MenubarItem>
            <MenubarItem>Keyboard Shortcuts</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => setAboutOpen(true)}>About BioSketch</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      <IconSubmissionDialog 
        open={iconSubmissionOpen}
        onOpenChange={setIconSubmissionOpen}
        categories={iconCategories}
      />
    </>
  );
};
