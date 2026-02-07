import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Check if local auth mode is enabled (no limits)
const isLocalAuthEnabled = () => import.meta.env.VITE_LOCAL_AUTH === 'true';

export interface FeatureAccessStatus {
  hasAccess: boolean;
  approvedCount: number;
  remaining: number;
  isLoading: boolean;
}

export const useFeatureAccess = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['feature-access', user?.id],
    queryFn: async () => {
      if (!user) return { approved_count: 0, has_access: false, remaining: 3 };

      // If local auth is enabled, give full access
      if (isLocalAuthEnabled()) {
        return { approved_count: 999, has_access: true, remaining: 0 };
      }

      const { data, error } = await supabase
        .rpc('get_user_premium_progress', { check_user_id: user.id })
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    hasAccess: isLocalAuthEnabled() ? true : (data?.has_access || false),
    approvedCount: isLocalAuthEnabled() ? 999 : Number(data?.approved_count || 0),
    remaining: isLocalAuthEnabled() ? 0 : Number(data?.remaining || 3),
    isLoading,
  };
};
