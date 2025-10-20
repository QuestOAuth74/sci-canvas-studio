import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Icon {
  id: string;
  name: string;
  category: string;
  svg_content: string;
  thumbnail: string | null;
  icon_categories?: { name: string } | null;
}

export const IconManager = () => {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalIcons, setTotalIcons] = useState(0);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [brokenThumbnails, setBrokenThumbnails] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setSelectedIcons(new Set());
    loadIcons(currentPage);
  }, [currentPage, selectedCategory]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('icon_categories')
      .select('id, name')
      .order('name');
    
    if (data) {
      setCategories(data);
    }
  };

  const loadIcons = async (page: number) => {
    // Build query with optional category filter
    let countQuery = supabase.from('icons').select('*', { count: 'exact', head: true });
    let dataQuery = supabase.from('icons').select('*');

    if (selectedCategory !== "all") {
      countQuery = countQuery.eq('category', selectedCategory);
      dataQuery = dataQuery.eq('category', selectedCategory);
    }

    // Get total count
    const { count } = await countQuery;

    if (count) {
      setTotalIcons(count);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    }

    // Get paginated data
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error } = await dataQuery
      .order('name')
      .range(from, to);
    
    // Fetch category names separately
    const { data: categoryData } = await supabase
      .from('icon_categories')
      .select('id, name');
    
    const categoryMap = new Map(categoryData?.map(cat => [cat.id, cat.name]) || []);
    
    // Augment icons with category names
    const iconsWithCategories = data?.map(icon => ({
      ...icon,
      icon_categories: categoryMap.has(icon.category) 
        ? { name: categoryMap.get(icon.category)! }
        : null
    }));

    if (!error && iconsWithCategories) {
      setIcons(iconsWithCategories);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('icons')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete icon");
    } else {
      toast.success("Icon deleted");
      loadIcons(currentPage);
    }
  };

  const toggleIconSelection = (iconId: string) => {
    const newSelection = new Set(selectedIcons);
    if (newSelection.has(iconId)) {
      newSelection.delete(iconId);
    } else {
      newSelection.add(iconId);
    }
    setSelectedIcons(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIcons.size === icons.length) {
      setSelectedIcons(new Set());
    } else {
      setSelectedIcons(new Set(icons.map(icon => icon.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIcons.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedIcons.size} icon${selectedIcons.size > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) return;
    
    setIsDeleting(true);
    
    try {
      const deletePromises = Array.from(selectedIcons).map(iconId =>
        supabase.from('icons').delete().eq('id', iconId)
      );
      
      const results = await Promise.allSettled(deletePromises);
      const failures = results.filter(r => r.status === 'rejected').length;
      const successes = selectedIcons.size - failures;
      
      if (failures > 0) {
        toast.error(`Deleted ${successes} icons, ${failures} failed`);
      } else {
        toast.success(`Successfully deleted ${successes} icon${successes > 1 ? 's' : ''}`);
      }
      
      setSelectedIcons(new Set());
      loadIcons(currentPage);
    } catch (error) {
      toast.error("Failed to delete icons");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegenerateThumbnail = async (icon: Icon) => {
    setRegeneratingId(icon.id);
    
    try {
      // Generate new optimized thumbnail
      const thumbnail = generateThumbnail(icon.svg_content);
      
      const { error } = await supabase
        .from('icons')
        .update({ thumbnail })
        .eq('id', icon.id);

      if (error) {
        toast.error("Failed to regenerate thumbnail");
        console.error(error);
      } else {
        toast.success("Thumbnail regenerated successfully!");
        loadIcons(currentPage);
        brokenThumbnails.delete(icon.id);
        setBrokenThumbnails(new Set(brokenThumbnails));
      }
    } catch (error) {
      toast.error("Error regenerating thumbnail");
      console.error(error);
    } finally {
      setRegeneratingId(null);
    }
  };

  const generateThumbnail = (svgContent: string): string => {
    try {
      let optimized = svgContent
        .replace(/<\?xml[^>]*\?>/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
        .replace(/<title>[\s\S]*?<\/title>/gi, '')
        .replace(/<desc>[\s\S]*?<\/desc>/gi, '')
        .replace(/<defs>[\s\S]*?<\/defs>/gi, '')
        .trim();

      const viewBoxMatch = optimized.match(/viewBox=["']([^"']*)["']/);
      const widthMatch = optimized.match(/width=["']([^"']*)["']/);
      const heightMatch = optimized.match(/height=["']([^"']*)["']/);

      if (!viewBoxMatch && widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1]);
        const height = parseFloat(heightMatch[1]);
        if (!isNaN(width) && !isNaN(height)) {
          optimized = optimized.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
        }
      }

      optimized = optimized
        .replace(/\s+id=["'][^"']*["']/g, '')
        .replace(/\s+class=["'][^"']*["']/g, '')
        .replace(/\s+style=["'][^"']*["']/g, '')
        .replace(/\s+data-[^=]*=["'][^"']*["']/g, '');

      optimized = optimized.replace(/(\d+\.\d{2,})/g, (match) => parseFloat(match).toFixed(1));
      optimized = optimized.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

      if (optimized.length > 50000) {
        optimized = optimized
          .replace(/\s+fill=["'][^"']*["']/g, '')
          .replace(/\s+stroke=["'][^"']*["']/g, '');
        optimized = optimized.replace(/(\d+\.\d+)/g, (match) => Math.round(parseFloat(match)).toString());
      }

      return optimized;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return svgContent;
    }
  };

  const handleThumbnailError = (iconId: string) => {
    brokenThumbnails.add(iconId);
    setBrokenThumbnails(new Set(brokenThumbnails));
  };

  const getThumbnailSize = (thumbnail: string | null): number => {
    if (!thumbnail) return 0;
    return new Blob([thumbnail]).size;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Icons</CardTitle>
        <CardDescription>
          View and delete uploaded icons - Showing {icons.length} of {totalIcons} icons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filter by category:</label>
          <Select value={selectedCategory} onValueChange={(value) => {
            setSelectedCategory(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selection Controls */}
        {icons.length > 0 && (
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIcons.size === icons.length && icons.length > 0}
                  onCheckedChange={toggleSelectAll}
                  id="select-all"
                />
                <label 
                  htmlFor="select-all" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Select All ({icons.length})
                </label>
              </div>
              {selectedIcons.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedIcons.size} icon{selectedIcons.size > 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            
            {selectedIcons.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleBatchDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedIcons.size})
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {icons.map((icon) => {
            const thumbnailSize = getThumbnailSize(icon.thumbnail);
            const isOversized = thumbnailSize > 100000;
            const isBroken = brokenThumbnails.has(icon.id);
            const isSelected = selectedIcons.has(icon.id);
            
            return (
              <div 
                key={icon.id} 
                className={`border rounded-lg p-3 space-y-2 transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                    : 'border-border'
                }`}
              >
                {/* Checkbox at top */}
                <div className="flex items-start justify-between">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleIconSelection(icon.id)}
                    className="mt-1"
                  />
                  {(isOversized || isBroken) && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-3 w-3" />
                      {isOversized ? "Large" : "Error"}
                    </div>
                  )}
                </div>
                
                {/* Rest of the icon card remains the same */}
                <div className="aspect-square border border-border rounded-lg p-2 flex items-center justify-center bg-muted">
                  {icon.thumbnail && !isBroken ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: icon.thumbnail }}
                      className="w-16 h-16 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                      onError={() => handleThumbnailError(icon.id)}
                    />
                  ) : (
                    <div 
                      dangerouslySetInnerHTML={{ __html: icon.svg_content }}
                      className="w-16 h-16 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                      onError={() => handleThumbnailError(icon.id)}
                    />
                  )}
                </div>
                <p className="text-sm font-medium truncate">{icon.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {icon.icon_categories?.name || icon.category}
                </p>
                {thumbnailSize > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {(thumbnailSize / 1024).toFixed(1)} KB
                  </p>
                )}
                <div className="flex gap-1">
                  {(isOversized || isBroken || !icon.thumbnail) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRegenerateThumbnail(icon)}
                      disabled={regeneratingId === icon.id}
                    >
                      <RefreshCw className={`h-3 w-3 ${regeneratingId === icon.id ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(icon.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        {icons.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No icons uploaded yet
          </p>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-12 px-6 font-bold uppercase border-[3px] border-foreground neo-brutalist-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-12 px-6 font-bold uppercase border-[3px] border-foreground neo-brutalist-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
