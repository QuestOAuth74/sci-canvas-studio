import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Mail, Download, Trash2, RefreshCw, UserCheck, UserX, Search, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';

interface EmailSubscription {
  id: string;
  user_id: string | null;
  email: string;
  subscribed_at: string;
  subscription_source: string;
  is_active: boolean;
  unsubscribed_at: string | null;
  created_at: string;
  full_name?: string;
  country?: string;
}

interface SubscriptionStats {
  totalActive: number;
  totalUnsubscribed: number;
  sources: { [key: string]: number };
  recentGrowth: {
    last7Days: number;
    last30Days: number;
  };
}

export const NewsletterSubscriptionsManager = () => {
  const [subscriptions, setSubscriptions] = useState<EmailSubscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<EmailSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalActive: 0,
    totalUnsubscribed: 0,
    sources: {},
    recentGrowth: { last7Days: 0, last30Days: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchQuery, statusFilter, sourceFilter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Fetch subscriptions with profile data
      const { data, error } = await supabase
        .from('email_subscriptions')
        .select(`
          *,
          profiles:user_id (
            full_name,
            country
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: EmailSubscription[] = (data || []).map((sub: any) => ({
        id: sub.id,
        user_id: sub.user_id,
        email: sub.email,
        subscribed_at: sub.subscribed_at,
        subscription_source: sub.subscription_source,
        is_active: sub.is_active,
        unsubscribed_at: sub.unsubscribed_at,
        created_at: sub.created_at,
        full_name: sub.profiles?.full_name,
        country: sub.profiles?.country
      }));

      setSubscriptions(formattedData);
      calculateStats(formattedData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: EmailSubscription[]) => {
    const active = data.filter(s => s.is_active).length;
    const unsubscribed = data.filter(s => !s.is_active).length;
    
    const sources: { [key: string]: number } = {};
    data.forEach(sub => {
      sources[sub.subscription_source] = (sources[sub.subscription_source] || 0) + 1;
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last7Days = data.filter(s => new Date(s.created_at) >= sevenDaysAgo).length;
    const last30Days = data.filter(s => new Date(s.created_at) >= thirtyDaysAgo).length;

    setStats({
      totalActive: active,
      totalUnsubscribed: unsubscribed,
      sources,
      recentGrowth: { last7Days, last30Days }
    });
  };

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(sub =>
        sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => 
        statusFilter === 'active' ? sub.is_active : !sub.is_active
      );
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(sub => sub.subscription_source === sourceFilter);
    }

    setFilteredSubscriptions(filtered);
  };

  const handleUnsubscribe = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_subscriptions')
        .update({
          is_active: false,
          unsubscribed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User unsubscribed successfully'
      });
      fetchSubscriptions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_subscriptions')
        .update({
          is_active: true,
          unsubscribed_at: null
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Subscription reactivated successfully'
      });
      fetchSubscriptions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const { error } = await supabase
        .from('email_subscriptions')
        .delete()
        .eq('id', selectedId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Subscription deleted successfully'
      });
      fetchSubscriptions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Name', 'Source', 'Subscribed Date', 'Status', 'Country'];
    const rows = filteredSubscriptions.map(sub => [
      sub.email,
      sub.full_name || 'Guest',
      sub.subscription_source,
      format(new Date(sub.subscribed_at), 'yyyy-MM-dd HH:mm:ss'),
      sub.is_active ? 'Active' : 'Unsubscribed',
      sub.country || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscriptions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'CSV exported successfully'
    });
  };

  const uniqueSources = Array.from(new Set(subscriptions.map(s => s.subscription_source)));

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActive}</div>
            <p className="text-xs text-muted-foreground">
              Active subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnsubscribed}</div>
            <p className="text-xs text-muted-foreground">
              Inactive subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.recentGrowth.last7Days}</div>
            <p className="text-xs text-muted-foreground">
              New subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.recentGrowth.last30Days}</div>
            <p className="text-xs text-muted-foreground">
              New subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sources Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Sources</CardTitle>
          <CardDescription>Breakdown by subscription source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.sources).map(([source, count]) => (
              <Badge key={source} variant="secondary">
                {source}: {count} ({Math.round((count / subscriptions.length) * 100)}%)
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Subscriptions</CardTitle>
          <CardDescription>Manage and view all newsletter subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {uniqueSources.map(source => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <Button onClick={fetchSubscriptions} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading subscriptions...</div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No subscriptions found</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {sub.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.full_name ? (
                          <div>
                            <div>{sub.full_name}</div>
                            {sub.country && (
                              <div className="text-xs text-muted-foreground">{sub.country}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Guest</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.subscription_source}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(sub.subscribed_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {sub.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Unsubscribed</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {sub.is_active ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUnsubscribe(sub.id)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReactivate(sub.id)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedId(sub.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this subscription. This action cannot be undone.
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
