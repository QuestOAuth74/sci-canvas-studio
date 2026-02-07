import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MoreVertical,
  FolderOpen,
  Trash2,
  Eye,
  Edit,
  ShieldCheck,
  Clock,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

import noPreviewImage from '@/assets/no_preview.png';

type CollaborationRole = Database['public']['Enums']['collaboration_role'];
type LabRole = Database['public']['Enums']['lab_role'];

interface LabProject {
  id: string;
  lab_id: string;
  project_id: string;
  permission_level: CollaborationRole;
  shared_at: string;
  shared_by: string;
  project: {
    id: string;
    name: string;
    thumbnail_url: string | null;
    canvas_width: number;
    canvas_height: number;
    updated_at: string;
    user_id: string;
    owner: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  sharer: {
    full_name: string | null;
  } | null;
}

interface LabProjectsListProps {
  labId: string;
  currentUserRole: LabRole;
  onProjectsChange?: () => void;
}

const permissionIcons: Record<CollaborationRole, typeof Eye> = {
  viewer: Eye,
  editor: Edit,
  admin: ShieldCheck,
};

const permissionColors: Record<CollaborationRole, string> = {
  viewer: 'bg-gray-100 text-gray-800 border-gray-300',
  editor: 'bg-blue-100 text-blue-800 border-blue-300',
  admin: 'bg-purple-100 text-purple-800 border-purple-300',
};

export function LabProjectsList({
  labId,
  currentUserRole,
  onProjectsChange,
}: LabProjectsListProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<LabProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [projectToRemove, setProjectToRemove] = useState<LabProject | null>(null);

  const canManageProjects = currentUserRole === 'owner' || currentUserRole === 'admin';

  useEffect(() => {
    loadProjects();
  }, [labId]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lab_projects')
        .select(`
          id,
          lab_id,
          project_id,
          permission_level,
          shared_at,
          shared_by,
          project:canvas_projects (
            id,
            name,
            thumbnail_url,
            canvas_width,
            canvas_height,
            updated_at,
            user_id,
            owner:profiles (
              full_name,
              avatar_url
            )
          ),
          sharer:profiles (
            full_name
          )
        `)
        .eq('lab_id', labId)
        .order('shared_at', { ascending: false });

      if (error) throw error;
      setProjects((data as LabProject[]) || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load lab projects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/canvas?project=${projectId}`);
  };

  const handleRemoveProject = async () => {
    if (!projectToRemove) return;

    try {
      const { error } = await supabase
        .from('lab_projects')
        .delete()
        .eq('id', projectToRemove.id);

      if (error) throw error;

      toast.success('Project removed from lab');
      loadProjects();
      onProjectsChange?.();
    } catch (error: any) {
      console.error('Error removing project:', error);
      toast.error(error.message || 'Failed to remove project');
    } finally {
      setRemoveDialogOpen(false);
      setProjectToRemove(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No projects shared</h3>
        <p className="text-muted-foreground">
          Projects shared with this lab will appear here
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((labProject) => {
          const project = labProject.project;
          if (!project) return null;

          const PermissionIcon = permissionIcons[labProject.permission_level];
          const isProjectOwner = project.user_id === user?.id;

          return (
            <Card
              key={labProject.id}
              className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleOpenProject(project.id)}
            >
              {/* Thumbnail */}
              <div className="relative h-40 bg-muted">
                <img
                  src={project.thumbnail_url || noPreviewImage}
                  alt={project.name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 right-2">
                  <Badge
                    variant="outline"
                    className={`gap-1 bg-background/80 backdrop-blur-sm ${permissionColors[labProject.permission_level]}`}
                  >
                    <PermissionIcon className="h-3 w-3" />
                    {labProject.permission_level}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={project.owner?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {project.owner?.full_name?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">
                        {project.owner?.full_name || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {(canManageProjects || isProjectOwner) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProject(project.id);
                          }}
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Open Project
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToRemove(labProject);
                            setRemoveDialogOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from Lab
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(project.updated_at), {
                      addSuffix: true,
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Shared by {labProject.sharer?.full_name || 'Unknown'}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Project from Lab</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{projectToRemove?.project?.name}" from
              this lab? Lab members will no longer have access to it through the lab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
