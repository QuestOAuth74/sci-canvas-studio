import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageDown, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const ThumbnailGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ processed: number; failed: number; total: number } | null>(null);

  const handleGenerateThumbnails = async () => {
    setIsGenerating(true);
    setResult(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      toast.info("Generating thumbnails... This may take a minute.");

      const { data, error } = await supabase.functions.invoke('generate-thumbnails', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error(`Failed to generate thumbnails: ${error.message}`);
        return;
      }

      setResult(data);
      
      if (data.processed > 0) {
        toast.success(`Successfully generated ${data.processed} thumbnails!`);
      } else {
        toast.info("All icons already have thumbnails");
      }
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      toast.error("Failed to generate thumbnails");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Thumbnails</CardTitle>
        <CardDescription>
          Generate optimized thumbnail versions of existing icons for faster loading.
          This process will create ~5-10KB thumbnail versions from full-size SVGs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Total icons processed:</strong> {result.total}</p>
                <p><strong>Successfully generated:</strong> {result.processed}</p>
                {result.failed > 0 && (
                  <p className="text-destructive"><strong>Failed:</strong> {result.failed}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={handleGenerateThumbnails} 
          className="w-full" 
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Thumbnails...
            </>
          ) : (
            <>
              <ImageDown className="h-4 w-4 mr-2" />
              Generate Thumbnails for Existing Icons
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Note: This only processes icons that don't already have thumbnails. 
          New uploads will automatically generate thumbnails.
        </p>
      </CardContent>
    </Card>
  );
};
