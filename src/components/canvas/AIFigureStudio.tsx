import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  PenTool, 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  Wand2, 
  Download,
  Loader2,
  X,
  Info,
  Square,
  Box,
  Pencil,
  BookOpen,
  Coins,
  Layers,
  ScanSearch,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import flatExampleImg from '@/assets/ai-styles/flat-example.png';
import threeDExampleImg from '@/assets/ai-styles/3d-example.png';
import sketchExampleImg from '@/assets/ai-styles/sketch-example.png';
import { ReferenceLibraryPanel } from './ReferenceLibraryPanel';
import { ReferenceImage } from '@/lib/scientificReferenceLibrary';
import { GenerationHistoryPanel } from './GenerationHistoryPanel';
import { useAIGenerationHistory, AIGeneration } from '@/hooks/useAIGenerationHistory';
import { useAICredits, CREDITS_PER_GENERATION } from '@/hooks/useAICredits';
import { AICreditsDisplay } from './AICreditsDisplay';
import { parseEditableFigure, FigureElement } from '@/lib/editableFigureParser';
import { FabricObject } from 'fabric';
import { ReconstructionProvider, useReconstruction } from './reconstruction/ReconstructionContext';
import { ElementsSidebar } from './reconstruction/ElementsSidebar';
import { PropertiesSidebar } from './reconstruction/PropertiesSidebar';
import { convertElementsToFabricObjects } from '@/lib/figureToFabric';

type GenerationMode = 'prompt_to_visual' | 'sketch_transform' | 'image_enhancer' | 'style_match' | 'reconstruct';
type StyleType = 'flat' | '3d' | 'sketch';

interface AIFigureStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertImage: (imageUrl: string) => void;
  onInsertEditableElements?: (elements: FabricObject[]) => void;
}

const modeConfig = {
  prompt_to_visual: {
    title: 'Prompt to Visual',
    description: 'Turn text descriptions into scientific figures with AI.',
    icon: FileText,
    requiresUpload: false,
    placeholder: 'Core Subject (e.g., Cas9 protein cutting DNA)\n\nAction / Details (e.g., Double strand break, detailed molecular view)',
  },
  sketch_transform: {
    title: 'Sketch Transform',
    description: 'Turn hand-drawn notes into scientific figures with AI.',
    icon: PenTool,
    requiresUpload: true,
    placeholder: 'Describe any specific details or modifications you want applied to your sketch...',
  },
  image_enhancer: {
    title: 'Image Enhancer',
    description: 'Make images sharp, clean, and journal-ready with AI.',
    icon: Sparkles,
    requiresUpload: true,
    placeholder: 'Describe any specific enhancements or adjustments you want...',
  },
  style_match: {
    title: 'Style Match',
    description: 'Generate scientific figures in the style of your reference images with AI.',
    icon: ImageIcon,
    requiresUpload: true,
    placeholder: 'Describe what new figure you want to create in the style of your reference image...',
  },
  reconstruct: {
    title: 'Reconstruct',
    description: 'Convert images to editable elements with AI detection.',
    icon: ScanSearch,
    requiresUpload: true,
    placeholder: '',
  },
};

const styleConfig = {
  flat: {
    label: 'Flat',
    icon: Square,
    description: 'Solid colors, clean shapes',
    preview: 'Clean vector style with uniform solid colors, sharp geometric edges, and no gradients. Perfect for diagrams and infographics.',
    image: flatExampleImg,
  },
  '3d': {
    label: '3D',
    icon: Box,
    description: 'Realistic depth & shading',
    preview: 'Rendered with realistic shadows, lighting, and material textures. Includes specular highlights and ambient occlusion for volume.',
    image: threeDExampleImg,
  },
  sketch: {
    label: 'Sketch',
    icon: Pencil,
    description: 'Hand-drawn appearance',
    preview: 'Pencil or pen-like strokes with visible line work. Uses hatching for shading with an organic, notebook aesthetic.',
    image: sketchExampleImg,
  },
};

