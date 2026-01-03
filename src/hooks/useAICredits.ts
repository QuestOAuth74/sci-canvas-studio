import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AICreditsInfo {
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  creditsUsed: number;
  remainingCredits: number;
  canGenerate: boolean;
  sharedProjectsCount: number;
  hasBonusCredits: boolean;
  creditsResetDate: string | null;
  isAdmin: boolean;
  generationsRemaining: number;
}

export const CREDITS_PER_GENERATION = 100;
export const FREE_CREDITS = 300;
export const BONUS_CREDITS = 300;
export const PROJECTS_FOR_BONUS = 3;
const RESET_PERIOD_DAYS = 30;

export const useAICredits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch AI credits info by calculating from existing data
  const { data: creditsInfo, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-credits', user?.id],
    queryFn: async (): Promise<AICreditsInfo> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      const isAdmin = roleData === true;

      if (isAdmin) {
        return {
          credits: FREE_CREDITS,
          bonusCredits: 0,
          totalCredits: FREE_CREDITS,
          creditsUsed: 0,
          remainingCredits: FREE_CREDITS,
          canGenerate: true,
          sharedProjectsCount: 0,
          hasBonusCredits: false,
          creditsResetDate: null,
          isAdmin: true,
          generationsRemaining: 999,
        };
      }

      // Get shared/approved projects count
      const { data: projectsData } = await supabase
        .from('canvas_projects')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_public', true)
        .eq('approval_status', 'approved');

      const sharedProjectsCount = projectsData?.length ?? 0;
      const hasBonusCredits = sharedProjectsCount >= PROJECTS_FOR_BONUS;

      // Calculate reset period (30 days from first generation or account creation)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - RESET_PERIOD_DAYS);
      
      // Get generations in current period
      const { data: usageData } = await supabase
        .from('ai_generation_usage')
        .select('id, generated_at')
        .eq('user_id', user.id)
        .gte('generated_at', thirtyDaysAgo.toISOString());

      const generationsInPeriod = usageData?.length ?? 0;
      const creditsUsed = generationsInPeriod * CREDITS_PER_GENERATION;

      // Calculate total available credits
      const baseCredits = FREE_CREDITS;
      const bonusCredits = hasBonusCredits ? BONUS_CREDITS : 0;
      const totalCredits = baseCredits + bonusCredits;
      const remainingCredits = Math.max(0, totalCredits - creditsUsed);

      // Calculate reset date (30 days from now if they started recently, or from first gen)
      const resetDate = new Date();
      resetDate.setDate(resetDate.getDate() + RESET_PERIOD_DAYS);

      return {
        credits: baseCredits,
        bonusCredits,
        totalCredits,
        creditsUsed,
        remainingCredits,
        canGenerate: remainingCredits >= CREDITS_PER_GENERATION,
        sharedProjectsCount,
        hasBonusCredits,
        creditsResetDate: resetDate.toISOString(),
        isAdmin: false,
        generationsRemaining: Math.floor(remainingCredits / CREDITS_PER_GENERATION),
      };
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Use credits mutation (record a generation)
  const useCredits = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // First verify user can generate
      if (creditsInfo && !creditsInfo.canGenerate && !creditsInfo.isAdmin) {
        throw new Error('Not enough credits for generation');
      }

      // Record the generation
      const { error } = await supabase
        .from('ai_generation_usage')
        .insert({
          user_id: user.id,
          month_year: new Date().toISOString().slice(0, 7), // YYYY-MM format
          prompt: 'AI Figure Studio generation',
          style: 'figure',
        });

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-credits', user?.id] });
    },
  });

  return {
    creditsInfo,
    isLoading,
    error,
    refetch,
    useCredits: useCredits.mutateAsync,
    isUsingCredits: useCredits.isPending,
    CREDITS_PER_GENERATION,
    FREE_CREDITS,
    BONUS_CREDITS,
    PROJECTS_FOR_BONUS,
  };
};
