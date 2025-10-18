import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageDown, Loader2, RefreshCw, Play, Square } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface IconStats {
  total: number;
  withThumbnails: number;
  withoutThumbnails: number;
}

type ProcessMode = 'missing' | 'bad_only' | 'all';

interface BatchResult {
  processed: number;
  failed: number;
  scanned: number;
  totalMatched?: number;
  lastId: string | null;
  hasMore: boolean;
  mode: ProcessMode;
}

export const ThumbnailGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [stats, setStats] = useState<IconStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [mode, setMode] = useState<ProcessMode>('missing');
  const [batchSize, setBatchSize] = useState<number>(20);
  const [lastId, setLastId] = useState<string | null>(null);
  const [totalProcessed, setTotalProcessed] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      // Get total count
      const { count: totalCount, error: totalError } = await supabase
        .from('icons')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get count with thumbnails
      const { count: withThumbnailsCount, error: withThumbnailsError } = await supabase
        .from('icons')
        .select('*', { count: 'exact', head: true })
        .not('thumbnail', 'is', null);

      if (withThumbnailsError) throw withThumbnailsError;

      setStats({
        total: totalCount || 0,
        withThumbnails: withThumbnailsCount || 0,
        withoutThumbnails: (totalCount || 0) - (withThumbnailsCount || 0)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error("Failed to load thumbnail statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  const processBatch = async (currentLastId: string | null): Promise<BatchResult | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("You must be logged in");
      return null;
    }

    const { data, error } = await supabase.functions.invoke('generate-thumbnails', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        mode,
        limit: batchSize,
        lastId: currentLastId,
        normalizeColors: true,
        neutralColor: '#94a3b8'
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      toast.error(`Failed to generate thumbnails: ${error.message}`);
      return null;
    }

    return data as BatchResult;
  };

  const handleGenerateThumbnails = async () => {
    setIsGenerating(true);
    setResult(null);
    setTotalProcessed(0);
    setLastId(null); // Reset cursor
    
    try {
      const modeLabel = mode === 'missing' ? 'missing thumbnails' : mode === 'bad_only' ? 'bad thumbnails' : 'all icons';
      toast.info(`Processing ${modeLabel} in batches of ${batchSize}...`);

      let currentLastId: string | null = null;
      let batchCount = 0;
      let cumulativeProcessed = 0;

      // Process batches
      do {
        batchCount++;
        const batchResult = await processBatch(currentLastId);
        
        if (!batchResult) break;

        cumulativeProcessed += batchResult.processed;
        setTotalProcessed(cumulativeProcessed);
        setResult(batchResult);
        setLastId(batchResult.lastId);
        
        // Reload stats after each batch
        await loadStats();
        
        if (batchResult.processed > 0) {
          const message = isContinuous 
            ? `Batch ${batchCount}: ${batchResult.processed} thumbnails generated`
            : `Successfully generated ${batchResult.processed} thumbnails!`;
          toast.success(message);
          
          // Notify icon library to refresh
          window.dispatchEvent(new Event('thumbnailsGenerated'));
        }

        // If not in continuous mode, stop after one batch
        if (!isContinuous) {
          if (batchResult.hasMore && batchResult.processed > 0) {
            toast.info("More icons available. Run again to continue.");
          } else if (batchResult.processed === 0) {
            toast.info("No icons needed processing");
          }
          break;
        }

        // If no more to process, stop continuous mode
        if (!batchResult.hasMore || batchResult.processed === 0) {
          toast.success(`Continuous processing complete! Total: ${cumulativeProcessed} thumbnails`);
          break;
        }

        // Update cursor for next batch
        currentLastId = batchResult.lastId;
        
      } while (isContinuous && isGenerating);

    } catch (error) {
      console.error('Error generating thumbnails:', error);
      toast.error("Failed to generate thumbnails");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    setIsGenerating(false);
    toast.info("Stopping after current batch...");
  };

  const progressPercentage = stats ? (stats.withThumbnails / stats.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Thumbnail Generation</CardTitle>
            <CardDescription>
              Optimize icons for faster loading with lightweight thumbnails (~5-10KB)
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadStats}
            disabled={loadingStats}
            title="Refresh statistics"
          >
            <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Processing Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mode">Processing Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as ProcessMode)} disabled={isGenerating}>
                <SelectTrigger id="mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="missing">Missing Only</SelectItem>
                  <SelectItem value="bad_only">Bad Only</SelectItem>
                  <SelectItem value="all">All Icons</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="batch-size">Batch Size</Label>
              <Select value={batchSize.toString()} onValueChange={(v) => setBatchSize(Number(v))} disabled={isGenerating}>
                <SelectTrigger id="batch-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 icons</SelectItem>
                  <SelectItem value="20">20 icons</SelectItem>
                  <SelectItem value="50">50 icons</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex flex-col">
              <Label htmlFor="continuous" className="cursor-pointer">Continuous Processing</Label>
              <span className="text-xs text-muted-foreground">Auto-process all batches until complete</span>
            </div>
            <Switch 
              id="continuous"
              checked={isContinuous} 
              onCheckedChange={setIsContinuous}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Processing Progress</span>
            <span className="text-muted-foreground">
              {loadingStats ? (
                <Loader2 className="h-3 w-3 animate-spin inline" />
              ) : stats ? (
                `${stats.withThumbnails} / ${stats.total} icons`
              ) : (
                '—'
              )}
            </span>
          </div>
          
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-muted rounded p-2 text-center">
              <div className="font-semibold text-lg">{stats?.total || 0}</div>
              <div className="text-muted-foreground">Total Icons</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded p-2 text-center">
              <div className="font-semibold text-lg text-green-600 dark:text-green-400">
                {stats?.withThumbnails || 0}
              </div>
              <div className="text-muted-foreground">Processed</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2 text-center">
              <div className="font-semibold text-lg text-orange-600 dark:text-orange-400">
                {stats?.withoutThumbnails || 0}
              </div>
              <div className="text-muted-foreground">Remaining</div>
            </div>
          </div>
        </div>

        {/* Last Run Result */}
        {result && (
          <Alert>
            <AlertDescription>
              <div className="space-y-1 text-sm">
                <p><strong>Last batch:</strong> {result.processed} generated, {result.failed} failed, {result.scanned} scanned</p>
                {result.totalMatched !== undefined && (
                  <p className="text-muted-foreground">Total matched: {result.totalMatched}</p>
                )}
                {result.hasMore && (
                  <p className="text-muted-foreground">More icons available for processing</p>
                )}
                {totalProcessed > 0 && isContinuous && (
                  <p className="font-medium text-green-600 dark:text-green-400">
                    Session total: {totalProcessed} thumbnails
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateThumbnails} 
            className="flex-1" 
            disabled={isGenerating || loadingStats}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isContinuous ? 'Processing Continuously...' : 'Processing Batch...'}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Processing
              </>
            )}
          </Button>
          
          {isGenerating && isContinuous && (
            <Button 
              onClick={handleStop}
              variant="destructive"
              size="icon"
              title="Stop after current batch"
            >
              <Square className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          {mode === 'missing' && `Processing icons without thumbnails in batches of ${batchSize}`}
          {mode === 'bad_only' && `Fixing broken thumbnails in batches of ${batchSize}`}
          {mode === 'all' && `Reprocessing all icons in batches of ${batchSize}`}
        </p>
      </CardContent>
    </Card>
  );
};
