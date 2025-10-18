import { Button } from "@/components/ui/button";
import { Eraser, Download } from "lucide-react";

interface CanvasToolbarProps {
  onClear: () => void;
  onExport: () => void;
}

export const CanvasToolbar = ({ onClear, onExport }: CanvasToolbarProps) => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onClear}>
        <Eraser className="h-4 w-4 mr-2" />
        Clear Canvas
      </Button>
      <Button onClick={onExport}>
        <Download className="h-4 w-4 mr-2" />
        Export Image
      </Button>
    </div>
  );
};
