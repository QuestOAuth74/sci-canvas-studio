import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useCanvas } from "@/contexts/CanvasContext";
import { 
  Undo2, Redo2, Scissors, Copy, Clipboard, Trash2, Layers, 
  ZoomIn, ZoomOut, Maximize, Grid3x3, Ruler, 
  AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  ArrowUp, ArrowDown, MoveUp, MoveDown, Group, Ungroup,
  MousePointer, Type, Image, Square, Circle, Minus, Move, Eraser,
  FileImage, FileDown
} from "lucide-react";
import { toast } from "sonner";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToolChange?: (tool: string) => void;
}

export const CommandPalette = ({ open, onOpenChange, onToolChange }: CommandPaletteProps) => {
  const [search, setSearch] = useState("");
  const {
    undo, redo, cut, copy, paste, deleteSelected, selectAll,
    zoomIn, zoomOut, zoomToFit, resetZoom,
    alignLeft, alignCenter, alignRight, alignTop, alignMiddle, alignBottom,
    bringToFront, sendToBack, bringForward, sendBackward,
    groupSelected, ungroupSelected,
    setGridEnabled, setRulersEnabled,
    exportAsPNG, exportAsJPG, exportAsPNGTransparent,
  } = useCanvas();

  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  const executeCommand = (id: string, label: string) => {
    // Add to recent commands
    setRecentCommands(prev => {
      const filtered = prev.filter(cmd => cmd !== id);
      return [id, ...filtered].slice(0, 5);
    });

    // Execute the command
    switch (id) {
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'cut': cut(); break;
      case 'copy': copy(); break;
      case 'paste': paste(); break;
      case 'delete': deleteSelected(); break;
      case 'select-all': selectAll(); break;
      case 'zoom-in': zoomIn(); break;
      case 'zoom-out': zoomOut(); break;
      case 'zoom-fit': zoomToFit(); break;
      case 'zoom-reset': resetZoom(); break;
      case 'grid': 
        if (setGridEnabled) {
          const canvas = document.querySelector('canvas');
          const currentEnabled = canvas?.parentElement?.querySelector('[data-grid-enabled]')?.getAttribute('data-grid-enabled') === 'true';
          setGridEnabled(!currentEnabled);
        }
        break;
      case 'rulers': 
        if (setRulersEnabled) {
          const canvas = document.querySelector('canvas');
          const currentEnabled = canvas?.parentElement?.querySelector('[data-rulers-enabled]')?.getAttribute('data-rulers-enabled') === 'true';
          setRulersEnabled(!currentEnabled);
        }
        break;
      case 'align-left': alignLeft(); break;
      case 'align-center': alignCenter(); break;
      case 'align-right': alignRight(); break;
      case 'align-top': alignTop(); break;
      case 'align-middle': alignMiddle(); break;
      case 'align-bottom': alignBottom(); break;
      case 'bring-front': bringToFront(); break;
      case 'send-back': sendToBack(); break;
      case 'bring-forward': bringForward(); break;
      case 'send-backward': sendBackward(); break;
      case 'group': groupSelected(); break;
      case 'ungroup': ungroupSelected(); break;
      case 'tool-select': onToolChange?.('select'); break;
      case 'tool-text': onToolChange?.('text'); break;
      case 'tool-image': onToolChange?.('image'); break;
      case 'tool-rectangle': onToolChange?.('rectangle'); break;
      case 'tool-circle': onToolChange?.('circle'); break;
      case 'tool-line': onToolChange?.('straight-line'); break;
      case 'tool-pen': onToolChange?.('pen'); break;
      case 'tool-eraser': onToolChange?.('eraser'); break;
      case 'export-png': exportAsPNG(300); break;
      case 'export-jpg': exportAsJPG(300); break;
      case 'export-png-transparent': exportAsPNGTransparent(300); break;
    }
    
    toast.success(label);
    onOpenChange(false);
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const commands = [
    // Edit
    { id: 'undo', label: 'Undo', icon: Undo2, shortcut: 'Ctrl+Z', category: 'Edit' },
    { id: 'redo', label: 'Redo', icon: Redo2, shortcut: 'Ctrl+Shift+Z', category: 'Edit' },
    { id: 'cut', label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', category: 'Edit' },
    { id: 'copy', label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', category: 'Edit' },
    { id: 'paste', label: 'Paste', icon: Clipboard, shortcut: 'Ctrl+V', category: 'Edit' },
    { id: 'delete', label: 'Delete', icon: Trash2, shortcut: 'Del', category: 'Edit' },
    { id: 'select-all', label: 'Select All', icon: Layers, shortcut: 'Ctrl+A', category: 'Edit' },
    
    // View
    { id: 'zoom-in', label: 'Zoom In', icon: ZoomIn, shortcut: 'Ctrl++', category: 'View' },
    { id: 'zoom-out', label: 'Zoom Out', icon: ZoomOut, shortcut: 'Ctrl+-', category: 'View' },
    { id: 'zoom-fit', label: 'Zoom to Fit', icon: Maximize, shortcut: 'Ctrl+0', category: 'View' },
    { id: 'zoom-reset', label: 'Reset Zoom', icon: ZoomOut, category: 'View' },
    { id: 'grid', label: 'Toggle Grid', icon: Grid3x3, category: 'View' },
    { id: 'rulers', label: 'Toggle Rulers', icon: Ruler, category: 'View' },
    
    // Arrange
    { id: 'align-left', label: 'Align Left', icon: AlignLeft, category: 'Arrange' },
    { id: 'align-center', label: 'Align Center', icon: AlignCenter, category: 'Arrange' },
    { id: 'align-right', label: 'Align Right', icon: AlignRight, category: 'Arrange' },
    { id: 'align-top', label: 'Align Top', icon: AlignVerticalJustifyStart, category: 'Arrange' },
    { id: 'align-middle', label: 'Align Middle', icon: AlignVerticalJustifyCenter, category: 'Arrange' },
    { id: 'align-bottom', label: 'Align Bottom', icon: AlignVerticalJustifyEnd, category: 'Arrange' },
    { id: 'bring-front', label: 'Bring to Front', icon: ArrowUp, shortcut: 'Ctrl+Shift+]', category: 'Arrange' },
    { id: 'send-back', label: 'Send to Back', icon: ArrowDown, shortcut: 'Ctrl+Shift+[', category: 'Arrange' },
    { id: 'bring-forward', label: 'Bring Forward', icon: MoveUp, shortcut: 'Ctrl+]', category: 'Arrange' },
    { id: 'send-backward', label: 'Send Backward', icon: MoveDown, shortcut: 'Ctrl+[', category: 'Arrange' },
    
    // Group
    { id: 'group', label: 'Group Objects', icon: Group, shortcut: 'Ctrl+G', category: 'Group' },
    { id: 'ungroup', label: 'Ungroup Objects', icon: Ungroup, shortcut: 'Ctrl+Shift+G', category: 'Group' },
    
    // Tools
    { id: 'tool-select', label: 'Select Tool', icon: MousePointer, shortcut: '1', category: 'Tools' },
    { id: 'tool-text', label: 'Text Tool', icon: Type, shortcut: '2', category: 'Tools' },
    { id: 'tool-rectangle', label: 'Rectangle Tool', icon: Square, shortcut: '3', category: 'Tools' },
    { id: 'tool-circle', label: 'Circle Tool', icon: Circle, shortcut: '4', category: 'Tools' },
    { id: 'tool-line', label: 'Line Tool', icon: Minus, shortcut: '5', category: 'Tools' },
    { id: 'tool-pen', label: 'Pen Tool', icon: Move, shortcut: '7', category: 'Tools' },
    { id: 'tool-image', label: 'Image Tool', icon: Image, shortcut: '8', category: 'Tools' },
    { id: 'tool-eraser', label: 'Eraser Tool', icon: Eraser, shortcut: '9', category: 'Tools' },
    
    // Export
    { id: 'export-png', label: 'Export as PNG', icon: FileImage, category: 'Export' },
    { id: 'export-jpg', label: 'Export as JPG', icon: FileDown, category: 'Export' },
    { id: 'export-png-transparent', label: 'Export as PNG (Transparent)', icon: FileImage, category: 'Export' },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(filteredCommands.map(cmd => cmd.category)));
  const recentCommandsData = recentCommands
    .map(id => commands.find(cmd => cmd.id === id))
    .filter(Boolean) as typeof commands;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl">
        <Command className="rounded-lg border-none">
          <CommandInput 
            placeholder="Search commands..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No commands found.</CommandEmpty>
            
            {recentCommandsData.length > 0 && search === "" && (
              <>
                <CommandGroup heading="Recent">
                  {recentCommandsData.map(cmd => {
                    const Icon = cmd.icon;
                    return (
                      <CommandItem
                        key={cmd.id}
                        onSelect={() => executeCommand(cmd.id, cmd.label)}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{cmd.label}</span>
                        </div>
                        {cmd.shortcut && (
                          <kbd className="text-xs px-2 py-1 bg-muted rounded">{cmd.shortcut}</kbd>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            
            {categories.map(category => (
              <CommandGroup key={category} heading={category}>
                {filteredCommands
                  .filter(cmd => cmd.category === category)
                  .map(cmd => {
                    const Icon = cmd.icon;
                    return (
                      <CommandItem
                        key={cmd.id}
                        onSelect={() => executeCommand(cmd.id, cmd.label)}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{cmd.label}</span>
                        </div>
                        {cmd.shortcut && (
                          <kbd className="text-xs px-2 py-1 bg-muted rounded">{cmd.shortcut}</kbd>
                        )}
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
