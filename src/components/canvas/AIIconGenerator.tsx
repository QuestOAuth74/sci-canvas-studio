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
import { Sparkles, Upload, Image as ImageIcon, Loader2, ArrowLeft, Save, RefreshCw, Dna, TestTube, Microscope, Heart, Pill, Syringe, FlaskConical, Activity, Brain, Droplet, Target, Scale, Undo2, Pencil, Shapes, Palette } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIconSubmissions } from '@/hooks/useIconSubmissions';
import { useUserAssets } from '@/hooks/useUserAssets';
import { removeBackground, loadImage, removeUniformBackgroundByFloodFill, BackgroundRemovalProgress } from '@/lib/backgroundRemoval';
import { useAIGenerationUsage } from '@/hooks/useAIGenerationUsage';
import { cn } from '@/lib/utils';
import pencilExample from '@/assets/ai-icon-styles/pencil-example.jpg';
import biomedicalExample from '@/assets/ai-icon-styles/biomedical-example.jpg';
import oilExample from '@/assets/ai-icon-styles/oil-example.jpg';

interface AIIconGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIconGenerated?: () => void;
}

type StylePreset = 'pencil' | 'biomedical' | 'oil';
type GenerationStage = 'idle' | 'uploading' | 'generating' | 'saving' | 'complete' | 'error';
type CreativityLevel = 'faithful' | 'balanced' | 'creative';

const styleDescriptions: Record<StylePreset, { label: string; desc: string; icon: React.ReactNode; example: string }> = {
  pencil: {
    label: 'Pencil Art',
    desc: 'Hand-drawn scientific sketch with fine line work and cross-hatching',
    icon: <Pencil className="h-5 w-5" />,
    example: pencilExample
  },
  biomedical: {
    label: 'Biomedical Vector',
    desc: 'Clean flat vectors with soft pastel gradients - publication ready',
    icon: <Shapes className="h-5 w-5" />,
    example: biomedicalExample
  },
  oil: {
    label: 'Oil Painting',
    desc: 'Rich textured brushstrokes with dramatic artistic lighting',
    icon: <Palette className="h-5 w-5" />,
    example: oilExample
  }
};

