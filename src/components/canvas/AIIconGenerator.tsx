import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Upload, Image as ImageIcon, Loader2, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIconSubmissions } from '@/hooks/useIconSubmissions';
import { useUserAssets } from '@/hooks/useUserAssets';
import { removeBackground, loadImage } from '@/lib/backgroundRemoval';
import { useAIGenerationUsage } from '@/hooks/useAIGenerationUsage';
import { processSVG } from '@/lib/svgProcessor';

interface AIIconGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIconGenerated?: () => void;
}

type StylePreset = 
  | 'cell-organelle' | 'cell-membrane' | 'dna-helix' | 'protein-structure'
  | 'molecular-structure' | 'organ-system' | 'lab-equipment' | 'pathway-diagram'
  | 'microscopy' | 'medical' | 'biochemical' | 'cellular' | 'simple' | 'detailed';
type GenerationStage = 'idle' | 'uploading' | 'generating' | 'saving' | 'complete' | 'error';
type GenerationMode = 'raster' | 'vector';

const styleDescriptions: Record<StylePreset, { label: string; desc: string; category: string }> = {
  // Cell Biology
  'cell-organelle': {
    label: 'Cell Organelle',
    desc: 'Detailed cellular structures with membrane compartments',
    category: 'Cell Biology'
  },
  'cell-membrane': {
    label: 'Cell Membrane',
    desc: 'Phospholipid bilayer with embedded proteins',
    category: 'Cell Biology'
  },
  'cellular': {
    label: 'Cellular',
    desc: 'General cellular biology and microscopic details',
    category: 'Cell Biology'
  },
  // Molecular Biology
  'dna-helix': {
    label: 'DNA Helix',
    desc: 'Double helix structure with base pairs',
    category: 'Molecular Biology'
  },
  'protein-structure': {
    label: 'Protein Structure',
    desc: 'Alpha helices, beta sheets, tertiary structure',
    category: 'Molecular Biology'
  },
  'biochemical': {
    label: 'Biochemical',
    desc: 'Molecular structures and pathways',
    category: 'Molecular Biology'
  },
  // Chemistry
  'molecular-structure': {
    label: 'Molecular Structure',
    desc: 'Chemical bonds and molecular geometry',
    category: 'Chemistry'
  },
  // Anatomy
  'organ-system': {
    label: 'Organ System',
    desc: 'Anatomical accuracy with tissue layers',
    category: 'Anatomy'
  },
  'medical': {
    label: 'Medical',
    desc: 'Medical illustration with anatomical accuracy',
    category: 'Anatomy'
  },
  // Laboratory
  'lab-equipment': {
    label: 'Lab Equipment',
    desc: 'Scientific glassware and precision instruments',
    category: 'Laboratory'
  },
  // Pathways
  'pathway-diagram': {
    label: 'Pathway Diagram',
    desc: 'Signaling pathways with arrows and connections',
    category: 'Pathways'
  },
  // Microscopy
  'microscopy': {
    label: 'Microscopy',
    desc: 'Microscope view with histological appearance',
    category: 'Microscopy'
  },
  // General
  'simple': {
    label: 'Simple',
    desc: 'Minimal, clear silhouette',
    category: 'General'
  },
  'detailed': {
    label: 'Detailed',
    desc: 'High detail scientific illustration',
    category: 'General'
  }
};

