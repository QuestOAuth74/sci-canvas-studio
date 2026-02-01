import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Upload, Image as ImageIcon, Loader2, ArrowLeft, Save, RefreshCw, Target, Scale, Undo2, Pencil, Shapes, Palette, Send, X, Clock, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIconSubmissions } from '@/hooks/useIconSubmissions';
import { useUserAssets } from '@/hooks/useUserAssets';
import { removeBackground, loadImage, removeUniformBackgroundByFloodFill } from '@/lib/backgroundRemoval';
import { useAIGenerationUsage } from '@/hooks/useAIGenerationUsage';
import { useAIGenerationHistory } from '@/hooks/useAIGenerationHistory';
import { cn } from '@/lib/utils';
import pencilExample from '@/assets/ai-icon-styles/pencil-example.jpg';
import biomedicalExample from '@/assets/ai-icon-styles/biomedical-example.jpg';
import oilExample from '@/assets/ai-icon-styles/oil-example.jpg';
import { isLocalAIEnabled, generateIconLocal } from '@/services/localAI';
import { AICreditsAccessPopup } from './AICreditsAccessPopup';

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
    desc: 'Hand-drawn scientific sketch with fine line work',
    icon: <Pencil className="h-5 w-5" />,
    example: pencilExample
  },
  biomedical: {
    label: 'Biomedical Vector',
    desc: 'Clean flat vectors - publication ready',
    icon: <Shapes className="h-5 w-5" />,
    example: biomedicalExample
  },
  oil: {
    label: 'Oil Painting',
    desc: 'Rich textured brushstrokes',
    icon: <Palette className="h-5 w-5" />,
    example: oilExample
  }
};

const creativityLevels = {
  faithful: { label: 'Faithful', icon: Target, description: 'Closely follows reference' },
  balanced: { label: 'Balanced', icon: Scale, description: 'Moderate interpretation' },
  creative: { label: 'Creative', icon: Sparkles, description: 'Artistic freedom' }
};

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

