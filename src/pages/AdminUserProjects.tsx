import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Loader2, User } from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  name: string;
  canvas_width: number;
  canvas_height: number;
  updated_at: string;
  created_at: string;
  thumbnail_url: string | null;
  paper_size: string | null;
}

const AdminUserProjects = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const userName = searchParams.get('userName') || 'User';

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-user-projects', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const { data, error } = await supabase
        .from('canvas_projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!userId,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('email, full_name, country, created_at')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No user ID provided</p>
            <Button onClick={() => navigate('/admin/analytics')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/analytics')}
            className="neo-brutalist-shadow-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
          
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-black uppercase mb-2">
                Projects by {userProfile?.full_name || userName}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>{userProfile?.email}</span>
                {userProfile?.country && <span>• {userProfile.country}</span>}
                <span>• {projects?.length || 0} projects</span>
                {userProfile?.created_at && (
                  <span>• Joined {format(new Date(userProfile.created_at), 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Read-only indicator */}
          <Card className="mt-4 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-primary" />
                <span className="font-medium">Read-Only View</span>
                <span className="text-muted-foreground">
                  — You are viewing this user's projects. You cannot edit or delete them.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        {!projects || projects.length === 0 ? (
          <Card className="neo-brutalist-shadow">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground text-lg">
                This user hasn't created any projects yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="neo-brutalist-shadow hover:shadow-xl transition-all duration-200 overflow-hidden group"
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {project.thumbnail_url ? (
                    <img
                      src={project.thumbnail_url}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Eye className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      onClick={() => navigate(`/canvas?project=${project.id}&readOnly=true`)}
                      variant="secondary"
                      size="lg"
                      className="neo-brutalist-shadow"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2 truncate">{project.name}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium">
                        {project.canvas_width} × {project.canvas_height}px
                      </span>
                    </div>
                    {project.paper_size && (
                      <div className="flex justify-between">
                        <span>Paper:</span>
                        <span className="font-medium uppercase">{project.paper_size}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span className="font-medium">
                        {format(new Date(project.updated_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-medium">
                        {format(new Date(project.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserProjects;
