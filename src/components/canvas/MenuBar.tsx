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

export const MenuBar = () => {
  const {
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
    exportAsPNG,
    exportAsPNGTransparent,
    exportAsJPG,
    exportAsSVG,
  } = useCanvas();

  const handleNew = () => {
    toast.info("New diagram");
  };

  const handleOpen = () => {
    toast.info("Open diagram");
  };

  const handleSave = () => {
    toast.success("Diagram saved");
  };

  const handleExportPDF = () => {
    toast.info("Export as PDF coming soon");
  };

  return (
    <Menubar className="border-none bg-transparent">
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={handleNew}>
            New <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={handleOpen}>
            Open <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={handleSave}>
            Save <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={handleSave}>Save As...</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={exportAsPNG}>Export as PNG</MenubarItem>
          <MenubarItem onClick={exportAsPNGTransparent}>Export as PNG (Transparent)</MenubarItem>
          <MenubarItem onClick={exportAsJPG}>Export as JPG</MenubarItem>
          <MenubarItem onClick={exportAsSVG}>Export as SVG</MenubarItem>
          <MenubarItem onClick={handleExportPDF}>Export as PDF</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
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
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => setGridEnabled(!gridEnabled)}>
            {gridEnabled ? "✓ " : ""}Grid
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={zoomIn}>Zoom In</MenubarItem>
          <MenubarItem onClick={zoomOut}>Zoom Out</MenubarItem>
          <MenubarItem onClick={resetZoom}>Actual Size</MenubarItem>
          <MenubarItem onClick={zoomToFit}>Fit to Screen</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Arrange</MenubarTrigger>
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
        <MenubarTrigger>Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Documentation</MenubarItem>
          <MenubarItem>Keyboard Shortcuts</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>About BioSketch</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};