// Group styles by category for better organization
const styleCategories = {
  'Cell Biology': ['cell-organelle', 'cell-membrane', 'cellular'] as StylePreset[],
  'Molecular Biology': ['dna-helix', 'protein-structure', 'biochemical'] as StylePreset[],
  'Chemistry': ['molecular-structure'] as StylePreset[],
  'Anatomy': ['organ-system', 'medical'] as StylePreset[],
  'Laboratory': ['lab-equipment'] as StylePreset[],
  'Pathways': ['pathway-diagram'] as StylePreset[],
  'Microscopy': ['microscopy'] as StylePreset[],
  'General': ['simple', 'detailed'] as StylePreset[]
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

  // Generation mode
  const [generationMode, setGenerationMode] = useState<GenerationMode>('vector');
  
  // Raster mode (image transform) state
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [backgroundType, setBackgroundType] = useState<'transparent' | 'white'>('transparent');
  
  // Vector mode (text-based SVG) state - no reference image needed
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StylePreset>('simple');
  
  // Common state
  const [iconName, setIconName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Laboratory');
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [usageRights, setUsageRights] = useState<'free_to_share' | 'own_rights' | 'licensed' | 'public_domain'>('own_rights');
  const [usageRightsDetails, setUsageRightsDetails] = useState('');
  
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedSVG, setGeneratedSVG] = useState<string | null>(null);
  const [isPureVector, setIsPureVector] = useState(false);

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
    if (generationMode === 'raster') {
      // Raster mode - requires reference image
      if (!referenceImage || !prompt.trim()) {
        toast({
          title: 'Missing information',
          description: 'Please upload a reference image and enter a prompt',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Vector mode - requires only prompt
      if (!prompt.trim()) {
        toast({
          title: 'Missing information',
          description: 'Please enter a prompt describing the icon you want to create',
          variant: 'destructive',
        });
        return;
      }
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
      console.log('🔄 Mode:', generationMode);
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

      if (generationMode === 'vector') {
        // ===== VECTOR MODE: Generate SVG directly from prompt =====
        console.log('🎨 Vector mode: Generating SVG from prompt...');
        
        const { data, error } = await supabase.functions.invoke('generate-svg-icon', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          },
          body: {
            prompt: prompt.trim(),
            style,
            scientificCategory: styleDescriptions[style].category
          }
        });

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
          throw new Error(data?.error || 'SVG generation failed');
        }

        console.log('✅ SVG generated successfully');
        console.log('📊 Pure vector:', data.isPureVector);
        setProgress(90);
        
        // Process and validate SVG
        const processed = processSVG(data.svgContent);
        if (!processed.success) {
          throw new Error(processed.error || 'SVG validation failed');
        }

        setGeneratedSVG(processed.svg);
        setIsPureVector(data.isPureVector);
        
        // Create a preview image from SVG for display
        const blob = new Blob([processed.svg!], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        setGeneratedImage(url);
        
      } else {
        // ===== RASTER MODE: Transform reference image to PNG =====
        console.log('🖼️ Raster mode: Transforming reference image...');
        
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
            backgroundType,
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
          
          if (backgroundType === 'white') {
            // User wants white background - skip removal, just convert to PNG
            console.log('⬜ User requested white background, skipping removal');
            const srcBlob = await dataUrlToBlob(data.generatedImage);
            const imgEl = await loadImage(srcBlob);
            const pngDataUrl = drawToPngDataUrl(imgEl);
            setGeneratedImage(pngDataUrl);
            setGeneratedSVG(null);
            setIsPureVector(false);
            console.log('✅ Converted to PNG with white background');
          } else {
            // User wants transparent background - existing logic
            console.log('🔍 Processing for transparent background...');
            const isJpegLike = data.generatedImage.startsWith('data:image/jpeg') ||
                               data.generatedImage.startsWith('data:image/jpg') ||
                               data.generatedImage.startsWith('data:image/webp');

            const srcBlob = await dataUrlToBlob(data.generatedImage);
            const imgEl = await loadImage(srcBlob);

            const hasAlpha = detectHasTransparency(imgEl);
            const looksWhiteBG = !hasAlpha && detectIsLikelyWhiteBackground(imgEl);

            let finalBlob: Blob;

            if (isJpegLike || looksWhiteBG) {
              console.log('🧹 Making background transparent (removal path)...');
              finalBlob = await removeBackground(imgEl);
            } else {
              console.log('✅ Image already has transparency');
              const pngDataUrl = drawToPngDataUrl(imgEl);
              finalBlob = await dataUrlToBlob(pngDataUrl);
            }

            const pngDataUrl = await blobToDataUrl(finalBlob);
            setGeneratedImage(pngDataUrl);
            setGeneratedSVG(null);
            setIsPureVector(false);
            console.log('✅ Final image is PNG with transparent background');
          }
        } catch (procErr) {
          console.error('❌ Unable to process image:', procErr);
          // Last resort: convert to PNG (may remain opaque)
          try {
            const fallbackBlob = await dataUrlToBlob(data.generatedImage);
            const fallbackImg = await loadImage(fallbackBlob);
            const fallbackDataUrl = drawToPngDataUrl(fallbackImg);
            setGeneratedImage(fallbackDataUrl);
            setGeneratedSVG(null);
            setIsPureVector(false);
          } catch {
            setGeneratedImage(data.generatedImage);
            setGeneratedSVG(null);
            setIsPureVector(false);
          }
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
        description: generationMode === 'vector' 
          ? 'Vector SVG icon created! Review and save to your library.'
          : 'Review and save your new icon to the library',
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

      let file: File;
      
      if (generatedSVG && isPureVector) {
        // Save as SVG file
        const blob = new Blob([generatedSVG], { type: 'image/svg+xml' });
        file = new File([blob], `${iconName}.svg`, { type: 'image/svg+xml' });
      } else {
        // Convert base64 to blob for PNG
        const base64Data = generatedImage.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        file = new File([blob], `${iconName}.png`, { type: 'image/png' });
      }

      setProgress(75);

      console.log('[SAVE] Attempting upload:', {
        userId: user.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        category: selectedCategory,
        isVector: isPureVector
      });

      // Upload to user_assets
      const asset = await uploadAsset({
        file,
        category: selectedCategory,
        tags: isPureVector ? ['ai-generated', 'vector'] : ['ai-generated'],
        description: description.trim() || `AI-generated ${isPureVector ? 'vector' : 'raster'} icon from prompt: "${prompt}"`,
        isShared: false // Private to user
      });

      if (!asset) {
        throw new Error('Failed to save to library');
      }

      setProgress(100);
      
      toast({
        title: 'Icon saved to your library!',
        description: `"${iconName}" is now available in your personal assets as ${isPureVector ? 'a scalable vector' : 'an image'}.`,
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

      let svgContent: string;
      let publicUrl: string;

      if (generatedSVG && isPureVector) {
        // True vector SVG - upload directly
        const blob = new Blob([generatedSVG], { type: 'image/svg+xml' });
        
        const filename = `${user.id}/submissions/ai-icon-${Date.now()}.svg`;
        const { error: uploadError } = await supabase.storage
          .from('user-assets')
          .upload(filename, blob, {
            contentType: 'image/svg+xml',
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl: svgUrl } } = supabase.storage
          .from('user-assets')
          .getPublicUrl(filename);

        publicUrl = svgUrl;
        svgContent = generatedSVG; // Use the raw SVG content
        
      } else {
        // Raster PNG - wrap in SVG
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
        const { data: { publicUrl: pngUrl } } = supabase.storage
          .from('user-assets')
          .getPublicUrl(filename);

        publicUrl = pngUrl;
        
        // Create SVG wrapper for the PNG
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <image href="${publicUrl}" width="512" height="512"/>
</svg>`;
      }

      setProgress(75);

      // Submit to icon_submissions table for review
      const submission = await submitIcon({
        name: iconName.trim(),
        category: selectedCategory,
        svg_content: svgContent,
        thumbnail: publicUrl,
        description: description.trim() || `AI-generated ${isPureVector ? 'vector' : 'raster'} icon from prompt: "${prompt}"`,
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
    setGeneratedSVG(null);
    setIsPureVector(false);
    setStage('idle');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    setGeneratedSVG(null);
    setIsPureVector(false);
    setStage('idle');
    setProgress(0);
  };

  const isGenerating = stage === 'generating';
  const isSaving = stage === 'saving';
  const isComplete = stage === 'complete';
  const canGenerate = (generationMode === 'vector' || referenceImage) && prompt.trim() && !isGenerating && !isSaving;
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
            {generationMode === 'vector' 
              ? 'Describe the scientific icon you want to create and AI will generate a scalable vector SVG'
              : 'Upload a reference image and describe how you want to transform it into an icon'}
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
            {/* Generation Mode Selection */}
            <div className="space-y-2">
              <Label>Generation Mode</Label>
              <RadioGroup value={generationMode} onValueChange={(v) => setGenerationMode(v as GenerationMode)} className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="vector" id="vector" />
                  <Label htmlFor="vector" className="flex-1 cursor-pointer">
                    <div className="font-medium">Vector (SVG)</div>
                    <div className="text-xs text-muted-foreground">Create from description</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="raster" id="raster" />
                  <Label htmlFor="raster" className="flex-1 cursor-pointer">
                    <div className="font-medium">Raster (PNG)</div>
                    <div className="text-xs text-muted-foreground">Transform image</div>
                  </Label>
                </div>
              </RadioGroup>
              {generationMode === 'vector' && (
                <p className="text-xs text-muted-foreground p-2 bg-primary/5 rounded border border-primary/10">
                  ✨ Vector mode creates true scalable SVG icons directly from your description
                </p>
              )}
            </div>

            {/* Reference Image - Only show in raster mode */}
            {generationMode === 'raster' && (
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
            )}

            <div>
              <Label htmlFor="prompt">
                {generationMode === 'vector' ? 'Icon Description' : 'Transformation Prompt'}
              </Label>
              <Textarea
                id="prompt"
                placeholder={generationMode === 'vector' 
                  ? "e.g., DNA double helix with base pairs, mitochondria with cristae, beaker with liquid"
                  : "e.g., simplify the design, make it monochrome, remove background"}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating || isSaving}
                className="mt-2 min-h-[80px]"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="style">Scientific Style</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as StylePreset)} disabled={isGenerating || isSaving}>
                <SelectTrigger id="style" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(styleCategories).map(([category, styles]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{category}</div>
                      {styles.map((styleKey) => {
                        const styleInfo = styleDescriptions[styleKey];
                        return (
                          <SelectItem key={styleKey} value={styleKey}>
                            <div>
                              <div className="font-medium">{styleInfo.label}</div>
                              <div className="text-xs text-muted-foreground">{styleInfo.desc}</div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {generationMode === 'raster' && (
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
            )}

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
                  <Label>Generated Icon {isPureVector && <span className="text-xs text-primary">(Vector SVG ✨)</span>}</Label>
                  <div className="mt-2 border rounded-lg p-4 bg-muted/30 flex items-center justify-center">
                    <img src={generatedImage} alt="Generated" className="max-h-64 rounded" />
                  </div>
                  {isPureVector && (
                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-primary/5 rounded border border-primary/10">
                      ✨ This is a true vector SVG - it will scale perfectly to any size!
                    </p>
                  )}
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
