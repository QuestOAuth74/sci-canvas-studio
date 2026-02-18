import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { exportUsersToExcel } from "@/lib/excelExport";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExportUsersDialogProps {
  totalUsers: number;
}

export function ExportUsersDialog({ totalUsers }: ExportUsersDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Signup date filters
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Project count filters
  const [minProjects, setMinProjects] = useState<string>("");
  const [maxProjects, setMaxProjects] = useState<string>("");

  // Last login filters
  const [lastLoginFrom, setLastLoginFrom] = useState<Date | undefined>(undefined);
  const [lastLoginTo, setLastLoginTo] = useState<Date | undefined>(undefined);
  const [loginActivity, setLoginActivity] = useState<string>("all");

  // Storage size filter
  const [minStorageMB, setMinStorageMB] = useState<string>("");
  const [maxStorageMB, setMaxStorageMB] = useState<string>("");

  // Sort option
  const [sortBy, setSortBy] = useState<string>("created_at");

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all profiles
      let query = supabase
        .from('profiles')
        .select(`id, email, full_name, country, field_of_study, created_at, last_login_at`);

      // Apply signup date filters
      if (startDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        query = query.gte('created_at', startOfDay.toISOString());
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      // Apply last login date filters
      if (lastLoginFrom) {
        const d = new Date(lastLoginFrom);
        d.setHours(0, 0, 0, 0);
        query = query.gte('last_login_at', d.toISOString());
      }
      if (lastLoginTo) {
        const d = new Date(lastLoginTo);
        d.setHours(23, 59, 59, 999);
        query = query.lte('last_login_at', d.toISOString());
      }

      // Login activity filter
      if (loginActivity === "never") {
        query = query.is('last_login_at', null);
      } else if (loginActivity === "active_7d") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.gte('last_login_at', sevenDaysAgo.toISOString());
      } else if (loginActivity === "active_30d") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('last_login_at', thirtyDaysAgo.toISOString());
      } else if (loginActivity === "inactive_30d") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.lt('last_login_at', thirtyDaysAgo.toISOString());
      }

      // Apply sort
      if (sortBy === "last_login_at") {
        query = query.order('last_login_at', { ascending: false, nullsFirst: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: profiles, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        toast.error("No users found matching your filters");
        return;
      }

      // Fetch projects with data sizes for all matching users
      const userIds = profiles.map(p => p.id);
      const { data: projects, error: projectsError } = await supabase
        .from('canvas_projects')
        .select('user_id, id, canvas_data')
        .in('user_id', userIds);

      if (projectsError) throw projectsError;

      // Calculate project counts and storage per user
      const userStats: Record<string, { count: number; storageBytes: number }> = {};
      projects?.forEach(p => {
        if (!userStats[p.user_id]) {
          userStats[p.user_id] = { count: 0, storageBytes: 0 };
        }
        userStats[p.user_id].count += 1;
        // Estimate storage from canvas_data JSON size
        if (p.canvas_data) {
          userStats[p.user_id].storageBytes += new Blob([JSON.stringify(p.canvas_data)]).size;
        }
      });

      // Apply project count filters
      const minP = minProjects ? parseInt(minProjects) : undefined;
      const maxP = maxProjects ? parseInt(maxProjects) : undefined;
      const minS = minStorageMB ? parseFloat(minStorageMB) * 1024 * 1024 : undefined;
      const maxS = maxStorageMB ? parseFloat(maxStorageMB) * 1024 * 1024 : undefined;

      let filteredProfiles = profiles.filter(profile => {
        const stats = userStats[profile.id] || { count: 0, storageBytes: 0 };
        if (minP !== undefined && stats.count < minP) return false;
        if (maxP !== undefined && stats.count > maxP) return false;
        if (minS !== undefined && stats.storageBytes < minS) return false;
        if (maxS !== undefined && stats.storageBytes > maxS) return false;
        return true;
      });

      // Sort by project count or storage if selected
      if (sortBy === "project_count") {
        filteredProfiles.sort((a, b) => (userStats[b.id]?.count || 0) - (userStats[a.id]?.count || 0));
      } else if (sortBy === "storage_size") {
        filteredProfiles.sort((a, b) => (userStats[b.id]?.storageBytes || 0) - (userStats[a.id]?.storageBytes || 0));
      }

      if (filteredProfiles.length === 0) {
        toast.error("No users match the applied filters");
        return;
      }

      const formattedUsers = filteredProfiles.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || '',
        country: profile.country,
        field_of_study: profile.field_of_study,
        created_at: profile.created_at,
        last_login_at: profile.last_login_at,
        project_count: userStats[profile.id]?.count || 0,
        storage_mb: parseFloat(((userStats[profile.id]?.storageBytes || 0) / (1024 * 1024)).toFixed(2)),
      }));

      // Generate filename
      let filename = 'BioSketch_Users';
      if (startDate && endDate) {
        filename += `_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}`;
      } else if (startDate) {
        filename += `_from_${format(startDate, 'yyyy-MM-dd')}`;
      } else if (endDate) {
        filename += `_until_${format(endDate, 'yyyy-MM-dd')}`;
      }

      exportUsersToExcel(formattedUsers, filename);

      toast.success("Export successful", {
        description: `Exported ${formattedUsers.length} users to Excel`,
      });

      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Export failed", {
        description: "Failed to export user data. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAll = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setMinProjects("");
    setMaxProjects("");
    setLastLoginFrom(undefined);
    setLastLoginTo(undefined);
    setLoginActivity("all");
    setMinStorageMB("");
    setMaxStorageMB("");
    setSortBy("created_at");
  };

  const hasFilters = startDate || endDate || minProjects || maxProjects ||
    lastLoginFrom || lastLoginTo || loginActivity !== "all" ||
    minStorageMB || maxStorageMB;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Users to Excel</DialogTitle>
          <DialogDescription>
            Filter and sort users before exporting.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signup" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="signup" className="text-xs">Signup Date</TabsTrigger>
            <TabsTrigger value="login" className="text-xs">Last Login</TabsTrigger>
            <TabsTrigger value="projects" className="text-xs">Projects</TabsTrigger>
            <TabsTrigger value="storage" className="text-xs">Storage</TabsTrigger>
          </TabsList>

          {/* Signup Date Tab */}
          <TabsContent value="signup" className="space-y-3 mt-3">
            <div className="grid gap-2">
              <Label>Signed up from</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={(date) => date > new Date() || (endDate ? date > endDate : false)} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>Signed up until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => date > new Date() || (startDate ? date < startDate : false)} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </TabsContent>

          {/* Last Login Tab */}
          <TabsContent value="login" className="space-y-3 mt-3">
            <div className="grid gap-2">
              <Label>Quick filter</Label>
              <Select value={loginActivity} onValueChange={setLoginActivity}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="active_7d">Active in last 7 days</SelectItem>
                  <SelectItem value="active_30d">Active in last 30 days</SelectItem>
                  <SelectItem value="inactive_30d">Inactive 30+ days</SelectItem>
                  <SelectItem value="never">Never logged in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Last login from</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !lastLoginFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {lastLoginFrom ? format(lastLoginFrom, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={lastLoginFrom} onSelect={setLastLoginFrom} disabled={(date) => date > new Date()} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>Last login until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !lastLoginTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {lastLoginTo ? format(lastLoginTo, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={lastLoginTo} onSelect={setLastLoginTo} disabled={(date) => date > new Date()} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Min projects</Label>
                <Input type="number" min="0" placeholder="0" value={minProjects} onChange={(e) => setMinProjects(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Max projects</Label>
                <Input type="number" min="0" placeholder="Any" value={maxProjects} onChange={(e) => setMaxProjects(e.target.value)} />
              </div>
            </div>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">Filter by estimated project data storage size (MB).</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Min size (MB)</Label>
                <Input type="number" min="0" step="0.1" placeholder="0" value={minStorageMB} onChange={(e) => setMinStorageMB(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Max size (MB)</Label>
                <Input type="number" min="0" step="0.1" placeholder="Any" value={maxStorageMB} onChange={(e) => setMaxStorageMB(e.target.value)} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Sort */}
        <div className="grid gap-2 pt-2">
          <Label>Sort by</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Signup date (newest)</SelectItem>
              <SelectItem value="last_login_at">Last login (recent)</SelectItem>
              <SelectItem value="project_count">Most projects</SelectItem>
              <SelectItem value="storage_size">Largest storage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          {hasFilters && (
            <Button variant="ghost" onClick={handleClearAll}>
              Clear all
            </Button>
          )}
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
