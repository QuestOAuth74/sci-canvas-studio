import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, User, UserX, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string | null;
  field_of_study: string | null;
}

interface Feedback {
  id: string;
  user_id: string | null;
  rating: 'thumbs_up' | 'thumbs_down';
  page: string;
  user_agent: string | null;
  created_at: string;
  comment: string | null;
  is_viewed: boolean;
}

interface FeedbackWithProfile extends Feedback {
  profile?: Profile | null;
}

const PAGE_SIZE = 10;

export const ToolFeedbackManager = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithProfile[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<FeedbackWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbacks, filterRating, filterUser]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRating, filterUser]);

  const fetchFeedbacks = async () => {
    try {
      // Fetch feedbacks
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('tool_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      const feedbackList = (feedbackData as Feedback[]) || [];

      // Get unique user IDs
      const userIds = [...new Set(feedbackList
        .map(f => f.user_id)
        .filter((id): id is string => id !== null)
      )];

      // Fetch profiles for those users
      let profilesMap = new Map<string, Profile>();
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, field_of_study')
          .in('id', userIds);

        if (profilesData) {
          profilesMap = new Map(profilesData.map(p => [p.id, p]));
        }
      }

      // Combine feedbacks with profiles
      const feedbacksWithProfiles: FeedbackWithProfile[] = feedbackList.map(f => ({
        ...f,
        profile: f.user_id ? profilesMap.get(f.user_id) || null : null
      }));

      setFeedbacks(feedbacksWithProfiles);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...feedbacks];

    if (filterRating !== 'all') {
      filtered = filtered.filter(f => f.rating === filterRating);
    }

    if (filterUser === 'logged_in') {
      filtered = filtered.filter(f => f.user_id !== null);
    } else if (filterUser === 'anonymous') {
      filtered = filtered.filter(f => f.user_id === null);
    }

    setFilteredFeedbacks(filtered);
  };

  const markAllAsViewed = async () => {
    try {
      const { error } = await supabase
        .from('tool_feedback')
        .update({ is_viewed: true })
        .eq('is_viewed', false);

      if (error) throw error;
      
      toast.success('All feedback marked as viewed');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error marking feedback as viewed:', error);
      toast.error('Failed to mark all feedback as viewed');
    }
  };

  const getStatistics = () => {
    const total = feedbacks.length;
    const thumbsUp = feedbacks.filter(f => f.rating === 'thumbs_up').length;
    const thumbsDown = feedbacks.filter(f => f.rating === 'thumbs_down').length;
    const thumbsUpPercent = total > 0 ? ((thumbsUp / total) * 100).toFixed(1) : '0';
    const thumbsDownPercent = total > 0 ? ((thumbsDown / total) * 100).toFixed(1) : '0';

    return { total, thumbsUp, thumbsDown, thumbsUpPercent, thumbsDownPercent };
  };

  const stats = getStatistics();

  // Pagination logic
  const totalPages = Math.ceil(filteredFeedbacks.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedFeedbacks = filteredFeedbacks.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tool Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading feedback...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Ratings</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              Positive
            </CardDescription>
            <CardTitle className="text-3xl text-green-600 dark:text-green-400">
              {stats.thumbsUp}
              <span className="text-lg ml-2 text-muted-foreground">({stats.thumbsUpPercent}%)</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ThumbsDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              Negative
            </CardDescription>
            <CardTitle className="text-3xl text-red-600 dark:text-red-400">
              {stats.thumbsDown}
              <span className="text-lg ml-2 text-muted-foreground">({stats.thumbsDownPercent}%)</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div>
              <CardTitle>Feedback Details</CardTitle>
              <CardDescription>All user feedback submissions</CardDescription>
            </div>
            <Button
              onClick={markAllAsViewed}
              variant="outline"
              size="sm"
              disabled={feedbacks.filter(f => !f.is_viewed).length === 0}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Viewed
            </Button>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="thumbs_up">Thumbs Up</SelectItem>
                <SelectItem value="thumbs_down">Thumbs Down</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="logged_in">Logged In</SelectItem>
                <SelectItem value="anonymous">Anonymous</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFeedbacks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No feedback found</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFeedbacks.map((feedback) => (
                      <TableRow key={feedback.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(feedback.created_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {feedback.rating === 'thumbs_up' ? (
                            <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Positive
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-400">
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              Negative
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {feedback.user_id ? (
                            <Badge variant="secondary">
                              <User className="h-3 w-3 mr-1" />
                              Logged In
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <UserX className="h-3 w-3 mr-1" />
                              Anonymous
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {feedback.profile?.full_name ? (
                            <span className="font-medium">{feedback.profile.full_name}</span>
                          ) : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {feedback.profile?.field_of_study ? (
                            <Badge variant="outline">{feedback.profile.field_of_study}</Badge>
                          ) : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{feedback.page}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          {feedback.comment ? (
                            <p className="text-sm text-foreground line-clamp-2" title={feedback.comment}>
                              {feedback.comment}
                            </p>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">No comment</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {!feedback.is_viewed && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}–{Math.min(endIndex, filteredFeedbacks.length)} of {filteredFeedbacks.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