export const AIIconGenerator = ({ open, onOpenChange, onIconGenerated }: AIIconGeneratorProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { submitIcon } = useIconSubmissions();
  const { uploadAsset } = useUserAssets();
  const { usage, isLoading: usageLoading, refetch: refetchUsage } = useAIGenerationUsage();
  const { 
    generations, 
    loading: historyLoading,
    saveGeneration, 
    markSavedToLibrary, 
    markSubmittedForReview 
  } = useAIGenerationHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [backgroundType, setBackgroundType] = useState<'transparent' | 'white'>('transparent');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StylePreset>('biomedical');
  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>('balanced');
  const [iconName, setIconName] = useState('');
  const [description, setDescription] = useState('');
  const [usageRights, setUsageRights] = useState<'free_to_share' | 'own_rights' | 'licensed' | 'public_domain'>('own_rights');
  const [usageRightsDetails, setUsageRightsDetails] = useState('');
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [refinementFeedback, setRefinementFeedback] = useState('');
  const [refinementHistory, setRefinementHistory] = useState<Array<{ feedback: string; timestamp: Date; imageUrl: string; version: number }>>([]);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [showAccessPopup, setShowAccessPopup] = useState(false);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 10MB', variant: 'destructive' });
      return;
    }
    setReferenceFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setReferenceImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [toast]);

  const handleGenerate = async (isRefinement = false) => {
    // Check if user can generate (has credits/access)
    if (usage && !usage.isAdmin && !usage.canGenerate) {
      setShowAccessPopup(true);
      return;
    }

    const effectivePrompt = isRefinement && refinementFeedback.trim() ? `${prompt}\n\nRefinement: ${refinementFeedback.trim()}` : prompt;
    if (!referenceImage || !effectivePrompt.trim()) {
      toast({ title: 'Missing information', description: 'Please upload a reference image and enter a prompt', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Authentication required', description: 'Please sign in', variant: 'destructive' });
      return;
    }

    let progressInterval: NodeJS.Timeout | null = null;
    try {
      setStage('generating');
      setProgress(10);

      const startTime = Date.now();
      progressInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setProgress(Math.min(90, 10 + (elapsed / 60) * 80));
      }, 1000);

      let data: { success: boolean; generatedImage?: string; imageUrl?: string; error?: string };

      if (isLocalAIEnabled()) {
        // Use local AI for icon generation
        const result = await generateIconLocal({
          prompt: effectivePrompt.trim(),
          referenceImage,
          style,
          creativityLevel,
          backgroundColor: backgroundType,
        });
        data = {
          success: result.success,
          generatedImage: result.imageUrl,
          error: result.error
        };
      } else {
        // Use Supabase edge function
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!session || sessionError) {
          toast({ title: 'Session expired', description: 'Please sign in again', variant: 'destructive' });
          setStage('idle');
          if (progressInterval) clearInterval(progressInterval);
          return;
        }

        const result = await supabase.functions.invoke('generate-icon-from-reference', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { image: referenceImage, prompt: effectivePrompt.trim(), style, backgroundType, creativityLevel }
        });

        if (result.error) throw result.error;
        data = result.data;
      }

      if (progressInterval) clearInterval(progressInterval);
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      setProgress(90);
      let finalImageUrl: string;
      if (backgroundType === 'white') {
        const srcBlob = await dataUrlToBlob(data.generatedImage);
        const imgEl = await loadImage(srcBlob);
        finalImageUrl = drawToPngDataUrl(imgEl);
      } else {
        setProgressMessage('Removing background with AI...');
        const srcBlob = await dataUrlToBlob(data.generatedImage);
        const imgEl = await loadImage(srcBlob);
        try {
          setProgress(92);
          const finalBlob = await removeBackground(imgEl);
          setProgress(98);
          finalImageUrl = await blobToDataUrl(finalBlob);
        } catch {
          setProgressMessage('Using fallback background removal...');
          const fallbackBlob = await removeUniformBackgroundByFloodFill(imgEl, { tolerance: 30 });
          finalImageUrl = await blobToDataUrl(fallbackBlob);
        }
      }
      setGeneratedImage(finalImageUrl);
      if (!isRefinement && !originalImage) setOriginalImage(finalImageUrl);
      
      // Auto-save to generation history
      if (referenceImage) {
        const savedGen = await saveGeneration({
          prompt: effectivePrompt.trim(),
          style,
          creativity_level: creativityLevel,
          background_type: backgroundType,
          reference_image_url: referenceImage,
          generated_image_url: finalImageUrl,
          icon_name: iconName.trim() || undefined,
          description: description.trim() || undefined
        });
        if (savedGen) {
          setCurrentGenerationId(savedGen.id);
        }
      }
      
      setProgress(100);
      setStage('complete');
      if (isRefinement && refinementFeedback.trim()) {
        setRefinementHistory(prev => [...prev, { feedback: refinementFeedback.trim(), timestamp: new Date(), imageUrl: generatedImage!, version: prev.length + 1 }]);
        setRefinementFeedback('');
      }
      await refetchUsage();
      if (!iconName) {
        const suggested = prompt.trim().split(' ').slice(0, 3).join(' ').replace(/[^a-zA-Z0-9\s]/g, '');
        setIconName(suggested);
      }
      toast({ title: isRefinement ? 'Icon refined!' : 'Icon generated!', description: 'Review and save your icon' });
    } catch (error: any) {
      if (progressInterval) clearInterval(progressInterval);
      console.error('Error generating icon:', error);
      setStage('error');
      toast({ title: 'Generation failed', description: error.message || 'Please try again', variant: 'destructive' });
    }
  };

  const handleSaveToMyLibrary = async () => {
    if (!generatedImage || !iconName.trim() || !user) return;
    try {
      setStage('saving');
      setProgress(25);
      const base64Data = generatedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'image/png' });
      
      // Convert Blob to File
      const file = new File([blob], `${iconName.trim()}.png`, { type: 'image/png' });
      
      setProgress(50);
      const result = await uploadAsset({ 
        file, 
        category: 'ai-icons', 
        description: description.trim() || undefined 
      });
      if (!result) throw new Error('Failed to upload');
      
      // Mark as saved in history
      if (currentGenerationId) {
        await markSavedToLibrary(currentGenerationId);
      }
      
      setProgress(100);
      toast({ title: 'Icon saved!', description: `"${iconName}" has been added to your library` });
      await refetchUsage();
      handleReset();
      onOpenChange(false);
      onIconGenerated?.();
    } catch (error: any) {
      console.error('Error saving icon to library:', error);
      setStage('error');
      toast({ title: 'Save failed', description: error.message || 'Please try again', variant: 'destructive' });
    }
  };

  const handleSubmitToPublic = async () => {
    if (!generatedImage || !iconName.trim() || !user) return;
    try {
      setStage('saving');
      setProgress(25);
      const base64Data = generatedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'image/png' });
      const filename = `${user.id}/submissions/ai-icon-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from('user-assets').upload(filename, blob, { contentType: 'image/png', cacheControl: '3600' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('user-assets').getPublicUrl(filename);
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><image href="${publicUrl}" width="512" height="512"/></svg>`;
      setProgress(75);
      const submission = await submitIcon({
        name: iconName.trim(),
        category: 'ai-icons',
        svg_content: svgContent,
        thumbnail: publicUrl,
        description: description.trim() || `AI-generated icon: "${prompt}"`,
        usage_rights: usageRights,
        usage_rights_details: usageRightsDetails.trim() || undefined
      });
      if (!submission) throw new Error('Failed to submit');
      
      // Mark as submitted in history
      if (currentGenerationId) {
        await markSubmittedForReview(currentGenerationId);
      }
      
      setProgress(100);
      toast({ title: 'Icon submitted!', description: `"${iconName}" will be reviewed` });
      await refetchUsage();
      handleReset();
      onOpenChange(false);
      onIconGenerated?.();
    } catch (error: any) {
      console.error('Error submitting icon:', error);
      setStage('error');
      toast({ title: 'Submission failed', description: error.message || 'Please try again', variant: 'destructive' });
    }
  };

  const handleRevertToVersion = (imageUrl: string, version: number) => {
    setGeneratedImage(imageUrl);
    setRefinementHistory(prev => prev.slice(0, version));
    toast({ title: 'Reverted', description: `Reverted to version ${version}` });
  };

  const handleReset = () => {
    setReferenceImage(null);
    setReferenceFile(null);
    setPrompt('');
    setStyle('biomedical');
    setIconName('');
    setDescription('');
    setUsageRights('own_rights');
    setUsageRightsDetails('');
    setGeneratedImage(null);
    setCurrentGenerationId(null);
    setStage('idle');
    setProgress(0);
    setProgressMessage('');
    setRefinementFeedback('');
    setRefinementHistory([]);
    setOriginalImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadPreviousGeneration = (gen: any) => {
    setReferenceImage(gen.reference_image_url);
    setGeneratedImage(gen.generated_image_url);
    setCurrentGenerationId(gen.id);
    setPrompt(gen.prompt);
    setIconName(gen.icon_name || '');
    setDescription(gen.description || '');
    setStyle(gen.style);
    setCreativityLevel(gen.creativity_level);
    setBackgroundType(gen.background_type);
    setStage('complete');
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
  const canGenerate = referenceImage && prompt.trim() && !isGenerating && !isSaving;
  const canSave = generatedImage && iconName.trim() && !isSaving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col">
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-pink-500/20 p-6 border-b flex-shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,0,255,0.15),transparent_50%)] animate-pulse-soft" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,0,150,0.1),transparent_50%)] animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <DialogHeader className="relative z-10">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-3">
                <div className="relative">
                  <Sparkles className="h-6 w-6 text-violet-500 animate-pulse" />
                  <div className="absolute inset-0 animate-ping"><Sparkles className="h-6 w-6 text-violet-500 opacity-20" /></div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">AI Icon Generator</span>
              </span>
              {!usageLoading && usage && !usage.isAdmin && (
                <Badge variant={usage.remaining === 0 ? "destructive" : "secondary"} className="gap-1.5">
                  <span className={cn("inline-block w-2 h-2 rounded-full animate-pulse", usage.remaining === 0 ? "bg-destructive-foreground" : "bg-green-500")} />
                  {usage.remaining === 0 ? 'Limit reached' : `${usage.remaining} left`}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Transform reference images into stunning scientific icons
              {!usageLoading && usage && !usage.isAdmin && !usage.hasPremium && (
                <div className="mt-3 p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-600 dark:text-amber-400">
                  🔒 Share {usage.needsApproved || 3} more to unlock
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Recent Generations Gallery */}
          {generations.length > 0 && stage === 'idle' && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Generations
                </h3>
                <span className="text-xs text-muted-foreground">{generations.length} total</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {generations.slice(0, 10).map((gen) => (
                  <button
                    key={gen.id}
                    onClick={() => loadPreviousGeneration(gen)}
                    className="group relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 border-primary/20 hover:border-primary/60 transition-all hover:scale-105"
                  >
                    <img 
                      src={gen.generated_image_url} 
                      alt={gen.prompt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="text-[10px] text-white truncate font-medium">{gen.prompt}</p>
                        <div className="flex gap-1 mt-0.5">
                          {gen.is_saved_to_library && (
                            <span className="text-[8px] bg-green-500/20 text-green-300 px-1 rounded">Saved</span>
                          )}
                          {gen.is_submitted_for_review && (
                            <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1 rounded">Submitted</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Art Style</Label>
                <div className="grid grid-cols-3 gap-4">
                  {(['pencil', 'biomedical', 'oil'] as StylePreset[]).map((styleKey) => (
                    <button
                      key={styleKey}
                      onClick={() => setStyle(styleKey)}
                      disabled={isGenerating || isSaving}
                      className={cn(
                        "group relative rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                        style === styleKey ? "border-primary ring-4 ring-primary/30" : "border-border",
                        (isGenerating || isSaving) && "opacity-50 pointer-events-none"
                      )}
                    >
                      <div className="relative">
                        <img src={styleDescriptions[styleKey].example} alt={styleDescriptions[styleKey].label} className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="flex items-center gap-2 text-white">{styleDescriptions[styleKey].icon}<span className="font-semibold text-sm">{styleDescriptions[styleKey].label}</span></div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Reference Image</Label>
                <div
                  className={cn("relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-primary hover:bg-primary/5", referenceImage && "border-primary bg-primary/5")}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {referenceImage ? (
                    <div className="relative">
                      <img src={referenceImage} alt="Reference" className="mx-auto max-h-56 rounded-lg shadow-lg" />
                      <button onClick={(e) => { e.stopPropagation(); setReferenceImage(null); }} className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-16 w-16 mx-auto text-muted-foreground animate-bounce-subtle" />
                      <p className="text-base font-medium">Click to upload</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </div>

              <Textarea id="prompt" placeholder="Describe transformation..." value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isGenerating || isSaving} className="min-h-[100px]" rows={4} />

              <div className="grid grid-cols-3 gap-3">
                {Object.entries(creativityLevels).map(([key, level]) => {
                  const Icon = level.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setCreativityLevel(key as CreativityLevel)}
                      className={cn("p-4 rounded-xl border-2 text-center hover:scale-105", creativityLevel === key ? "border-primary bg-primary/10 ring-4 ring-primary/20" : "border-border")}
                    >
                      <Icon className="h-6 w-6 mb-2 mx-auto text-primary" />
                      <span className="text-sm font-semibold">{level.label}</span>
                    </button>
                  );
                })}
              </div>

              {!generatedImage && (
                <Button onClick={() => handleGenerate(false)} disabled={!canGenerate || (usage && !usage.canGenerate)} className="w-full h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:scale-[1.02]" size="lg">
                  {isGenerating ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-5 w-5 mr-2" />Generate Icon</>}
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {(isGenerating || isSaving) && (
                <div className="flex flex-col items-center justify-center py-16 space-y-6 bg-gradient-to-br from-violet-500/5 to-pink-500/5 rounded-2xl border-2 border-primary/20">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center animate-glow">
                      <Sparkles className="h-12 w-12 text-white animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">{isGenerating ? 'Creating Masterpiece' : 'Saving'}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{progressMessage || 'AI magic...'}</p>
                  </div>
                  <div className="w-full max-w-sm"><Progress value={progress} className="h-2" /></div>
                </div>
              )}

              {generatedImage && !isGenerating && !isSaving && (
                <div className="space-y-4">
                  <div className="relative group rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl">
                    <div className="p-8 flex items-center justify-center"><img src={generatedImage} alt="Generated" className="max-h-80 object-contain" /></div>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-violet-500/5 to-pink-500/5 border-2 border-violet-500/20 rounded-2xl">
                    <div className="flex gap-2">
                      <Input placeholder="Refine..." value={refinementFeedback} onChange={(e) => setRefinementFeedback(e.target.value)} className="rounded-full h-12" />
                      <Button onClick={() => handleGenerate(true)} disabled={!refinementFeedback.trim()} className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Input placeholder="Icon name" value={iconName} onChange={(e) => setIconName(e.target.value)} className="h-11" />
                  <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>
              )}

              {!generatedImage && !isGenerating && !isSaving && (
                <div className="h-full flex items-center justify-center p-12 bg-gradient-to-br from-muted/20 to-transparent rounded-2xl border-2 border-dashed">
                  <div className="text-center">
                    <ImageIcon className="h-20 w-20 mx-auto text-muted-foreground/30 animate-float" />
                    <p className="text-base font-medium text-muted-foreground mt-4">Your AI icon will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Options - Now inside scrollable area */}
          {generatedImage && !isGenerating && !isSaving && (
            <div className="mt-6 pt-6 border-t space-y-4">
              {/* Clear Save Options with Visual Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-center">Save Your Icon</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Save to My Library */}
                  <button
                    onClick={handleSaveToMyLibrary}
                    disabled={!canSave || (currentGenerationId ? generations.find(g => g.id === currentGenerationId)?.is_saved_to_library : false)}
                    className="group relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 hover:border-primary/50 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <div className="p-3 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                      <Save className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold mb-1">My Library</p>
                      <p className="text-xs text-muted-foreground">Save privately to your assets</p>
                    </div>
                    {currentGenerationId && generations.find(g => g.id === currentGenerationId)?.is_saved_to_library && (
                      <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Saved
                      </Badge>
                    )}
                  </button>

                  {/* Submit to Community */}
                  <button
                    onClick={handleSubmitToPublic}
                    disabled={!canSave || (currentGenerationId ? generations.find(g => g.id === currentGenerationId)?.is_submitted_for_review : false)}
                    className="group relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-600/10 hover:from-blue-500/10 hover:to-blue-600/20 hover:border-blue-500/50 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <div className="p-3 rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                      <Send className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold mb-1">Submit to Community</p>
                      <p className="text-xs text-muted-foreground">Share with everyone (requires review)</p>
                    </div>
                    {currentGenerationId && generations.find(g => g.id === currentGenerationId)?.is_submitted_for_review && (
                      <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="ghost" onClick={handleReset} size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />Start Over
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* AI Credits Access Popup */}
      <AICreditsAccessPopup
        open={showAccessPopup}
        onOpenChange={setShowAccessPopup}
      />
    </Dialog>
  );
};
