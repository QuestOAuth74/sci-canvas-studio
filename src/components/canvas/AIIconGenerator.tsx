import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Upload, Image as ImageIcon, Loader2, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIconSubmissions } from '@/hooks/useIconSubmissions';
import { useUserAssets } from '@/hooks/useUserAssets';
import { removeBackground, loadImage } from '@/lib/backgroundRemoval';
import { useAIGenerationUsage } from '@/hooks/useAIGenerationUsage';

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

// Helper functions for image processing
const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const res = await fetch(dataUrl);
  return await res.blob();
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });

const drawToPngDataUrl = (img: HTMLImageElement): string => {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return c.toDataURL('image/png');
};

const detectHasTransparency = (img: HTMLImageElement): boolean => {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true; // anything not fully opaque
  }
  return false;
};

const detectIsLikelyWhiteBackground = (img: HTMLImageElement): boolean => {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const { width, height } = c;
  const { data } = ctx.getImageData(0, 0, width, height);
  const sample = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    return (255 - r) + (255 - g) + (255 - b) < 45; // near-white threshold
  };
  let whiteCount = 0, total = 0;
  const step = Math.max(1, Math.floor(Math.min(width, height) / 64));
  for (let x = 0; x < width; x += step) {
    whiteCount += sample(x, 0) ? 1 : 0;
    whiteCount += sample(x, height - 1) ? 1 : 0;
    total += 2;
  }
  for (let y = 0; y < height; y += step) {
    whiteCount += sample(0, y) ? 1 : 0;
    whiteCount += sample(width - 1, y) ? 1 : 0;
    total += 2;
  }
  return total > 0 && whiteCount / total > 0.7; // 70% of border near white
};

