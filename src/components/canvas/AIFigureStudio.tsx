import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Info
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
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[hsl(var(--ink-blue))]">
            <Wand2 className="h-5 w-5" />
            AI Figure Studio
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Mode Selection */}
          <div className="w-64 border-r bg-muted/30 p-4 flex flex-col gap-2">
            {(Object.keys(modeConfig) as GenerationMode[]).map((modeKey) => {
              const cfg = modeConfig[modeKey];
              const Icon = cfg.icon;
              const isActive = mode === modeKey;
              
              return (
                <button
                  key={modeKey}
                  onClick={() => handleModeChange(modeKey)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{cfg.title}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header with description */}
            <div className="p-6 pb-4">
              <h2 className="text-2xl font-bold text-[hsl(var(--ink-blue))] mb-1">
                {config.description.split(' with AI.')[0]}
              </h2>
              <p className="text-primary text-xl font-semibold">
                with AI.
              </p>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Prompt Input */}
              <div className="border rounded-xl p-4 bg-card shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span>Write a generation-ready prompt</span>
                    <span className="text-muted-foreground/60">| Be specific · Be structured</span>
                  </div>
                  <Badge variant="secondary" className="text-primary">
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
                  <div className="flex gap-2">
                    {(['flat', '3d', 'sketch'] as StyleType[]).map((s) => (
                      <Button
                        key={s}
                        variant={style === s ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStyle(s)}
                        className="capitalize"
                      >
                        {s === '3d' ? '3D' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </Button>
                    ))}
                  </div>
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
                <div className="mt-6 border rounded-xl p-4 bg-card shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Generated Figure</h3>
                  <div className="relative">
                    <img
                      src={generatedImage}
                      alt="Generated figure"
                      className="w-full rounded-lg border"
                    />
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleInsert} className="flex-1">
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
            <div className="p-6 pt-4 border-t bg-background">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
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
