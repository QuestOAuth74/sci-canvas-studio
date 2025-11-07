import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
    hasAccess: data?.has_access || false,
    approvedCount: Number(data?.approved_count || 0),
    remaining: Number(data?.remaining || 3),
    isLoading,
  };
};
