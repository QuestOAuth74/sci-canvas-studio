import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Collaborator {
  id: string;
  name: string;
  avatarUrl: string | null;
  color: string;
  cursorX?: number;
  cursorY?: number;
  lastSeen: number;
}

interface CollaboratorPresenceProps {
  projectId: string;
  onCollaboratorsChange?: (collaborators: Collaborator[]) => void;
}

// Generate a consistent color for a user based on their ID
const generateUserColor = (userId: string): string => {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

export function CollaboratorPresence({
  projectId,
  onCollaboratorsChange,
}: CollaboratorPresenceProps) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .single();

    return data;
  }, []);

  useEffect(() => {
    if (!projectId || !user) return;

    const channelName = `presence:project:${projectId}`;
    const presenceChannel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Handle presence sync
    presenceChannel.on('presence', { event: 'sync' }, async () => {
      const presenceState = presenceChannel.presenceState();
      const newCollaborators: Collaborator[] = [];

      for (const [userId, presences] of Object.entries(presenceState)) {
        if (userId === user.id) continue; // Skip self

        const presence = (presences as any[])[0];
        if (!presence) continue;

        newCollaborators.push({
          id: userId,
          name: presence.name || 'Unknown',
          avatarUrl: presence.avatarUrl || null,
          color: presence.color || generateUserColor(userId),
          cursorX: presence.cursorX,
          cursorY: presence.cursorY,
          lastSeen: Date.now(),
        });
      }

      setCollaborators(newCollaborators);
      onCollaboratorsChange?.(newCollaborators);
    });

    // Handle join events
    presenceChannel.on('presence', { event: 'join' }, async ({ key, newPresences }) => {
      if (key === user.id) return;

      const presence = newPresences[0];
      if (!presence) return;

      // Toast notification could be added here
      console.log(`${presence.name || 'Someone'} joined the project`);
    });

    // Handle leave events
    presenceChannel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      if (key === user.id) return;

      const presence = leftPresences[0];
      if (!presence) return;

      console.log(`${presence.name || 'Someone'} left the project`);
    });

    // Subscribe to the channel
    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Get current user profile
        const profile = await fetchUserProfile(user.id);

        // Track presence
        await presenceChannel.track({
          name: profile?.full_name || user.email || 'Anonymous',
          avatarUrl: profile?.avatar_url,
          color: generateUserColor(user.id),
          onlineAt: new Date().toISOString(),
        });
      }
    });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [projectId, user, fetchUserProfile, onCollaboratorsChange]);

  // Update cursor position
  const updateCursor = useCallback(
    (x: number, y: number) => {
      if (!channel || !user) return;

      channel.track({
        cursorX: x,
        cursorY: y,
      });
    },
    [channel, user]
  );

  if (collaborators.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* Avatar Stack */}
        <div className="flex -space-x-2">
          {collaborators.slice(0, 4).map((collab, index) => (
            <Tooltip key={collab.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'relative rounded-full ring-2 ring-background transition-transform hover:z-10 hover:scale-110',
                  )}
                  style={{ zIndex: 4 - index }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={collab.avatarUrl || undefined} />
                    <AvatarFallback
                      style={{ backgroundColor: collab.color }}
                      className="text-white text-xs font-medium"
                    >
                      {collab.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <span
                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{collab.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Overflow indicator */}
          {collaborators.length > 4 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background">
                  <span className="text-xs font-medium">
                    +{collaborators.length - 4}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {collaborators
                    .slice(4)
                    .map((c) => c.name)
                    .join(', ')}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Viewing count */}
        <span className="ml-2 text-sm text-muted-foreground">
          {collaborators.length} viewing
        </span>
      </div>
    </TooltipProvider>
  );
}

// Export the color generator for use in cursor rendering
export { generateUserColor };