export const AIIconGenerator = ({ open, onOpenChange, onIconGenerated }: AIIconGeneratorProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { submitIcon } = useIconSubmissions();
  const { uploadAsset } = useUserAssets();
  const { usage, isLoading: usageLoading, refetch: refetchUsage } = useAIGenerationUsage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StylePreset>('simple');
  const [iconName, setIconName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Laboratory');
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [usageRights, setUsageRights] = useState<'free_to_share' | 'own_rights' | 'licensed' | 'public_domain'>('own_rights');
  const [usageRightsDetails, setUsageRightsDetails] = useState('');
  
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Load categories
  const loadCategories = useCallback(async () => {
    const { data } = await supabase
      .from('icon_categories')
      .select('name')
      .order('name');
    
    if (data && data.length > 0) {
      const categoryNames = data.map(c => c.name);
      setCategories(categoryNames);
      // Set first category as default if current selection is invalid
      if (!categoryNames.includes(selectedCategory)) {
        setSelectedCategory(categoryNames[0]);
      }
    } else {
      // Fallback categories if database is empty
      setCategories(['Laboratory', 'Anatomy', 'General']);
    }
  }, [selectedCategory]);

  // Load categories when dialog opens
  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open, loadCategories]);

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
      setProgress(90);
      
      // Normalize to PNG with transparent background
      try {
        console.log('🎨 Normalizing to PNG with transparent background...');
        const isJpegLike = data.generatedImage.startsWith('data:image/jpeg') ||
                           data.generatedImage.startsWith('data:image/jpg') ||
                           data.generatedImage.startsWith('data:image/webp');

        // Load the returned image
        const srcBlob = await dataUrlToBlob(data.generatedImage);
        const imgEl = await loadImage(srcBlob);

        const hasAlpha = detectHasTransparency(imgEl);
        const looksWhiteBG = !hasAlpha && detectIsLikelyWhiteBackground(imgEl);

        // Decide if we must remove background
        let finalBlob: Blob;

        if (isJpegLike || looksWhiteBG) {
          console.log('🧹 Making background transparent (removal path)...');
          finalBlob = await removeBackground(imgEl);
        } else {
          console.log('✅ Image already has transparency or no white background detected');
          // Standardize to PNG
          const pngDataUrl = drawToPngDataUrl(imgEl);
          finalBlob = await dataUrlToBlob(pngDataUrl);
        }

        const pngDataUrl = await blobToDataUrl(finalBlob);
        setGeneratedImage(pngDataUrl);
        console.log('✅ Final image is PNG with transparent background');
      } catch (procErr) {
        console.error('❌ Unable to ensure transparency automatically:', procErr);
        // Last resort: convert to PNG (may remain opaque)
        try {
          const fallbackBlob = await dataUrlToBlob(data.generatedImage);
          const fallbackImg = await loadImage(fallbackBlob);
          const fallbackDataUrl = drawToPngDataUrl(fallbackImg);
          setGeneratedImage(fallbackDataUrl);
        } catch {
          setGeneratedImage(data.generatedImage);
        }
      }
      
      setProgress(100);
      setStage('complete');
      
      // Refetch usage after successful generation
      await refetchUsage();

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

  // Save to personal library (user_assets)
  const handleSaveToMyLibrary = async () => {
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
      const file = new File([blob], `${iconName}.png`, { type: 'image/png' });

      setProgress(75);

      console.log('[SAVE] Attempting upload:', {
        userId: user.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        category: selectedCategory
      });

      // Upload to user_assets
      const asset = await uploadAsset({
        file,
        category: selectedCategory,
        tags: ['ai-generated'],
        description: description.trim() || `AI-generated icon from prompt: "${prompt}"`,
        isShared: false // Private to user
      });

      if (!asset) {
        throw new Error('Failed to save to library');
      }

      setProgress(100);
      
      toast({
        title: 'Icon saved to your library!',
        description: `"${iconName}" is now available in your personal assets.`,
      });
      
      // Refetch usage after saving
      await refetchUsage();

      // Reset and close
      handleReset();
      onOpenChange(false);
      onIconGenerated?.();

    } catch (error: any) {
      console.error('Save error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      setStage('error');
      
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save icon to library. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Submit to public library for admin review
  const handleSubmitToPublic = async () => {
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
        description: 'Please sign in to submit icons',
        variant: 'destructive',
      });
      return;
    }

    try {
      setStage('saving');
      setProgress(50);

      // Convert base64 to blob for thumbnail
      const base64Data = generatedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      console.log('[SUBMIT] Attempting upload:', {
        userId: user.id,
        blobSize: blob.size,
        blobType: blob.type
      });

      // Upload thumbnail to storage with proper folder structure
      const filename = `${user.id}/submissions/ai-icon-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('user-assets')
        .upload(filename, blob, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        // Provide helpful error messages
        if (uploadError.message.includes('mime_type')) {
          throw new Error('File type not supported by storage bucket');
        } else if (uploadError.message.includes('size')) {
          throw new Error('File size exceeds bucket limit');
        } else if (uploadError.message.includes('policy')) {
          throw new Error('Storage permission denied - check bucket policies');
        }
        
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-assets')
        .getPublicUrl(filename);

      setProgress(75);

      // Create SVG wrapper for the PNG
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <image href="${publicUrl}" width="512" height="512"/>
</svg>`;

      // Submit to icon_submissions table for review
      const submission = await submitIcon({
        name: iconName.trim(),
        category: selectedCategory,
        svg_content: svgContent,
        thumbnail: publicUrl,
        description: description.trim() || `AI-generated icon from prompt: "${prompt}"`,
        usage_rights: usageRights,
        usage_rights_details: usageRightsDetails.trim() || undefined,
      });

      if (!submission) {
        throw new Error('Failed to submit icon');
      }

      setProgress(100);
      
      toast({
        title: 'Icon submitted for review!',
        description: `"${iconName}" will be reviewed by our team before being added to the public library.`,
      });
      
      // Refetch usage after submission
      await refetchUsage();

      // Reset and close
      handleReset();
      onOpenChange(false);
      onIconGenerated?.();

    } catch (error: any) {
      console.error('Submit error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      setStage('error');
      
      toast({
        title: 'Submission failed',
        description: error.message || 'Failed to submit icon for review. Please try again.',
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
    setDescription('');
    setUsageRights('own_rights');
    setUsageRightsDetails('');
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
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Icon Generator
            </span>
            {!usageLoading && usage && !usage.isAdmin && (
              <span className="text-sm font-normal text-muted-foreground">
                {usage.remaining === 0 ? (
                  <span className="text-destructive flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-destructive"></span>
                    Limit reached
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    {usage.remaining} generation{usage.remaining === 1 ? '' : 's'} remaining
                  </span>
                )}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Upload a reference image and describe how you want to transform it into an icon
            {!usageLoading && usage && !usage.isAdmin && usage.remaining === 0 && (
              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                You've reached your monthly limit of {usage.limit} free generations. 
                Limit resets on {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {!user && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              ⚠️ You must be signed in to save or submit icons
            </p>
          </div>
        )}

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
              <>
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate || (usage && !usage.canGenerate)}
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
                      {usage && !usage.canGenerate ? 'Limit Reached' : 'Generate Icon'}
                    </>
                  )}
                </Button>
                
                {!usageLoading && usage && !usage.canGenerate && !usage.isAdmin && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Monthly limit: {usage.used}/{usage.limit} used
                  </p>
                )}
              </>
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

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this icon"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSaving}
                    className="mt-2 min-h-[60px]"
                    rows={2}
                  />
                </div>

                {/* Public submission options */}
                <div className="p-3 bg-muted/30 rounded-lg border space-y-3">
                  <p className="text-sm font-medium">Public Submission Options</p>
                  <div>
                    <Label htmlFor="usageRights" className="text-xs">Usage Rights</Label>
                    <Select value={usageRights} onValueChange={(v: any) => setUsageRights(v)} disabled={isSaving}>
                      <SelectTrigger id="usageRights" className="mt-1.5 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="own_rights">I created this / I own the rights</SelectItem>
                        <SelectItem value="free_to_share">Free to share (e.g., Creative Commons)</SelectItem>
                        <SelectItem value="licensed">Licensed (specify below)</SelectItem>
                        <SelectItem value="public_domain">Public domain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(usageRights === 'licensed' || usageRights === 'free_to_share') && (
                    <div>
                      <Label htmlFor="usageRightsDetails" className="text-xs">License Details</Label>
                      <Input
                        id="usageRightsDetails"
                        placeholder="Specify license or source"
                        value={usageRightsDetails}
                        onChange={(e) => setUsageRightsDetails(e.target.value)}
                        disabled={isSaving}
                        className="mt-1.5 h-9"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Required only if submitting to public library
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Choose where to save your icon:</p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSaveToMyLibrary}
                      disabled={!canSave}
                      className="w-full justify-start"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          <div className="text-left">
                            <div className="font-medium">Save to My Library</div>
                            <div className="text-xs text-muted-foreground font-normal">
                              Private - Only you can use this icon
                            </div>
                          </div>
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleSubmitToPublic}
                      disabled={!canSave}
                      className="w-full justify-start"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          <div className="text-left">
                            <div className="font-medium">Submit to Public Library</div>
                            <div className="text-xs opacity-80 font-normal">
                              Pending review - Will be available to all users if approved
                            </div>
                          </div>
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    onClick={handleRegenerate}
                    disabled={isSaving}
                    className="w-full"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Icon
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
