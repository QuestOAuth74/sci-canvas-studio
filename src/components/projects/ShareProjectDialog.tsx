import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, X, AlertCircle, Globe, Lock, Users, Eye, Edit, ShieldCheck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateProjectThumbnail } from '@/lib/thumbnailGenerator';
import { Database } from '@/integrations/supabase/types';

type CollaborationRole = Database['public']['Enums']['collaboration_role'];
type LabRole = Database['public']['Enums']['lab_role'];

interface UserLab {
  lab_id: string;
  lab_name: string;
  user_role: LabRole;
  member_count: number;
}

interface LabShare {
  lab_id: string;
  lab_name: string;
  permission_level: CollaborationRole;
}

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

const permissionDescriptions: Record<CollaborationRole, string> = {
  viewer: 'Can view and clone the project',
  editor: 'Can view, clone, and edit the project',
  admin: 'Full access including sharing permissions',
};

const permissionIcons: Record<CollaborationRole, typeof Eye> = {
  viewer: Eye,
  editor: Edit,
  admin: ShieldCheck,
};

export function ShareProjectDialog({ project, isOpen, onClose, onUpdate }: ShareProjectDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('community');
  const [saving, setSaving] = useState(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);

  // Community sharing state
  const [isPublic, setIsPublic] = useState(project.is_public || false);
  const [title, setTitle] = useState(project.title || project.name);
  const [description, setDescription] = useState(project.description || '');
  const [citations, setCitations] = useState(project.citations || '');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(project.keywords || []);

  // Lab sharing state
  const [userLabs, setUserLabs] = useState<UserLab[]>([]);
  const [labShares, setLabShares] = useState<LabShare[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<CollaborationRole>('viewer');
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [sharingToLab, setSharingToLab] = useState(false);

  useEffect(() => {
    setIsPublic(project.is_public || false);
    setTitle(project.title || project.name);
    setDescription(project.description || '');
    setCitations(project.citations || '');
    setKeywords(project.keywords || []);
  }, [project]);

  useEffect(() => {
    if (isOpen && user) {
      loadUserLabs();
      loadLabShares();
    }
  }, [isOpen, user, project.id]);

  const loadUserLabs = async () => {
    if (!user) return;
    setLoadingLabs(true);
    try {
      const { data, error } = await supabase.rpc('get_user_labs', {
        check_user_id: user.id,
      });

      if (error) throw error;
      setUserLabs(data || []);
    } catch (error) {
      console.error('Error loading labs:', error);
    } finally {
      setLoadingLabs(false);
    }
  };

  const loadLabShares = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_projects')
        .select(`
          lab_id,
          permission_level,
          lab:labs (
            name
          )
        `)
        .eq('project_id', project.id);

      if (error) throw error;

      const shares: LabShare[] = (data || []).map((item: any) => ({
        lab_id: item.lab_id,
        lab_name: item.lab?.name || 'Unknown Lab',
        permission_level: item.permission_level,
      }));

      setLabShares(shares);
    } catch (error) {
      console.error('Error loading lab shares:', error);
    }
  };

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

  const generateThumbnail = async (): Promise<string | null> => {
    try {
      setGeneratingThumbnail(true);

      const { data: projectData, error: fetchError } = await supabase
        .from('canvas_projects')
        .select('canvas_data, canvas_width, canvas_height')
        .eq('id', project.id)
        .single();

      if (fetchError || !projectData) {
        console.error('Error fetching canvas data:', fetchError);
        return null;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      return await generateProjectThumbnail(
        projectData.canvas_data,
        projectData.canvas_width,
        projectData.canvas_height,
        project.id,
        user.id
      );
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    } finally {
      setGeneratingThumbnail(false);
    }
  };

  const handleSaveCommunity = async () => {
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
      let thumbnailUrl = null;

      if (isPublic) {
        thumbnailUrl = await generateThumbnail();
        if (!thumbnailUrl) {
          toast.error('Warning: Could not generate preview image, but project will still be saved', {
            duration: 5000,
          });
        }
      }

      const { error } = await supabase
        .from('canvas_projects')
        .update({
          is_public: isPublic,
          title: title.trim() || null,
          description: description.trim() || null,
          keywords: keywords.length > 0 ? keywords : null,
          citations: citations.trim() || null,
          approval_status: isPublic ? 'pending' : null,
          thumbnail_url: thumbnailUrl,
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

  const handleShareToLab = async () => {
    if (!selectedLabId || !user) {
      toast.error('Please select a lab');
      return;
    }

    // Check if already shared
    if (labShares.some(s => s.lab_id === selectedLabId)) {
      toast.error('Project is already shared with this lab');
      return;
    }

    setSharingToLab(true);
    try {
      const { error } = await supabase.from('lab_projects').insert({
        lab_id: selectedLabId,
        project_id: project.id,
        shared_by: user.id,
        permission_level: selectedPermission,
      });

      if (error) throw error;

      const labName = userLabs.find(l => l.lab_id === selectedLabId)?.lab_name;
      toast.success(`Project shared with ${labName}`);

      loadLabShares();
      setSelectedLabId('');
      setSelectedPermission('viewer');
    } catch (error: any) {
      console.error('Error sharing to lab:', error);
      toast.error(error.message || 'Failed to share project');
    } finally {
      setSharingToLab(false);
    }
  };

  const handleRemoveLabShare = async (labId: string) => {
    try {
      const { error } = await supabase
        .from('lab_projects')
        .delete()
        .eq('project_id', project.id)
        .eq('lab_id', labId);

      if (error) throw error;

      toast.success('Project removed from lab');
      loadLabShares();
    } catch (error: any) {
      console.error('Error removing lab share:', error);
      toast.error(error.message || 'Failed to remove share');
    }
  };

  // Filter out labs that already have the project shared
  const availableLabs = userLabs.filter(
    lab => !labShares.some(s => s.lab_id === lab.lab_id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            Share your project with the community or your lab members
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="community" className="gap-2">
              <Globe className="h-4 w-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="labs" className="gap-2">
              <Users className="h-4 w-4" />
              Labs
            </TabsTrigger>
          </TabsList>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6 mt-4">
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
                <CheckCircle className="h-4 w-4 text-green-500" />
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

            <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="p-4" onClick={() => setIsPublic(!isPublic)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isPublic ? (
                      <Globe className="h-5 w-5 text-primary" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-semibold cursor-pointer">
                          Share to Community
                        </Label>
                        <Badge variant={isPublic ? "default" : "secondary"}>
                          {isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isPublic
                          ? "This project will be visible in the community gallery after approval"
                          : "Only you can see this project"
                        }
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="public-toggle"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </Card>

            {isPublic && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Making this project public allows anyone to view and clone it to their workspace.
                  </AlertDescription>
                </Alert>

                <Alert className="border-orange-500 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-900">
                    <strong>Security Notice:</strong> Ensure your diagram doesn't contain sensitive or confidential information.
                    All content (text, annotations, metadata) will be publicly visible after approval.
                  </AlertDescription>
                </Alert>

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

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSaveCommunity} disabled={saving || generatingThumbnail}>
                {saving || generatingThumbnail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {generatingThumbnail ? 'Generating preview...' : 'Saving...'}
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Labs Tab */}
          <TabsContent value="labs" className="space-y-6 mt-4">
            {/* Current Lab Shares */}
            {labShares.length > 0 && (
              <div className="space-y-2">
                <Label>Currently Shared With</Label>
                <div className="space-y-2">
                  {labShares.map((share) => {
                    const PermIcon = permissionIcons[share.permission_level];
                    return (
                      <div
                        key={share.lab_id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{share.lab_name}</span>
                          <Badge variant="outline" className="gap-1">
                            <PermIcon className="h-3 w-3" />
                            {share.permission_level}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLabShare(share.lab_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Share to New Lab */}
            {userLabs.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-1">No Labs Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create or join a lab to share projects with your team
                </p>
                <Button variant="outline" onClick={() => {
                  onClose();
                  window.location.href = '/labs';
                }}>
                  Go to Labs
                </Button>
              </div>
            ) : availableLabs.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This project is already shared with all your labs.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Share with Lab</Label>
                  <Select value={selectedLabId} onValueChange={setSelectedLabId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lab..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLabs.map((lab) => (
                        <SelectItem key={lab.lab_id} value={lab.lab_id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{lab.lab_name}</span>
                            <span className="text-muted-foreground text-xs">
                              ({lab.member_count} members)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Permission Level</Label>
                  <Select
                    value={selectedPermission}
                    onValueChange={(v) => setSelectedPermission(v as CollaborationRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['viewer', 'editor', 'admin'] as CollaborationRole[]).map((perm) => {
                        const PermIcon = permissionIcons[perm];
                        return (
                          <SelectItem key={perm} value={perm}>
                            <div className="flex items-center gap-2">
                              <PermIcon className="h-4 w-4" />
                              <div>
                                <span className="font-medium capitalize">{perm}</span>
                                <span className="text-muted-foreground text-xs ml-2">
                                  - {permissionDescriptions[perm]}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleShareToLab}
                  disabled={!selectedLabId || sharingToLab}
                  className="w-full"
                >
                  {sharingToLab ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Share with Lab
                    </>
                  )}
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
