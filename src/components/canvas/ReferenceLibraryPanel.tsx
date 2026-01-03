import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Check, X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ReferenceImage,
  ReferenceCategory,
  referenceCategories,
  referenceLibrary,
  getImagesByCategory,
  searchImages,
} from '@/lib/scientificReferenceLibrary';

interface ReferenceLibraryPanelProps {
  onSelectReference: (image: ReferenceImage) => void;
  selectedId?: string;
  onClose: () => void;
}

export const ReferenceLibraryPanel: React.FC<ReferenceLibraryPanelProps> = ({
  onSelectReference,
  selectedId,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<ReferenceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredImages = useMemo(() => {
    let images = activeCategory === 'all' 
      ? referenceLibrary 
      : getImagesByCategory(activeCategory);
    
    if (searchQuery.trim()) {
      const searchResults = searchImages(searchQuery);
      images = images.filter(img => searchResults.some(r => r.id === img.id));
    }
    
    return images;
  }, [activeCategory, searchQuery]);

  const categories = Object.entries(referenceCategories) as [ReferenceCategory, typeof referenceCategories[ReferenceCategory]][];

  return (
    <div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Reference Library</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search references..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 p-2 border-b overflow-x-auto">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs shrink-0"
          onClick={() => setActiveCategory('all')}
        >
          All
        </Button>
        {categories.map(([key, config]) => {
          const Icon = config.icon;
          return (
            <TooltipProvider key={key} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeCategory === key ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs shrink-0 gap-1"
                    onClick={() => setActiveCategory(key)}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Image Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 gap-2 p-3">
          {filteredImages.map((image) => {
            const isSelected = selectedId === image.id;
            return (
              <TooltipProvider key={image.id} delayDuration={400}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelectReference(image)}
                      className={cn(
                        'relative group rounded-lg overflow-hidden border-2 transition-all aspect-square',
                        isSelected 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <img
                        src={image.imagePath}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback for missing images
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <span className="text-white text-xs font-medium line-clamp-2">
                          {image.name}
                        </span>
                      </div>
                      
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p className="font-medium mb-1">{image.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{image.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {image.tags.slice(0, 4).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {filteredImages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No references found</p>
            <p className="text-xs">Try a different search or category</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ReferenceLibraryPanel;
