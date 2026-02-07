import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  IconSearch,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconArrowUp,
  IconArrowRight,
  IconArrowDown,
  IconArrowLeft,
  IconLayersSubtract,
  IconStack2,
  IconWaveSine,
  IconRotate,
  IconSpacing,
  IconResize,
} from "@tabler/icons-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import noPreview from "@/assets/no_preview.png";
import { Canvas, Group, FabricObject, Circle, Path, loadSVGFromString } from "fabric";

// Helper functions
const isUrl = (str: string): boolean => {
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:');
};

const sanitizeSvg = (raw: string): string => {
  let svg = raw.trim();
  svg = svg
    .replace(/<\?xml[^>]*?>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");

  if (!svg.includes('viewBox')) {
    const widthMatch = svg.match(/width\s*=\s*["']([^"']+)["']/i);
    const heightMatch = svg.match(/height\s*=\s*["']([^"']+)["']/i);
    if (widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1]);
      const height = parseFloat(heightMatch[1]);
      if (!isNaN(width) && !isNaN(height)) {
        svg = svg.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
      }
    }
  }

  return svg;
};

const svgToDataUrl = (svg: string): string => {
  const encoded = encodeURIComponent(svg)
    .replace(/%0A/g, "")
    .replace(/%20/g, " ");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
};

const ICONS_PER_PAGE = 16;

interface Point {
  x: number;
  y: number;
}

interface AnchorPoint extends Point {
  id: string;
  controlIn?: Point;
  controlOut?: Point;
}

interface Category {
  id: string;
  name: string;
}

interface Icon {
  id: string;
  name: string;
  category: string;
  svg_content: string;
  thumbnail?: string;
}

