import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateUserColor } from './CollaboratorPresence';

interface CursorData {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastUpdated: number;
}

interface CollaboratorCursorsProps {
  projectId: string;
  canvasRef: React.RefObject<HTMLCanvasElement | HTMLDivElement>;
  zoom?: number;
  panX?: number;
  panY?: number;
}

// Throttle function to limit cursor updates
const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export function CollaboratorCursors({
  projectId,
  canvasRef,
  zoom = 1,
  panX = 0,
  panY = 0,
}: CollaboratorCursorsProps) {
  const { user } = useAuth();
  const [cursors, setCursors] = useState<Map<string, CursorData>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Clean up stale cursors (older than 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        const newCursors = new Map(prev);
        for (const [userId, cursor] of newCursors) {
          if (now - cursor.lastUpdated > 5000) {
            newCursors.delete(userId);
          }
        }
        return newCursors;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch user profile for name
  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    return data?.full_name || 'Anonymous';
  }, []);

  // Set up broadcast channel for cursor updates
  useEffect(() => {
    if (!projectId || !user) return;

    const channelName = `cursors:project:${projectId}`;
    const channel = supabase.channel(channelName);

    // Listen for cursor movements from other users
    channel.on('broadcast', { event: 'cursor_move' }, async ({ payload }) => {
      if (payload.userId === user.id) return;

      const name = await fetchUserProfile(payload.userId);

      setCursors((prev) => {
        const newCursors = new Map(prev);
        newCursors.set(payload.userId, {
          userId: payload.userId,
          name,
          color: generateUserColor(payload.userId),
          x: payload.x,
          y: payload.y,
          lastUpdated: Date.now(),
        });
        return newCursors;
      });
    });

    // Listen for cursor leave events
    channel.on('broadcast', { event: 'cursor_leave' }, ({ payload }) => {
      setCursors((prev) => {
        const newCursors = new Map(prev);
        newCursors.delete(payload.userId);
        return newCursors;
      });
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      // Notify others that this user is leaving
      channel.send({
        type: 'broadcast',
        event: 'cursor_leave',
        payload: { userId: user.id },
      });
      channel.unsubscribe();
    };
  }, [projectId, user, fetchUserProfile]);

  // Broadcast cursor position (throttled)
  const broadcastCursor = useCallback(
    throttle((x: number, y: number) => {
      if (!channelRef.current || !user) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: {
          userId: user.id,
          x,
          y,
        },
      });
    }, 33), // ~30fps
    [user]
  );

  // Track mouse movements on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Convert screen coordinates to canvas coordinates
      const x = (e.clientX - rect.left - panX) / zoom;
      const y = (e.clientY - rect.top - panY) / zoom;
      broadcastCursor(x, y);
    };

    const handleMouseLeave = () => {
      if (channelRef.current && user) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'cursor_leave',
          payload: { userId: user.id },
        });
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [canvasRef, broadcastCursor, user, zoom, panX, panY]);

  // Convert canvas coordinates back to screen coordinates for rendering
  const toScreenCoords = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: x * zoom + panX + rect.left,
      y: y * zoom + panY + rect.top,
    };
  };

  if (cursors.size === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from(cursors.values()).map((cursor) => {
        const screenPos = toScreenCoords(cursor.x, cursor.y);

        return (
          <div
            key={cursor.userId}
            className="absolute transition-all duration-75 ease-linear"
            style={{
              left: screenPos.x,
              top: screenPos.y,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Cursor pointer */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            >
              <path
                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.37-.92L5.94 2.85a.5.5 0 0 0-.44.36z"
                fill={cursor.color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>

            {/* Name label */}
            <div
              className="absolute left-4 top-4 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium text-white shadow-md"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
