import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PencilSimple,
  Copy,
  Trash,
  ArrowUp,
  ArrowDown,
  X,
  Check,
} from "@phosphor-icons/react";

interface PageContextMenuProps {
  pageId: string;
  pageIndex: number;
  totalPages: number;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: (pageId: string, newName: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const PageContextMenu = ({
  pageId,
  pageIndex,
  totalPages,
  position,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: PageContextMenuProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isRenaming) {
          setIsRenaming(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, isRenaming]);

  // Focus input when renaming
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 200),
    y: Math.min(position.y, window.innerHeight - 250),
  };

  const handleRenameSubmit = () => {
    if (newName.trim()) {
      onRename(pageId, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsRenaming(false);
    }
  };

  const canMoveUp = pageIndex > 0;
  const canMoveDown = pageIndex < totalPages - 1;
  const canDelete = totalPages > 1;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[180px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {isRenaming ? (
        <div className="px-2 py-1">
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              placeholder="Page name"
              className="h-7 text-xs"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleRenameSubmit}
            >
              <Check size={14} weight="bold" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-500 hover:text-slate-700"
              onClick={() => setIsRenaming(false)}
            >
              <X size={14} weight="bold" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <button
            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            onClick={() => {
              setNewName(`Page ${pageIndex + 1}`);
              setIsRenaming(true);
            }}
          >
            <PencilSimple size={14} />
            Rename Page
          </button>

          <button
            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
            onClick={onDuplicate}
          >
            <Copy size={14} />
            Duplicate Page
          </button>

          <div className="h-px bg-slate-200 my-1" />

          <button
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
              canMoveUp
                ? "text-slate-700 hover:bg-slate-100"
                : "text-slate-300 cursor-not-allowed"
            }`}
            onClick={canMoveUp ? onMoveUp : undefined}
            disabled={!canMoveUp}
          >
            <ArrowUp size={14} />
            Move Up
          </button>

          <button
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
              canMoveDown
                ? "text-slate-700 hover:bg-slate-100"
                : "text-slate-300 cursor-not-allowed"
            }`}
            onClick={canMoveDown ? onMoveDown : undefined}
            disabled={!canMoveDown}
          >
            <ArrowDown size={14} />
            Move Down
          </button>

          <div className="h-px bg-slate-200 my-1" />

          <button
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
              canDelete
                ? "text-red-600 hover:bg-red-50"
                : "text-slate-300 cursor-not-allowed"
            }`}
            onClick={canDelete ? onDelete : undefined}
            disabled={!canDelete}
          >
            <Trash size={14} />
            Delete Page
          </button>
        </>
      )}
    </div>
  );
};
