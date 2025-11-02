import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export const KeyboardShortcutsDialog = ({ 
  open, 
  onOpenChange,
  trigger 
}: KeyboardShortcutsDialogProps) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      category: "Basic Actions",
      items: [
        { keys: [`${modKey}`, "Z"], description: "Undo last action" },
        { keys: [`${modKey}`, "Shift", "Z"], description: "Redo last action" },
        { keys: [`${modKey}`, "S"], description: "Save project" },
        { keys: [`${modKey}`, "K"], description: "Open Command Palette" },
        { keys: ["?"], description: "Show keyboard shortcuts" },
      ],
    },
    {
      category: "Clipboard",
      items: [
        { keys: [`${modKey}`, "C"], description: "Copy selected objects" },
        { keys: [`${modKey}`, "X"], description: "Cut selected objects" },
        { keys: [`${modKey}`, "V"], description: "Paste copied objects" },
        { keys: [`${modKey}`, "Shift", "V"], description: "Paste in place" },
        { keys: [`${modKey}`, "D"], description: "Duplicate selected" },
        { keys: [`${modKey}`, "="], description: "Duplicate below" },
        { keys: ["Alt", "Drag"], description: "Quick duplicate while moving" },
      ],
    },
    {
      category: "Selection",
      items: [
        { keys: [`${modKey}`, "A"], description: "Select all objects" },
        { keys: [`${modKey}`, "Shift", "A"], description: "Deselect all" },
        { keys: ["Tab"], description: "Cycle through objects" },
        { keys: ["Shift", "Tab"], description: "Cycle backwards" },
        { keys: ["Esc"], description: "Deselect" },
      ],
    },
    {
      category: "Arrange & Transform",
      items: [
        { keys: [`${modKey}`, "Shift", "]"], description: "Bring to front" },
        { keys: [`${modKey}`, "]"], description: "Bring forward" },
        { keys: [`${modKey}`, "["], description: "Send backward" },
        { keys: [`${modKey}`, "Shift", "["], description: "Send to back" },
        { keys: [`${modKey}`, "R"], description: "Rotate 90° clockwise" },
        { keys: [`${modKey}`, "Shift", "R"], description: "Rotate 90° counter-clockwise" },
        { keys: [`${modKey}`, "Shift", "L"], description: "Lock/Unlock selected" },
        { keys: [`${modKey}`, "L"], description: "Pin/Unpin object" },
        { keys: [`${modKey}`, "G"], description: "Group objects" },
        { keys: [`${modKey}`, "Shift", "G"], description: "Ungroup objects" },
      ],
    },
    {
      category: "Visibility",
      items: [
        { keys: ["H"], description: "Hide selected object" },
        { keys: [`${modKey}`, "H"], description: "Show all hidden objects" },
      ],
    },
    {
      category: "Movement & Nudge",
      items: [
        { keys: ["↑↓←→"], description: "Nudge object 1px" },
        { keys: ["Shift", "↑↓←→"], description: "Nudge object 10px" },
      ],
    },
    {
      category: "Tools (Number Keys)",
      items: [
        { keys: ["1"], description: "Select tool" },
        { keys: ["2"], description: "Text tool" },
        { keys: ["3"], description: "Rectangle tool" },
        { keys: ["4"], description: "Circle tool" },
        { keys: ["5"], description: "Straight line tool" },
        { keys: ["6"], description: "Arrow tool" },
        { keys: ["7"], description: "Pen tool" },
        { keys: ["8"], description: "Image tool" },
        { keys: ["9"], description: "Eraser tool" },
      ],
    },
    {
      category: "View & Zoom",
      items: [
        { keys: ["+"], description: "Zoom in" },
        { keys: ["-"], description: "Zoom out" },
        { keys: ["0"], description: "Fit canvas to screen" },
      ],
    },
    {
      category: "Editing",
      items: [
        { keys: ["Del"], description: "Delete selected objects" },
        { keys: ["Backspace"], description: "Delete selected objects" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[650px] max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Keyboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Master BioSketch with these keyboard shortcuts
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {shortcuts.map((section, sectionIndex) => (
              <div key={section.category}>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <div key={keyIndex} className="flex items-center gap-1">
                            <kbd className="px-2 py-1.5 bg-card border border-border rounded text-xs font-mono font-semibold shadow-sm min-w-[2rem] text-center">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground text-xs">+</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {sectionIndex < shortcuts.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
          <span>💡 Hover over any tool to see its shortcut</span>
          <span>Press <kbd className="px-1.5 py-0.5 bg-muted border rounded mx-1">?</kbd> to reopen</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
