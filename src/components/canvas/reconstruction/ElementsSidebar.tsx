/**
 * Elements Sidebar for Reconstruction
 * Displays detected elements grouped by type with actions
 */

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, 
  Pencil, 
  Trash2, 
  Type, 
  Image, 
  ArrowRight, 
  Square,
  CheckCircle,
  Clock,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReconstruction } from './ReconstructionContext';
import { groupElementsByType } from '@/lib/figureDetection';
import { AnyDetectedElement, ElementStatus } from '@/types/figureReconstruction';

interface ElementRowProps {
  element: AnyDetectedElement;
  isSelected: boolean;
  onSelect: () => void;
  onAccept: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function getStatusIcon(status: ElementStatus) {
  switch (status) {
    case 'accepted':
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case 'editing':
      return <Edit3 className="h-3 w-3 text-yellow-500" />;
    default:
      return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
}

function getStatusBadge(status: ElementStatus) {
  const variants: Record<ElementStatus, string> = {
    pending: 'bg-muted text-muted-foreground',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    editing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', variants[status])}>
      {status}
    </Badge>
  );
}

function ElementRow({ element, isSelected, onSelect, onAccept, onEdit, onDelete }: ElementRowProps) {
  const getElementIcon = () => {
    switch (element.type) {
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'icon':
        return <Image className="h-4 w-4" />;
      case 'arrow':
        return <ArrowRight className="h-4 w-4" />;
      case 'box':
        return <Square className="h-4 w-4" />;
    }
  };

  const getElementSummary = () => {
    switch (element.type) {
      case 'text':
        return (element as any).content?.substring(0, 20) || 'Text';
      case 'icon':
        return (element as any).matchedIconName || (element as any).queryTerms?.[0] || 'Icon';
      case 'arrow':
        return `${(element as any).style} arrow`;
      case 'box':
        return (element as any).label || 'Box';
      default:
        return (element as any).label || 'Element';
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors',
        isSelected
          ? 'bg-primary/10 border-primary'
          : 'bg-background border-border hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {getStatusIcon(element.status)}
        <span className="text-muted-foreground">{getElementIcon()}</span>
        <span className="text-sm truncate flex-1">{getElementSummary()}</span>
        {element.confidence < 0.7 && (
          <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-300">
            {Math.round(element.confidence * 100)}%
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {element.status !== 'accepted' && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
          >
            <Check className="h-3 w-3 text-green-500" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

interface ElementsGroupProps {
  title: string;
  icon: React.ReactNode;
  elements: AnyDetectedElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onAcceptElement: (id: string) => void;
  onEditElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
}

function ElementsGroup({
  title,
  icon,
  elements,
  selectedElementId,
  onSelectElement,
  onAcceptElement,
  onEditElement,
  onDeleteElement,
}: ElementsGroupProps) {
  if (elements.length === 0) return null;

  const acceptedCount = elements.filter(e => e.status === 'accepted').length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          <span>{title}</span>
          <Badge variant="secondary" className="text-xs">
            {acceptedCount}/{elements.length}
          </Badge>
        </div>
      </div>
      <div className="space-y-1">
        {elements.map((element) => (
          <ElementRow
            key={element.id}
            element={element}
            isSelected={selectedElementId === element.id}
            onSelect={() => onSelectElement(element.id)}
            onAccept={() => onAcceptElement(element.id)}
            onEdit={() => onEditElement(element.id)}
            onDelete={() => onDeleteElement(element.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function ElementsSidebar() {
  const {
    elements,
    selectedElementId,
    selectElement,
    acceptElement,
    editElement,
    deleteElement,
  } = useReconstruction();

  const grouped = groupElementsByType(elements);
  const totalElements = elements.length;
  const acceptedElements = elements.filter(e => e.status === 'accepted').length;

  return (
    <div className="h-full flex flex-col bg-background border-r">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Detected Objects</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {acceptedElements} of {totalElements} accepted
        </p>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 grid grid-cols-5">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="text" className="text-xs">
            <Type className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="icons" className="text-xs">
            <Image className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="arrows" className="text-xs">
            <ArrowRight className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="boxes" className="text-xs">
            <Square className="h-3 w-3" />
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="all" className="space-y-4 mt-0">
            <ElementsGroup
              title="Text"
              icon={<Type className="h-4 w-4" />}
              elements={grouped.text}
              selectedElementId={selectedElementId}
              onSelectElement={selectElement}
              onAcceptElement={acceptElement}
              onEditElement={editElement}
              onDeleteElement={deleteElement}
            />
            <ElementsGroup
              title="Icons"
              icon={<Image className="h-4 w-4" />}
              elements={grouped.icons}
              selectedElementId={selectedElementId}
              onSelectElement={selectElement}
              onAcceptElement={acceptElement}
              onEditElement={editElement}
              onDeleteElement={deleteElement}
            />
            <ElementsGroup
              title="Arrows"
              icon={<ArrowRight className="h-4 w-4" />}
              elements={grouped.arrows}
              selectedElementId={selectedElementId}
              onSelectElement={selectElement}
              onAcceptElement={acceptElement}
              onEditElement={editElement}
              onDeleteElement={deleteElement}
            />
            <ElementsGroup
              title="Boxes"
              icon={<Square className="h-4 w-4" />}
              elements={grouped.boxes}
              selectedElementId={selectedElementId}
              onSelectElement={selectElement}
              onAcceptElement={acceptElement}
              onEditElement={editElement}
              onDeleteElement={deleteElement}
            />
          </TabsContent>

          <TabsContent value="text" className="mt-0">
            <ElementsGroup
              title="Text Elements"
              icon={<Type className="h-4 w-4" />}
              elements={grouped.text}
              selectedElementId={selectedElementId}
              onSelectElement={selectElement}
              onAcceptElement={acceptElement}
              onEditElement={editElement}
              onDeleteElement={deleteElement}
            />
          </TabsContent>

          <TabsContent value="icons" className="mt-0">
            <ElementsGroup
              title="Icon Regions"
              icon={<Image className="h-4 w-4" />}
              elements={grouped.icons}
              selectedElementId={selectedElementId}
              onSelectElement={selectElement}
              onAcceptElement={acceptElement}
              onEditElement={editElement}
              onDeleteElement={deleteElement}
            />
          </TabsContent>

          <TabsContent value="arrows" className="mt-0">
            <ElementsGroup
              title="Arrows & Connectors"
              icon={<ArrowRight className="h-4 w-4" />}
              elements={grouped.arrows}
              selectedElementId={selectedElementId}
              onSelectElement={selectElement}
              onAcceptElement={acceptElement}
              onEditElement={editElement}
              onDeleteElement={deleteElement}
            />
          </TabsContent>

          <TabsContent value="boxes" className="mt-0">
            <ElementsGroup
              title="Shapes & Boxes"
              icon={<Square className="h-4 w-4" />}
              elements={grouped.boxes}
              selectedElementId={selectedElementId}
              onSelectElement={selectElement}
              onAcceptElement={acceptElement}
              onEditElement={editElement}
              onDeleteElement={deleteElement}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Bulk actions */}
      <div className="p-4 border-t space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            elements.forEach(el => {
              if (el.status === 'pending') {
                acceptElement(el.id);
              }
            });
          }}
        >
          <Check className="h-4 w-4 mr-2" />
          Accept All Pending
        </Button>
      </div>
    </div>
  );
}
