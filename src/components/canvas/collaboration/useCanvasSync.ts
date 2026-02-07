import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CanvasChange {
  type: 'object_added' | 'object_modified' | 'object_removed' | 'objects_grouped' | 'objects_ungrouped';
  objectId: string;
  objectIds?: string[];
  changes?: Record<string, any>;
  userId: string;
  timestamp: number;
}

interface ObjectLock {
  objectId: string;
  userId: string;
  userName: string;
  lockedAt: number;
}

interface UseCanvasSyncOptions {
  projectId: string;
  onRemoteChange?: (change: CanvasChange) => void;
  onLockChange?: (locks: Map<string, ObjectLock>) => void;
}

export function useCanvasSync({
  projectId,
  onRemoteChange,
  onLockChange,
}: UseCanvasSyncOptions) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [locks, setLocks] = useState<Map<string, ObjectLock>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingChangesRef = useRef<CanvasChange[]>([]);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    return data?.full_name || 'Someone';
  }, []);

  // Set up the sync channel
  useEffect(() => {
    if (!projectId || !user) return;

    const channelName = `canvas_sync:project:${projectId}`;
    const channel = supabase.channel(channelName);

    // Listen for canvas changes
    channel.on('broadcast', { event: 'canvas_change' }, ({ payload }) => {
      if (payload.userId === user.id) return;

      onRemoteChange?.(payload as CanvasChange);
    });

    // Listen for object locks
    channel.on('broadcast', { event: 'object_lock' }, async ({ payload }) => {
      if (payload.userId === user.id) return;

      const userName = await fetchUserProfile(payload.userId);

      setLocks((prev) => {
        const newLocks = new Map(prev);
        newLocks.set(payload.objectId, {
          objectId: payload.objectId,
          userId: payload.userId,
          userName,
          lockedAt: Date.now(),
        });
        onLockChange?.(newLocks);
        return newLocks;
      });
    });

    // Listen for object unlocks
    channel.on('broadcast', { event: 'object_unlock' }, ({ payload }) => {
      setLocks((prev) => {
        const newLocks = new Map(prev);
        newLocks.delete(payload.objectId);
        onLockChange?.(newLocks);
        return newLocks;
      });
    });

    channel.subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED');

      // Send any pending changes after reconnection
      if (status === 'SUBSCRIBED' && pendingChangesRef.current.length > 0) {
        pendingChangesRef.current.forEach((change) => {
          channel.send({
            type: 'broadcast',
            event: 'canvas_change',
            payload: change,
          });
        });
        pendingChangesRef.current = [];
      }
    });

    channelRef.current = channel;

    // Clean up stale locks periodically
    const lockCleanupInterval = setInterval(() => {
      const now = Date.now();
      setLocks((prev) => {
        const newLocks = new Map(prev);
        for (const [objectId, lock] of newLocks) {
          // Remove locks older than 30 seconds (user may have disconnected)
          if (now - lock.lockedAt > 30000) {
            newLocks.delete(objectId);
          }
        }
        if (newLocks.size !== prev.size) {
          onLockChange?.(newLocks);
        }
        return newLocks;
      });
    }, 5000);

    return () => {
      clearInterval(lockCleanupInterval);
      channel.unsubscribe();
    };
  }, [projectId, user, onRemoteChange, onLockChange, fetchUserProfile]);

  // Broadcast a canvas change
  const broadcastChange = useCallback(
    (change: Omit<CanvasChange, 'userId' | 'timestamp'>) => {
      if (!user) return;

      const fullChange: CanvasChange = {
        ...change,
        userId: user.id,
        timestamp: Date.now(),
      };

      if (channelRef.current && isConnected) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'canvas_change',
          payload: fullChange,
        });
      } else {
        // Queue for later if disconnected
        pendingChangesRef.current.push(fullChange);
      }
    },
    [user, isConnected]
  );

  // Lock an object for editing
  const lockObject = useCallback(
    (objectId: string) => {
      if (!channelRef.current || !user) return;

      // Check if already locked by someone else
      const existingLock = locks.get(objectId);
      if (existingLock && existingLock.userId !== user.id) {
        return false; // Cannot lock, already locked by someone else
      }

      channelRef.current.send({
        type: 'broadcast',
        event: 'object_lock',
        payload: {
          objectId,
          userId: user.id,
        },
      });

      return true;
    },
    [user, locks]
  );

  // Unlock an object
  const unlockObject = useCallback(
    (objectId: string) => {
      if (!channelRef.current || !user) return;

      // Only unlock if we hold the lock
      const existingLock = locks.get(objectId);
      if (existingLock && existingLock.userId !== user.id) {
        return; // Cannot unlock someone else's lock
      }

      channelRef.current.send({
        type: 'broadcast',
        event: 'object_unlock',
        payload: {
          objectId,
          userId: user.id,
        },
      });
    },
    [user, locks]
  );

  // Check if an object is locked by someone else
  const isLockedByOther = useCallback(
    (objectId: string): ObjectLock | null => {
      const lock = locks.get(objectId);
      if (lock && lock.userId !== user?.id) {
        return lock;
      }
      return null;
    },
    [locks, user]
  );

  return {
    isConnected,
    locks,
    broadcastChange,
    lockObject,
    unlockObject,
    isLockedByOther,
  };
}
