import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

  const insertCharacter = (char: string) => {
    if (!canvas || !selectedObject) return;

    const textObj = selectedObject as Textbox;
    if (textObj.type !== "textbox" && textObj.type !== "text") return;

    // Enter editing mode if not already editing
    if (!textObj.isEditing) {
      textObj.enterEditing();
    }

    // Get cursor position
    const cursorPos = textObj.selectionStart || 0;
    
    // Insert character at cursor position
    const currentText = textObj.text || "";
    const newText = 
      currentText.substring(0, cursorPos) + 
      char + 
      currentText.substring(cursorPos);
    
    textObj.text = newText;
    
    // Move cursor after inserted character
    textObj.selectionStart = cursorPos + 1;
    textObj.selectionEnd = cursorPos + 1;
    
    canvas.renderAll();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <Omega className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
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