interface MembraneToolProps {
  canvas: Canvas | null;
  active: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

export const MembraneTool = ({ canvas, active, onComplete, onCancel }: MembraneToolProps) => {
  // Drawing state
  const [anchorPoints, setAnchorPoints] = useState<AnchorPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<Path | null>(null);
  const anchorCirclesRef = useRef<Map<string, Circle>>(new Map());

  // Dialog state
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [pathPoints, setPathPoints] = useState<Point[]>([]);

  // Icon selection state
  const [categories, setCategories] = useState<Category[]>([]);
  const [iconsByCategory, setIconsByCategory] = useState<Record<string, Icon[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Icon[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(0);
  const [activeTab, setActiveTab] = useState("suggested");

  // Membrane options
  const [iconSize, setIconSize] = useState(40);
  const [spacing, setSpacing] = useState(0);
  const [rotateToPath, setRotateToPath] = useState(true);
  const [bilayerMode, setBilayerMode] = useState(true);
  const [orientationOffset, setOrientationOffset] = useState(0);
  const [bilayerGap, setBilayerGap] = useState(0.7);

  // Suggested membrane icons
  const suggestedIcons = [
    { name: "Phospholipid", search: "phospholipid", default: true },
    { name: "Ion Channel", search: "ion channel" },
    { name: "Receptor", search: "receptor" },
    { name: "Transporter", search: "transporter" },
    { name: "Pump", search: "pump" },
    { name: "Glycoprotein", search: "glycoprotein" },
  ];

  // Generate unique ID for anchor points
  const generateId = () => `anchor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Load categories when dialog opens
  useEffect(() => {
    if (showConfigDialog) {
      loadCategories();
      // Auto-search for phospholipid
      setSearchQuery("phospholipid");
    }
  }, [showConfigDialog]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchPage(0);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle canvas click for adding anchor points
  useEffect(() => {
    if (!canvas || !active) return;

    const handleMouseDown = (e: any) => {
      const pointer = canvas.getViewportPoint(e.e);

      // Check if clicking on existing anchor point to close path
      if (anchorPoints.length >= 2) {
        const firstPoint = anchorPoints[0];
        const dist = Math.sqrt(
          Math.pow(pointer.x - firstPoint.x, 2) + Math.pow(pointer.y - firstPoint.y, 2)
        );

        if (dist < 15) {
          // Close the path and open config dialog
          finishDrawing();
          return;
        }
      }

      // Add new anchor point
      const newPoint: AnchorPoint = {
        id: generateId(),
        x: pointer.x,
        y: pointer.y,
      };

      setAnchorPoints(prev => [...prev, newPoint]);
      setIsDrawing(true);

      // Add visual anchor circle
      const circle = new Circle({
        left: pointer.x,
        top: pointer.y,
        radius: 6,
        fill: '#3b82f6',
        stroke: '#ffffff',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        shadow: {
          color: 'rgba(0,0,0,0.3)',
          blur: 4,
          offsetX: 0,
          offsetY: 2,
        },
      });
      (circle as any).isTemp = true;
      (circle as any).anchorId = newPoint.id;
      canvas.add(circle);
      anchorCirclesRef.current.set(newPoint.id, circle);
    };

    const handleMouseMove = (e: any) => {
      if (anchorPoints.length === 0) return;

      const pointer = canvas.getViewportPoint(e.e);
      updatePreviewPath(pointer);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelDrawing();
      } else if (e.key === 'Enter' && anchorPoints.length >= 2) {
        finishDrawing();
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    // Disable canvas selection
    canvas.selection = false;
    canvas.skipTargetFind = true;

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.selection = true;
      canvas.skipTargetFind = false;
    };
  }, [canvas, active, anchorPoints]);

  const updatePreviewPath = useCallback((currentPointer?: Point) => {
    if (!canvas || anchorPoints.length === 0) return;

    // Remove old preview
    if (previewPath) {
      canvas.remove(previewPath);
    }

    // Build path string
    const points = [...anchorPoints];
    if (currentPointer) {
      points.push({ id: 'temp', x: currentPointer.x, y: currentPointer.y });
    }

    if (points.length < 2) return;

    // Create smooth curve path using quadratic bezier
    let pathStr = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      if (i === 1) {
        pathStr += ` L ${curr.x} ${curr.y}`;
      } else {
        // Use previous point as control point for smooth curve
        const prevPrev = points[i - 2];
        const cpX = prev.x;
        const cpY = prev.y;
        pathStr += ` Q ${cpX} ${cpY} ${curr.x} ${curr.y}`;
      }
    }

    const path = new Path(pathStr, {
      fill: '',
      stroke: '#3b82f6',
      strokeWidth: 3,
      strokeDashArray: [8, 4],
      selectable: false,
      evented: false,
      opacity: 0.8,
    });
    (path as any).isTemp = true;

    canvas.add(path);
    setPreviewPath(path);
    canvas.renderAll();
  }, [canvas, anchorPoints, previewPath]);

  const finishDrawing = () => {
    if (anchorPoints.length < 2) {
      toast.error("Add at least 2 points to create a membrane");
      return;
    }

    // Convert anchor points to path points
    const points = smoothPath(anchorPoints);
    setPathPoints(points);

    // Show config dialog
    setShowConfigDialog(true);
    setIsDrawing(false);
  };

  const cancelDrawing = () => {
    cleanup();
    setAnchorPoints([]);
    setIsDrawing(false);
    onCancel();
  };

  const cleanup = () => {
    if (!canvas) return;

    // Remove preview path
    if (previewPath) {
      canvas.remove(previewPath);
      setPreviewPath(null);
    }

    // Remove anchor circles
    anchorCirclesRef.current.forEach(circle => {
      canvas.remove(circle);
    });
    anchorCirclesRef.current.clear();

    // Remove any temp objects
    canvas.getObjects().forEach(obj => {
      if ((obj as any).isTemp) {
        canvas.remove(obj);
      }
    });

    canvas.renderAll();
  };

  const smoothPath = (points: AnchorPoint[]): Point[] => {
    if (points.length < 3) return points;

    const smoothed: Point[] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];

      // Add interpolated points using Catmull-Rom spline
      const numSegments = 5;
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

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("icon_categories")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setIsSearching(true);
      const searchTerms = query.trim().split(/\s+/).join(' & ');

      const { data, error } = await supabase
        .from('icons')
        .select('id, name, category, svg_content, thumbnail')
        .textSearch('search_vector', searchTerms, {
          type: 'websearch',
          config: 'english'
        })
        .limit(100);

      if (error) throw error;
      setSearchResults(data || []);
      setSearchPage(0);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getPaginatedSearchResults = () => {
    const startIdx = searchPage * ICONS_PER_PAGE;
    return searchResults.slice(startIdx, startIdx + ICONS_PER_PAGE);
  };

  const getTotalSearchPages = () => Math.ceil(searchResults.length / ICONS_PER_PAGE);

  const handleGenerateMembrane = async () => {
    if (!canvas || !selectedIcon || pathPoints.length < 2) {
      toast.error("Please select an icon first");
      return;
    }

    cleanup();

    try {
      const icons = await placeIconsAlongPath();
      if (icons.length === 0) {
        toast.error("Failed to generate membrane");
        return;
      }

      const membrane = new Group(icons, {
        selectable: true,
        evented: true,
      });

      (membrane as any).isMembrane = true;
      (membrane as any).membraneOptions = {
        iconSVG: selectedIcon.svg_content,
        iconSize,
        spacing,
        rotateToPath,
        doubleSided: bilayerMode,
        orientationOffset,
        bilayerGap,
      };
      (membrane as any).membranePathPoints = pathPoints;

      canvas.add(membrane);
      canvas.setActiveObject(membrane);
      canvas.renderAll();

      toast.success("Membrane created successfully");

      // Reset state
      setShowConfigDialog(false);
      setAnchorPoints([]);
      setPathPoints([]);
      setSelectedIcon(null);
      onComplete();
    } catch (error) {
      console.error("Error generating membrane:", error);
      toast.error("Failed to generate membrane");
    }
  };

  const calculatePathLength = (points: Point[]): number => {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  };

  const getPointAtDistance = (points: Point[], distance: number): { point: Point; angle: number } | null => {
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

  const placeIconsAlongPath = async (): Promise<FabricObject[]> => {
    if (!selectedIcon) return [];

    const pathLength = calculatePathLength(pathPoints);
    const icons: FabricObject[] = [];

    return new Promise((resolve) => {
      loadSVGFromString(selectedIcon.svg_content).then(({ objects }) => {
        if (!objects || objects.length === 0) {
          resolve([]);
          return;
        }

        const iconTemplate = new Group(objects);
        const iconWidth = iconTemplate.width || 1;
        const iconHeight = iconTemplate.height || 1;
        const scale = iconSize / Math.max(iconWidth, iconHeight);

        const scaledWidth = iconWidth * scale;
        const scaledHeight = iconHeight * scale;

        const baseAngle = rotateToPath ? 90 : 0;
        const totalRotation = baseAngle + orientationOffset;
        const normalizedAngle = ((totalRotation % 360) + 360) % 360;
        const isVerticalOrientation = (normalizedAngle >= 45 && normalizedAngle < 135) ||
                                       (normalizedAngle >= 225 && normalizedAngle < 315);

        const effectiveDimension = isVerticalOrientation ? scaledHeight : scaledWidth;
        // Allow negative spacing for overlap, but ensure minimum spacing of 20% icon size
        const effectiveSpacing = Math.max(effectiveDimension * 0.2, effectiveDimension + spacing);
        const numIcons = Math.max(2, Math.floor(pathLength / effectiveSpacing));

        let placedCount = 0;
        const expectedCount = bilayerMode ? numIcons * 2 : numIcons;

        for (let i = 0; i < numIcons; i++) {
          const distance = (i / (numIcons - 1)) * pathLength;
          const result = getPointAtDistance(pathPoints, distance);

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

            if (rotateToPath) {
              icon.set({ angle: result.angle + 90 + orientationOffset });
            } else {
              icon.set({ angle: orientationOffset });
            }

            icons.push(icon);
            placedCount++;

            // If bilayer mode, add mirrored icon
            if (bilayerMode) {
              iconTemplate.clone().then((mirroredIcon) => {
                const offset = iconSize * bilayerGap;
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
                  angle: rotateToPath ? result.angle - 90 + orientationOffset : orientationOffset + 180,
                });

                icons.push(mirroredIcon);
                placedCount++;

                if (placedCount >= expectedCount) {
                  resolve(icons);
                }
              });
            } else if (placedCount >= expectedCount) {
              resolve(icons);
            }
          });
        }
      }).catch(error => {
        console.error("Error loading SVG:", error);
        resolve([]);
      });
    });
  };

  const renderIconThumbnail = (icon: Icon) => {
    let thumbSrc = '';
    if (icon.thumbnail) {
      if (isUrl(icon.thumbnail)) {
        thumbSrc = icon.thumbnail;
      } else {
        thumbSrc = svgToDataUrl(sanitizeSvg(icon.thumbnail));
      }
    }

    return thumbSrc ? (
      <img src={thumbSrc} alt={icon.name} className="w-full h-full object-contain" />
    ) : icon.svg_content ? (
      <div dangerouslySetInnerHTML={{ __html: icon.svg_content }} className="w-full h-full" />
    ) : (
      <img src={noPreview} alt="No preview" className="w-full h-full object-contain opacity-50" />
    );
  };

  // Don't render anything if not active
  if (!active && !showConfigDialog) return null;

  return (
    <>
      {/* Drawing instructions overlay */}
      {active && !showConfigDialog && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-slate-900/95 backdrop-blur-xl text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
            <IconWaveSine size={24} className="text-blue-400" />
            <div>
              <p className="font-semibold">Drawing Membrane Path</p>
              <p className="text-sm text-slate-300">
                Click to add points ({anchorPoints.length} points) | Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs">Enter</kbd> to finish | <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs">Esc</kbd> to cancel
              </p>
            </div>
            {anchorPoints.length >= 2 && (
              <Button
                size="sm"
                onClick={finishDrawing}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Done
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={(open) => {
        if (!open) {
          cleanup();
          setAnchorPoints([]);
          onCancel();
        }
        setShowConfigDialog(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <IconWaveSine size={24} className="text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800">Configure Membrane</DialogTitle>
                <DialogDescription className="text-slate-500">
                  Choose an icon and configure the membrane appearance
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex">
            {/* Left side - Icon Selection */}
            <div className="w-1/2 border-r flex flex-col">
              <div className="p-4 border-b bg-slate-50/50">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search icons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-8 h-10 rounded-xl border-slate-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded transition-colors"
                    >
                      <IconX size={14} className="text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Suggested Icons */}
                  <div>
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
                      Suggested for Membranes
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {suggestedIcons.map((item) => (
                        <Button
                          key={item.search}
                          variant={searchQuery === item.search ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSearchQuery(item.search)}
                          className="rounded-full"
                        >
                          {item.name}
                          {item.default && (
                            <Badge variant="secondary" className="ml-1.5 text-[10px]">
                              Recommended
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Search Results */}
                  {searchQuery.trim() && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
                        {isSearching ? "Searching..." : `Results (${searchResults.length})`}
                      </Label>
                      {searchResults.length > 0 ? (
                        <>
                          <div className="grid grid-cols-4 gap-2">
                            {getPaginatedSearchResults().map((icon) => (
                              <button
                                key={icon.id}
                                onClick={() => setSelectedIcon(icon)}
                                className={`aspect-square p-2 rounded-xl border-2 transition-all hover:scale-105 ${
                                  selectedIcon?.id === icon.id
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/30 shadow-md'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                                title={icon.name}
                              >
                                {renderIconThumbnail(icon)}
                              </button>
                            ))}
                          </div>

                          {getTotalSearchPages() > 1 && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <span className="text-xs text-slate-500">
                                Page {searchPage + 1} of {getTotalSearchPages()}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={searchPage === 0}
                                  onClick={() => setSearchPage(searchPage - 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <IconChevronLeft size={16} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={searchPage >= getTotalSearchPages() - 1}
                                  onClick={() => setSearchPage(searchPage + 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <IconChevronRight size={16} />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : !isSearching && (
                        <div className="text-sm text-slate-500 p-4 text-center border rounded-xl bg-slate-50">
                          No icons found for "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right side - Options */}
            <div className="w-1/2 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Selected Icon Preview */}
                  {selectedIcon && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border">
                      <div className="w-16 h-16 rounded-xl bg-white border shadow-sm flex items-center justify-center p-2">
                        {renderIconThumbnail(selectedIcon)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{selectedIcon.name}</p>
                        <p className="text-sm text-slate-500">Selected icon</p>
                      </div>
                    </div>
                  )}

                  {/* Bilayer Toggle - PROMINENT */}
                  <div className="p-4 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/20">
                          <IconStack2 size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <Label className="font-semibold text-slate-800">Bilayer Mode</Label>
                          <p className="text-xs text-slate-500">Create phospholipid bilayer membrane</p>
                        </div>
                      </div>
                      <Switch
                        checked={bilayerMode}
                        onCheckedChange={setBilayerMode}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>

                    {bilayerMode && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-sm text-slate-600">Layer Gap</Label>
                          <span className="text-sm font-medium text-slate-700">{(bilayerGap * 100).toFixed(0)}%</span>
                        </div>
                        <Slider
                          value={[bilayerGap]}
                          onValueChange={(v) => setBilayerGap(v[0])}
                          min={0.3}
                          max={1.5}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* Size & Spacing */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <IconResize size={18} className="text-slate-500" />
                      <Label className="font-semibold text-slate-700">Size & Spacing</Label>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm text-slate-600">Icon Size</Label>
                        <span className="text-sm font-medium text-slate-700">{iconSize}px</span>
                      </div>
                      <Slider
                        value={[iconSize]}
                        onValueChange={(v) => setIconSize(v[0])}
                        min={20}
                        max={100}
                        step={5}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm text-slate-600">Spacing</Label>
                        <span className="text-sm font-medium text-slate-700">
                          {spacing}px {spacing === 0 && "(touching)"}{spacing < 0 && " (overlapping)"}
                        </span>
                      </div>
                      <Slider
                        value={[spacing]}
                        onValueChange={(v) => setSpacing(v[0])}
                        min={-30}
                        max={50}
                        step={5}
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Overlap</span>
                        <span>Gap</span>
                      </div>
                    </div>
                  </div>

                  {/* Rotation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <IconRotate size={18} className="text-slate-500" />
                      <Label className="font-semibold text-slate-700">Orientation</Label>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border">
                      <Label className="text-sm text-slate-600">Follow path direction</Label>
                      <Switch
                        checked={rotateToPath}
                        onCheckedChange={setRotateToPath}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm text-slate-600">Rotation Offset</Label>
                        <span className="text-sm font-medium text-slate-700">{orientationOffset}°</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[
                          { angle: 0, icon: IconArrowUp, label: "Up" },
                          { angle: 90, icon: IconArrowRight, label: "Right" },
                          { angle: 180, icon: IconArrowDown, label: "Down" },
                          { angle: 270, icon: IconArrowLeft, label: "Left" },
                        ].map(({ angle, icon: Icon, label }) => (
                          <Button
                            key={angle}
                            variant={orientationOffset === angle ? "default" : "outline"}
                            size="sm"
                            onClick={() => setOrientationOffset(angle)}
                            className="flex-col h-auto py-2"
                          >
                            <Icon size={16} />
                            <span className="text-[10px] mt-1">{label}</span>
                          </Button>
                        ))}
                      </div>

                      <Slider
                        value={[orientationOffset]}
                        onValueChange={(v) => setOrientationOffset(v[0])}
                        min={0}
                        max={360}
                        step={15}
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {selectedIcon && (
                    <div className="p-4 rounded-2xl bg-slate-50 border">
                      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
                        Preview
                      </Label>
                      <div className="flex items-center justify-center gap-2 p-4 bg-white rounded-xl border">
                        {/* Path indicator */}
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-1 bg-slate-300 rounded" />
                          <IconArrowRight size={16} className="text-slate-400" />
                        </div>

                        {/* Icon preview */}
                        <div
                          className="w-10 h-10"
                          style={{ transform: `rotate(${(rotateToPath ? 90 : 0) + orientationOffset}deg)` }}
                        >
                          {renderIconThumbnail(selectedIcon)}
                        </div>

                        {/* Second layer if bilayer */}
                        {bilayerMode && (
                          <div
                            className="w-10 h-10"
                            style={{ transform: `rotate(${(rotateToPath ? -90 : 180) + orientationOffset}deg)` }}
                          >
                            {renderIconThumbnail(selectedIcon)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  cleanup();
                  setShowConfigDialog(false);
                  setAnchorPoints([]);
                  onCancel();
                }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateMembrane}
                  disabled={!selectedIcon}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <IconWaveSine size={18} className="mr-2" />
                  Generate Membrane
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
