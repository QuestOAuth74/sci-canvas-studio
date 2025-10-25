import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost } from "@/types/blog";
import { useToast } from "@/hooks/use-toast";

export const useBlogPosts = (options?: {
  status?: 'draft' | 'published' | 'scheduled';
  categorySlug?: string;
  tagSlug?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['blog-posts', options],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, full_name, avatar_url, email),
          categories:blog_post_categories(category:blog_categories(*)),
          tags:blog_post_tags(tag:blog_tags(*))
        `)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.categorySlug) {
        const { data: category } = await supabase
          .from('blog_categories')
          .select('id')
          .eq('slug', options.categorySlug)
          .single();
        
        if (category) {
          const { data: postIds } = await supabase
            .from('blog_post_categories')
            .select('post_id')
            .eq('category_id', category.id);
          
          if (postIds) {
            query = query.in('id', postIds.map(p => p.post_id));
          }
        }
      }

      if (options?.tagSlug) {
        const { data: tag } = await supabase
          .from('blog_tags')
          .select('id')
          .eq('slug', options.tagSlug)
          .single();
        
        if (tag) {
          const { data: postIds } = await supabase
            .from('blog_post_tags')
            .select('post_id')
            .eq('tag_id', tag.id);
          
          if (postIds) {
            query = query.in('id', postIds.map(p => p.post_id));
          }
        }
      }

      if (options?.searchQuery) {
        query = query.textSearch('search_vector', options.searchQuery, {
          type: 'websearch',
          config: 'english'
        });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch blog posts",
          variant: "destructive",
        });
        throw error;
      }

      return (data || []) as any as BlogPost[];
    },
  });
};

export const useBlogPost = (slug: string) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, full_name, avatar_url, email),
          categories:blog_post_categories(category:blog_categories(*)),
          tags:blog_post_tags(tag:blog_tags(*))
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch blog post",
          variant: "destructive",
        });
        throw error;
      }

      if (!data) {
        return null;
      }

      return data as any as BlogPost;
    },
  });
};

export const useIncrementViewCount = () => {
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.rpc('increment_blog_post_view_count', {
        post_id_param: postId
      });

      if (error) throw error;
    },
  });
};

export const useRelatedPosts = (postId: string, limit: number = 4) => {
  return useQuery({
    queryKey: ['related-posts', postId, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_related_blog_posts', {
        post_id_param: postId,
        limit_param: limit
      });

      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });
};
