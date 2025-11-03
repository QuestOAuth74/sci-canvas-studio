import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Upload, Image as ImageIcon, Loader2, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AIIconGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIconGenerated?: () => void;
}

type StylePreset = 'medical' | 'biochemical' | 'cellular' | 'simple' | 'detailed';
type GenerationStage = 'idle' | 'uploading' | 'generating' | 'saving' | 'complete' | 'error';

const styleDescriptions: Record<StylePreset, string> = {
  medical: 'Medical illustration with anatomical accuracy',
  biochemical: 'Molecular structures and pathways',
  cellular: 'Cellular biology and microscopic details',
  simple: 'Minimal, clear silhouette',
  detailed: 'High detail scientific illustration'
};

export const AIIconGenerator = ({ open, onOpenChange, onIconGenerated }: AIIconGeneratorProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StylePreset>('simple');
  const [iconName, setIconName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [categories, setCategories] = useState<string[]>([]);
  
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Load categories
  const loadCategories = useCallback(async () => {
    const { data } = await supabase
      .from('icon_categories')
      .select('name')
      .order('name');
    
    if (data) {
      setCategories(data.map(c => c.name));
    }
  }, []);

  // Load categories when dialog opens
  useState(() => {
    if (open) {
      loadCategories();
    }
  });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, or WEBP)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setReferenceFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setReferenceImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleGenerate = async () => {
    if (!referenceImage || !prompt.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please upload a reference image and enter a prompt',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to generate icons',
        variant: 'destructive',
      });
      return;
    }

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      setStage('generating');
      setProgress(10);

      // Explicitly get session and validate
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session || sessionError) {
        console.error('Session error:', sessionError);
        toast({
          title: 'Session expired',
          description: 'Please sign in again to generate icons',
          variant: 'destructive',
        });
        setStage('idle');
        return;
      }

      console.log('🎨 Starting icon generation...');
      console.log('📝 Prompt:', prompt);
      console.log('🎭 Style:', style);
      console.log('🔐 Session valid:', !!session.access_token);

      // Start progress timer
      const startTime = Date.now();
      progressInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newProgress = Math.min(90, 10 + (elapsed / 60) * 80);
        setProgress(newProgress);
        console.log(`⏱️ Generating... ${elapsed}s elapsed (${Math.round(newProgress)}%)`);
      }, 1000);

      // Add timeout (2 minutes)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 120000)
      );

      const invokePromise = supabase.functions.invoke('generate-icon-from-reference', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: {
          image: referenceImage,
          prompt: prompt.trim(),
          style,
        }
      });

      // Race between generation and timeout
      const { data, error } = await Promise.race([
        invokePromise,
        timeoutPromise
      ]) as any;

      // Clear progress timer
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Generation failed');
      }

      console.log('✅ Icon generated successfully');
      setProgress(100);
      setGeneratedImage(data.generatedImage);
      setStage('complete');

      // Auto-suggest icon name from prompt
      if (!iconName) {
        const suggested = prompt
          .trim()
          .split(' ')
          .slice(0, 3)
          .join(' ')
          .replace(/[^a-zA-Z0-9\s]/g, '');
        setIconName(suggested);
      }

      toast({
        title: 'Icon generated!',
        description: 'Review and save your new icon to the library',
      });

    } catch (error: any) {
      // Clear progress timer on error
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      console.error('Generation error:', error);
      setStage('error');
      
      let errorMessage = 'Failed to generate icon. Please try again.';
      
      if (error.message === 'TIMEOUT') {
        errorMessage = 'AI generation took too long. Please try with a smaller image or simpler prompt.';
      } else if (error.message?.includes('RATE_LIMITED') || error.message?.includes('429')) {
        errorMessage = 'Rate limit reached. Please wait a moment and try again.';
      } else if (error.message?.includes('CREDITS_DEPLETED') || error.message?.includes('402')) {
        errorMessage = 'AI credits depleted. Add credits in Settings → Workspace → Usage.';
      } else if (error.message?.includes('session') || error.message?.includes('auth')) {
        errorMessage = 'Session expired. Please refresh the page and try again.';
      }
      
      toast({
        title: 'Generation failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleSaveIcon = async () => {
    if (!generatedImage || !iconName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide an icon name',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save icons',
        variant: 'destructive',
      });
      return;
    }

    try {
      setStage('saving');
      setProgress(50);

      // Convert base64 to blob
      const base64Data = generatedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Upload to storage
      const filename = `ai-icon-${user.id}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-assets')
        .upload(filename, blob, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-assets')
        .getPublicUrl(filename);

      setProgress(75);

      // Create SVG wrapper for the PNG (icons table expects svg_content)
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <image href="${publicUrl}" width="512" height="512"/>
</svg>`;

      // Insert into icons table
      const { error: insertError } = await supabase
        .from('icons')
        .insert({
          name: iconName.trim(),
          category: selectedCategory,
          svg_content: svgContent,
          thumbnail: publicUrl,
          uploaded_by: user.id
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      setProgress(100);
      
      toast({
        title: 'Icon saved!',
        description: `"${iconName}" has been added to your icon library`,
      });

      // Reset and close
      handleReset();
      onOpenChange(false);
      onIconGenerated?.();

    } catch (error: any) {
      console.error('Save error:', error);
      setStage('error');
      
      toast({
        title: 'Save failed',
        description: 'Failed to save icon to library. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    setReferenceImage(null);
    setReferenceFile(null);
    setPrompt('');
    setStyle('simple');
    setIconName('');
    setSelectedCategory('General');
    setGeneratedImage(null);
    setStage('idle');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    setStage('idle');
    setProgress(0);
  };

  const isGenerating = stage === 'generating';
  const isSaving = stage === 'saving';
  const isComplete = stage === 'complete';
  const canGenerate = referenceImage && prompt.trim() && !isGenerating && !isSaving;
  const canSave = generatedImage && iconName.trim() && !isSaving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Icon Generator
          </DialogTitle>
          <DialogDescription>
            Upload a reference image and describe how you want to transform it into an icon
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-4">
            <div>
              <Label>Reference Image</Label>
              <div
                className="mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {referenceImage ? (
                  <img src={referenceImage} alt="Reference" className="mx-auto max-h-48 rounded" />
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, or WEBP (max 10MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div>
              <Label htmlFor="prompt">Transformation Prompt</Label>
              <Input
                id="prompt"
                placeholder="e.g., simplify the design, make it monochrome, remove background"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating || isSaving}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="style">Style Preset</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as StylePreset)} disabled={isGenerating || isSaving}>
                <SelectTrigger id="style" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(styleDescriptions).map(([key, desc]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <div className="font-medium capitalize">{key}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!generatedImage && (
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Icon
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Right Column - Output */}
          <div className="space-y-4">
            {(isGenerating || isSaving) && (
              <div className="space-y-2">
                <Label>Progress</Label>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  {isGenerating && 'Generating your icon with AI...'}
                  {isSaving && 'Saving to your library...'}
                </p>
              </div>
            )}

            {generatedImage && (
              <>
                <div>
                  <Label>Generated Icon</Label>
                  <div className="mt-2 border rounded-lg p-4 bg-muted/30 flex items-center justify-center">
                    <img src={generatedImage} alt="Generated" className="max-h-64 rounded" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="iconName">Icon Name</Label>
                  <Input
                    id="iconName"
                    placeholder="Enter icon name"
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    disabled={isSaving}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isSaving}>
                    <SelectTrigger id="category" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button
                    onClick={handleSaveIcon}
                    disabled={!canSave}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save to Library
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {!generatedImage && !isGenerating && !isSaving && (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div className="space-y-2">
                  <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Generated icon will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {generatedImage && (
          <div className="pt-4 border-t">
            <Button variant="ghost" onClick={handleReset} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