// Creativity level configuration
const creativityLevels = {
  faithful: {
    label: 'Faithful',
    icon: Target,
    description: 'Closely follows reference with minimal changes',
  },
  balanced: {
    label: 'Balanced',
    icon: Scale,
    description: 'Moderate interpretation with scientific accuracy',
  },
  creative: {
    label: 'Creative',
    icon: Sparkles,
    description: 'Artistic freedom with imaginative interpretation',
  }
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

  // Raster mode (image transform) state
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [backgroundType, setBackgroundType] = useState<'transparent' | 'white'>('transparent');
  
  // Generation state
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StylePreset>('biomedical');
  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>('balanced');
  
  // Common state
  const [iconName, setIconName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ai-icons');
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [usageRights, setUsageRights] = useState<'free_to_share' | 'own_rights' | 'licensed' | 'public_domain'>('own_rights');
  const [usageRightsDetails, setUsageRightsDetails] = useState('');
  
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // Refinement state
  const [refinementFeedback, setRefinementFeedback] = useState('');
  const [refinementHistory, setRefinementHistory] = useState<Array<{ 
    feedback: string; 
    timestamp: Date; 
    imageUrl: string;
    version: number;
  }>>([]);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

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

  const handleGenerate = async (isRefinement = false) => {
    const effectivePrompt = isRefinement && refinementFeedback.trim() 
      ? `${prompt}\n\nRefinement: ${refinementFeedback.trim()}`
      : prompt;
    
    if (!referenceImage || !effectivePrompt.trim()) {
      toast({
        title: 'Missing information',
        description: isRefinement 
          ? 'Please enter refinement feedback'
          : 'Please upload a reference image and enter a prompt',
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

      console.log('🎨 Starting PNG icon generation...');
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

      // ===== PNG MODE: Transform reference image =====
      console.log('🖼️ Transforming reference image to PNG...');
        
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
          prompt: effectivePrompt.trim(),
          style,
          backgroundType,
          creativityLevel,
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
        
      // Normalize to PNG
      try {
        console.log('🎨 Normalizing to PNG...');
        
        let finalImageUrl: string;
        
        if (backgroundType === 'white') {
          // User wants white background - skip removal, just convert to PNG
          console.log('⬜ User requested white background, skipping removal');
          const srcBlob = await dataUrlToBlob(data.generatedImage);
          const imgEl = await loadImage(srcBlob);
          const pngDataUrl = drawToPngDataUrl(imgEl);
          finalImageUrl = pngDataUrl;
          setGeneratedImage(pngDataUrl);
          console.log('✅ Converted to PNG with white background');
        } else {
          // User wants transparent background - ALWAYS run background removal
          console.log('🧹 Ensuring transparent background...');
          setProgressMessage('Preparing background removal...');
          const srcBlob = await dataUrlToBlob(data.generatedImage);
          const imgEl = await loadImage(srcBlob);

          let finalBlob: Blob;

          try {
            // Try AI segmentation first (best quality)
            console.log('🤖 Attempting AI background removal...');
            setProgressMessage('Loading AI background removal model...');
            finalBlob = await removeBackground(imgEl, (bgProgress: BackgroundRemovalProgress) => {
              // Map background removal progress to 90-100% range
              const mappedProgress = 90 + (bgProgress.progress * 0.1);
              setProgress(Math.round(mappedProgress));
              setProgressMessage(bgProgress.message);
            });
            console.log('✅ AI background removal successful');
          } catch (aiError) {
            // Fallback to universal flood-fill removal (handles any uniform background)
            console.warn('⚠️ AI removal failed, using flood-fill fallback:', aiError);
            setProgressMessage('Using fallback background removal...');
            finalBlob = await removeUniformBackgroundByFloodFill(imgEl, { tolerance: 30 });
            console.log('✅ Flood-fill background removal successful');
          }

          const pngDataUrl = await blobToDataUrl(finalBlob);
          finalImageUrl = pngDataUrl;
          setGeneratedImage(pngDataUrl);
          console.log('✅ Final image is PNG with transparent background');
        }
        
        // Set original image on first generation (not refinement)
        if (!isRefinement && !originalImage) {
          setOriginalImage(finalImageUrl);
        }
      } catch (procErr) {
        console.error('❌ Unable to process image:', procErr);
        // Last resort: convert to PNG (may remain opaque)
        try {
          const fallbackBlob = await dataUrlToBlob(data.generatedImage);
          const fallbackImg = await loadImage(fallbackBlob);
          const fallbackDataUrl = drawToPngDataUrl(fallbackImg);
          setGeneratedImage(fallbackDataUrl);
          
          // Set original if first generation
          if (!isRefinement && !originalImage) {
            setOriginalImage(fallbackDataUrl);
          }
        } catch {
          setGeneratedImage(data.generatedImage);
          
          // Set original if first generation
          if (!isRefinement && !originalImage) {
            setOriginalImage(data.generatedImage);
          }
        }
      }
      
      setProgress(100);
      setStage('complete');
      
      // Track refinement if this was a refinement
      if (isRefinement && refinementFeedback.trim() && generatedImage) {
        setRefinementHistory(prev => [...prev, { 
          feedback: refinementFeedback.trim(), 
          timestamp: new Date(),
          imageUrl: generatedImage,
          version: prev.length + 1
        }]);
        setRefinementFeedback('');
      }
      
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
        title: isRefinement ? 'Icon refined!' : 'Icon generated!',
        description: isRefinement ? 'Your icon has been improved based on your feedback' : 'Review and save your new PNG icon to the library',
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
      } else if (error.message?.includes('PREMIUM_REQUIRED') || error.message?.includes('403')) {
        errorMessage = 'Premium access required. Share 3+ approved public projects to unlock AI icon generation.';
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

      // Convert base64 to blob for PNG
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
        category: 'ai-icons',
        tags: ['ai-generated'],
        description: description.trim() || `AI-generated PNG icon from prompt: "${prompt}"`,
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

      // PNG - wrap in SVG
      const base64Data = generatedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      const filename = `${user.id}/submissions/ai-icon-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
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

      // Create SVG wrapper for the PNG
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <image href="${publicUrl}" width="512" height="512"/>
</svg>`;

      setProgress(75);

      // Submit to icon_submissions table for review
      const submission = await submitIcon({
        name: iconName.trim(),
        category: 'ai-icons',
        svg_content: svgContent,
        thumbnail: publicUrl,
        description: description.trim() || `AI-generated PNG icon from prompt: "${prompt}"`,
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

  const handleRevertToVersion = (imageUrl: string, version: number) => {
    setGeneratedImage(imageUrl);
    
    // Remove refinements after this version
    setRefinementHistory(prev => prev.slice(0, version));
    
    toast({
      title: 'Reverted to version',
      description: `Successfully reverted to version ${version}`,
    });
  };

  const handleReset = () => {
    setReferenceImage(null);
    setReferenceFile(null);
    setPrompt('');
    setStyle('biomedical');
    setIconName('');
    setSelectedCategory('ai-icons');
    setDescription('');
    setUsageRights('own_rights');
    setUsageRightsDetails('');
    setGeneratedImage(null);
    setStage('idle');
    setProgress(0);
    setProgressMessage('');
    setRefinementFeedback('');
    setRefinementHistory([]);
    setOriginalImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    setStage('idle');
    setProgress(0);
    setProgressMessage('');
    setRefinementHistory([]);
    setOriginalImage(null);
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
            Upload a reference image and describe how you want to transform it into a PNG icon
            {!usageLoading && usage && !usage.isAdmin && !usage.hasPremium && (
              <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-600 dark:text-amber-400">
                🔒 AI icon generation requires 3+ approved public projects. 
                Share {usage.needsApproved || 3} more project{(usage.needsApproved || 3) !== 1 ? 's' : ''} to the community to unlock this feature.
              </div>
            )}
            {!usageLoading && usage && !usage.isAdmin && usage.hasPremium && usage.remaining === 0 && (
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
            {/* Art Style Selector */}
            <div className="space-y-2">
              <Label>Art Style</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['pencil', 'biomedical', 'oil'] as StylePreset[]).map((styleKey) => (
                  <button
                    key={styleKey}
                    onClick={() => setStyle(styleKey)}
                    disabled={isGenerating || isSaving}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-all overflow-hidden",
                      style === styleKey
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50",
                      (isGenerating || isSaving) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {/* Example Preview Image */}
                    <div className="mb-2 rounded overflow-hidden border border-border/50">
                      <img 
                        src={styleDescriptions[styleKey].example} 
                        alt={`${styleDescriptions[styleKey].label} example`}
                        className="w-full h-20 object-cover"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      {styleDescriptions[styleKey].icon}
                      <span className="font-medium text-sm">{styleDescriptions[styleKey].label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {styleDescriptions[styleKey].desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Image */}
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
              <Textarea
                id="prompt"
                placeholder="e.g., simplify the design, make it monochrome, enhance contrast, apply scientific style"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating || isSaving}
                className="mt-2 min-h-[80px]"
                rows={3}
              />
            </div>

            <div>
                <Label htmlFor="background">Background Type</Label>
                <Select value={backgroundType} onValueChange={(v) => setBackgroundType(v as 'transparent' | 'white')} disabled={isGenerating || isSaving}>
                  <SelectTrigger id="background" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transparent">
                      <div>
                        <div className="font-medium">Transparent (PNG)</div>
                        <div className="text-xs text-muted-foreground">No background, ideal for overlays</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="white">
                      <div>
                        <div className="font-medium">White Background (PNG)</div>
                        <div className="text-xs text-muted-foreground">Solid white background</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
            </div>

            {/* Creativity Level Selector */}
            <div className="space-y-2">
              <Label>AI Creativity Level</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(creativityLevels).map(([key, level]) => {
                  const Icon = level.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setCreativityLevel(key as CreativityLevel)}
                      disabled={isGenerating || isSaving}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg border transition-all text-center",
                        creativityLevel === key 
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50",
                        (isGenerating || isSaving) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-sm font-medium">{level.label}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {level.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {!generatedImage && (
              <>
                <Button
                  onClick={() => handleGenerate(false)}
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
                      {usage && !usage.hasPremium && !usage.isAdmin ? '🔒 Premium Required' : 
                       usage && !usage.canGenerate ? 'Limit Reached' : 'Generate Icon'}
                    </>
                  )}
                </Button>
                
                {!usageLoading && usage && !usage.isAdmin && usage.hasPremium && (
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
                  {progressMessage || (isGenerating && 'Generating your icon with AI...') || (isSaving && 'Saving to your library...')}
                </p>
              </div>
            )}

            {generatedImage && (
              <>
                <div>
                  <Label>Generated PNG Icon</Label>
                  <div className="mt-2 border rounded-lg p-4 bg-muted/30 flex items-center justify-center">
                    <img src={generatedImage} alt="Generated" className="max-h-64 rounded" />
                  </div>
                </div>

                {/* Version Comparison Gallery */}
                {(originalImage || refinementHistory.length > 0) && (
                  <div className="space-y-2 p-3 bg-muted/30 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Version History</Label>
                      <span className="text-xs text-muted-foreground">
                        {refinementHistory.length + 1} version{refinementHistory.length !== 0 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {/* Original version */}
                      {originalImage && (
                        <div className="space-y-1">
                          <div 
                            className={cn(
                              "relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105",
                              generatedImage === originalImage ? "border-primary ring-2 ring-primary/20" : "border-border"
                            )}
                            onClick={() => handleRevertToVersion(originalImage, 0)}
                          >
                            <img src={originalImage} alt="Original" className="w-full h-20 object-contain bg-muted/50 p-1" />
                            {generatedImage === originalImage && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                                Current
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-center text-muted-foreground font-medium">Original</p>
                        </div>
                      )}
                      
                      {/* Refinement versions */}
                      {refinementHistory.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div 
                            className={cn(
                              "relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 group",
                              generatedImage === item.imageUrl ? "border-primary ring-2 ring-primary/20" : "border-border"
                            )}
                            onClick={() => handleRevertToVersion(item.imageUrl, item.version)}
                          >
                            <img src={item.imageUrl} alt={`Version ${item.version}`} className="w-full h-20 object-contain bg-muted/50 p-1" />
                            {generatedImage === item.imageUrl && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                                Current
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Undo2 className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <p className="text-[10px] text-center text-muted-foreground line-clamp-2" title={item.feedback}>
                            v{item.version}: {item.feedback}
                          </p>
                        </div>
                      ))}
                      
                      {/* Current/latest version if different from all stored versions */}
                      {generatedImage && !originalImage && refinementHistory.length === 0 && (
                        <div className="space-y-1">
                          <div className="relative border-2 border-primary ring-2 ring-primary/20 rounded-lg overflow-hidden">
                            <img src={generatedImage} alt="Current" className="w-full h-20 object-contain bg-muted/50 p-1" />
                            <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                              Current
                            </div>
                          </div>
                          <p className="text-[10px] text-center text-muted-foreground font-medium">Current</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      💡 Click any version to revert to it
                    </p>
                  </div>
                )}

                {/* Refinement Section */}
                <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold">Refine Your Icon</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Provide feedback to iteratively improve your icon
                  </p>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., make it more colorful, simplify the design, add more detail..."
                      value={refinementFeedback}
                      onChange={(e) => setRefinementFeedback(e.target.value)}
                      disabled={isGenerating || isSaving}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && refinementFeedback.trim() && !isGenerating) {
                          handleGenerate(true);
                        }
                      }}
                    />
                    <Button
                      onClick={() => handleGenerate(true)}
                      disabled={!refinementFeedback.trim() || isGenerating || isSaving}
                      size="sm"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Refine
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    💡 Tip: Each refinement uses 1 generation credit
                  </p>
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
                  <div className="mt-2 px-3 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-md flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">AI Icons</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">All AI-generated icons are automatically saved to this category</p>
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
