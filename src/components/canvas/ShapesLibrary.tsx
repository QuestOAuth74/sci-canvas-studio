import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { iconStorage } from "@/lib/iconStorage";
import { IconCategory, IconItem } from "@/types/icon";

interface ShapesLibraryProps {
  onShapeSelect: (shape: string) => void;
}

export const ShapesLibrary = ({ onShapeSelect }: ShapesLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(["arrows"]);
  const [categories, setCategories] = useState<IconCategory[]>([]);
  const [iconsByCategory, setIconsByCategory] = useState<Record<string, IconItem[]>>({});

  useEffect(() => {
    const cats = iconStorage.getCategories();
    setCategories(cats);
    const map: Record<string, IconItem[]> = {};
    cats.forEach((c) => {
      map[c.id] = iconStorage.getIconsByCategory(c.id);
    });
    setIconsByCategory(map);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const basicShapes = [
    { id: "rectangle", label: "Rectangle", svg: "M 0 0 L 40 0 L 40 30 L 0 30 Z" },
    { id: "rounded-rect", label: "Rounded", svg: "M 5 0 L 35 0 Q 40 0 40 5 L 40 25 Q 40 30 35 30 L 5 30 Q 0 30 0 25 L 0 5 Q 0 0 5 0 Z" },
    { id: "circle", label: "Circle", svg: "M 20 5 A 15 15 0 1 1 20 35 A 15 15 0 1 1 20 5" },
    { id: "ellipse", label: "Ellipse", svg: "M 20 8 A 18 12 0 1 1 20 32 A 18 12 0 1 1 20 8" },
    { id: "square", label: "Square", svg: "M 5 5 L 35 5 L 35 35 L 5 35 Z" },
    { id: "rhombus", label: "Rhombus", svg: "M 20 2 L 38 20 L 20 38 L 2 20 Z" },
    { id: "parallelogram", label: "Parallelogram", svg: "M 8 5 L 38 5 L 32 35 L 2 35 Z" },
    { id: "trapezoid", label: "Trapezoid", svg: "M 10 5 L 30 5 L 38 35 L 2 35 Z" },
  ];

  const advancedShapes = [
    { id: "pentagon", label: "Pentagon", svg: "M 20 2 L 38 15 L 32 38 L 8 38 L 2 15 Z" },
    { id: "hexagon", label: "Hexagon", svg: "M 20 2 L 35 10 L 35 30 L 20 38 L 5 30 L 5 10 Z" },
    { id: "octagon", label: "Octagon", svg: "M 12 2 L 28 2 L 38 12 L 38 28 L 28 38 L 12 38 L 2 28 L 2 12 Z" },
    { id: "star", label: "Star", svg: "M 20 2 L 24 14 L 38 14 L 27 23 L 32 38 L 20 28 L 8 38 L 13 23 L 2 14 L 16 14 Z" },
    { id: "triangle", label: "Triangle", svg: "M 20 5 L 35 35 L 5 35 Z" },
    { id: "right-triangle", label: "Right Triangle", svg: "M 5 5 L 35 35 L 5 35 Z" },
    { id: "cylinder", label: "Cylinder", svg: "M 5 10 Q 5 5 20 5 Q 35 5 35 10 L 35 30 Q 35 35 20 35 Q 5 35 5 30 Z M 5 10 Q 5 15 20 15 Q 35 15 35 10" },
    { id: "cube", label: "Cube", svg: "M 8 15 L 20 8 L 32 15 L 32 28 L 20 35 L 8 28 Z M 8 15 L 20 22 M 32 15 L 20 22 L 20 35" },
  ];

  const arrowShapes = [
    { id: "arrow-right", label: "Arrow Right", svg: "M 2 18 L 28 18 L 28 12 L 38 20 L 28 28 L 28 22 L 2 22 Z" },
    { id: "arrow-left", label: "Arrow Left", svg: "M 38 18 L 12 18 L 12 12 L 2 20 L 12 28 L 12 22 L 38 22 Z" },
    { id: "arrow-up", label: "Arrow Up", svg: "M 18 38 L 18 12 L 12 12 L 20 2 L 28 12 L 22 12 L 22 38 Z" },
    { id: "arrow-down", label: "Arrow Down", svg: "M 18 2 L 18 28 L 12 28 L 20 38 L 28 28 L 22 28 L 22 2 Z" },
    { id: "arrow-double-h", label: "Double H", svg: "M 2 20 L 12 12 L 12 16 L 28 16 L 28 12 L 38 20 L 28 28 L 28 24 L 12 24 L 12 28 Z" },
    { id: "arrow-double-v", label: "Double V", svg: "M 20 2 L 28 12 L 24 12 L 24 28 L 28 28 L 20 38 L 12 28 L 16 28 L 16 12 L 12 12 Z" },
    { id: "arrow-bent-right", label: "Bent Right", svg: "M 5 15 L 15 15 L 15 5 L 25 5 L 25 25 L 35 25 L 30 30 L 25 35 L 25 30 L 20 30 L 20 10 L 10 10 L 10 15 Z" },
    { id: "arrow-bent-left", label: "Bent Left", svg: "M 35 15 L 25 15 L 25 5 L 15 5 L 15 25 L 5 25 L 10 30 L 15 35 L 15 30 L 20 30 L 20 10 L 30 10 L 30 15 Z" },
    { id: "arrow-thick", label: "Thick Arrow", svg: "M 2 15 L 22 15 L 22 8 L 38 20 L 22 32 L 22 25 L 2 25 Z" },
    { id: "arrow-dashed", label: "Dashed", svg: "M 5 20 L 10 20 M 12 20 L 17 20 M 19 20 L 24 20 M 26 20 L 30 20 L 30 15 L 38 20 L 30 25 L 30 20" },
  ];

  const flowchartShapes = [
    { id: "process", label: "Process", svg: "M 5 10 L 35 10 L 35 30 L 5 30 Z" },
    { id: "decision", label: "Decision", svg: "M 20 5 L 35 20 L 20 35 L 5 20 Z" },
    { id: "data", label: "Data", svg: "M 8 10 L 35 10 L 32 30 L 5 30 Z" },
    { id: "terminator", label: "Terminator", svg: "M 10 15 Q 10 10 15 10 L 25 10 Q 30 10 30 15 L 30 25 Q 30 30 25 30 L 15 30 Q 10 30 10 25 Z" },
    { id: "document", label: "Document", svg: "M 8 2 L 28 2 L 32 6 L 32 38 L 8 38 Z M 28 2 L 28 6 L 32 6" },
    { id: "multidoc", label: "Multi-Document", svg: "M 10 5 L 30 5 L 30 30 L 10 30 Z M 12 8 L 32 8 L 32 33 M 14 11 L 34 11 L 34 36" },
    { id: "database", label: "Database", svg: "M 8 8 Q 8 5 20 5 Q 32 5 32 8 L 32 32 Q 32 35 20 35 Q 8 35 8 32 Z M 8 8 Q 8 11 20 11 Q 32 11 32 8" },
    { id: "manual-input", label: "Manual Input", svg: "M 5 15 L 35 5 L 35 30 L 5 30 Z" },
  ];

  const miscShapes = [
    { id: "callout", label: "Callout", svg: "M 5 5 L 35 5 L 35 25 L 22 25 L 20 35 L 18 25 L 5 25 Z" },
    { id: "cloud", label: "Cloud", svg: "M 12 15 Q 8 15 8 18 Q 8 21 12 21 L 28 21 Q 32 21 32 18 Q 32 15 28 15 Q 28 12 25 12 Q 22 12 22 15 L 18 15 Q 18 12 15 12 Q 12 12 12 15 Z" },
    { id: "heart", label: "Heart", svg: "M 20 30 Q 10 20 10 14 Q 10 8 15 8 Q 18 8 20 12 Q 22 8 25 8 Q 30 8 30 14 Q 30 20 20 30 Z" },
    { id: "cross", label: "Cross", svg: "M 15 5 L 25 5 L 25 15 L 35 15 L 35 25 L 25 25 L 25 35 L 15 35 L 15 25 L 5 25 L 5 15 L 15 15 Z" },
  ];

  const renderShapeGrid = (shapes: typeof basicShapes) => (
    <div className="grid grid-cols-4 gap-1 p-2">
      {shapes.map(shape => (
        <button
          key={shape.id}
          onClick={() => onShapeSelect(shape.id)}
          className="aspect-square border border-border hover:border-primary hover:bg-accent rounded p-1 transition-colors"
          title={shape.label}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <path d={shape.svg} fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-56 border-r bg-card/50 flex flex-col">
      {/* Search Bar */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Type / to search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Arrows */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("arrows")}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent text-sm font-medium"
            >
              <span>Arrows</span>
              {expandedSections.includes("arrows") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections.includes("arrows") && renderShapeGrid(arrowShapes)}
          </div>

          {/* Flowchart */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("flowchart")}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent text-sm font-medium"
            >
              <span>Flowchart</span>
              {expandedSections.includes("flowchart") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections.includes("flowchart") && renderShapeGrid(flowchartShapes)}
          </div>

          {/* Bioicons (Dynamic) */}
          {categories
            .filter((c) => (iconsByCategory[c.id]?.length || 0) > 0)
            .map((c) => {
              const sectionId = `bio:${c.id}`;
              return (
                <div key={c.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(sectionId)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent text-sm font-medium"
                  >
                    <span>{c.name}</span>
                    {expandedSections.includes(sectionId) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedSections.includes(sectionId) && (
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {(iconsByCategory[c.id] || []).map((icon) => (
                        <button
                          key={icon.id}
                          onClick={() =>
                            window.dispatchEvent(
                              new CustomEvent("addIconToCanvas", { detail: { svgData: icon.svgData } })
                            )
                          }
                          className="aspect-square border border-border hover:border-primary hover:bg-accent rounded p-1 transition-colors"
                          title={icon.name}
                        >
                          <img src={icon.thumbnail} alt={icon.name} className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Basic Shapes */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("basic")}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent text-sm font-medium"
            >
              <span>Basic</span>
              {expandedSections.includes("basic") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections.includes("basic") && renderShapeGrid(basicShapes)}
          </div>

          {/* Advanced Shapes */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("advanced")}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent text-sm font-medium"
            >
              <span>Advanced</span>
              {expandedSections.includes("advanced") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections.includes("advanced") && renderShapeGrid(advancedShapes)}
          </div>

          {/* Misc Shapes */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("misc")}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent text-sm font-medium"
            >
              <span>Misc</span>
              {expandedSections.includes("misc") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections.includes("misc") && renderShapeGrid(miscShapes)}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
