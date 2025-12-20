import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * User analytics data
 */
interface UserAnalyticsData {
  id: string;
  email: string;
  full_name: string;
  country: string | null;
  field_of_study: string | null;
  avatar_url: string | null;
  quote: string | null;
  created_at: string;
  last_login_at: string | null;
  project_count: number;
}

/**
 * Response from useUserAnalytics hook
 */
interface UserAnalyticsResponse {
  users: UserAnalyticsData[];
  totalCount: number;
}

/**
 * Hook to fetch user analytics with pagination
 *
 * Fetches profiles with project counts using efficient queries.
 *
 * @param page - Current page number (1-indexed)
 * @param itemsPerPage - Number of items per page (default: 20)
 * @returns Query result with paginated users and total count
 */
export const useUserAnalytics = (page: number = 1, itemsPerPage: number = 20) => {
  return useQuery<UserAnalyticsResponse>({
    queryKey: ['user-analytics', page, itemsPerPage],
    queryFn: async () => {
      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      // Get paginated profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, country, field_of_study, avatar_url, quote, created_at, last_login_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        return {
          users: [],
          totalCount: totalCount ?? 0,
        };
      }

      // Get project counts for these users
      const userIds = profiles.map(p => p.id);
      const { data: projectCounts, error: countsError } = await supabase
        .from('canvas_projects')
        .select('user_id')
        .in('user_id', userIds);

      if (countsError) {
        console.error('Error fetching project counts:', countsError);
      }

      // Count projects per user
      const countMap = new Map<string, number>();
      if (projectCounts) {
        projectCounts.forEach(p => {
          countMap.set(p.user_id, (countMap.get(p.user_id) ?? 0) + 1);
        });
      }

      // Transform to response format
      return {
        users: profiles.map(profile => ({
          id: profile.id,
          email: profile.email ?? '',
          full_name: profile.full_name ?? '',
          country: profile.country,
          field_of_study: profile.field_of_study,
          avatar_url: profile.avatar_url,
          quote: profile.quote,
          created_at: profile.created_at ?? '',
          last_login_at: profile.last_login_at,
          project_count: countMap.get(profile.id) ?? 0,
        })),
        totalCount: totalCount ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 15 * 60 * 1000, // Keep in memory for 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
