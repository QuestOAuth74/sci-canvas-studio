import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CreditTransaction {
  id: string;
  type: 'generation' | 'purchase';
  description: string;
  creditsChange: number;
  createdAt: string;
  metadata?: {
    prompt?: string;
    style?: string;
    packageName?: string;
    stripeSessionId?: string;
  };
}

export const useCreditsHistory = (limit = 50) => {
  const { user } = useAuth();

  const { data: transactions, isLoading, error, refetch } = useQuery({
    queryKey: ['credits-history', user?.id, limit],
    queryFn: async (): Promise<CreditTransaction[]> => {
      if (!user) throw new Error('User not authenticated');

      const results: CreditTransaction[] = [];

      // Fetch AI generations (usage)
      const { data: usageData, error: usageError } = await supabase
        .from('ai_generation_usage')
        .select('id, prompt, style, generated_at')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (usageError) {
        console.error('Error fetching usage:', usageError);
      } else if (usageData) {
        usageData.forEach((item) => {
          results.push({
            id: `gen-${item.id}`,
            type: 'generation',
            description: item.prompt || 'AI Generation',
            creditsChange: -100,
            createdAt: item.generated_at,
            metadata: {
              prompt: item.prompt,
              style: item.style,
            },
          });
        });
      }

      // Fetch purchases
      try {
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchased_credits' as any)
          .select('id, credits_amount, package_name, stripe_session_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (purchaseError) {
          console.error('Error fetching purchases:', purchaseError);
        } else if (purchaseData && Array.isArray(purchaseData)) {
          purchaseData.forEach((item: any) => {
            results.push({
              id: `pur-${item.id}`,
              type: 'purchase',
              description: item.package_name || 'Credit Purchase',
              creditsChange: item.credits_amount || 0,
              createdAt: item.created_at,
              metadata: {
                packageName: item.package_name,
                stripeSessionId: item.stripe_session_id,
              },
            });
          });
        }
      } catch (e) {
        console.log('Purchased credits table not available yet');
      }

      // Sort by date descending
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return results.slice(0, limit);
    },
    enabled: !!user,
    staleTime: 30000,
  });

  return {
    transactions: transactions || [],
    isLoading,
    error,
    refetch,
  };
};
