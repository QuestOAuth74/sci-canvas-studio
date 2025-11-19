import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Omega } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { Textbox } from "fabric";

const SPECIAL_CHARACTERS = {
  greek: {
    label: "Greek",
    symbols: [
      "α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ",
      "ν", "ξ", "ο", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω",
      "Α", "Β", "Γ", "Δ", "Ε", "Ζ", "Η", "Θ", "Ι", "Κ", "Λ", "Μ",
      "Ν", "Ξ", "Ο", "Π", "Ρ", "Σ", "Τ", "Υ", "Φ", "Χ", "Ψ", "Ω"
    ]
  },
  math: {
    label: "Math",
    symbols: [
      "±", "∓", "×", "÷", "≠", "≈", "≡", "≤", "≥", "∞",
      "∫", "∑", "∏", "√", "∂", "∇", "∆", "∈", "∉", "⊂",
      "⊃", "∩", "∪", "∧", "∨", "¬", "⊕", "⊗", "∝", "∴"
    ]
  },
  arrows: {
    label: "Arrows",
    symbols: [
      "←", "→", "↑", "↓", "↔", "↕", "⇐", "⇒", "⇑", "⇓",
      "⇔", "⇕", "↖", "↗", "↘", "↙", "⟲", "⟳", "↺", "↻"
    ]
  },
  common: {
    label: "Common",
    symbols: [
      "°", "′", "″", "‰", "℃", "℉", "Å", "Ω", "µ", "Ø",
      "§", "¶", "†", "‡", "©", "®", "™", "‹", "›", "«",
      "»", "–", "—", "…", "·", "•", "◦", "▪", "▫", "★"
    ]
  }
};

export const SpecialCharactersPalette = () => {
  const { canvas, selectedObject } = useCanvas();

  const getTextObject = (obj: any): Textbox | null => {
    if (!obj) return null;

    // Direct text objects
    if (obj.type === "textbox" || obj.type === "text") {
      return obj as Textbox;
    }

    // Groups or active selections that contain text
    if (obj.type === "group" || obj.type === "activeSelection") {
      const textObj = obj
        .getObjects?.()
        ?.find(
          (o: any) => o.type === "textbox" || o.type === "text"
        );
      return (textObj as Textbox) || null;
    }

    return null;
  };

  const insertCharacter = (char: string) => {
    if (!canvas) return;

    // Prefer the context-selected object, but fall back to Fabric's active object
    const baseObj = selectedObject || canvas.getActiveObject();
    const textObj = getTextObject(baseObj);

    if (!textObj) {
      // No suitable text object found in the current selection/group
      return;
    }

    // Ensure we're in editing mode so selectionStart/End are valid
    if (!textObj.isEditing) {
      textObj.enterEditing();

      // If no explicit cursor, put it at the end of the existing text
      const len = textObj.text?.length ?? 0;
      textObj.selectionStart = len;
      textObj.selectionEnd = len;
    }

    const cursorPos =
      typeof textObj.selectionStart === "number"
        ? textObj.selectionStart
        : textObj.text?.length ?? 0;

    const currentText = textObj.text || "";
    const newText =
      currentText.substring(0, cursorPos) +
      char +
      currentText.substring(cursorPos);

    textObj.text = newText;

    const newCursorPos = cursorPos + char.length;
    textObj.selectionStart = newCursorPos;
    textObj.selectionEnd = newCursorPos;

    canvas.requestRenderAll?.() ?? canvas.renderAll();
  };

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Omega className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Special Characters (α, β, ±, etc.)</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80" align="start">
        <Tabs defaultValue="greek" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="greek" className="text-xs">Greek</TabsTrigger>
            <TabsTrigger value="math" className="text-xs">Math</TabsTrigger>
            <TabsTrigger value="arrows" className="text-xs">Arrows</TabsTrigger>
            <TabsTrigger value="common" className="text-xs">Common</TabsTrigger>
          </TabsList>
          
          {Object.entries(SPECIAL_CHARACTERS).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-2">
              <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
                {category.symbols.map((symbol) => (
                  <Button
                    key={symbol}
                    variant="outline"
                    className="h-8 w-8 p-0 text-base hover:bg-primary hover:text-primary-foreground"
                    onClick={() => insertCharacter(symbol)}
                    title={symbol}
                  >
                    {symbol}
                  </Button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
