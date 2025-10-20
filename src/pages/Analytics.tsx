import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, FolderOpen, TrendingUp, Crown, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useState } from "react";

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
  };

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
            className="neo-brutalist-shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <h1 className="text-4xl font-black uppercase">User Analytics</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="neo-brutalist-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-bold uppercase">Total Users</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="neo-brutalist-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-bold uppercase">Total Projects</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{totalProjects}</div>
            </CardContent>
          </Card>

          <Card className="neo-brutalist-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-bold uppercase">Avg Projects</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{avgProjects}</div>
            </CardContent>
          </Card>

          <Card className="neo-brutalist-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-bold uppercase">Most Active</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-black truncate">{mostActiveUser?.full_name}</div>
              <div className="text-sm text-muted-foreground">{mostActiveUser?.project_count} projects</div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="neo-brutalist-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase">User Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:text-primary font-bold uppercase"
                      onClick={() => handleSort('full_name')}
                    >
                      Name {sortColumn === 'full_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary font-bold uppercase"
                      onClick={() => handleSort('email')}
                    >
                      Email {sortColumn === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary font-bold uppercase"
                      onClick={() => handleSort('country')}
                    >
                      Location {sortColumn === 'country' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary font-bold uppercase text-center"
                      onClick={() => handleSort('project_count')}
                    >
                      Projects {sortColumn === 'project_count' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-primary font-bold uppercase"
                      onClick={() => handleSort('created_at')}
                    >
                      Joined {sortColumn === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((user) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
