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
import { toast } from "sonner";
import { normalizeEditingTextFont } from "@/lib/fontLoader";

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
  const { canvas } = useCanvas();

  const findEditingTextObject = (canvas: any | null): Textbox | null => {
    if (!canvas) return null;

    // 1) Prefer the active object if it's a text in editing mode
    const active = canvas.getActiveObject() as any;
    if (
      active &&
      (active.type === "textbox" || active.type === "text") &&
      active.isEditing
    ) {
      return active as Textbox;
    }

    // 2) Fallback: scan all objects for a text that is currently editing
    const objects = canvas.getObjects() as any[];
    for (const obj of objects) {
      if (
        (obj.type === "textbox" || obj.type === "text") &&
        obj.isEditing
      ) {
        return obj as Textbox;
      }
    }

    return null;
  };

  const insertCharacter = (char: string) => {
    if (!canvas) return;

    const textObj = findEditingTextObject(canvas);

    if (!textObj) {
      // No text box is actively being edited — guide the user
      toast.error("Double-click a text label to edit, then click a symbol to insert it.", {
        duration: 2000,
      });
      return;
    }

    // Normalize font BEFORE inserting to ensure special characters render
    normalizeEditingTextFont(textObj);

    const currentText = textObj.text || "";
    const cursorPos =
      typeof textObj.selectionStart === "number"
        ? textObj.selectionStart
        : currentText.length;

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
          <p>Special Characters - Double-click a label to edit first</p>
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
