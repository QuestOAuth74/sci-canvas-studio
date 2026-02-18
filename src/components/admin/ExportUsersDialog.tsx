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

// Helper to batch an array into chunks
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
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

  const needsStorageData = !!(minStorageMB || maxStorageMB || sortBy === "storage_size");

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`id, email, full_name, country, field_of_study, created_at, last_login_at`);

      if (startDate) {
        const d = new Date(startDate);
        d.setHours(0, 0, 0, 0);
        query = query.gte('created_at', d.toISOString());
      }
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        query = query.lte('created_at', d.toISOString());
      }
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
      if (loginActivity === "never") {
        query = query.is('last_login_at', null);
      } else if (loginActivity === "active_7d") {
        const ago = new Date(); ago.setDate(ago.getDate() - 7);
        query = query.gte('last_login_at', ago.toISOString());
      } else if (loginActivity === "active_30d") {
        const ago = new Date(); ago.setDate(ago.getDate() - 30);
        query = query.gte('last_login_at', ago.toISOString());
      } else if (loginActivity === "inactive_30d") {
        const ago = new Date(); ago.setDate(ago.getDate() - 30);
        query = query.lt('last_login_at', ago.toISOString());
      }

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

      const userIds = profiles.map(p => p.id);
      const BATCH_SIZE = 50;
      const batches = chunk(userIds, BATCH_SIZE);

      // Fetch project counts (lightweight - no canvas_data)
      const projectCountMap: Record<string, number> = {};
      const storageMap: Record<string, number> = {};

      if (needsStorageData) {
        // Need canvas_data for storage calculation - fetch in batches
        for (const batch of batches) {
          const { data, error } = await supabase
            .from('canvas_projects')
            .select('user_id, canvas_data')
            .in('user_id', batch);
          if (error) throw error;
          data?.forEach(p => {
            projectCountMap[p.user_id] = (projectCountMap[p.user_id] || 0) + 1;
            if (p.canvas_data) {
              storageMap[p.user_id] = (storageMap[p.user_id] || 0) + new Blob([JSON.stringify(p.canvas_data)]).size;
            }
          });
        }
      } else {
        // Only need counts - much lighter query
        for (const batch of batches) {
          const { data, error } = await supabase
            .from('canvas_projects')
            .select('user_id')
            .in('user_id', batch);
          if (error) throw error;
          data?.forEach(p => {
            projectCountMap[p.user_id] = (projectCountMap[p.user_id] || 0) + 1;
          });
        }
      }

      // Apply project count & storage filters
      const minP = minProjects ? parseInt(minProjects) : undefined;
      const maxP = maxProjects ? parseInt(maxProjects) : undefined;
      const minS = minStorageMB ? parseFloat(minStorageMB) * 1024 * 1024 : undefined;
      const maxS = maxStorageMB ? parseFloat(maxStorageMB) * 1024 * 1024 : undefined;

      let filtered = profiles.filter(profile => {
        const count = projectCountMap[profile.id] || 0;
        const storage = storageMap[profile.id] || 0;
        if (minP !== undefined && count < minP) return false;
        if (maxP !== undefined && count > maxP) return false;
        if (minS !== undefined && storage < minS) return false;
        if (maxS !== undefined && storage > maxS) return false;
        return true;
      });

      if (sortBy === "project_count") {
        filtered.sort((a, b) => (projectCountMap[b.id] || 0) - (projectCountMap[a.id] || 0));
      } else if (sortBy === "storage_size") {
        filtered.sort((a, b) => (storageMap[b.id] || 0) - (storageMap[a.id] || 0));
      }

      if (filtered.length === 0) {
        toast.error("No users match the applied filters");
        return;
      }

      const formattedUsers = filtered.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || '',
        country: profile.country,
        field_of_study: profile.field_of_study,
        created_at: profile.created_at,
        last_login_at: profile.last_login_at,
        project_count: projectCountMap[profile.id] || 0,
        storage_mb: parseFloat(((storageMap[profile.id] || 0) / (1024 * 1024)).toFixed(2)),
      }));

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

          <TabsContent value="login" className="space-y-3 mt-3">
            <div className="grid gap-2">
              <Label>Quick filter</Label>
              <Select value={loginActivity} onValueChange={setLoginActivity}>
                <SelectTrigger><SelectValue placeholder="All users" /></SelectTrigger>
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

          <TabsContent value="storage" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">Filter by estimated project data storage size (MB). Note: this may take longer to export.</p>
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

        <div className="grid gap-2 pt-2">
          <Label>Sort by</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Button variant="ghost" onClick={handleClearAll}>Clear all</Button>
          )}
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting...</>
            ) : (
              <><Download className="mr-2 h-4 w-4" />Export</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
