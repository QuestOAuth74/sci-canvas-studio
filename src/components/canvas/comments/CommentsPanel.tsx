import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  X,
  MessageCircle,
  CheckCircle,
  Circle,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { CommentThread } from './CommentThread';
import { CommentForm } from './CommentForm';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  comment_text: string;
  user_id: string;
  is_resolved: boolean;
  canvas_position: { x: number; y: number } | null;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  user: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  replies?: Comment[];
}

interface CommentsPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  selectedCommentId?: string | null;
  onCommentSelect?: (commentId: string | null) => void;
  onPinClick?: (position: { x: number; y: number }) => void;
  isAddingComment?: boolean;
  onAddCommentModeChange?: (isAdding: boolean) => void;
  pendingCommentPosition?: { x: number; y: number } | null;
  onClearPendingPosition?: () => void;
}

type FilterType = 'all' | 'unresolved' | 'resolved';

export function CommentsPanel({
  projectId,
  isOpen,
  onClose,
  selectedCommentId,
  onCommentSelect,
  onPinClick,
  isAddingComment = false,
  onAddCommentModeChange,
  pendingCommentPosition,
  onClearPendingPosition,
}: CommentsPanelProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  // Load comments
  const loadComments = useCallback(async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('project_comments')
        .select(`
          id,
          comment_text,
          user_id,
          is_resolved,
          canvas_position,
          parent_comment_id,
          created_at,
          updated_at,
          user:profiles!project_comments_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Organize comments into threads
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      // First pass: create all comment objects
      (data || []).forEach((comment: any) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: organize into parent-child relationships
      (data || []).forEach((comment: any) => {
        const commentObj = commentMap.get(comment.id)!;
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentObj);
          }
        } else {
          rootComments.push(commentObj);
        }
      });

      // Sort replies by date
      rootComments.forEach((comment) => {
        if (comment.replies) {
          comment.replies.sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!projectId) return;

    loadComments();

    const channel = supabase
      .channel(`comments:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_comments',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, loadComments]);

  // Add new comment
  const handleAddComment = async (text: string) => {
    if (!user || !projectId) return;

    try {
      const { error } = await supabase.from('project_comments').insert({
        project_id: projectId,
        user_id: user.id,
        comment_text: text,
        canvas_position: pendingCommentPosition,
      });

      if (error) throw error;

      toast.success('Comment added');
      onClearPendingPosition?.();
      onAddCommentModeChange?.(false);
      loadComments();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.message || 'Failed to add comment');
    }
  };

  // Reply to comment
  const handleReply = async (parentId: string, text: string) => {
    if (!user || !projectId) return;

    try {
      const { error } = await supabase.from('project_comments').insert({
        project_id: projectId,
        user_id: user.id,
        comment_text: text,
        parent_comment_id: parentId,
      });

      if (error) throw error;

      toast.success('Reply added');
      loadComments();
    } catch (error: any) {
      console.error('Error adding reply:', error);
      toast.error(error.message || 'Failed to add reply');
    }
  };

  // Resolve/unresolve comment
  const handleResolve = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('project_comments')
        .update({
          is_resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment resolved');
      loadComments();
    } catch (error: any) {
      console.error('Error resolving comment:', error);
      toast.error(error.message || 'Failed to resolve comment');
    }
  };

  const handleUnresolve = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('project_comments')
        .update({
          is_resolved: false,
          resolved_by: null,
          resolved_at: null,
        })
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment reopened');
      loadComments();
    } catch (error: any) {
      console.error('Error unresolving comment:', error);
      toast.error(error.message || 'Failed to reopen comment');
    }
  };

  // Delete comment
  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment deleted');
      if (selectedCommentId === commentId) {
        onCommentSelect?.(null);
      }
      loadComments();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error(error.message || 'Failed to delete comment');
    }
  };

  // Edit comment
  const handleEdit = async (commentId: string, text: string) => {
    try {
      const { error } = await supabase
        .from('project_comments')
        .update({ comment_text: text })
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment updated');
      loadComments();
    } catch (error: any) {
      console.error('Error updating comment:', error);
      toast.error(error.message || 'Failed to update comment');
    }
  };

  // Filter comments
  const filteredComments = comments.filter((comment) => {
    switch (filter) {
      case 'unresolved':
        return !comment.is_resolved;
      case 'resolved':
        return comment.is_resolved;
      default:
        return true;
    }
  });

  const unresolvedCount = comments.filter((c) => !c.is_resolved).length;
  const resolvedCount = comments.filter((c) => c.is_resolved).length;

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-background border-l w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h2 className="font-semibold">Comments</h2>
          <Badge variant="secondary">{comments.length}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Actions Bar */}
      <div className="p-4 border-b space-y-3">
        <Button
          variant={isAddingComment ? 'secondary' : 'outline'}
          className="w-full gap-2"
          onClick={() => onAddCommentModeChange?.(!isAddingComment)}
        >
          {isAddingComment ? (
            <>
              <AlertCircle className="h-4 w-4" />
              Click on canvas to place comment
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Comment
            </>
          )}
        </Button>

        <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                All ({comments.length})
              </div>
            </SelectItem>
            <SelectItem value="unresolved">
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-yellow-500" />
                Unresolved ({unresolvedCount})
              </div>
            </SelectItem>
            <SelectItem value="resolved">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Resolved ({resolvedCount})
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* New Comment Form (when position is set) */}
      {pendingCommentPosition && (
        <div className="p-4 border-b bg-primary/5">
          <p className="text-sm text-muted-foreground mb-2">
            Adding comment at position ({Math.round(pendingCommentPosition.x)}, {Math.round(pendingCommentPosition.y)})
          </p>
          <CommentForm
            placeholder="Write your comment..."
            onSubmit={handleAddComment}
            onCancel={() => {
              onClearPendingPosition?.();
              onAddCommentModeChange?.(false);
            }}
            autoFocus
          />
        </div>
      )}

      {/* Comments List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No comments</p>
              <p className="text-sm">
                {filter !== 'all'
                  ? `No ${filter} comments found`
                  : 'Click "Add Comment" to start a discussion'}
              </p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                isSelected={selectedCommentId === comment.id}
                onReply={handleReply}
                onResolve={handleResolve}
                onUnresolve={handleUnresolve}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPinClick={onPinClick}
                onClick={() => onCommentSelect?.(comment.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
