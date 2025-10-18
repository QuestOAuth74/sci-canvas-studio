import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ShareProjectDialogProps {
  project: {
    id: string;
    name: string;
    is_public?: boolean;
    title?: string | null;
    description?: string | null;
    keywords?: string[] | null;
    citations?: string | null;
    approval_status?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ShareProjectDialog({ project, isOpen, onClose, onUpdate }: ShareProjectDialogProps) {
  const [saving, setSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(project.is_public || false);
  const [title, setTitle] = useState(project.title || project.name);
  const [description, setDescription] = useState(project.description || '');
  const [citations, setCitations] = useState(project.citations || '');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(project.keywords || []);

  useEffect(() => {
    setIsPublic(project.is_public || false);
    setTitle(project.title || project.name);
    setDescription(project.description || '');
    setCitations(project.citations || '');
    setKeywords(project.keywords || []);
  }, [project]);

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed) && keywords.length < 10) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleSave = async () => {
    // Validation
    if (isPublic) {
      if (!title.trim()) {
        toast.error('Title is required for public projects');
        return;
      }
      if (title.trim().length > 100) {
        toast.error('Title must be 100 characters or less');
        return;
      }
      if (!description.trim()) {
        toast.error('Description is required for public projects');
        return;
      }
      if (description.trim().length < 10) {
        toast.error('Description must be at least 10 characters');
        return;
      }
      if (description.trim().length > 500) {
        toast.error('Description must be 500 characters or less');
        return;
      }
      if (keywords.length === 0) {
        toast.error('At least one keyword is required for public projects');
        return;
      }
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('canvas_projects')
        .update({
          is_public: isPublic,
          title: title.trim() || null,
          description: description.trim() || null,
          keywords: keywords.length > 0 ? keywords : null,
          citations: citations.trim() || null,
          approval_status: isPublic ? 'pending' : null,
        })
        .eq('id', project.id);

      if (error) throw error;

      toast.success(isPublic 
        ? 'Project submitted for admin approval. It will appear in the community once approved.' 
        : 'Project privacy updated');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast.error(error.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share to Community</DialogTitle>
          <DialogDescription>
            Submit your project for admin approval to appear in the community gallery
          </DialogDescription>
          {project.approval_status === 'pending' && project.is_public && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This project is pending admin approval.
              </AlertDescription>
            </Alert>
          )}
          {project.approval_status === 'approved' && project.is_public && (
            <Alert className="mt-4 border-green-500">
              <AlertCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                This project has been approved and is visible in the community.
              </AlertDescription>
            </Alert>
          )}
          {project.approval_status === 'rejected' && (
            <Alert className="mt-4 border-destructive">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                <p className="font-medium mb-1">This project was not approved for the community gallery.</p>
                {(project as any).rejection_reason && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    <strong>Reason:</strong> {(project as any).rejection_reason}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle">Make this project public</Label>
              <p className="text-sm text-muted-foreground">
                Public projects appear in the community gallery
              </p>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {isPublic && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Making this project public allows anyone to view and clone it to their workspace.
                </AlertDescription>
              </Alert>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title..."
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {title.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this project is about..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 characters (minimum 10)
                </p>
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label htmlFor="keywords">
                  Keywords <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="keywords"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                    placeholder="Add a keyword and press Enter..."
                    disabled={keywords.length >= 10}
                  />
                  <Button 
                    type="button" 
                    onClick={addKeyword}
                    disabled={keywords.length >= 10}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {keywords.length}/10 keywords (at least 1 required)
                </p>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Citations */}
              <div className="space-y-2">
                <Label htmlFor="citations">
                  Citations <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="citations"
                  value={citations}
                  onChange={(e) => setCitations(e.target.value)}
                  placeholder="Add any relevant citations, references, or sources..."
                  rows={3}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  {citations.length}/1000 characters
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
