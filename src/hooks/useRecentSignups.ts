import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRecentSignups = () => {
  return useQuery({
    queryKey: ["recent-signups"],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Get count
      const { count, error: countError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", twentyFourHoursAgo.toISOString());

      if (countError) {
        console.error("Error fetching recent signups:", countError);
        return { count: 0, topCountries: [], totalWithLocation: 0 };
      }

      // Get country distribution
      const { data: profiles, error: dataError } = await supabase
        .from("profiles")
        .select("country")
        .gte("created_at", twentyFourHoursAgo.toISOString())
        .not("country", "is", null);

      if (dataError) {
        return { count: count || 0, topCountries: [], totalWithLocation: 0 };
      }

      // Count occurrences of each country
      const countryCounts = profiles.reduce((acc, profile) => {
        const country = profile.country;
        if (country) {
          acc[country] = (acc[country] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Get top 3 countries
      const topCountries = Object.entries(countryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([country, count]) => ({ country, count }));

      return { 
        count: count || 0, 
        topCountries,
        totalWithLocation: profiles.length 
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
