import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Admin notification counts
 */
interface AdminNotificationCounts {
  pendingProjects: number;
  pendingTestimonials: number;
  pendingIconSubmissions: number;
  unreadMessages: number;
  totalFeedback: number;
}

/**
 * Hook to fetch admin notification counts with caching
 *
 * Uses parallel queries to fetch counts efficiently.
 *
 * Caching Strategy:
 * - staleTime: 5 minutes (data is fresh for 5 min)
 * - refetchInterval: 5 minutes (background refresh)
 * - refetchOnWindowFocus: true (refresh when admin returns)
 *
 * @returns Query result with admin notification counts
 */
export const useAdminNotificationCounts = () => {
  return useQuery<AdminNotificationCounts>({
    queryKey: ['admin-notification-counts'],
    queryFn: async () => {
      // Run all count queries in parallel for efficiency
      const [
        projectsResult,
        testimonialsResult,
        iconsResult,
        messagesResult,
        feedbackResult,
      ] = await Promise.all([
        supabase
          .from('canvas_projects')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 'pending'),
        supabase
          .from('testimonials')
          .select('id', { count: 'exact', head: true })
          .eq('is_approved', false),
        supabase
          .from('icon_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 'pending'),
        supabase
          .from('contact_messages')
          .select('id', { count: 'exact', head: true })
          .eq('is_read', false),
        supabase
          .from('tool_feedback')
          .select('id', { count: 'exact', head: true })
          .eq('is_viewed', false),
      ]);

      return {
        pendingProjects: projectsResult.count ?? 0,
        pendingTestimonials: testimonialsResult.count ?? 0,
        pendingIconSubmissions: iconsResult.count ?? 0,
        unreadMessages: messagesResult.count ?? 0,
        totalFeedback: feedbackResult.count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    refetchOnWindowFocus: true, // Refresh when admin returns to tab
    refetchOnMount: 'always', // Always fetch on mount for fresh data
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
