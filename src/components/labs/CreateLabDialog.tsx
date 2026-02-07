import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface CreateLabDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLabCreated: (labId: string) => void;
}

export function CreateLabDialog({ isOpen, onClose, onLabCreated }: CreateLabDialogProps) {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!user) {
      toast.error('You must be logged in to create a lab');
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

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('labs')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          owner_id: user.id,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Lab created successfully');
      onLabCreated(data.id);
      handleClose();
    } catch (error: any) {
      console.error('Error creating lab:', error);
      toast.error(error.message || 'Failed to create lab');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Lab
          </DialogTitle>
          <DialogDescription>
            Create a lab to collaborate with your team on projects
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="lab-name">
              Lab Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lab-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Molecular Biology Lab"
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/100 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lab-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="lab-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this lab is about..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Lab'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
