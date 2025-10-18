import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  FolderOpen,
  Download,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  Copy,
  Scissors,
  Clipboard,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface TopToolbarProps {
  onExport: () => void;
}

export const TopToolbar = ({ onExport }: TopToolbarProps) => {
  return (
    <div className="flex items-center gap-1 p-2 border-b bg-card">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm">
          <FolderOpen className="h-4 w-4 mr-1" />
          Open
        </Button>
        <Button variant="ghost" size="sm">
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Scissors className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Clipboard className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-2" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm px-2">100%</span>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
