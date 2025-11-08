import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GOOGLE_FONTS } from "@/lib/fontLoader";
import { CurvedText, CurvedTextOptions } from "@/lib/curvedText";

interface CurvedTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (curvedText: CurvedText) => void;
  existingText?: CurvedText;
}

export const CurvedTextDialog = ({ open, onOpenChange, onAdd, existingText }: CurvedTextDialogProps) => {
  const [text, setText] = useState("Curved Text");
  const [diameter, setDiameter] = useState(400);
  const [kerning, setKerning] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [fontSize, setFontSize] = useState(40);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal");
  const [color, setColor] = useState("#000000");
  const [previewText, setPreviewText] = useState<CurvedText | null>(null);

  // Load existing text properties if editing
  useEffect(() => {
    if (existingText) {
      setText(existingText.text);
      setDiameter(existingText.diameter);
      setKerning(existingText.kerning);
      setFlipped(existingText.flipped);
      setFontSize(existingText.fontSize);
      setFontFamily(existingText.fontFamily);
      setFontWeight(existingText.fontWeight as "normal" | "bold");
      setFontStyle(existingText.fontStyle as "normal" | "italic");
      setColor(existingText.textFill || '#000000');
    } else {
      // Reset to defaults when opening fresh
      setText("Curved Text");
      setDiameter(400);
      setKerning(0);
      setFlipped(false);
      setFontSize(40);
      setFontFamily("Inter");
      setFontWeight("normal");
      setFontStyle("normal");
      setColor("#000000");
    }
  }, [existingText, open]);

  // Update preview when properties change
  useEffect(() => {
    if (!open) return;
    
    const preview = new CurvedText(text, {
      diameter,
      kerning,
      flipped,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      fill: color,
    });
    
    setPreviewText(preview);
  }, [text, diameter, kerning, flipped, fontSize, fontFamily, fontWeight, fontStyle, color, open]);

  const handleAdd = () => {
    const options: CurvedTextOptions = {
      text,
      diameter,
      kerning,
      flipped,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      fill: color,
      left: 100,
      top: 100,
    };

    const curvedText = new CurvedText(text, options);
    onAdd(curvedText);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingText ? "Edit" : "Add"} Curved Text</DialogTitle>
          <DialogDescription>
            Create text that curves along a circular arc. Adjust the properties below to customize your curved text.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="text">Text</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your text here..."
              className="min-h-[80px]"
            />
          </div>

          {/* Font Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger id="fontFamily">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOOGLE_FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size: {fontSize}px</Label>
              <Slider
                id="fontSize"
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                min={12}
                max={120}
                step={1}
              />
            </div>
          </div>

          {/* Font Style Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fontWeight">Font Weight</Label>
              <Select value={fontWeight} onValueChange={(v) => setFontWeight(v as "normal" | "bold")}>
                <SelectTrigger id="fontWeight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontStyle">Font Style</Label>
              <Select value={fontStyle} onValueChange={(v) => setFontStyle(v as "normal" | "italic")}>
                <SelectTrigger id="fontStyle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="italic">Italic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Curve Controls */}
          <div className="space-y-2">
            <Label htmlFor="diameter">Curve Diameter: {diameter}px</Label>
            <Slider
              id="diameter"
              value={[diameter]}
              onValueChange={(value) => setDiameter(value[0])}
              min={100}
              max={1000}
              step={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kerning">Letter Spacing (Kerning): {kerning}</Label>
            <Slider
              id="kerning"
              value={[kerning]}
              onValueChange={(value) => setKerning(value[0])}
              min={-5}
              max={20}
              step={1}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Flip Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="flipped">Flip Text (Curve Downward)</Label>
            <Switch
              id="flipped"
              checked={flipped}
              onCheckedChange={setFlipped}
            />
          </div>

          {/* Preview Section */}
          <div className="border rounded-lg p-4 bg-muted/30 min-h-[200px] flex items-center justify-center">
            <div className="text-center text-muted-foreground text-sm">
              Preview will appear in canvas after adding
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!text.trim()}>
            {existingText ? "Update" : "Add to Canvas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
