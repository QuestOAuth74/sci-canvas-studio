import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Waves } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { createTextOnPath, createArcPath, createWavePath } from "@/lib/textOnPath";
import { toast } from "sonner";

export const TextOnPathDialog = () => {
  const { canvas } = useCanvas();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("Text on Curve");
  const [pathType, setPathType] = useState<"arc" | "wave">("arc");
  const [fontSize, setFontSize] = useState(24);
  const [radius, setRadius] = useState(150);
  const [amplitude, setAmplitude] = useState(30);

  const handleCreate = () => {
    if (!canvas || !text.trim()) {
      toast.error("Please enter text");
      return;
    }

    let pathData: string;
    const centerX = (canvas.width || 800) / 2;
    const centerY = (canvas.height || 600) / 2;

    if (pathType === "arc") {
      pathData = createArcPath(centerX, centerY - 50, radius, -90, 90);
    } else {
      pathData = createWavePath(centerX - 200, centerY, 400, amplitude, 2);
    }

    const group = createTextOnPath(canvas, text, pathData, {
      fontSize,
      fontFamily: 'Inter',
      fill: '#000000',
      spacing: 1,
    });

    if (group) {
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      toast.success("Text on path created!");
      setOpen(false);
    } else {
      toast.error("Failed to create text on path");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Waves className="h-4 w-4" />
          Text on Path
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Text on Path</DialogTitle>
          <DialogDescription>
            Create text that follows along a curved path
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="text">Text</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pathType">Path Type</Label>
            <Select value={pathType} onValueChange={(v: any) => setPathType(v)}>
              <SelectTrigger id="pathType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arc">Arc (Curved)</SelectItem>
                <SelectItem value="wave">Wave (Wavy)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Font Size: {fontSize}px</Label>
            <Slider
              value={[fontSize]}
              onValueChange={([v]) => setFontSize(v)}
              min={12}
              max={72}
              step={1}
            />
          </div>

          {pathType === "arc" && (
            <div className="grid gap-2">
              <Label>Curve Radius: {radius}px</Label>
              <Slider
                value={[radius]}
                onValueChange={([v]) => setRadius(v)}
                min={50}
                max={300}
                step={10}
              />
            </div>
          )}

          {pathType === "wave" && (
            <div className="grid gap-2">
              <Label>Wave Height: {amplitude}px</Label>
              <Slider
                value={[amplitude]}
                onValueChange={([v]) => setAmplitude(v)}
                min={10}
                max={80}
                step={5}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
