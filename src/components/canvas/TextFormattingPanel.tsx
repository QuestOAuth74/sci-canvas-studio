import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Underline,
  Type,
  Bold,
  Italic,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCanvas } from "@/contexts/CanvasContext";
import { useEffect } from "react";
import { Textbox } from "fabric";
import { ensureFontLoaded } from "@/lib/fontLoader";
import { toast } from "sonner";

const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Ubuntu",
  "Playfair Display",
  "Merriweather",
  "Crimson Text",
  "Source Sans 3",
  "Oswald",
];

export const TextFormattingPanel = () => {
  const {
    textFont,
    setTextFont,
    textAlign,
    setTextAlign,
    textUnderline,
    setTextUnderline,
    textOverline,
    setTextOverline,
    textBold,
    setTextBold,
    textItalic,
    setTextItalic,
    canvas,
    selectedObject,
  } = useCanvas();

  // Helper function to get text object from selection
  const getTextObject = (obj: any): Textbox | null => {
    if (obj?.type === 'textbox') {
      return obj as Textbox;
    }
    // Check if it's a group containing text
    if (obj?.type === 'group') {
      const textObj = obj.getObjects().find((o: any) => o.type === 'textbox');
      return textObj as Textbox || null;
    }
    return null;
  };

  // Update toolbar to reflect selected text object's properties
  useEffect(() => {
    const textObj = getTextObject(selectedObject);
    if (textObj) {
      if (textObj.fontFamily) setTextFont(textObj.fontFamily);
      if (textObj.textAlign) setTextAlign(textObj.textAlign);
      setTextBold(textObj.fontWeight === 'bold');
      setTextItalic(textObj.fontStyle === 'italic');
      setTextUnderline(!!textObj.underline);
      setTextOverline(!!textObj.overline);
    }
  }, [selectedObject, setTextFont, setTextAlign, setTextBold, setTextItalic, setTextUnderline, setTextOverline]);

  const handleFontChange = async (font: string) => {
    // Ensure font is loaded before applying
    const loaded = await ensureFontLoaded(font);
    if (!loaded) {
      toast.error(`Font "${font}" failed to load`);
      return;
    }
    
    setTextFont(font);
    // Update selected text object if exists
    const textObj = getTextObject(selectedObject);
    if (canvas && textObj) {
      textObj.set({ fontFamily: font });
      canvas.renderAll();
    }
  };

  const handleBoldChange = () => {
    const newBold = !textBold;
    setTextBold(newBold);
    // Update selected text object if exists
    const textObj = getTextObject(selectedObject);
    if (canvas && textObj) {
      textObj.set({ fontWeight: newBold ? 'bold' : 'normal' });
      canvas.renderAll();
    }
  };

  const handleItalicChange = () => {
    const newItalic = !textItalic;
    setTextItalic(newItalic);
    // Update selected text object if exists
    const textObj = getTextObject(selectedObject);
    if (canvas && textObj) {
      textObj.set({ fontStyle: newItalic ? 'italic' : 'normal' });
      canvas.renderAll();
    }
  };

  const handleAlignChange = (align: string) => {
    setTextAlign(align);
    // Update selected text object if exists
    const textObj = getTextObject(selectedObject);
    if (canvas && textObj) {
      textObj.set({ textAlign: align as any });
      canvas.renderAll();
    }
  };

  const handleUnderlineChange = () => {
    const newUnderline = !textUnderline;
    setTextUnderline(newUnderline);
    // Update selected text object if exists
    const textObj = getTextObject(selectedObject);
    if (canvas && textObj) {
      textObj.set({ underline: newUnderline });
      canvas.renderAll();
    }
  };

  const handleOverlineChange = () => {
    const newOverline = !textOverline;
    setTextOverline(newOverline);
    // Update selected text object if exists
    const textObj = getTextObject(selectedObject);
    if (canvas && textObj) {
      textObj.set({ overline: newOverline });
      canvas.renderAll();
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Font Selection */}
      <Select value={textFont} onValueChange={handleFontChange}>
        <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
          <SelectValue placeholder="Select font" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {GOOGLE_FONTS.map((font) => (
            <SelectItem key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text Style */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={textBold ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={handleBoldChange}
          >
            <Bold className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bold</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={textItalic ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={handleItalicChange}
          >
            <Italic className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Italic</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text Alignment */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={textAlign === "left" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => handleAlignChange("left")}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Left</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={textAlign === "center" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => handleAlignChange("center")}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Center</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={textAlign === "right" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => handleAlignChange("right")}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Align Right</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text Decoration */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={textUnderline ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={handleUnderlineChange}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Underline</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={textOverline ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 relative"
            onClick={handleOverlineChange}
          >
            <Type className="h-4 w-4" />
            <div className="absolute top-1.5 left-2 right-2 h-px bg-current" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Overline</TooltipContent>
      </Tooltip>
    </div>
  );
};
