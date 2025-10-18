import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StylePanel } from "./StylePanel";
import { ArrangePanel } from "./ArrangePanel";
import { PAPER_SIZES, getPaperSize } from "@/types/paperSizes";
import { useState, useEffect } from "react";
import { useCanvas } from "@/contexts/CanvasContext";
import { Textbox } from "fabric";

const GOOGLE_FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Raleway", label: "Raleway" },
  { value: "Ubuntu", label: "Ubuntu" },
  { value: "Oswald", label: "Oswald" },
  { value: "Merriweather", label: "Merriweather (Serif)" },
  { value: "Playfair Display", label: "Playfair Display (Serif)" },
  { value: "Crimson Text", label: "Crimson Text (Serif)" },
  { value: "Source Sans 3", label: "Source Sans 3" },
  { value: "Arial", label: "Arial (System)" },
  { value: "Helvetica", label: "Helvetica (System)" },
  { value: "Georgia", label: "Georgia (System)" },
  { value: "Times New Roman", label: "Times New Roman (System)" },
];

export const PropertiesPanel = () => {
  const { 
    gridEnabled, 
    setGridEnabled, 
    rulersEnabled, 
    setRulersEnabled, 
    backgroundColor, 
    setBackgroundColor,
    paperSize,
    setPaperSize,
    setCanvasDimensions,
    canvasDimensions,
    canvas,
    selectedObject
  } = useCanvas();
  const [showBgColor, setShowBgColor] = useState(false);
  const [textFont, setTextFont] = useState("Inter");
  const [textSize, setTextSize] = useState(24);
  const [textColor, setTextColor] = useState("#000000");
  const [shapeFillColor, setShapeFillColor] = useState("#3b82f6");
  const [shapeStrokeColor, setShapeStrokeColor] = useState("#000000");

  const COLOR_PALETTE = [
    "#3b82f6", // Blue
    "#0D9488", // Teal
    "#10b981", // Green
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#ffffff", // White
    "#000000", // Black
    "#6b7280", // Gray
    "#f3f4f6", // Light gray
  ];

  // Update text properties when selected object changes
  useEffect(() => {
    if (selectedObject && selectedObject.type === 'textbox') {
      const textObj = selectedObject as Textbox;
      setTextFont(textObj.fontFamily || "Inter");
      setTextSize(textObj.fontSize || 24);
      setTextColor(textObj.fill as string || "#000000");
    }
    // Update shape color properties for non-text objects
    if (selectedObject && selectedObject.type !== 'textbox') {
      setShapeFillColor((selectedObject.fill as string) || "#3b82f6");
      setShapeStrokeColor((selectedObject.stroke as string) || "#000000");
    }
  }, [selectedObject]);

  const handleFontChange = (font: string) => {
    setTextFont(font);
    if (canvas && selectedObject && selectedObject.type === 'textbox') {
      const textObj = selectedObject as Textbox;
      textObj.set({ fontFamily: font });
      canvas.renderAll();
    }
  };

  const handleTextSizeChange = (size: string) => {
    const numSize = parseInt(size);
    if (!isNaN(numSize)) {
      setTextSize(numSize);
      if (canvas && selectedObject && selectedObject.type === 'textbox') {
        const textObj = selectedObject as Textbox;
        textObj.set({ fontSize: numSize });
        canvas.renderAll();
      }
    }
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    if (canvas && selectedObject && selectedObject.type === 'textbox') {
      const textObj = selectedObject as Textbox;
      textObj.set({ fill: color });
      canvas.renderAll();
    }
  };

  const handleShapeFillColorChange = (color: string) => {
    setShapeFillColor(color);
    if (canvas && selectedObject && selectedObject.type !== 'textbox') {
      selectedObject.set({ fill: color });
      canvas.renderAll();
    }
  };

  const handleShapeStrokeColorChange = (color: string) => {
    setShapeStrokeColor(color);
    if (canvas && selectedObject && selectedObject.type !== 'textbox') {
      selectedObject.set({ stroke: color });
      canvas.renderAll();
    }
  };

  const handlePaperSizeChange = (sizeId: string) => {
    setPaperSize(sizeId);
    const selected = getPaperSize(sizeId);
    
    // Scale down large poster sizes to fit viewport
    let width = selected.width;
    let height = selected.height;
    
    const maxWidth = window.innerWidth - 400;
    const maxHeight = window.innerHeight - 200;
    
    if (width > maxWidth || height > maxHeight) {
      const scaleX = maxWidth / width;
      const scaleY = maxHeight / height;
      const scale = Math.min(scaleX, scaleY);
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
    }
    
    setCanvasDimensions({ width, height });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea type="always" className="flex-1 min-h-0">
        <Tabs defaultValue="diagram" className="w-full">
          <TabsList className="grid w-full grid-cols-2 m-3">
            <TabsTrigger value="diagram" className="text-xs">Diagram</TabsTrigger>
            <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
          </TabsList>
          
          <div className="px-3 pb-4">
            <TabsContent value="diagram" className="space-y-4 mt-0">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">View</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="grid" className="text-xs">Grid</Label>
                    <Checkbox 
                      id="grid" 
                      checked={gridEnabled}
                      onCheckedChange={(checked) => setGridEnabled(checked as boolean)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rulers" className="text-xs">Rulers</Label>
                    <Checkbox 
                      id="rulers" 
                      checked={rulersEnabled}
                      onCheckedChange={(checked) => setRulersEnabled(checked as boolean)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Background</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bg-color-toggle" className="text-xs">Custom Color</Label>
                    <Checkbox 
                      id="bg-color-toggle"
                      checked={showBgColor}
                      onCheckedChange={(checked) => setShowBgColor(checked as boolean)}
                    />
                  </div>
                  {showBgColor && (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="color" 
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-8 w-12 p-1" 
                      />
                      <Input 
                        type="text" 
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-8 text-xs flex-1" 
                        placeholder="#ffffff"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Paper Size</h3>
                <Select value={paperSize} onValueChange={handlePaperSizeChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAPER_SIZES.map((size) => (
                      <SelectItem key={size.id} value={size.id} className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium">{size.name}</span>
                          <span className="text-xs text-muted-foreground">{size.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  Canvas: {canvasDimensions.width} × {canvasDimensions.height}px
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="style" className="space-y-4 mt-0">
              <StylePanel />

              {/* Shape Colors - Only show for non-text objects */}
              {selectedObject && selectedObject.type !== 'textbox' && (
                <div className="pt-3 border-t">
                  <h3 className="font-semibold text-sm mb-3">Shape Colors</h3>
                  <div className="space-y-3">
                    {/* Fill Color */}
                    <div className="space-y-2">
                      <Label className="text-xs">Fill Color</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleShapeFillColorChange(color)}
                            className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                            style={{ 
                              backgroundColor: color,
                              borderColor: shapeFillColor === color ? '#0D9488' : '#e5e7eb'
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={shapeFillColor}
                          onChange={(e) => handleShapeFillColorChange(e.target.value)}
                          className="h-8 w-12 p-1" 
                        />
                        <Input 
                          type="text" 
                          value={shapeFillColor}
                          onChange={(e) => handleShapeFillColorChange(e.target.value)}
                          className="h-8 text-xs flex-1" 
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    {/* Stroke Color */}
                    <div className="space-y-2">
                      <Label className="text-xs">Stroke Color</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleShapeStrokeColorChange(color)}
                            className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                            style={{ 
                              backgroundColor: color,
                              borderColor: shapeStrokeColor === color ? '#0D9488' : '#e5e7eb'
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={shapeStrokeColor}
                          onChange={(e) => handleShapeStrokeColorChange(e.target.value)}
                          className="h-8 w-12 p-1" 
                        />
                        <Input 
                          type="text" 
                          value={shapeStrokeColor}
                          onChange={(e) => handleShapeStrokeColorChange(e.target.value)}
                          className="h-8 text-xs flex-1" 
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-3 border-t">
                <h3 className="font-semibold text-sm mb-3">Text</h3>
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Font Family</Label>
                    <Select value={textFont} onValueChange={handleFontChange}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {GOOGLE_FONTS.map((font) => (
                          <SelectItem 
                            key={font.value} 
                            value={font.value}
                            className="text-xs"
                            style={{ fontFamily: font.value }}
                          >
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Size</Label>
                      <Input 
                        type="number" 
                        value={textSize} 
                        onChange={(e) => handleTextSizeChange(e.target.value)}
                        className="h-8 text-xs" 
                        min="8"
                        max="200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Color</Label>
                      <Input 
                        type="color" 
                        value={textColor} 
                        onChange={(e) => handleTextColorChange(e.target.value)}
                        className="h-8" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <h3 className="font-semibold text-sm mb-3">Arrange</h3>
                <ArrangePanel />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </ScrollArea>
    </div>
  );
};
