import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type LabRole = Database['public']['Enums']['lab_role'];

interface Lab {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  owner_id: string;
}

interface LabSettingsProps {
  lab: Lab;
  currentUserRole: LabRole;
  onLabUpdated: () => void;
}

export function LabSettings({ lab, currentUserRole, onLabUpdated }: LabSettingsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [name, setName] = useState(lab.name);
  const [description, setDescription] = useState(lab.description || '');

  const isOwner = currentUserRole === 'owner';
  const canEdit = isOwner || currentUserRole === 'admin';

  useEffect(() => {
    setName(lab.name);
    setDescription(lab.description || '');
  }, [lab]);

  const handleSave = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to edit lab settings');
      return;
    }

    if (!name.trim()) {
      toast.error('Lab name is required');
      return;
    }

    if (name.trim().length > 100) {
      toast.error('Lab name must be 100 characters or less');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('labs')
        .update({
          name: name.trim(),
          description: description.trim() || null,
        })
        .eq('id', lab.id);

      if (error) throw error;

      toast.success('Lab settings updated');
      onLabUpdated();
    } catch (error: any) {
      console.error('Error updating lab:', error);
      toast.error(error.message || 'Failed to update lab settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) {
      toast.error('Only the lab owner can delete the lab');
      return;
    }

    if (deleteConfirmText !== lab.name) {
      toast.error('Please type the lab name to confirm');
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.from('labs').delete().eq('id', lab.id);

      if (error) throw error;

      toast.success('Lab deleted successfully');
      navigate('/labs');
    } catch (error: any) {
      console.error('Error deleting lab:', error);
      toast.error(error.message || 'Failed to delete lab');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleLeave = async () => {
    if (isOwner) {
      toast.error('Lab owner cannot leave. Transfer ownership or delete the lab.');
      return;
    }

    try {
      const { error } = await supabase
        .from('lab_members')
        .delete()
        .eq('lab_id', lab.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('You have left the lab');
      navigate('/labs');
    } catch (error: any) {
      console.error('Error leaving lab:', error);
      toast.error(error.message || 'Failed to leave lab');
    }
  };

  const hasChanges = name !== lab.name || description !== (lab.description || '');

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update your lab's name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lab-name">
              Lab Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lab-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter lab name"
              maxLength={100}
              disabled={!canEdit}
            />
            <p className="text-xs text-muted-foreground">{name.length}/100 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lab-description">Description</Label>
            <Textarea
              id="lab-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your lab..."
              rows={4}
              maxLength={500}
              disabled={!canEdit}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          {canEdit && (
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Leave Lab (for non-owners) */}
      {!isOwner && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-700">Leave Lab</CardTitle>
            <CardDescription>
              Leave this lab and lose access to shared projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Once you leave, you'll need a new invitation to rejoin. Your personal
              projects won't be affected.
            </p>
            <Button variant="outline" onClick={handleLeave}>
              Leave Lab
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone (for owners only) */}
      {isOwner && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions - proceed with caution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-destructive/10 rounded-lg">
              <h4 className="font-medium mb-2">Delete Lab</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete this lab and all its data. This action cannot be
                undone. All members will lose access.
              </p>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Lab
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Lab Permanently
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently
                delete the <strong>{lab.name}</strong> lab and remove all members.
              </p>
              <p>Shared projects will be unlinked but not deleted.</p>
              <div className="mt-4">
                <Label htmlFor="confirm-name" className="text-foreground">
                  Type <strong>{lab.name}</strong> to confirm:
                </Label>
                <Input
                  id="confirm-name"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Enter lab name"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || deleteConfirmText !== lab.name}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Lab'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
