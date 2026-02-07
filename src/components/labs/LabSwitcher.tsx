import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, Plus, Users, Settings, Crown, Shield, User } from 'lucide-react';
import { CreateLabDialog } from './CreateLabDialog';
import { Database } from '@/integrations/supabase/types';

type LabRole = Database['public']['Enums']['lab_role'];

interface UserLab {
  lab_id: string;
  lab_name: string;
  lab_description: string | null;
  lab_avatar_url: string | null;
  user_role: LabRole;
  member_count: number;
  project_count: number;
  joined_at: string;
}

interface LabSwitcherProps {
  currentLabId?: string;
  onLabChange?: (labId: string) => void;
}

const roleIcons: Record<LabRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const roleColors: Record<LabRole, string> = {
  owner: 'bg-amber-100 text-amber-800 border-amber-300',
  admin: 'bg-blue-100 text-blue-800 border-blue-300',
  member: 'bg-gray-100 text-gray-800 border-gray-300',
};

export function LabSwitcher({ currentLabId, onLabChange }: LabSwitcherProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [labs, setLabs] = useState<UserLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadLabs();
    }
  }, [user]);

  const loadLabs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_labs', {
        check_user_id: user.id,
      });

      if (error) throw error;
      setLabs(data || []);
    } catch (error) {
      console.error('Error loading labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentLab = labs.find((lab) => lab.lab_id === currentLabId);

  const handleLabSelect = (labId: string) => {
    if (onLabChange) {
      onLabChange(labId);
    } else {
      navigate(`/labs/${labId}`);
    }
  };

  const handleLabCreated = (labId: string) => {
    loadLabs();
    navigate(`/labs/${labId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 h-9">
            <Users className="h-4 w-4" />
            {currentLab ? (
              <span className="max-w-[120px] truncate">{currentLab.lab_name}</span>
            ) : labs.length > 0 ? (
              <span>My Labs ({labs.length})</span>
            ) : (
              <span>No Labs</span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Your Labs</span>
            <Badge variant="secondary" className="text-xs">
              {labs.length}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {labs.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No labs yet</p>
              <p className="text-xs">Create or join a lab to collaborate</p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {labs.map((lab) => {
                const RoleIcon = roleIcons[lab.user_role];
                const isSelected = lab.lab_id === currentLabId;

                return (
                  <DropdownMenuItem
                    key={lab.lab_id}
                    onClick={() => handleLabSelect(lab.lab_id)}
                    className={`flex items-start gap-3 p-3 cursor-pointer ${
                      isSelected ? 'bg-accent' : ''
                    }`}
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={lab.lab_avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {lab.lab_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{lab.lab_name}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-5 ${roleColors[lab.user_role]}`}
                        >
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {lab.user_role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{lab.member_count} members</span>
                        <span>{lab.project_count} projects</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Lab
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/labs')} className="gap-2">
            <Settings className="h-4 w-4" />
            Manage Labs
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateLabDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onLabCreated={handleLabCreated}
      />
    </>
  );
}
