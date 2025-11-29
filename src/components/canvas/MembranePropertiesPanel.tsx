import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowUp, ArrowRight, ArrowDown, ArrowLeft, RefreshCw } from "lucide-react";
import { Group, loadSVGFromString, FabricObject } from "fabric";
import { useCanvas } from "@/contexts/CanvasContext";
import { toast } from "sonner";
import { MembraneBrushIconSelector } from "./MembraneBrushIconSelector";

interface MembranePropertiesPanelProps {
  membrane: Group;
}

export const MembranePropertiesPanel = ({ membrane }: MembranePropertiesPanelProps) => {
  const { canvas } = useCanvas();
  const [showIconSelector, setShowIconSelector] = useState(false);
  
  // Get current membrane options
  const membraneOptions = (membrane as any).membraneOptions || {
    iconSize: 40,
    spacing: 0,
    rotateToPath: true,
    doubleSided: false,
    orientationOffset: 0,
  };

  const [iconSize, setIconSize] = useState(membraneOptions.iconSize);
  const [spacing, setSpacing] = useState(membraneOptions.spacing);
  const [rotateToPath, setRotateToPath] = useState(membraneOptions.rotateToPath);
  const [doubleSided, setDoubleSided] = useState(membraneOptions.doubleSided);
  const [orientationOffset, setOrientationOffset] = useState(membraneOptions.orientationOffset);

  // Update state when membrane changes
  useEffect(() => {
    setIconSize(membraneOptions.iconSize);
    setSpacing(membraneOptions.spacing);
    setRotateToPath(membraneOptions.rotateToPath);
    setDoubleSided(membraneOptions.doubleSided);
    setOrientationOffset(membraneOptions.orientationOffset);
  }, [membrane]);

  const handleRegenerateMembrane = async () => {
    if (!canvas) return;

    const updatedOptions = {
      iconSVG: membraneOptions.iconSVG,
      iconSize,
      spacing,
      rotateToPath,
      doubleSided,
      orientationOffset,
    };

    try {
      // Get the path points from the existing membrane
      const pathPoints = (membrane as any).membranePathPoints;
      if (!pathPoints || pathPoints.length < 2) {
        toast.error("Cannot regenerate: path data not found");
        return;
      }

      // Regenerate icons along the path
      const newIcons = await placeIconsAlongPath(pathPoints, updatedOptions);
      
      // Clear existing objects in the membrane group
      membrane.removeAll();
      
      // Add new icons to the group
      newIcons.forEach(icon => {
        membrane.add(icon);
      });
      
      // Update stored options
      (membrane as any).membraneOptions = updatedOptions;
      
      membrane.setCoords();
      canvas.renderAll();
      toast.success("Membrane updated!");
    } catch (error) {
      console.error("Error regenerating membrane:", error);
      toast.error("Failed to update membrane");
    }
  };

  const handleReplaceIcon = (iconSVG: string, options: any) => {
    if (!canvas) return;

    const updatedOptions = {
      iconSVG,
      iconSize: options.iconSize,
      spacing: options.spacing,
      rotateToPath: options.rotateToPath,
      doubleSided: options.doubleSided,
      orientationOffset: options.orientationOffset,
    };

    // Store the new icon
    (membrane as any).membraneOptions = updatedOptions;
    
    // Update state
    setIconSize(options.iconSize);
    setSpacing(options.spacing);
    setRotateToPath(options.rotateToPath);
    setDoubleSided(options.doubleSided);
    setOrientationOffset(options.orientationOffset);

    // Regenerate with new icon
    setTimeout(() => handleRegenerateMembrane(), 100);
  };

  // Helper function to place icons along path (simplified from MembraneBrushTool)
  const placeIconsAlongPath = async (pathPoints: any[], options: any): Promise<FabricObject[]> => {
    const smoothedPoints = smoothPath(pathPoints);
    const pathLength = calculatePathLength(smoothedPoints);
    const effectiveSpacing = options.iconSize + options.spacing;
    const numIcons = Math.max(2, Math.floor(pathLength / effectiveSpacing));
    
    const icons: FabricObject[] = [];
    
    return new Promise((resolve) => {
      loadSVGFromString(options.iconSVG).then(({ objects }) => {
        if (!objects || objects.length === 0) {
          resolve([]);
          return;
        }
        
        const iconTemplate = new Group(objects);
        const scale = options.iconSize / Math.max(iconTemplate.width || 1, iconTemplate.height || 1);
        
        for (let i = 0; i < numIcons; i++) {
          const distance = (i / (numIcons - 1)) * pathLength;
          const result = getPointAtDistance(smoothedPoints, distance);
          
          if (!result) continue;
          
          iconTemplate.clone().then((icon) => {
            icon.set({
              left: result.point.x,
              top: result.point.y,
              scaleX: scale,
              scaleY: scale,
              originX: 'center',
              originY: 'center',
              selectable: false,
              evented: false,
            });
            
            if (options.rotateToPath) {
              icon.set({ angle: result.angle + 90 + options.orientationOffset });
            } else {
              icon.set({ angle: options.orientationOffset });
            }
            
            icons.push(icon);
            
            // If double-sided, add mirrored icon
            if (options.doubleSided) {
              iconTemplate.clone().then((mirroredIcon) => {
                const offset = options.iconSize * 0.7;
                const perpAngle = (result.angle + 90) * (Math.PI / 180);
                const offsetX = Math.cos(perpAngle) * offset;
                const offsetY = Math.sin(perpAngle) * offset;
                
                mirroredIcon.set({
                  left: result.point.x + offsetX,
                  top: result.point.y + offsetY,
                  scaleX: scale,
                  scaleY: scale,
                  originX: 'center',
                  originY: 'center',
                  selectable: false,
                  evented: false,
                  angle: options.rotateToPath ? result.angle - 90 + options.orientationOffset : options.orientationOffset,
                });
                
                icons.push(mirroredIcon);
                
                if (icons.length >= (options.doubleSided ? numIcons * 2 : numIcons)) {
                  resolve(icons);
                }
              });
            } else if (icons.length >= numIcons) {
              resolve(icons);
            }
          });
        }
      }).catch(() => {
        resolve([]);
      });
    });
  };

  // Path smoothing helper
  const smoothPath = (points: any[]) => {
    if (points.length < 3) return points;
    const smoothed: any[] = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      
      const numSegments = 3;
      for (let t = 0; t < numSegments; t++) {
        const u = t / numSegments;
        const u2 = u * u;
        const u3 = u2 * u;
        
        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - (i + 1 < points.length - 1 ? points[i + 1].x : p2.x)) * u2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + (i + 1 < points.length - 1 ? points[i + 1].x : p2.x)) * u3
        );
        
        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * u +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - (i + 1 < points.length - 1 ? points[i + 1].y : p2.y)) * u2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + (i + 1 < points.length - 1 ? points[i + 1].y : p2.y)) * u3
        );
        
        smoothed.push({ x, y });
      }
    }
    
    smoothed.push(points[points.length - 1]);
    return smoothed;
  };

  const calculatePathLength = (points: any[]) => {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  };

  const getPointAtDistance = (points: any[], distance: number) => {
    let accumulated = 0;
    
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      
      if (accumulated + segmentLength >= distance) {
        const ratio = (distance - accumulated) / segmentLength;
        const x = p1.x + dx * ratio;
        const y = p1.y + dy * ratio;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        return { point: { x, y }, angle };
      }
      
      accumulated += segmentLength;
    }
    
    return null;
  };

  return (
    <div className="space-y-4 p-4 border rounded-md bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Membrane Properties</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowIconSelector(true)}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Replace Icon
        </Button>
      </div>

      {/* Icon Size */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label className="text-sm">Icon Size</Label>
          <span className="text-sm text-muted-foreground">{iconSize}px</span>
        </div>
        <Slider
          value={[iconSize]}
          onValueChange={(v) => setIconSize(v[0])}
          min={20}
          max={100}
          step={5}
        />
      </div>

      {/* Spacing */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label className="text-sm">Spacing</Label>
          <span className="text-sm text-muted-foreground">
            {spacing}px {spacing === 0 && "(touching)"}
          </span>
        </div>
        <Slider
          value={[spacing]}
          onValueChange={(v) => setSpacing(v[0])}
          min={0}
          max={50}
          step={5}
        />
      </div>

      {/* Orientation */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm">Icon Orientation</Label>
          <span className="text-sm text-muted-foreground">{orientationOffset}°</span>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <Button 
            variant={orientationOffset === 0 ? "default" : "outline"} 
            size="sm"
            onClick={() => setOrientationOffset(0)}
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button 
            variant={orientationOffset === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setOrientationOffset(90)}
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
          <Button 
            variant={orientationOffset === 180 ? "default" : "outline"}
            size="sm"
            onClick={() => setOrientationOffset(180)}
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button 
            variant={orientationOffset === 270 ? "default" : "outline"}
            size="sm"
            onClick={() => setOrientationOffset(270)}
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
        </div>

        <Slider
          value={[orientationOffset]}
          onValueChange={(v) => setOrientationOffset(v[0])}
          min={0}
          max={360}
          step={15}
        />
      </div>

      {/* Switches */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Rotate to follow path</Label>
          <Switch
            checked={rotateToPath}
            onCheckedChange={setRotateToPath}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm">Double-sided (bilayer)</Label>
          <Switch
            checked={doubleSided}
            onCheckedChange={setDoubleSided}
          />
        </div>
      </div>

      {/* Apply Button */}
      <Button 
        onClick={handleRegenerateMembrane}
        className="w-full"
      >
        Apply Changes
      </Button>

      {/* Icon Selector Dialog */}
      <MembraneBrushIconSelector
        open={showIconSelector}
        onOpenChange={setShowIconSelector}
        onStart={handleReplaceIcon}
      />
    </div>
  );
};
