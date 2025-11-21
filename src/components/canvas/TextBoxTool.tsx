import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Square, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { createTextBox } from "@/lib/textBoxTool";
import { toast } from "sonner";

const FONTS = [
  { name: "Inter", value: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { name: "Arial", value: "Arial, Helvetica, sans-serif" },
  { name: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { name: "Courier New", value: "'Courier New', Courier, monospace" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { name: "STIX Two Text", value: "'STIX Two Text', serif" },
];

const ALIGN_OPTIONS = [
  { value: "left", icon: AlignLeft, label: "Left" },
  { value: "center", icon: AlignCenter, label: "Center" },
  { value: "right", icon: AlignRight, label: "Right" },
  { value: "justify", icon: AlignJustify, label: "Justify" },
];

export const TextBoxTool = () => {
  const { canvas } = useCanvas();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("Enter text here...");
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(150);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState(FONTS[0].value);
  const [textAlign, setTextAlign] = useState("left");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderWidth, setBorderWidth] = useState(1);
  const [padding, setPadding] = useState(15);
  const [fontColor, setFontColor] = useState("#000000");

  const handleAddTextBox = () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    const textBox = createTextBox({
      text,
      width,
      height,
      fontSize,
      fontFamily,
      textAlign,
      backgroundColor,
      borderColor,
      borderWidth,
      padding,
      fontColor,
      left: canvas.getWidth() / 2 - width / 2,
      top: canvas.getHeight() / 2 - height / 2,
    });

    canvas.add(textBox);
    canvas.setActiveObject(textBox);
    canvas.requestRenderAll();

    toast.success("Text box added");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          title="Add Text Box"
        >
          <Square className="h-4 w-4" />
          <AlignLeft className="h-3 w-3 -ml-1" />
          Text Box
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Text Box</DialogTitle>
          <DialogDescription>
            Add a multiline text box with a visible frame to your canvas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Text Content */}
          <div className="space-y-2">
            <Label htmlFor="text">Text Content</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your text..."
              rows={4}
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width: {width}px</Label>
              <Slider
                value={[width]}
                onValueChange={([value]) => setWidth(value)}
                min={150}
                max={800}
                step={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Height: {height}px</Label>
              <Slider
                value={[height]}
                onValueChange={([value]) => setHeight(value)}
                min={80}
                max={600}
                step={10}
              />
            </div>
          </div>

          {/* Font Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="font">Font Family</Label>
              <select
                id="font"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {FONTS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Font Size: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={([value]) => setFontSize(value)}
                min={12}
                max={48}
                step={1}
              />
            </div>
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <Label htmlFor="fontColor">Text Color</Label>
            <div className="flex gap-2">
              <input
                id="fontColor"
                type="color"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
                className="h-10 w-20 rounded border border-input cursor-pointer"
              />
              <input
                type="text"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Text Alignment */}
          <div className="space-y-2">
            <Label>Text Alignment</Label>
            <div className="flex gap-2">
              {ALIGN_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={textAlign === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextAlign(option.value)}
                  title={option.label}
                >
                  <option.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Background & Border Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bgColor">Background Color</Label>
              <div className="flex gap-2">
                <input
                  id="bgColor"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-10 w-20 rounded border border-input cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="borderColor">Border Color</Label>
              <div className="flex gap-2">
                <input
                  id="borderColor"
                  type="color"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="h-10 w-20 rounded border border-input cursor-pointer"
                />
                <input
                  type="text"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Border Width & Padding */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Border Width: {borderWidth}px</Label>
              <Slider
                value={[borderWidth]}
                onValueChange={([value]) => setBorderWidth(value)}
                min={0}
                max={5}
                step={0.5}
              />
            </div>
            <div className="space-y-2">
              <Label>Padding: {padding}px</Label>
              <Slider
                value={[padding]}
                onValueChange={([value]) => setPadding(value)}
                min={5}
                max={50}
                step={5}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTextBox}>
              Add Text Box
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
