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
  } = useCanvas();

  return (
    <div className="flex items-center gap-1">
      {/* Font Selection */}
      <Select value={textFont} onValueChange={setTextFont}>
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
            onClick={() => setTextBold(!textBold)}
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
            onClick={() => setTextItalic(!textItalic)}
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
            onClick={() => setTextAlign("left")}
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
            onClick={() => setTextAlign("center")}
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
            onClick={() => setTextAlign("right")}
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
            onClick={() => setTextUnderline(!textUnderline)}
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
            onClick={() => setTextOverline(!textOverline)}
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
