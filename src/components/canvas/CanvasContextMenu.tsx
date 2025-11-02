import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { 
  Copy, 
  Scissors, 
  Clipboard, 
  Files, 
  Trash2, 
  Lock, 
  Unlock, 
  EyeOff, 
  Eye,
  ArrowUp, 
  ArrowDown, 
  ChevronsUp, 
  ChevronsDown,
  Group,
  Ungroup,
  Settings,
  MousePointerClick,
  Undo2,
  Redo2
} from "lucide-react";
import { FabricObject, ActiveSelection } from "fabric";

interface CanvasContextMenuProps {
  children: React.ReactNode;
  selectedObject: FabricObject | null;
  hasClipboard: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasHiddenObjects: boolean;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onLock: () => void;
  onHide: () => void;
  onBringToFront: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onSendToBack: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onSelectAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onShowAllHidden: () => void;
  onOpenProperties: () => void;
}

export const CanvasContextMenu = ({
  children,
  selectedObject,
  hasClipboard,
  canUndo,
  canRedo,
  hasHiddenObjects,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onLock,
  onHide,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onGroup,
  onUngroup,
  onSelectAll,
  onUndo,
  onRedo,
  onShowAllHidden,
  onOpenProperties,
}: CanvasContextMenuProps) => {
  const hasSelection = !!selectedObject;
  const isMultipleSelection = selectedObject instanceof ActiveSelection && selectedObject._objects && (selectedObject._objects?.length ?? 0) > 1;
  const isGroup = selectedObject?.type === 'group';
  const isLocked = selectedObject?.lockMovementX || selectedObject?.lockMovementY;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {hasSelection ? (
          // Menu when object is selected
          <>
            <ContextMenuItem onClick={onCopy}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy</span>
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onCut}>
              <Scissors className="mr-2 h-4 w-4" />
              <span>Cut</span>
              <ContextMenuShortcut>⌘X</ContextMenuShortcut>
            </ContextMenuItem>
            {hasClipboard && (
              <ContextMenuItem onClick={onPaste}>
                <Clipboard className="mr-2 h-4 w-4" />
                <span>Paste</span>
                <ContextMenuShortcut>⌘V</ContextMenuShortcut>
              </ContextMenuItem>
            )}
            <ContextMenuItem onClick={onDuplicate}>
              <Files className="mr-2 h-4 w-4" />
              <span>Duplicate</span>
              <ContextMenuShortcut>⌘D</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
              <ContextMenuShortcut>Del</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={onLock}>
              {isLocked ? (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  <span>Unlock</span>
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Lock</span>
                </>
              )}
              <ContextMenuShortcut>⌘⇧L</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onHide}>
              <EyeOff className="mr-2 h-4 w-4" />
              <span>Hide</span>
              <ContextMenuShortcut>H</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={onBringToFront}>
              <ChevronsUp className="mr-2 h-4 w-4" />
              <span>Bring to Front</span>
              <ContextMenuShortcut>⌘⇧]</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onBringForward}>
              <ArrowUp className="mr-2 h-4 w-4" />
              <span>Bring Forward</span>
              <ContextMenuShortcut>⌘]</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onSendBackward}>
              <ArrowDown className="mr-2 h-4 w-4" />
              <span>Send Backward</span>
              <ContextMenuShortcut>⌘[</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onSendToBack}>
              <ChevronsDown className="mr-2 h-4 w-4" />
              <span>Send to Back</span>
              <ContextMenuShortcut>⌘⇧[</ContextMenuShortcut>
            </ContextMenuItem>
            
            {(isMultipleSelection || isGroup) && (
              <>
                <ContextMenuSeparator />
                {isMultipleSelection && !isGroup && (
                  <ContextMenuItem onClick={onGroup}>
                    <Group className="mr-2 h-4 w-4" />
                    <span>Group</span>
                    <ContextMenuShortcut>⌘G</ContextMenuShortcut>
                  </ContextMenuItem>
                )}
                {isGroup && (
                  <ContextMenuItem onClick={onUngroup}>
                    <Ungroup className="mr-2 h-4 w-4" />
                    <span>Ungroup</span>
                    <ContextMenuShortcut>⌘⇧G</ContextMenuShortcut>
                  </ContextMenuItem>
                )}
              </>
            )}
            
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={onOpenProperties}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Properties</span>
            </ContextMenuItem>
          </>
        ) : (
          // Menu when canvas is empty (no selection)
          <>
            {hasClipboard && (
              <ContextMenuItem onClick={onPaste}>
                <Clipboard className="mr-2 h-4 w-4" />
                <span>Paste</span>
                <ContextMenuShortcut>⌘V</ContextMenuShortcut>
              </ContextMenuItem>
            )}
            <ContextMenuItem onClick={onSelectAll}>
              <MousePointerClick className="mr-2 h-4 w-4" />
              <span>Select All</span>
              <ContextMenuShortcut>⌘A</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            {canUndo && (
              <ContextMenuItem onClick={onUndo}>
                <Undo2 className="mr-2 h-4 w-4" />
                <span>Undo</span>
                <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
              </ContextMenuItem>
            )}
            {canRedo && (
              <ContextMenuItem onClick={onRedo}>
                <Redo2 className="mr-2 h-4 w-4" />
                <span>Redo</span>
                <ContextMenuShortcut>⌘⇧Z</ContextMenuShortcut>
              </ContextMenuItem>
            )}
            
            {hasHiddenObjects && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={onShowAllHidden}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Show All Hidden Objects</span>
                  <ContextMenuShortcut>⌘H</ContextMenuShortcut>
                </ContextMenuItem>
              </>
            )}
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
