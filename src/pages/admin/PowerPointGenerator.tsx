import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PowerPointTemplateSelector } from '@/components/admin/PowerPointTemplateSelector';
import { PowerPointGenerationList } from '@/components/admin/PowerPointGenerationList';
import { PowerPointTemplateBuilder } from '@/components/admin/PowerPointTemplateBuilder';
import { PowerPointPreviewModal } from '@/components/admin/PowerPointPreviewModal';
import { PowerPointSettingsPanel, type PresentationSettings } from '@/components/admin/PowerPointSettingsPanel';
import { SEOHead } from '@/components/SEO/SEOHead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Loader2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { analyzeDocx, type DocxPreviewData } from '@/lib/docxAnalyzer';

export default function PowerPointGenerator() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('scientific-report');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<DocxPreviewData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [presentationSettings, setPresentationSettings] = useState<PresentationSettings>({
    primaryColor: '#2563EB',
    accentColor: '#3B82F6',
    fontPairing: 'modern-sans',
    layoutDensity: 'balanced',
  });
  const queryClient = useQueryClient();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        toast.success('File selected successfully');
      }
    },
    onDropRejected: (rejections) => {
      const error = rejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        toast.error('File too large. Maximum size is 10MB');
      } else if (error?.code === 'file-invalid-type') {
        toast.error('Invalid file type. Please upload a .docx file');
      } else {
        toast.error('Failed to upload file');
      }
    },
  });

  const handlePreview = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsAnalyzing(true);

    try {
      const preview = await analyzeDocx(selectedFile);
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(`Failed to analyze document: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setShowPreview(false);
    setIsGenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload Word document to storage
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('ppt-word-uploads')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Create database record
      const { data: generation, error: insertError } = await supabase
        .from('powerpoint_generations')
        .insert({
          user_id: user.id,
          original_filename: selectedFile.name,
          generated_filename: selectedFile.name.replace('.docx', '.pptx'),
          template_name: selectedTemplate,
          storage_path: '', // Will be updated by edge function
          word_doc_path: fileName,
          status: 'processing',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call edge function to generate PowerPoint
      const { error: functionError } = await supabase.functions.invoke('generate-powerpoint', {
        body: {
          generationId: generation.id,
          wordDocPath: fileName,
          templateId: selectedTemplate,
        },
      });

      if (functionError) throw functionError;

      toast.success('PowerPoint generation started!');
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['powerpoint-generations'] });

      // Poll for completion
      const pollInterval = setInterval(async () => {
        const { data: updated } = await supabase
          .from('powerpoint_generations')
          .select('status')
          .eq('id', generation.id)
          .single();

        if (updated?.status === 'completed') {
          clearInterval(pollInterval);
          toast.success('PowerPoint generated successfully!');
          queryClient.invalidateQueries({ queryKey: ['powerpoint-generations'] });
        } else if (updated?.status === 'failed') {
          clearInterval(pollInterval);
          toast.error('PowerPoint generation failed');
          queryClient.invalidateQueries({ queryKey: ['powerpoint-generations'] });
        }
      }, 3000);

      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);

    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(`Failed to generate: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <SEOHead
        title="PowerPoint Generator - Admin"
        description="Convert Word documents to PowerPoint presentations"
      />
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">PowerPoint Generator</h1>
          <p className="text-muted-foreground">
            Convert Word documents to PowerPoint presentations using AI
          </p>
        </div>

        <Tabs defaultValue="generate" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - File Upload & Template */}
          <div className="space-y-6 lg:col-span-2">
            {/* File Upload */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>Upload a Word document (.docx, max 10MB)</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300",
                    isDragActive
                      ? 'border-primary bg-primary/10 scale-[1.02]'
                      : 'border-border hover:border-primary/50 hover:bg-accent/5'
                  )}
                >
                  <input {...getInputProps()} />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-3 animate-fade-in">
                      <FileText className="h-12 w-12 text-primary" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {isDragActive ? 'Drop file here' : 'Click or drag file to upload'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Word documents only (.docx)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Select Template</CardTitle>
                <CardDescription>Choose a presentation style</CardDescription>
              </CardHeader>
              <CardContent>
                <PowerPointTemplateSelector
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={setSelectedTemplate}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settings Panel */}
          <div className="lg:col-span-1">
            <PowerPointSettingsPanel
              settings={presentationSettings}
              onSettingsChange={setPresentationSettings}
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center gap-3">
          <Button
            size="lg"
            variant="outline"
            onClick={handlePreview}
            disabled={!selectedFile || isAnalyzing || isGenerating}
            className="min-w-[200px]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </>
            )}
          </Button>
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={!selectedFile || isGenerating || isAnalyzing}
            className="min-w-[200px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Generate PowerPoint
              </>
            )}
          </Button>
        </div>

        <PowerPointPreviewModal
          open={showPreview}
          onOpenChange={setShowPreview}
          previewData={previewData}
          onConfirm={handleGenerate}
          isGenerating={isGenerating}
        />
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Template Builder</CardTitle>
                <CardDescription>
                  Create custom templates with your own colors, fonts, and layouts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PowerPointTemplateBuilder />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Generation History</CardTitle>
                <CardDescription>View and download your generated presentations</CardDescription>
              </CardHeader>
              <CardContent>
                <PowerPointGenerationList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
