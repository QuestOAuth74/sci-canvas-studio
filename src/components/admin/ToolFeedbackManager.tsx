import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, User, UserX } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface Feedback {
  id: string;
  user_id: string | null;
  rating: 'thumbs_up' | 'thumbs_down';
  page: string;
  user_agent: string | null;
  created_at: string;
}

export const ToolFeedbackManager = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbacks, filterRating, filterUser]);

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('tool_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks((data as Feedback[]) || []);
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

  const getStatistics = () => {
    const total = feedbacks.length;
    const thumbsUp = feedbacks.filter(f => f.rating === 'thumbs_up').length;
    const thumbsDown = feedbacks.filter(f => f.rating === 'thumbs_down').length;
    const thumbsUpPercent = total > 0 ? ((thumbsUp / total) * 100).toFixed(1) : '0';
    const thumbsDownPercent = total > 0 ? ((thumbsDown / total) * 100).toFixed(1) : '0';

    return { total, thumbsUp, thumbsDown, thumbsUpPercent, thumbsDownPercent };
  };

  const stats = getStatistics();

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
          <CardTitle>Feedback Details</CardTitle>
          <CardDescription>All user feedback submissions</CardDescription>
          
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Page</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeedbacks.map((feedback) => (
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
                        <Badge variant="outline">{feedback.page}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
