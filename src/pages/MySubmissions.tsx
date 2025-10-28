import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Trash2, Clock, CheckCircle, XCircle, Upload } from 'lucide-react';
import { useIconSubmissions } from '@/hooks/useIconSubmissions';
import { IconSubmissionDialog } from '@/components/community/IconSubmissionDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MySubmissions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, submissions, fetchMySubmissions, deleteSubmission } = useIconSubmissions();
  const [activeTab, setActiveTab] = useState('pending');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchMySubmissions();
    
    // Fetch categories
    supabase
      .from('icon_categories')
      .select('id, name')
      .order('name')
      .then(({ data }) => setCategories(data || []));
  }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const success = await deleteSubmission(deleteId);
    if (success) {
      fetchMySubmissions();
    }
    setDeleteId(null);
  };

  const filteredSubmissions = submissions.filter(s => s.approval_status === activeTab);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">My Icon Submissions</h1>
              <p className="text-muted-foreground">Track the status of your submitted icons</p>
            </div>
          </div>
          <Button onClick={() => setShowSubmitDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Submit New Icon
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({submissions.filter(s => s.approval_status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({submissions.filter(s => s.approval_status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({submissions.filter(s => s.approval_status === 'rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading submissions...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No {activeTab} submissions yet
                </p>
                <Button onClick={() => setShowSubmitDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Your First Icon
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubmissions.map((submission) => (
                  <Card key={submission.id} className="p-6">
                    <div className="flex flex-col gap-4">
                      {/* Preview */}
                      <div className="w-full h-32 bg-checker rounded-lg flex items-center justify-center">
                        {submission.thumbnail ? (
                          <img src={submission.thumbnail} alt={submission.name} className="max-w-full max-h-full" style={{ backgroundColor: 'transparent' }} />
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: submission.svg_content }} className="max-w-full max-h-full" />
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{submission.name}</h3>
                          {getStatusBadge(submission.approval_status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Category: {submission.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Description */}
                      {submission.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {submission.description}
                        </p>
                      )}

                      {/* Rejection Reason */}
                      {submission.rejection_reason && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                          <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                          <p className="text-sm text-muted-foreground">{submission.rejection_reason}</p>
                        </div>
                      )}

                      {/* Actions */}
                      {submission.approval_status === 'pending' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteId(submission.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Submit Dialog */}
      <IconSubmissionDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        categories={categories}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this submission? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MySubmissions;
