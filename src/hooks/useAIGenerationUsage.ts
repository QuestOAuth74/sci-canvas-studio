import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Check if local auth mode is enabled (no limits)
const isLocalAuthEnabled = () => import.meta.env.VITE_LOCAL_AUTH === 'true';

export interface GenerationUsage {
  canGenerate: boolean;
  isAdmin: boolean;
  hasPremium: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  monthYear: string;
  approvedCount?: number;
  needsApproved?: number;
}

export const useAIGenerationUsage = () => {
  const { user } = useAuth();

  const { data: usage, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-generation-usage', user?.id],
    queryFn: async (): Promise<GenerationUsage> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // If local auth is enabled, give unlimited access to all signed-in users
      if (isLocalAuthEnabled()) {
        return {
          canGenerate: true,
          isAdmin: true,
          hasPremium: true,
          used: 0,
          limit: null,
          remaining: null,
          monthYear: new Date().toISOString().slice(0, 7),
          approvedCount: 999,
          needsApproved: 0,
        };
      }

      const { data, error } = await supabase
        .rpc('can_user_generate', { _user_id: user.id });

      if (error) {
        console.error('Error fetching generation usage:', error);
        throw error;
      }

      return data as unknown as GenerationUsage;
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  return {
    usage,
    isLoading,
    error,
    refetch,
  };
};
