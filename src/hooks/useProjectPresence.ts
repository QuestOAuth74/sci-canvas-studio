import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceUser {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  online_at: string;
}

export function useProjectPresence(projectId: string | null) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!projectId || !user) {
      return;
    }

    // Create a unique channel for this project
    const presenceChannel = supabase.channel(`project:${projectId}:presence`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Listen for presence changes
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users: PresenceUser[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: PresenceUser) => {
            users.push(presence);
          });
        });
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Get user profile for presence data
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single();

          // Track this user's presence
          await presenceChannel.track({
            user_id: user.id,
            user_name: profile?.full_name || 'Anonymous',
            user_avatar: profile?.avatar_url,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(presenceChannel);

    // Cleanup on unmount
    return () => {
      presenceChannel.unsubscribe();
      supabase.removeChannel(presenceChannel);
    };
  }, [projectId, user]);

  return { onlineUsers, channel };
}
