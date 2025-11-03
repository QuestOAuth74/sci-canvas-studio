import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { IconSubmission, IconSubmissionWithUser } from '@/types/iconSubmission';

export const useIconSubmissions = () => {
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<IconSubmissionWithUser[]>([]);

  const fetchMySubmissions = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('icon_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('approval_status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubmissions((data || []) as IconSubmissionWithUser[]);
      return (data || []) as IconSubmissionWithUser[];
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllSubmissions = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      console.log('[fetchAllSubmissions] Starting fetch...', { status });
      
      let query = supabase
        .from('icon_submissions')
        .select(`
          *,
          submitter:profiles!icon_submissions_user_id_fkey(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('approval_status', status);
      }

      const { data, error } = await query;
      
      console.log('[fetchAllSubmissions] Query result:', { 
        dataCount: data?.length || 0, 
        error: error?.message 
      });

      if (error) throw error;
      
      const formatted = (data || []).map((item: any) => ({
        ...item,
        submitter: item.submitter
      }));
      
      console.log('[fetchAllSubmissions] Setting submissions:', formatted.length);
      setSubmissions(formatted);
      return formatted;
    } catch (error: any) {
      console.error('[fetchAllSubmissions] Error:', error);
      toast.error('Failed to load submissions');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const submitIcon = useCallback(async (data: {
    name: string;
    category: string;
    svg_content: string;
    thumbnail: string;
    description?: string;
    usage_rights: IconSubmission['usage_rights'];
    usage_rights_details?: string;
  }) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast.error('You must be logged in to submit an icon');
        return null;
      }

      const { data: submission, error } = await supabase
        .from('icon_submissions')
        .insert({
          user_id: session.session.user.id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Icon submitted successfully! It will be reviewed by our team.');
      return submission;
    } catch (error: any) {
      console.error('Error submitting icon:', error);
      toast.error(error.message || 'Failed to submit icon');
      return null;
    }
  }, []);

  const updateSubmission = useCallback(async (id: string, updates: Partial<IconSubmission>) => {
    try {
      const { error } = await supabase
        .from('icon_submissions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Submission updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission');
      return false;
    }
  }, []);

  const deleteSubmission = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('icon_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Submission deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission');
      return false;
    }
  }, []);

  const approveSubmission = useCallback(async (id: string, adminNotes?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast.error('Unauthorized');
        return false;
      }

      // Get submission data
      const { data: submission, error: fetchError } = await supabase
        .from('icon_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Insert into icons table
      const { error: insertError } = await supabase
        .from('icons')
        .insert({
          name: submission.name,
          category: submission.category,
          svg_content: submission.svg_content,
          thumbnail: submission.thumbnail,
          uploaded_by: submission.user_id,
        });

      if (insertError) throw insertError;

      // Update submission status
      const { error: updateError } = await supabase
        .from('icon_submissions')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: session.session.user.id,
          admin_notes: adminNotes || null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Icon approved and added to library!');
      return true;
    } catch (error: any) {
      console.error('Error approving submission:', error);
      toast.error('Failed to approve submission');
      return false;
    }
  }, []);

  const rejectSubmission = useCallback(async (id: string, reason: string, adminNotes?: string) => {
    try {
      const { error } = await supabase
        .from('icon_submissions')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason,
          admin_notes: adminNotes || null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Submission rejected');
      return true;
    } catch (error: any) {
      console.error('Error rejecting submission:', error);
      toast.error('Failed to reject submission');
      return false;
    }
  }, []);

  return {
    loading,
    submissions,
    fetchMySubmissions,
    fetchAllSubmissions,
    submitIcon,
    updateSubmission,
    deleteSubmission,
    approveSubmission,
    rejectSubmission,
  };
};
