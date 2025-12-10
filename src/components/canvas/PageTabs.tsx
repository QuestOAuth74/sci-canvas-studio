import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Plus,
  X,
  Copy,
  PencilSimple,
  TrashSimple,
  Check,
} from '@phosphor-icons/react';
import { ProjectPage } from '@/hooks/useProjectPages';
import { cn } from '@/lib/utils';

interface PageTabsProps {
  pages: ProjectPage[];
  currentPageIndex: number;
  onSwitchPage: (index: number) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
  onRenamePage: (pageId: string, newName: string) => void;
  onDuplicatePage: (pageId: string) => void;
}

export const PageTabs = ({
  pages,
  currentPageIndex,
  onSwitchPage,
  onAddPage,
  onDeletePage,
  onRenamePage,
  onDuplicatePage,
}: PageTabsProps) => {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = (page: ProjectPage) => {
    setEditingPageId(page.id);
    setEditingName(page.page_name);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const saveRename = () => {
    if (editingPageId && editingName.trim()) {
      onRenamePage(editingPageId, editingName.trim());
    }
    setEditingPageId(null);
    setEditingName('');
  };

  const cancelRename = () => {
    setEditingPageId(null);
    setEditingName('');
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto max-w-md scrollbar-thin scrollbar-thumb-border">
      {pages.map((page, index) => (
        <ContextMenu key={page.id}>
          <ContextMenuTrigger asChild>
            <Button
              variant={index === currentPageIndex ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 px-3 text-xs font-medium transition-all duration-200 shrink-0',
                index === currentPageIndex 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'hover:bg-muted/70'
              )}
              onClick={() => onSwitchPage(index)}
            >
              {editingPageId === page.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    ref={inputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={saveRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    className="h-5 w-20 text-xs px-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Check 
                    size={12} 
                    className="cursor-pointer text-green-600" 
                    onClick={(e) => {
                      e.stopPropagation();
                      saveRename();
                    }}
                  />
                </div>
              ) : (
                <span className="truncate max-w-[80px]">{page.page_name}</span>
              )}
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-40">
            <ContextMenuItem 
              onClick={() => startRename(page)}
              className="text-xs"
            >
              <PencilSimple size={14} className="mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={() => onDuplicatePage(page.id)}
              className="text-xs"
            >
              <Copy size={14} className="mr-2" />
              Duplicate
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onDeletePage(page.id)}
              className="text-xs text-destructive focus:text-destructive"
              disabled={pages.length <= 1}
            >
              <TrashSimple size={14} className="mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))}
      
      {/* Add Page Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 hover:bg-primary/10 hover:text-primary transition-all duration-200"
        onClick={onAddPage}
        title="Add new page"
      >
        <Plus size={16} weight="bold" />
      </Button>
    </div>
  );
};
