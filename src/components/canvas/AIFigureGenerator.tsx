import { useState, useCallback } from "react";
import { Upload, Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Canvas as FabricCanvas, FabricImage, Text as FabricText, Group, loadSVGFromString, util } from "fabric";
import { createConnector } from "@/lib/connectorSystem";

interface AIFigureGeneratorProps {
  canvas: FabricCanvas | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GeneratedLayout {
  objects: Array<{
    type: string;
    icon_id: string;
    icon_name: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    label?: string;
    labelPosition?: "top" | "bottom" | "left" | "right";
  }>;
  connectors: Array<{
    from: number;
    to: number;
    type: string;
    style: string;
    strokeWidth: number;
    color: string;
    startMarker?: string;
    endMarker?: string;
    label?: string;
  }>;
}

export const AIFigureGenerator = ({ canvas, open, onOpenChange }: AIFigureGeneratorProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLayout, setGeneratedLayout] = useState<GeneratedLayout | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setGeneratedLayout(null);
      setMetadata(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async () => {
    if (!image || !canvas) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-figure-from-reference', {
        body: {
          image,
          description: description.trim(),
          canvasWidth: canvas.width || 800,
          canvasHeight: canvas.height || 600,
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedLayout(data.layout);
      setMetadata(data.metadata);
      toast.success(`Generated ${data.metadata.total_objects} objects and ${data.metadata.total_connectors} connectors`);
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate figure");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyToCanvas = async () => {
    if (!generatedLayout || !canvas) return;

    try {
      const canvasWidth = canvas.width || 800;
      const canvasHeight = canvas.height || 600;

      // Filter objects with valid icon_id (valid UUID format)
      const validObjects = generatedLayout.objects.filter(obj => {
        const isValid = obj.icon_id && 
          typeof obj.icon_id === 'string' && 
          obj.icon_id.length === 36 &&
          obj.icon_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        return isValid;
      });

      if (validObjects.length === 0) {
        toast.error("No valid icons to add to canvas");
        return;
      }

      const skippedCount = generatedLayout.objects.length - validObjects.length;
      if (skippedCount > 0) {
        toast.warning(`${skippedCount} element${skippedCount > 1 ? 's' : ''} couldn't be matched to database icons`);
      }

      // Fetch all icons SVG content
      const iconIds = validObjects.map(obj => obj.icon_id);
      const { data: icons, error } = await supabase
        .from('icons')
        .select('id, svg_content, name')
        .in('id', iconIds);

      if (error) {
        console.error("Database query error:", error);
        throw new Error(`Failed to fetch icons: ${error.message}`);
      }

      const iconMap = new Map(icons?.map(icon => [icon.id, icon]) || []);
      const addedObjects: any[] = [];

      // Add icons to canvas
      for (const obj of validObjects) {
        const iconData = iconMap.get(obj.icon_id);
        if (!iconData) {
          console.warn(`Icon not found in database: ${obj.icon_id} (${obj.icon_name})`);
          continue;
        }

        try {
        // Load SVG
        const { objects, options } = await loadSVGFromString(iconData.svg_content);
        const group = util.groupSVGElements(objects, options);

        // Get original dimensions
        const originalWidth = group.width || 100;
        const originalHeight = group.height || 100;

        // Calculate scale to normalize to ~200x200px target
        const TARGET_SIZE = 200;
        const maxDimension = Math.max(originalWidth, originalHeight);
        const normalizationScale = TARGET_SIZE / maxDimension;

        // Apply AI's scale on top of normalization
        const finalScale = normalizationScale * obj.scale;

        console.log(`Icon: ${iconData.name}, Original: ${originalWidth.toFixed(0)}x${originalHeight.toFixed(0)}px, Scale: ${finalScale.toFixed(2)}, Final size: ~${(maxDimension * finalScale).toFixed(0)}px`);

        // Convert percentage to pixels
        const x = (obj.x / 100) * canvasWidth;
        const y = (obj.y / 100) * canvasHeight;

        group.set({
          left: x,
          top: y,
          scaleX: finalScale,
          scaleY: finalScale,
          angle: obj.rotation,
        });

          canvas.add(group);
          addedObjects.push(group);

          // Add label if exists
          if (obj.label) {
            const labelOffsets = {
              top: { x: 0, y: -40 },
              bottom: { x: 0, y: 40 },
              left: { x: -60, y: 0 },
              right: { x: 60, y: 0 },
            };
            const offset = labelOffsets[obj.labelPosition || 'bottom'];

            const text = new FabricText(obj.label, {
              left: x + offset.x,
              top: y + offset.y,
              fontSize: 14,
              fill: '#000000',
              fontFamily: 'Arial',
            });
            canvas.add(text);
          }
        } catch (err) {
          console.error(`Failed to load icon ${iconData.name}:`, err);
        }
      }

      // Add connectors with enhanced styling
      for (const conn of generatedLayout.connectors) {
        const fromObj = addedObjects[conn.from];
        const toObj = addedObjects[conn.to];

        if (fromObj && toObj) {
          // Calculate center positions
          const startX = (fromObj.left || 0) + ((fromObj.width || 0) * (fromObj.scaleX || 1)) / 2;
          const startY = (fromObj.top || 0) + ((fromObj.height || 0) * (fromObj.scaleY || 1)) / 2;
          const endX = (toObj.left || 0) + ((toObj.width || 0) * (toObj.scaleX || 1)) / 2;
          const endY = (toObj.top || 0) + ((toObj.height || 0) * (toObj.scaleY || 1)) / 2;

          createConnector(canvas, {
            startX,
            startY,
            endX,
            endY,
            startMarker: (conn.startMarker || 'none') as any,
            endMarker: (conn.endMarker || 'arrow') as any,
            lineStyle: (conn.style === 'dashed' ? 'dashed' : 'solid') as any,
            routingStyle: (conn.type === 'curved' ? 'curved' : 'straight') as any,
            strokeColor: conn.color || '#000000',
            strokeWidth: conn.strokeWidth || 2,
          });

          // Add connector label if exists
          if (conn.label) {
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            const text = new FabricText(conn.label, {
              left: midX,
              top: midY - 10,
              fontSize: 11,
              fill: '#333333',
              backgroundColor: '#FFFFFF',
              padding: 2,
              selectable: false,
            });
            canvas.add(text);
          }
        }
      }

      canvas.renderAll();
      
      const successMsg = addedObjects.length === 1 
        ? "Added 1 icon to canvas" 
        : `Added ${addedObjects.length} icons to canvas`;
      toast.success(successMsg);
      onOpenChange(false);
      
      // Reset state
      setImage(null);
      setDescription("");
      setGeneratedLayout(null);
      setMetadata(null);
    } catch (error: any) {
      console.error("Apply to canvas error:", error);
      const errorMsg = error.message || "Failed to apply layout to canvas";
      toast.error(errorMsg);
    }
  };

  const handleReset = () => {
    setImage(null);
    setDescription("");
    setGeneratedLayout(null);
    setMetadata(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>AI Figure Generator</DialogTitle>
            <Badge variant="secondary">Admin Only</Badge>
          </div>
          <DialogDescription>
            Upload a reference image and let AI recreate it using icons from the database
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Reference Image</Label>
            {!image ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, JPEG, WEBP (MAX. 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileUpload}
                />
              </label>
            ) : (
              <Card className="relative p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleReset}
                >
                  <X className="h-4 w-4" />
                </Button>
                <img src={image} alt="Reference" className="w-full rounded-lg" />
              </Card>
            )}
          </div>

          {/* Optional Description */}
          {image && !generatedLayout && (
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="e.g., 'metabolic pathway with mitochondria and glucose molecules'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>
          )}

          {/* Metadata Display */}
          {metadata && (
            <Card className="p-4 bg-accent/50">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Elements identified:</span>
                  <span className="ml-2 font-semibold">{metadata.elements_identified}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Icons matched:</span>
                  <span className="ml-2 font-semibold">{metadata.icons_matched}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Objects:</span>
                  <span className="ml-2 font-semibold">{metadata.total_objects}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Connectors:</span>
                  <span className="ml-2 font-semibold">{metadata.total_connectors}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {image && !generatedLayout && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Figure
                  </>
                )}
              </Button>
            )}

            {generatedLayout && (
              <>
                <Button onClick={applyToCanvas} className="flex-1">
                  Apply to Canvas
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
