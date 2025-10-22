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
  Subscript,
  Superscript,
  WrapText,
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

  const getTextScript = () => {
    if (selectedObject && selectedObject.type === 'textbox') {
      const textbox = selectedObject as any;
      
      // Check if in editing mode with selection
      if (textbox.isEditing && textbox.selectionStart !== undefined && textbox.selectionStart !== textbox.selectionEnd) {
        const styles = textbox.getSelectionStyles(textbox.selectionStart, textbox.selectionEnd);
        
        // Check if all selected characters have subscript
        const allSub = styles.every((style: any) => style.deltaY > 0);
        if (allSub) return 'sub';
        
        // Check if all selected characters have superscript
        const allSuper = styles.every((style: any) => style.deltaY < 0);
        if (allSuper) return 'super';
      }
    }
    return 'normal';
  };

  const textScript = getTextScript();

  // Update toolbar to reflect selected text object's properties
  useEffect(() => {
    if (selectedObject && selectedObject.type === 'textbox') {
      const textObj = selectedObject as Textbox;
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
    if (canvas && selectedObject && selectedObject.type === 'textbox') {
      selectedObject.set({ fontFamily: font });
      canvas.renderAll();
    }
  };

  const handleBoldChange = () => {
    const newBold = !textBold;
    setTextBold(newBold);
    // Update selected text object if exists
    if (canvas && selectedObject && selectedObject.type === 'textbox') {
      selectedObject.set({ fontWeight: newBold ? 'bold' : 'normal' });
      canvas.renderAll();
    }
  };

  const handleItalicChange = () => {
    const newItalic = !textItalic;
    setTextItalic(newItalic);
    // Update selected text object if exists
    if (canvas && selectedObject && selectedObject.type === 'textbox') {
      selectedObject.set({ fontStyle: newItalic ? 'italic' : 'normal' });
      canvas.renderAll();
    }
  };

  const handleAlignChange = (align: string) => {
    setTextAlign(align);
    // Update selected text object if exists
    if (canvas && selectedObject && selectedObject.type === 'textbox') {
      selectedObject.set({ textAlign: align as any });
      canvas.renderAll();
    }
  };

  const handleUnderlineChange = () => {
    const newUnderline = !textUnderline;
    setTextUnderline(newUnderline);
    // Update selected text object if exists
    if (canvas && selectedObject && selectedObject.type === 'textbox') {
      selectedObject.set({ underline: newUnderline });
      canvas.renderAll();
    }
  };

  const handleOverlineChange = () => {
    const newOverline = !textOverline;
    setTextOverline(newOverline);
    // Update selected text object if exists
    if (canvas && selectedObject && selectedObject.type === 'textbox') {
      selectedObject.set({ overline: newOverline });
      canvas.renderAll();
    }
  };

  const handleSubscriptChange = () => {
    if (canvas && selectedObject && selectedObject.type === 'textbox') {
      const textbox = selectedObject as any;
      
      // Check if textbox is in editing mode with selection
      if (textbox.isEditing && textbox.selectionStart !== textbox.selectionEnd) {
        // User has text selected in editing mode
        const start = textbox.selectionStart;
        const end = textbox.selectionEnd;
        
        const currentStyles = textbox.getSelectionStyles(start, end);
        const hasSubscript = currentStyles.some((style: any) => style.deltaY > 0);
        
        if (hasSubscript) {
          textbox.setSelectionStyles({
            deltaY: 0,
            fontSize: undefined,
          }, start, end);
          toast.success("Subscript removed");
        } else {
          const baseFontSize = textbox.fontSize || 20;
          textbox.setSelectionStyles({
            deltaY: baseFontSize * 0.3,
            fontSize: baseFontSize * 0.6,
          }, start, end);
          toast.success("Subscript applied");
        }
        
        canvas.renderAll();
      } else if (!textbox.isEditing) {
        // Textbox is selected but not in editing mode
        textbox.enterEditing();
        textbox.selectAll();
        
        const baseFontSize = textbox.fontSize || 20;
        textbox.setSelectionStyles({
          deltaY: baseFontSize * 0.3,
          fontSize: baseFontSize * 0.6,
        }, 0, textbox.text.length);
        
        textbox.exitEditing();
        canvas.renderAll();
        toast.success("Subscript applied to all text");
      } else {
        toast.info("Select text first to apply subscript");
      }
    }
  };

  const handleSuperscriptChange = () => {
    if (canvas && selectedObject && selectedObject.type === 'textbox') {
      const textbox = selectedObject as any;
      
      // Check if textbox is in editing mode with selection
      if (textbox.isEditing && textbox.selectionStart !== textbox.selectionEnd) {
        // User has text selected in editing mode
        const start = textbox.selectionStart;
        const end = textbox.selectionEnd;
        
        const currentStyles = textbox.getSelectionStyles(start, end);
        const hasSuperscript = currentStyles.some((style: any) => style.deltaY < 0);
        
        if (hasSuperscript) {
          textbox.setSelectionStyles({
            deltaY: 0,
            fontSize: undefined,
          }, start, end);
          toast.success("Superscript removed");
        } else {
          const baseFontSize = textbox.fontSize || 20;
          textbox.setSelectionStyles({
            deltaY: -baseFontSize * 0.3,
            fontSize: baseFontSize * 0.6,
          }, start, end);
          toast.success("Superscript applied");
        }
        
        canvas.renderAll();
      } else if (!textbox.isEditing) {
        // Textbox is selected but not in editing mode
        textbox.enterEditing();
        textbox.selectAll();
        
        const baseFontSize = textbox.fontSize || 20;
        textbox.setSelectionStyles({
          deltaY: -baseFontSize * 0.3,
          fontSize: baseFontSize * 0.6,
        }, 0, textbox.text.length);
        
        textbox.exitEditing();
        canvas.renderAll();
        toast.success("Superscript applied to all text");
      } else {
        toast.info("Select text first to apply superscript");
      }
    }
  };

  const handleAutoResizeToggle = () => {
    if (canvas && selectedObject && selectedObject.type === 'textbox') {
      const textbox = selectedObject as Textbox;
      const isAutoResize = textbox.width === undefined || (textbox as any).dynamicMinWidth;
      
      if (isAutoResize) {
        // Disable auto-resize, set fixed width
        textbox.set({ 
          width: textbox.getScaledWidth(),
          splitByGrapheme: false 
        });
        toast.success("Fixed width enabled");
      } else {
        // Enable auto-resize
        (textbox as any).dynamicMinWidth = true;
        textbox.set({ 
          width: undefined,
          splitByGrapheme: true 
        });
        toast.success("Auto-resize enabled");
      }
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

      <div className="w-px h-6 bg-border mx-1" />

      {/* Subscript/Superscript */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={textScript === 'sub' ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={handleSubscriptChange}
            disabled={!selectedObject || selectedObject.type !== 'textbox'}
          >
            <Subscript className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Subscript (H₂O)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={textScript === 'super' ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={handleSuperscriptChange}
            disabled={!selectedObject || selectedObject.type !== 'textbox'}
          >
            <Superscript className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Superscript (E=mc²)</TooltipContent>
      </Tooltip>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Auto-resize */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleAutoResizeToggle}
            disabled={!selectedObject || selectedObject.type !== 'textbox'}
          >
            <WrapText className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle Auto-resize</TooltipContent>
      </Tooltip>
    </div>
  );
};
