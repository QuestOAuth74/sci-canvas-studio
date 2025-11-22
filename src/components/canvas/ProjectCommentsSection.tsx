import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Trash2, Reply, AtSign, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCommentsSectionProps {
  projectId: string;
}

interface Collaborator {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export function ProjectCommentsSection({ projectId }: ProjectCommentsSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadCollaborators = async () => {
    try {
      const collabs: Collaborator[] = [];
      
      // Load project owner
      const { data: project } = await supabase
        .from('canvas_projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

      if (project?.user_id) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .eq('id', project.user_id)
          .single();
        
        if (ownerProfile) {
          collabs.push(ownerProfile);
        }
      }

      // Load collaborators
      const { data: collabData } = await supabase
        .from('project_collaborators')
        .select('user_id')
        .eq('project_id', projectId)
        .not('accepted_at', 'is', null);

      if (collabData && collabData.length > 0) {
        // Fetch profiles for collaborators
        const userIds = collabData.map(c => c.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', userIds);

        if (profiles) {
          profiles.forEach(profile => {
            if (!collabs.find(c => c.id === profile.id)) {
              collabs.push(profile);
            }
          });
        }
      }

      setCollaborators(collabs);
    } catch (error: any) {
      console.error('Error loading collaborators:', error);
    }
  };

  const loadComments = async () => {
    try {
      // Load top-level comments
      const { data, error } = await supabase
        .from('project_comments')
        .select(`
          *,
          user:profiles!user_id(id, full_name, avatar_url, email)
        `)
        .eq('project_id', projectId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);

      // Load replies for each comment
      if (data && data.length > 0) {
        const { data: repliesData, error: repliesError } = await supabase
          .from('project_comments')
          .select(`
            *,
            user:profiles!user_id(id, full_name, avatar_url, email)
          `)
          .eq('project_id', projectId)
          .not('parent_comment_id', 'is', null)
          .order('created_at', { ascending: true });

        if (repliesError) throw repliesError;

        // Group replies by parent comment
        const repliesByParent: Record<string, any[]> = {};
        repliesData?.forEach(reply => {
          if (!repliesByParent[reply.parent_comment_id]) {
            repliesByParent[reply.parent_comment_id] = [];
          }
          repliesByParent[reply.parent_comment_id].push(reply);
        });
        setReplies(repliesByParent);
      }
      
      // Scroll to bottom on new comments
      setTimeout(() => {
        if (scrollRef.current) {
          const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }
        }
      }, 100);
    } catch (error: any) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });

    loadCollaborators();
    loadComments();

    // Real-time subscription for comments
    const channel = supabase
      .channel(`project-${projectId}-comments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_comments',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNewComment(value);
    setCursorPosition(cursorPos);

    // Check for @ mention
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      const hasSpace = textAfterAt.includes(' ');
      
      if (!hasSpace) {
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentions(true);
        return;
      }
    }
    
    setShowMentions(false);
    setMentionSearch('');
  };

  const insertMention = (collaborator: Collaborator) => {
    const textBeforeCursor = newComment.slice(0, cursorPosition);
    const textAfterCursor = newComment.slice(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const mentionName = collaborator.full_name || collaborator.email;
      const newText = 
        textBeforeCursor.slice(0, lastAtIndex) + 
        `@${mentionName} ` + 
        textAfterCursor;
      
      setNewComment(newText);
      setShowMentions(false);
      setMentionSearch('');
      
      // Focus textarea
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const filteredCollaborators = collaborators.filter(c => {
    if (!mentionSearch) return true;
    const name = (c.full_name || c.email).toLowerCase();
    return name.includes(mentionSearch);
  });

  const handleSendComment = async () => {
    const trimmedComment = newComment.trim();
    if (!trimmedComment) return;

    if (trimmedComment.length > 2000) {
      toast.error('Comment is too long. Maximum 2000 characters.');
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: commentData, error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          user_id: user.id,
          comment_text: trimmedComment,
          parent_comment_id: replyingTo
        })
        .select()
        .single();

      if (error) throw error;

      // Send notifications asynchronously
      if (commentData) {
        supabase.functions.invoke('send-comment-notifications', {
          body: {
            comment_id: commentData.id,
            project_id: projectId,
            comment_text: trimmedComment,
            commenter_id: user.id,
            parent_comment_id: replyingTo
          }
        }).catch(err => {
          console.error('Error sending notifications:', err);
          // Don't block user experience if notifications fail
        });
      }

      setNewComment('');
      setReplyingTo(null);
      toast.success(replyingTo ? 'Reply added' : 'Comment added');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      toast.success('Comment deleted');
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const handleResolveComment = async (commentId: string, isResolved: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('project_comments')
        .update({
          is_resolved: !isResolved,
          resolved_at: !isResolved ? new Date().toISOString() : null,
          resolved_by: !isResolved ? user.id : null
        })
        .eq('id', commentId);

      if (error) throw error;
      toast.success(isResolved ? 'Thread reopened' : 'Thread resolved');
    } catch (error: any) {
      console.error('Error resolving comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const renderComment = (comment: any, isReply: boolean = false) => {
    const commentReplies = replies[comment.id] || [];
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-10 mt-3' : ''}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.user.avatar_url} />
            <AvatarFallback>
              {getInitials(comment.user.full_name, comment.user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-medium">
                {comment.user.full_name || comment.user.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {comment.is_resolved && (
                <Badge variant="outline" className="text-xs h-5">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">
              {comment.comment_text}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setReplyingTo(isReply ? comment.parent_comment_id : comment.id);
                  const replyPrefix = `@${comment.user.full_name || comment.user.email} `;
                  setNewComment(replyPrefix);
                  textareaRef.current?.focus();
                }}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleResolveComment(comment.id, comment.is_resolved)}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {comment.is_resolved ? 'Reopen' : 'Resolve'}
                </Button>
              )}
              {comment.user_id === currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Render replies */}
        {commentReplies.length > 0 && (
          <div className="mt-3 space-y-3">
            {commentReplies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Comments List */}
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Start the discussion!</p>
            </div>
          ) : (
            comments.map(comment => renderComment(comment))
          )}
        </div>
      </ScrollArea>

      {/* New Comment Input */}
      <div className="mt-4 pt-4 border-t space-y-2">
        {replyingTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            <Reply className="h-3 w-3" />
            <span>Replying to thread</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 ml-auto"
              onClick={() => {
                setReplyingTo(null);
                setNewComment('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}
        
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleTextareaChange}
            placeholder={replyingTo ? "Write a reply... Use @ to mention" : "Add a comment... Use @ to mention collaborators"}
            rows={2}
            maxLength={2000}
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSendComment();
              }
              if (e.key === 'Escape') {
                setShowMentions(false);
                setMentionSearch('');
              }
            }}
          />
          
          {/* Mentions dropdown */}
          {showMentions && filteredCollaborators.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-auto z-10">
              {filteredCollaborators.map(collab => (
                <button
                  key={collab.id}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-left"
                  onClick={() => insertMention(collab)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={collab.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(collab.full_name, collab.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{collab.full_name || collab.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              {newComment.length}/2000
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AtSign className="h-3 w-3" />
              <span>Type @ to mention</span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleSendComment}
            disabled={!newComment.trim() || sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                {replyingTo ? 'Reply' : 'Send'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
