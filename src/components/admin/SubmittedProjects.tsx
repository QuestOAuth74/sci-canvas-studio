import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Project {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  keywords: string[] | null;
  citations: string | null;
  approval_status: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  cloned_count: number;
  thumbnail_url: string | null;
  user_id: string;
}

export function SubmittedProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('canvas_projects')
        .select('*')
        .eq('is_public', true)
        .eq('approval_status', activeTab)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [activeTab]);

  const handleApprove = async (projectId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('canvas_projects')
        .update({ 
          approval_status: 'approved',
          rejection_reason: null 
        })
        .eq('id', projectId);

      if (error) throw error;
      
      toast.success('Project approved successfully');
      loadProjects();
    } catch (error: any) {
      console.error('Error approving project:', error);
      toast.error('Failed to approve project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProject || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('canvas_projects')
        .update({ 
          approval_status: 'rejected',
          rejection_reason: rejectionReason.trim()
        })
        .eq('id', selectedProject.id);

      if (error) throw error;
      
      toast.success('Project rejected');
      setShowRejectDialog(false);
      setSelectedProject(null);
      setRejectionReason('');
      loadProjects();
    } catch (error: any) {
      console.error('Error rejecting project:', error);
      toast.error('Failed to reject project');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (project: Project) => {
    setSelectedProject(project);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submitted Projects</CardTitle>
          <CardDescription>
            Review and manage project submissions for the community gallery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No {activeTab} projects found
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          {/* Thumbnail */}
                          {project.thumbnail_url && (
                            <div className="flex-shrink-0">
                              <img 
                                src={project.thumbnail_url} 
                                alt={project.title || project.name}
                                className="w-32 h-32 object-cover rounded-lg border"
                              />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold">{project.title || project.name}</h3>
                                  {getStatusBadge(project.approval_status)}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Submitted {new Date(project.updated_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {project.description && (
                              <p className="text-sm">{project.description}</p>
                            )}

                            {project.keywords && project.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {project.keywords.map((keyword, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {project.citations && (
                              <div className="text-sm">
                                <span className="font-medium">Citations: </span>
                                <span className="text-muted-foreground">{project.citations}</span>
                              </div>
                            )}

                            {project.rejection_reason && activeTab === 'rejected' && (
                              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                                <p className="text-sm text-muted-foreground mt-1">{project.rejection_reason}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {project.view_count} views
                              </span>
                              <span className="flex items-center gap-1">
                                <ExternalLink className="h-4 w-4" />
                                {project.cloned_count} clones
                              </span>
                            </div>

                            {/* Actions */}
                            {activeTab === 'pending' && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(project.id)}
                                  disabled={actionLoading}
                                  className="gap-2"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openRejectDialog(project)}
                                  disabled={actionLoading}
                                  className="gap-2"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            )}

                            {activeTab === 'approved' && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openRejectDialog(project)}
                                  disabled={actionLoading}
                                  className="gap-2"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Revoke Approval
                                </Button>
                              </div>
                            )}

                            {activeTab === 'rejected' && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(project.id)}
                                  disabled={actionLoading}
                                  className="gap-2"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Project</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this project. This will be visible to the project owner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this project cannot be approved..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {rejectionReason.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}