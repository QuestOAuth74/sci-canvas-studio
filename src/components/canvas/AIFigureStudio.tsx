import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Pencil
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';

type GenerationMode = 'prompt_to_visual' | 'sketch_transform' | 'image_enhancer' | 'style_match';
type StyleType = 'flat' | '3d' | 'sketch';

interface AIFigureStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertImage: (imageUrl: string) => void;
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
};

const styleConfig = {
  flat: {
    label: 'Flat',
    icon: Square,
    description: 'Solid colors, clean shapes',
    preview: 'Clean vector style with uniform solid colors, sharp geometric edges, and no gradients. Perfect for diagrams and infographics.',
  },
  '3d': {
    label: '3D',
    icon: Box,
    description: 'Realistic depth & shading',
    preview: 'Rendered with realistic shadows, lighting, and material textures. Includes specular highlights and ambient occlusion for volume.',
  },
  sketch: {
    label: 'Sketch',
    icon: Pencil,
    description: 'Hand-drawn appearance',
    preview: 'Pencil or pen-like strokes with visible line work. Uses hatching for shading with an organic, notebook aesthetic.',
  },
};

export const AIFigureStudio: React.FC<AIFigureStudioProps> = ({
  open,
  onOpenChange,
  onInsertImage,
}) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<GenerationMode>('prompt_to_visual');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StyleType>('flat');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [contextImage, setContextImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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

    try {
      const { data, error } = await supabase.functions.invoke('generate-figure-gemini', {
        body: {
          mode,
          prompt: prompt.trim(),
          style,
          referenceImage: referenceImage || undefined,
          contextImage: contextImage || undefined,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedImage(data.image);
      toast({
        title: 'Figure generated',
        description: 'Your scientific figure has been created successfully.',
      });
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

  const handleInsert = () => {
    if (generatedImage) {
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
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as GenerationMode);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-background">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Figure Studio
          </DialogTitle>
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
                <div className="flex items-center gap-3 mt-4 pt-4 border-t">
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
                            <TooltipContent side="bottom" className="max-w-[220px] p-3">
                              <p className="font-medium text-sm mb-1">{cfg.label} Style</p>
                              <p className="text-xs text-muted-foreground">{cfg.preview}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </TooltipProvider>
                </div>

                {/* Image Upload Zone (for modes that require it) */}
                {config.requiresUpload && (
                  <div className="mt-4 pt-4 border-t">
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
                            {isDragActive ? 'Drop the image here' : 'Upload Context'}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            Drag and drop or click to upload
                          </p>
                        </>
                      )}
                    </div>
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
            </div>

            {/* Generate Button */}
            <div className="p-6 pt-4 border-t border-border bg-muted/10">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIFigureStudio;
