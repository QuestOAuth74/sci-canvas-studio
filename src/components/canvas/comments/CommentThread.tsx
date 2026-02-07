import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Reply,
  CheckCircle,
  Circle,
  Trash2,
  Edit2,
  MapPin,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CommentForm } from './CommentForm';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  comment_text: string;
  user_id: string;
  is_resolved: boolean;
  canvas_position: { x: number; y: number } | null;
  created_at: string;
  updated_at: string;
  user: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  replies?: Comment[];
}

interface CommentThreadProps {
  comment: Comment;
  isSelected?: boolean;
  onReply: (parentId: string, text: string) => Promise<void>;
  onResolve: (commentId: string) => Promise<void>;
  onUnresolve: (commentId: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onEdit?: (commentId: string, text: string) => Promise<void>;
  onPinClick?: (position: { x: number; y: number }) => void;
  onClick?: () => void;
}

export function CommentThread({
  comment,
  isSelected = false,
  onReply,
  onResolve,
  onUnresolve,
  onDelete,
  onEdit,
  onPinClick,
  onClick,
}: CommentThreadProps) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isOwner = user?.id === comment.user_id;
  const displayName = comment.user?.full_name || 'Anonymous';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleReply = async (text: string) => {
    await onReply(comment.id, text);
    setShowReplyForm(false);
  };

  const handleEdit = async (text: string) => {
    if (onEdit) {
      await onEdit(comment.id, text);
    }
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-colors cursor-pointer',
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50',
        comment.is_resolved && 'opacity-60'
      )}
      onClick={onClick}
    >
      {/* Main Comment */}
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.user?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-medium text-sm">{displayName}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {comment.canvas_position && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPinClick?.(comment.canvas_position!);
                  }}
                >
                  <MapPin className="h-3 w-3 text-primary" />
                </Button>
              )}

              {comment.is_resolved ? (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" />
                  Resolved
                </Badge>
              ) : null}

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReplyForm(true);
                    }}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>

                  {comment.is_resolved ? (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnresolve(comment.id);
                      }}
                    >
                      <Circle className="h-4 w-4 mr-2" />
                      Unresolve
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolve(comment.id);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </DropdownMenuItem>
                  )}

                  {isOwner && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(comment.id);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isEditing ? (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <CommentForm
                placeholder="Edit your comment..."
                onSubmit={handleEdit}
                onCancel={() => setIsEditing(false)}
                autoFocus
                submitLabel="Save"
              />
            </div>
          ) : (
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.comment_text}</p>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 ml-11 space-y-4 border-l-2 border-muted pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={reply.user?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {(reply.user?.full_name || 'A').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {reply.user?.full_name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{reply.comment_text}</p>
              </div>

              {user?.id === reply.user_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(reply.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm && (
        <div className="mt-4 ml-11" onClick={(e) => e.stopPropagation()}>
          <CommentForm
            placeholder="Write a reply..."
            onSubmit={handleReply}
            onCancel={() => setShowReplyForm(false)}
            autoFocus
            submitLabel="Reply"
          />
        </div>
      )}
    </div>
  );
}