// Reconstruction Mode Content Component
function ReconstructionModeContent({ 
  onInsertEditableElements,
  onOpenChange,
}: { 
  onInsertEditableElements?: (elements: FabricObject[]) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const {
    elements,
    sourceImageUrl,
    isDetecting,
    detectionProgress,
    error,
    startDetection,
    reset,
    acceptElement,
  } = useReconstruction();

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setUploadedImage(base64);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  const handleStartDetection = async () => {
    if (!uploadedImage) return;
    await startDetection(uploadedImage);
  };

  const handleInsertElements = async () => {
    if (!onInsertEditableElements) return;
    
    // Get accepted elements
    const acceptedElements = elements.filter(e => e.status === 'accepted');
    if (acceptedElements.length === 0) {
      toast({
        title: 'No elements accepted',
        description: 'Please accept at least one element before inserting.',
        variant: 'destructive',
      });
      return;
    }

    // Convert to Fabric objects
    const fabricObjects = await convertElementsToFabricObjects(acceptedElements);
    onInsertEditableElements(fabricObjects);
    
    toast({
      title: 'Elements inserted',
      description: `${fabricObjects.length} editable elements added to canvas.`,
    });
    
    reset();
    onOpenChange(false);
  };

  const acceptedCount = elements.filter(e => e.status === 'accepted').length;
  const hasDetected = elements.length > 0;

  // Show upload UI if not detecting and no elements yet
  if (!hasDetected && !isDetecting) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <div className="border-2 border-dashed rounded-lg p-8 flex-1 flex flex-col items-center justify-center">
          {uploadedImage ? (
            <div className="text-center space-y-4">
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="max-h-[300px] rounded-lg mx-auto border"
              />
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setUploadedImage(null)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
                <Button onClick={handleStartDetection}>
                  <ScanSearch className="h-4 w-4 mr-2" />
                  Detect Elements
                </Button>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                'w-full h-full flex flex-col items-center justify-center cursor-pointer transition-colors',
                isDragActive ? 'bg-primary/5' : ''
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Upload an image to reconstruct</p>
              <p className="text-sm text-muted-foreground mt-1">
                AI will detect text, icons, arrows, and boxes
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Drag and drop or click to upload
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show detection progress
  if (isDetecting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Detecting elements...</p>
        <Progress value={detectionProgress} className="w-64 mt-4" />
        <p className="text-sm text-muted-foreground mt-2">
          Analyzing text, icons, arrows, and shapes
        </p>
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <p className="text-destructive text-lg font-medium">Detection failed</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
        <Button onClick={reset} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  // Show reconstruction UI with three-panel layout
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Sidebar - Elements */}
      <div className="w-64 flex-shrink-0">
        <ElementsSidebar />
      </div>

      {/* Center - Canvas Preview */}
      <div className="flex-1 flex flex-col overflow-hidden border-x">
        <div className="flex-1 overflow-auto p-4 bg-muted/20">
          <div className="relative inline-block">
            {sourceImageUrl && (
              <img
                src={sourceImageUrl}
                alt="Source"
                className="max-w-full rounded-lg opacity-60"
              />
            )}
            {/* Overlay for detected elements would go here */}
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="p-4 border-t bg-background">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {acceptedCount} of {elements.length} elements accepted
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>
                Start Over
              </Button>
              <Button 
                onClick={handleInsertElements}
                disabled={acceptedCount === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Insert {acceptedCount} Elements
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      <div className="w-72 flex-shrink-0">
        <PropertiesSidebar />
      </div>
    </div>
  );
}

export const AIFigureStudio: React.FC<AIFigureStudioProps> = ({
  open,
  onOpenChange,
  onInsertImage,
  onInsertEditableElements,
}) => {
  const { toast } = useToast();
  const { saveGeneration } = useAIGenerationHistory();
  const { creditsInfo, isLoading: isLoadingCredits, useCredits, isUsingCredits } = useAICredits();
  const [mode, setMode] = useState<GenerationMode>('prompt_to_visual');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StyleType>('flat');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [contextImage, setContextImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryReference, setLibraryReference] = useState<ReferenceImage | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [editableMode, setEditableMode] = useState(false);
  const [editableElements, setEditableElements] = useState<FigureElement[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextInputRef = useRef<HTMLInputElement>(null);

  const config = modeConfig[mode];

  const handleImageUpload = useCallback((file: File, isContext: boolean = false) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (isContext) {
        setContextImage(base64);
      } else {
        setReferenceImage(base64);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleImageUpload(acceptedFiles[0], false);
    }
  }, [handleImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  const handleGenerate = async () => {
    // Check credits first (skip for admins)
    if (!creditsInfo?.isAdmin && !creditsInfo?.canGenerate) {
      toast({
        title: 'Not enough credits',
        description: `You need ${CREDITS_PER_GENERATION} credits to generate. Share projects to earn bonus credits!`,
        variant: 'destructive',
      });
      return;
    }

    if (!prompt.trim() && mode === 'prompt_to_visual') {
      toast({
        title: 'Prompt required',
        description: 'Please enter a description for your figure.',
        variant: 'destructive',
      });
      return;
    }

    if (config.requiresUpload && !referenceImage) {
      toast({
        title: 'Image required',
        description: 'Please upload an image to process.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setEditableElements(null);

    try {
      // Use credits before generation (skip for admins)
      if (!creditsInfo?.isAdmin) {
        await useCredits();
      }

      // If using library reference, fetch it as base64
      let libraryImageBase64: string | undefined;
      if (libraryReference && !referenceImage) {
        try {
          const response = await fetch(libraryReference.imagePath);
          const blob = await response.blob();
          libraryImageBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error('Failed to load library reference:', err);
        }
      }

      // Use editable figure endpoint if editable mode is on and we're in prompt_to_visual mode
      if (editableMode && mode === 'prompt_to_visual' && onInsertEditableElements) {
        const { data, error } = await supabase.functions.invoke('generate-editable-figure', {
          body: {
            prompt: prompt.trim(),
            style,
          },
        });

        if (error) {
          throw error;
        }

        if (!data.success) {
          throw new Error(data.error || 'Generation failed');
        }

        setEditableElements(data.elements);
        
        toast({
          title: 'Editable figure generated',
          description: `${data.elements.length} editable elements created. ${creditsInfo?.isAdmin ? '' : `${creditsInfo?.remainingCredits ? creditsInfo.remainingCredits - CREDITS_PER_GENERATION : 0} credits remaining.`}`,
        });
      } else {
        // Standard raster image generation
        const { data, error } = await supabase.functions.invoke('generate-figure-gemini', {
          body: {
            mode,
            prompt: prompt.trim(),
            style,
            referenceImage: referenceImage || libraryImageBase64 || undefined,
            contextImage: contextImage || undefined,
            libraryReferenceId: libraryReference?.id,
            libraryReferenceCategory: libraryReference?.category,
          },
        });

        if (error) {
          throw error;
        }

        if (!data.success) {
          throw new Error(data.error || 'Generation failed');
        }

        setGeneratedImage(data.image);
        
        // Save to generation history
        await saveGeneration({
          prompt: prompt.trim(),
          style,
          creativity_level: 'medium',
          background_type: 'transparent',
          reference_image_url: referenceImage || libraryImageBase64 || '',
          generated_image_url: data.image,
        });
        
        toast({
          title: 'Figure generated',
          description: `Your scientific figure has been created. ${creditsInfo?.isAdmin ? '' : `${creditsInfo?.remainingCredits ? creditsInfo.remainingCredits - CREDITS_PER_GENERATION : 0} credits remaining.`}`,
        });
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'An error occurred during generation.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = async () => {
    if (editableElements && onInsertEditableElements) {
      // Parse editable elements into Fabric objects
      const figureId = `figure-${Date.now()}`;
      const parsedObjects = await parseEditableFigure(editableElements, figureId);
      const fabricObjects = parsedObjects.map(p => p.fabricObject);
      
      if (fabricObjects.length > 0) {
        onInsertEditableElements(fabricObjects);
        onOpenChange(false);
        resetState();
        toast({
          title: 'Editable figure inserted',
          description: `${fabricObjects.length} elements added to canvas. Select any element to edit it.`,
        });
      }
    } else if (generatedImage) {
      onInsertImage(generatedImage);
      onOpenChange(false);
      resetState();
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `figure-${Date.now()}.png`;
      link.click();
    }
  };

  const resetState = () => {
    setPrompt('');
    setReferenceImage(null);
    setContextImage(null);
    setGeneratedImage(null);
    setLibraryReference(null);
    setShowLibrary(false);
    setEditableElements(null);
  };

  const handleSelectLibraryReference = (image: ReferenceImage) => {
    setLibraryReference(image);
    setReferenceImage(null); // Clear uploaded image when selecting from library
    setShowLibrary(false);
  };

  const clearLibraryReference = () => {
    setLibraryReference(null);
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as GenerationMode);
    resetState();
  };

  const handleReusePrompt = (generation: AIGeneration) => {
    setPrompt(generation.prompt);
    setStyle(generation.style as StyleType);
    // If there was a reference image, we could set it too
    if (generation.reference_image_url) {
      setReferenceImage(generation.reference_image_url);
    }
    toast({
      title: 'Prompt loaded',
      description: 'Previous generation settings have been applied.',
    });
  };

  // For reconstruct mode, show special full-width layout
  if (mode === 'reconstruct') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 gap-0 bg-background">
          <DialogHeader className="p-4 pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <ScanSearch className="h-5 w-5 text-primary" />
                Reconstruct Figure
              </DialogTitle>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleModeChange('prompt_to_visual')}
                >
                  ← Back to Studio
                </Button>
                <AICreditsDisplay variant="compact" />
              </div>
            </div>
          </DialogHeader>

          <ReconstructionProvider>
            <ReconstructionModeContent 
              onInsertEditableElements={onInsertEditableElements}
              onOpenChange={onOpenChange}
            />
          </ReconstructionProvider>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-background">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <Wand2 className="h-5 w-5 text-primary" />
              AI Figure Studio
            </DialogTitle>
            <AICreditsDisplay variant="compact" />
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Mode Selection */}
          <div className="w-64 border-r bg-muted/10 p-4 flex flex-col gap-1">
            {(Object.keys(modeConfig) as GenerationMode[]).map((modeKey) => {
              const cfg = modeConfig[modeKey];
              const Icon = cfg.icon;
              const isActive = mode === modeKey;
              
              return (
                <button
                  key={modeKey}
                  onClick={() => handleModeChange(modeKey)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors border',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{cfg.title}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* Header with description */}
            <div className="p-6 pb-4 border-b border-border/50">
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {config.description.split(' with AI.')[0]}
              </h2>
              <p className="text-primary text-lg font-medium">
                with AI.
              </p>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Prompt Input */}
              <div className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span>Write a generation-ready prompt</span>
                    <span className="text-muted-foreground/60">| Be specific · Be structured</span>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Enhance
                  </Badge>
                </div>

                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={config.placeholder}
                  className="min-h-[100px] resize-none border-none bg-transparent p-0 focus-visible:ring-0 text-base"
                />

                {/* Style Selection */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">STYLE</span>
                    <TooltipProvider delayDuration={200}>
                      <div className="flex gap-2">
                        {(['flat', '3d', 'sketch'] as StyleType[]).map((s) => {
                          const cfg = styleConfig[s];
                          const Icon = cfg.icon;
                          return (
                            <Tooltip key={s}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={style === s ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setStyle(s)}
                                  className="gap-1.5"
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  {cfg.label}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="w-[200px] p-0 overflow-hidden">
                                <img 
                                  src={cfg.image} 
                                  alt={`${cfg.label} style example`} 
                                  className="w-full h-28 object-cover"
                                />
                                <div className="p-2.5">
                                  <p className="font-medium text-sm mb-0.5">{cfg.label} Style</p>
                                  <p className="text-xs text-muted-foreground leading-snug">{cfg.preview}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </TooltipProvider>
                  </div>

                  {/* Editable Mode Toggle - only show for prompt_to_visual mode */}
                  {mode === 'prompt_to_visual' && onInsertEditableElements && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="editable-mode" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5">
                              <Layers className="h-3.5 w-3.5" />
                              Editable
                            </Label>
                            <Switch
                              id="editable-mode"
                              checked={editableMode}
                              onCheckedChange={setEditableMode}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[250px]">
                          <p className="text-sm font-medium mb-1">Editable Output Mode</p>
                          <p className="text-xs text-muted-foreground">
                            Generate figures as separate editable elements. You can replace individual icons, 
                            modify arrows, and adjust each component after insertion.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {/* Image Upload Zone (for modes that require it) */}
                {config.requiresUpload && (
                  <div className="mt-4 pt-4 border-t">
                    {/* Toggle between Upload and Library */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-muted-foreground">REFERENCE</span>
                      <div className="flex gap-1">
                        <Button
                          variant={!showLibrary ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setShowLibrary(false)}
                          className="h-7 text-xs gap-1"
                        >
                          <Upload className="h-3 w-3" />
                          Upload
                        </Button>
                        <Button
                          variant={showLibrary ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setShowLibrary(true)}
                          className="h-7 text-xs gap-1"
                        >
                          <BookOpen className="h-3 w-3" />
                          Library
                        </Button>
                      </div>
                    </div>

                    {/* Library Reference Preview */}
                    {libraryReference && !showLibrary && (
                      <div className="mb-3 p-3 border rounded-lg bg-muted/20">
                        <div className="flex items-start gap-3">
                          <img
                            src={libraryReference.imagePath}
                            alt={libraryReference.name}
                            className="w-20 h-20 object-cover rounded-md border"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm truncate">{libraryReference.name}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={clearLibraryReference}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {libraryReference.description}
                            </p>
                            <Badge variant="secondary" className="text-[10px] mt-1.5">
                              {libraryReference.category.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {showLibrary ? (
                      <div className="h-[280px]">
                        <ReferenceLibraryPanel
                          onSelectReference={handleSelectLibraryReference}
                          selectedId={libraryReference?.id}
                          onClose={() => setShowLibrary(false)}
                        />
                      </div>
                    ) : !libraryReference && (
                      <div
                        {...getRootProps()}
                        className={cn(
                          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
                        )}
                      >
                        <input {...getInputProps()} />
                        {referenceImage ? (
                          <div className="relative inline-block">
                            <img
                              src={referenceImage}
                              alt="Reference"
                              className="max-h-40 rounded-lg mx-auto"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReferenceImage(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {isDragActive ? 'Drop the image here' : 'Upload your own reference'}
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              Drag and drop or click to upload
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Generated Image Preview */}
              {generatedImage && (
                <div className="mt-6 border border-border rounded-lg p-4 bg-card">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Generated Figure</h3>
                  <div className="relative">
                    <img
                      src={generatedImage}
                      alt="Generated figure"
                      className="w-full rounded-md border border-border"
                    />
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleInsert} className="flex-1 bg-primary hover:bg-primary/90">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Insert into Canvas
                      </Button>
                      <Button variant="outline" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Editable Elements Preview */}
              {editableElements && editableElements.length > 0 && (
                <div className="mt-6 border border-border rounded-lg p-4 bg-card">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Editable Figure Elements ({editableElements.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto">
                    {editableElements.map((element) => (
                      <div
                        key={element.id}
                        className="border rounded-md p-2 bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {element.type}
                          </Badge>
                        </div>
                        <p className="text-xs font-medium truncate">{element.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleInsert} className="flex-1 bg-primary hover:bg-primary/90">
                      <Layers className="h-4 w-4 mr-2" />
                      Insert as Editable Elements
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Each element can be selected and edited independently on the canvas
                  </p>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="p-6 pt-4 border-t border-border bg-muted/10 space-y-3">
              {!creditsInfo?.isAdmin && !creditsInfo?.canGenerate && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                  <p className="text-sm text-destructive font-medium">
                    Not enough credits. Share projects to earn bonus credits!
                  </p>
                </div>
              )}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || isUsingCredits || (!creditsInfo?.isAdmin && !creditsInfo?.canGenerate)}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isGenerating || isUsingCredits ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {isUsingCredits ? 'Using credits...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    Generate
                    {!creditsInfo?.isAdmin && (
                      <Badge variant="secondary" className="ml-2 bg-primary-foreground/20">
                        <Coins className="h-3 w-3 mr-1" />
                        {CREDITS_PER_GENERATION}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </div>

            {/* Generation History Panel */}
            <GenerationHistoryPanel
              onReusePrompt={handleReusePrompt}
              isExpanded={showHistory}
              onToggleExpand={() => setShowHistory(!showHistory)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIFigureStudio;
