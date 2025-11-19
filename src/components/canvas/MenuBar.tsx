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
import { Type } from "lucide-react";

interface MenuBarProps {
  onTemplatesClick?: () => void;
}

export const MenuBar = ({ onTemplatesClick }: MenuBarProps = {}) => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [iconSubmissionOpen, setIconSubmissionOpen] = useState(false);
  const [iconCategories, setIconCategories] = useState<{ id: string; name: string }[]>([]);
  
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
      <Menubar className="border-none bg-transparent shadow-none">
        <MenubarMenu>
          <MenubarTrigger className="font-medium">File</MenubarTrigger>
          <MenubarContent>
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
            <MenubarItem onClick={handleOpenExportDialog}>Export Image...</MenubarItem>
            <MenubarItem onClick={() => exportAsSVG()}>Export as SVG</MenubarItem>
            <MenubarItem onClick={handleExportPDF}>Export as PDF</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="font-medium">Edit</MenubarTrigger>
          <MenubarContent>
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
          <MenubarTrigger className="font-medium">View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => setGridEnabled(!gridEnabled)}>
              {gridEnabled ? "✓ " : ""}Grid
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleNormalizeFonts}>
              <Type className="mr-2 h-4 w-4" />
              Normalize Fonts
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={zoomIn}>Zoom In</MenubarItem>
            <MenubarItem onClick={zoomOut}>Zoom Out</MenubarItem>
            <MenubarItem onClick={resetZoom}>Actual Size</MenubarItem>
            <MenubarItem onClick={zoomToFit}>Fit to Screen</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="font-medium">Arrange</MenubarTrigger>
          <MenubarContent>
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
          <MenubarTrigger className="font-medium">Help</MenubarTrigger>
          <MenubarContent>
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
