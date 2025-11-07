import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, FileText, Upload, Loader2 } from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface PowerPointGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PowerPointGenerator = ({ open, onOpenChange }: PowerPointGeneratorProps) => {
  const { hasAccess, remaining } = useFeatureAccess();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    onDrop: (files) => {
      if (!hasAccess) {
        toast.error(`Submit ${remaining} more approved figures to unlock PowerPoint Maker`, {
          action: {
            label: 'View Submissions',
            onClick: () => navigate('/my-submissions')
          }
        });
        return;
      }
      if (files.length > 0) {
        setSelectedFile(files[0]);
      }
    },
  });

  const handleGenerate = async () => {
    if (!hasAccess) {
      toast.error(`Submit ${remaining} more approved figure${remaining !== 1 ? 's' : ''} to unlock PowerPoint Maker`, {
        action: {
          label: 'View Submissions',
          onClick: () => navigate('/my-submissions')
        }
      });
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a Word document first');
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `word-docs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ppt-word-uploads')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      toast.success('Document uploaded! Processing will begin shortly.', {
        description: 'You can view the status in the admin PowerPoint generator.',
        action: {
          label: 'View Admin',
          onClick: () => navigate('/admin/powerpoint-generator')
        }
      });

      setSelectedFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PowerPoint Generator
          </DialogTitle>
        </DialogHeader>

        {!hasAccess && (
          <div className="bg-muted p-4 rounded-lg flex items-start gap-3">
            <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Feature Locked</p>
              <p className="text-xs text-muted-foreground mt-1">
                Submit {remaining} more approved figure{remaining !== 1 ? 's' : ''} to unlock
              </p>
            </div>
          </div>
        )}

        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive && 'border-primary bg-primary/5',
            !hasAccess && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} disabled={!hasAccess} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium">
            {selectedFile ? selectedFile.name : 'Drop your .docx file here'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse (max 10MB)
          </p>
        </div>

        {selectedFile && (
          <Button 
            onClick={handleGenerate} 
            disabled={!hasAccess || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate PowerPoint
              </>
            )}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
