import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Users, FolderOpen, TrendingUp, Crown, ArrowLeft, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useState } from "react";
import { UserProjectsDialog } from "@/components/admin/UserProjectsDialog";

interface UserAnalytics {
  id: string;
  email: string;
  full_name: string;
  country: string | null;
  created_at: string;
  project_count: number;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = useState<keyof UserAnalytics>("project_count");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProjectsDialogOpen, setIsProjectsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['user-analytics'],
    queryFn: async () => {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, country, created_at');
      
      if (profilesError) throw profilesError;

      // Fetch project counts for each user
      const { data: projectCounts, error: projectsError } = await supabase
        .from('canvas_projects')
        .select('user_id');
      
      if (projectsError) throw projectsError;

      // Count projects per user
      const projectCountMap = projectCounts.reduce((acc, project) => {
        acc[project.user_id] = (acc[project.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Combine data
      return profiles.map(user => ({
        ...user,
        project_count: projectCountMap[user.id] || 0
      })) as UserAnalytics[];
    }
  });

  const { data: userProjects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['user-projects', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const { data, error } = await supabase
        .from('canvas_projects')
        .select('id, name, title, created_at, updated_at, is_public, approval_status, view_count, cloned_count')
        .eq('user_id', selectedUserId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUserId && isProjectsDialogOpen
  });

  const sortedData = analyticsData ? [...analyticsData].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  }) : [];

  const handleSort = (column: keyof UserAnalytics) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  // Calculate pagination
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const totalUsers = analyticsData?.length || 0;
  const totalProjects = analyticsData?.reduce((sum, user) => sum + user.project_count, 0) || 0;
  const avgProjects = totalUsers > 0 ? (totalProjects / totalUsers).toFixed(1) : "0";
  const mostActiveUser = analyticsData?.reduce((max, user) => 
    user.project_count > max.project_count ? user : max
  , { project_count: 0, full_name: "N/A" });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <h1 className="text-4xl font-semibold">User Analytics</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-semibold">Total Users</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-semibold">Total Projects</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalProjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-semibold">Avg Projects</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgProjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-semibold">Most Active</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{mostActiveUser?.full_name}</div>
              <div className="text-sm text-muted-foreground">{mostActiveUser?.project_count} projects</div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">User Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:text-primary font-semibold"
                      onClick={() => handleSort('full_name')}
                    >
                      Name {sortColumn === 'full_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary font-semibold"
                      onClick={() => handleSort('email')}
                    >
                      Email {sortColumn === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary font-semibold"
                      onClick={() => handleSort('country')}
                    >
                      Location {sortColumn === 'country' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary font-semibold text-center"
                      onClick={() => handleSort('project_count')}
                    >
                      Projects {sortColumn === 'project_count' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary font-semibold"
                      onClick={() => handleSort('created_at')}
                    >
                      Joined {sortColumn === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((user) => (
                    <TableRow 
                      key={user.id}
                      className={
                        user.project_count >= 5 
                          ? 'bg-green-500/5 hover:bg-green-500/10' 
                          : user.project_count >= 1 
                          ? 'bg-yellow-500/5 hover:bg-yellow-500/10'
                          : 'hover:bg-muted/50'
                      }
                    >
                      <TableCell className="font-medium">
                        {user.full_name || 'No name'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {user.country || (
                          <span className="text-muted-foreground italic">No location set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {user.project_count}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setIsProjectsDialogOpen(true);
                          }}
                          disabled={user.project_count === 0}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Projects ({user.project_count})
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Projects Dialog */}
        <UserProjectsDialog
          isOpen={isProjectsDialogOpen}
          onClose={() => {
            setIsProjectsDialogOpen(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
          userProjects={userProjects || []}
          userName={sortedData.find(u => u.id === selectedUserId)?.full_name || 'User'}
          isLoading={isLoadingProjects}
        />
      </div>
    </div>
  );
};

export default Analytics;
