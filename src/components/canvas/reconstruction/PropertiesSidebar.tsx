/**
 * Properties Sidebar for Reconstruction
 * Shows properties and icon matches for selected element
 */

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Type, 
  Image, 
  ArrowRight, 
  Square, 
  Check,
  SkipForward,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReconstruction } from './ReconstructionContext';
import { 
  AnyDetectedElement, 
  DetectedText, 
  DetectedIcon, 
  DetectedArrow, 
  DetectedBox,
  ARROW_STYLES,
  ARROW_HEAD_TYPES
} from '@/types/figureReconstruction';

function TextProperties({ element }: { element: DetectedText }) {
  const { updateElement } = useReconstruction();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Content</Label>
        <Input
          value={element.content}
          onChange={(e) => updateElement(element.id, { content: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Font Size</Label>
          <Input
            type="number"
            value={element.fontSize || 14}
            onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Font Weight</Label>
          <Select
            value={element.fontWeight || 'normal'}
            onValueChange={(v) => updateElement(element.id, { fontWeight: v as 'normal' | 'bold' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={element.color || '#000000'}
            onChange={(e) => updateElement(element.id, { color: e.target.value })}
            className="w-12 h-9 p-1"
          />
          <Input
            value={element.color || '#000000'}
            onChange={(e) => updateElement(element.id, { color: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

function IconProperties({ element }: { element: DetectedIcon }) {
  const { iconMatches, loadingIconMatches, assignIconToElement } = useReconstruction();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Search Terms</Label>
        <div className="flex flex-wrap gap-1">
          {element.queryTerms.map((term, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {term}
            </Badge>
          ))}
        </div>
      </div>

      {element.matchedIconId && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Icon Selected</span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-500 mt-1">
            {element.matchedIconName}
          </p>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <Label>Icon Matches</Label>
        {loadingIconMatches ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : iconMatches.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {iconMatches.map((match) => (
              <button
                key={match.id}
                className={cn(
                  'aspect-square rounded-lg border-2 p-2 transition-all hover:border-primary',
                  element.matchedIconId === match.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                )}
                onClick={() => assignIconToElement(
                  element.id,
                  match.id,
                  match.name,
                  match.svgContent || ''
                )}
                title={match.name}
              >
                {match.thumbnail ? (
                  <img
                    src={match.thumbnail}
                    alt={match.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Image className="h-6 w-6" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No matching icons found. Select the element to search.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          disabled={!element.matchedIconId}
        >
          <Check className="h-4 w-4 mr-2" />
          Place Icon
        </Button>
        <Button variant="outline" size="sm">
          <SkipForward className="h-4 w-4 mr-2" />
          Skip
        </Button>
      </div>
    </div>
  );
}

function ArrowProperties({ element }: { element: DetectedArrow }) {
  const { updateElement } = useReconstruction();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Style</Label>
          <Select
            value={element.style}
            onValueChange={(v) => updateElement(element.id, { style: v as 'solid' | 'dashed' | 'dotted' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARROW_STYLES.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Stroke Width</Label>
          <Input
            type="number"
            value={element.strokeWidth || 2}
            min={1}
            max={10}
            onChange={(e) => updateElement(element.id, { strokeWidth: parseInt(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Head Type</Label>
          <Select
            value={element.headType}
            onValueChange={(v) => updateElement(element.id, { headType: v as typeof element.headType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARROW_HEAD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tail Type</Label>
          <Select
            value={element.tailType}
            onValueChange={(v) => updateElement(element.id, { tailType: v as typeof element.tailType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="arrow">Arrow</SelectItem>
              <SelectItem value="circle">Circle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={element.color || '#000000'}
            onChange={(e) => updateElement(element.id, { color: e.target.value })}
            className="w-12 h-9 p-1"
          />
          <Input
            value={element.color || '#000000'}
            onChange={(e) => updateElement(element.id, { color: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

function BoxProperties({ element }: { element: DetectedBox }) {
  const { updateElement } = useReconstruction();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Corner Radius</Label>
          <Input
            type="number"
            value={element.cornerRadius || 0}
            min={0}
            max={50}
            onChange={(e) => updateElement(element.id, { cornerRadius: parseInt(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Stroke Width</Label>
          <Input
            type="number"
            value={element.strokeWidth || 1}
            min={0}
            max={10}
            onChange={(e) => updateElement(element.id, { strokeWidth: parseInt(e.target.value) })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Fill Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={element.fillColor || '#ffffff'}
            onChange={(e) => updateElement(element.id, { fillColor: e.target.value })}
            className="w-12 h-9 p-1"
          />
          <Input
            value={element.fillColor || 'transparent'}
            onChange={(e) => updateElement(element.id, { fillColor: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Stroke Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={element.strokeColor || '#000000'}
            onChange={(e) => updateElement(element.id, { strokeColor: e.target.value })}
            className="w-12 h-9 p-1"
          />
          <Input
            value={element.strokeColor || '#000000'}
            onChange={(e) => updateElement(element.id, { strokeColor: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

export function PropertiesSidebar() {
  const { elements, selectedElementId } = useReconstruction();

  const selectedElement = selectedElementId
    ? elements.find(e => e.id === selectedElementId)
    : null;

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="h-5 w-5" />;
      case 'icon':
        return <Image className="h-5 w-5" />;
      case 'arrow':
        return <ArrowRight className="h-5 w-5" />;
      case 'box':
        return <Square className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-l">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Properties</h3>
        {selectedElement && (
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            {getElementIcon(selectedElement.type)}
            <span className="text-xs capitalize">{selectedElement.type}</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {selectedElement ? (
          <div>
            {selectedElement.type === 'text' && (
              <TextProperties element={selectedElement as DetectedText} />
            )}
            {selectedElement.type === 'icon' && (
              <IconProperties element={selectedElement as DetectedIcon} />
            )}
            {selectedElement.type === 'arrow' && (
              <ArrowProperties element={selectedElement as DetectedArrow} />
            )}
            {selectedElement.type === 'box' && (
              <BoxProperties element={selectedElement as DetectedBox} />
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Square className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select an element to edit its properties</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
