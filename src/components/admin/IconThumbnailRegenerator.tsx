import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface IconStats {
  total: number;
  withBlackStroke: number;
  withBlackFill: number;
}

export const IconThumbnailRegenerator = () => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [stats, setStats] = useState<IconStats>({
    total: 0,
    withBlackStroke: 0,
    withBlackFill: 0,
  });
  const [progress, setProgress] = useState(0);
  const [currentIcon, setCurrentIcon] = useState(0);
  const [totalIcons, setTotalIcons] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [removeBlackStroke, setRemoveBlackStroke] = useState(true);
  const [removeBlackFill, setRemoveBlackFill] = useState(true);

  useEffect(() => {
    loadStats();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('icon_categories')
        .select('name')
        .order('name');
      
      if (data) {
        setCategories(data.map(c => c.name));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      // Get total icons count
      const { count: totalCount } = await supabase
        .from('icons')
        .select('*', { count: 'exact', head: true });

      // Get icons with black strokes
      const { count: blackStrokeCount } = await supabase
        .from('icons')
        .select('*', { count: 'exact', head: true })
        .or('svg_content.ilike.%stroke="black"%,svg_content.ilike.%stroke="#000"%,svg_content.ilike.%stroke:#000%');

      // Get icons with black fills
      const { count: blackFillCount } = await supabase
        .from('icons')
        .select('*', { count: 'exact', head: true })
        .or('svg_content.ilike.%fill="black"%,svg_content.ilike.%fill="#000"%,svg_content.ilike.%fill:#000%');

      setStats({
        total: totalCount || 0,
        withBlackStroke: blackStrokeCount || 0,
        withBlackFill: blackFillCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  const generateCleanThumbnail = (svgContent: string): string => {
    let cleaned = svgContent;

    // Remove black strokes if option is selected
    if (removeBlackStroke) {
      // Replace stroke="black" with stroke="none"
      cleaned = cleaned.replace(/stroke=["']black["']/gi, 'stroke="none"');
      // Replace stroke="#000000" and variants with stroke="none"
      cleaned = cleaned.replace(/stroke=["']#000+["']/gi, 'stroke="none"');
      // Handle CSS style attributes
      cleaned = cleaned.replace(/style=["']([^"']*?)stroke:\s*black([^"']*?)["']/gi, 'style="$1stroke:none$2"');
      cleaned = cleaned.replace(/style=["']([^"']*?)stroke:\s*#000+([^"']*?)["']/gi, 'style="$1stroke:none$2"');
    }

    // Remove black fills if option is selected
    if (removeBlackFill) {
      // Replace fill="black" with fill="none"
      cleaned = cleaned.replace(/fill=["']black["']/gi, 'fill="none"');
      // Replace fill="#000000" and variants with fill="none"
      cleaned = cleaned.replace(/fill=["']#000+["']/gi, 'fill="none"');
      // Handle CSS style attributes
      cleaned = cleaned.replace(/style=["']([^"']*?)fill:\s*black([^"']*?)["']/gi, 'style="$1fill:none$2"');
      cleaned = cleaned.replace(/style=["']([^"']*?)fill:\s*#000+([^"']*?)["']/gi, 'style="$1fill:none$2"');
    }

    // Remove XML declarations and comments
    cleaned = cleaned.replace(/<\?xml[^?]*\?>/g, '');
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
    
    // Ensure viewBox exists
    if (!cleaned.includes('viewBox')) {
      cleaned = cleaned.replace(/<svg/, '<svg viewBox="0 0 512 512"');
    }

    // Optimize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  };

  const handleRegenerateThumbnails = async () => {
    setIsRegenerating(true);
    setIsCancelled(false);
    setProgress(0);
    setResult(null);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('You must be logged in');
        return;
      }

      // Build query
      let query = supabase
        .from('icons')
        .select('id, svg_content, category');

      // Apply category filter
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      // Apply black stroke/fill filter if both options are selected
      if (removeBlackStroke || removeBlackFill) {
        const conditions = [];
        if (removeBlackStroke) {
          conditions.push('svg_content.ilike.%stroke="black"%');
          conditions.push('svg_content.ilike.%stroke="#000"%');
          conditions.push('svg_content.ilike.%stroke:#000%');
        }
        if (removeBlackFill) {
          conditions.push('svg_content.ilike.%fill="black"%');
          conditions.push('svg_content.ilike.%fill="#000"%');
          conditions.push('svg_content.ilike.%fill:#000%');
        }
        query = query.or(conditions.join(','));
      }

      const { data: icons, error } = await query;

      if (error) throw error;

      if (!icons || icons.length === 0) {
        toast.info('No icons match the selected criteria');
        setIsRegenerating(false);
        return;
      }

      setTotalIcons(icons.length);
      let successCount = 0;
      let failedCount = 0;

      // Process each icon
      for (let i = 0; i < icons.length; i++) {
        if (isCancelled) {
          toast.info('Regeneration cancelled');
          break;
        }

        const icon = icons[i];
        setCurrentIcon(i + 1);
        setProgress(((i + 1) / icons.length) * 100);

        try {
          const cleanedThumbnail = generateCleanThumbnail(icon.svg_content);

          const { error: updateError } = await supabase
            .from('icons')
            .update({ thumbnail: cleanedThumbnail })
            .eq('id', icon.id);

          if (updateError) throw updateError;
          successCount++;
        } catch (error) {
          console.error(`Failed to regenerate thumbnail for icon ${icon.id}:`, error);
          failedCount++;
        }
      }

      setResult({ success: successCount, failed: failedCount });
      toast.success(`Regenerated ${successCount} icon thumbnails`);
      
      // Reload stats
      await loadStats();
    } catch (error) {
      console.error('Error regenerating thumbnails:', error);
      toast.error('Failed to regenerate thumbnails');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCancel = () => {
    setIsCancelled(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Icon Thumbnail Regenerator
            </CardTitle>
            <CardDescription>
              Remove black strokes and fills from icon thumbnails to fix dark outline issues
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadStats}
            disabled={loadingStats || isRegenerating}
          >
            <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRegenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Processing icons...</span>
              <span>{currentIcon} / {totalIcons}</span>
            </div>
            <Progress value={progress} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}

        {result && (
          <Alert>
            <AlertDescription>
              <strong>Batch Complete:</strong> {result.success} thumbnails regenerated successfully
              {result.failed > 0 && `, ${result.failed} failed`}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Icons</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.withBlackStroke}</div>
            <div className="text-sm text-muted-foreground">With Black Strokes</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-2xl font-bold text-red-600">{stats.withBlackFill}</div>
            <div className="text-sm text-muted-foreground">With Black Fills</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category Filter</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remove-stroke"
                checked={removeBlackStroke}
                onCheckedChange={(checked) => setRemoveBlackStroke(checked as boolean)}
              />
              <Label
                htmlFor="remove-stroke"
                className="text-sm font-normal cursor-pointer"
              >
                Remove black strokes (replace with transparent)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remove-fill"
                checked={removeBlackFill}
                onCheckedChange={(checked) => setRemoveBlackFill(checked as boolean)}
              />
              <Label
                htmlFor="remove-fill"
                className="text-sm font-normal cursor-pointer"
              >
                Remove black fills (replace with transparent)
              </Label>
            </div>
          </div>
        </div>

        <Button
          onClick={handleRegenerateThumbnails}
          disabled={isRegenerating || loadingStats || (!removeBlackStroke && !removeBlackFill)}
          className="w-full"
        >
          {isRegenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Processing {currentIcon} / {totalIcons}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Regenerate Icon Thumbnails
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          This will process icons matching the selected criteria and remove black strokes/fills from their thumbnails.
          The original SVG content remains unchanged - only the thumbnail display is updated.
        </p>
      </CardContent>
    </Card>
  );
};
