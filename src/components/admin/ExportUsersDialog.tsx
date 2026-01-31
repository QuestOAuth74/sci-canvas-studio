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
import { supabase } from "@/integrations/supabase/client";
import { exportUsersToExcel } from "@/lib/excelExport";
import { toast } from "sonner";

interface ExportUsersDialogProps {
  totalUsers: number;
}

export function ExportUsersDialog({ totalUsers }: ExportUsersDialogProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Build query with date filters
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          country,
          field_of_study,
          created_at,
          last_login_at
        `);

      // Apply date filters if set
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

      const { data: profiles, error: profilesError } = await query.order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        toast.error("No users found", {
          description: startDate || endDate 
            ? "No users found in the selected date range" 
            : "No users to export",
        });
        return;
      }

      // Fetch project counts for these users
      const userIds = profiles.map(p => p.id);
      const { data: projectCounts, error: projectsError } = await supabase
        .from('canvas_projects')
        .select('user_id')
        .in('user_id', userIds);

      if (projectsError) throw projectsError;

      // Count projects per user
      const projectCountMap: Record<string, number> = {};
      projectCounts?.forEach(p => {
        projectCountMap[p.user_id] = (projectCountMap[p.user_id] || 0) + 1;
      });

      const formattedUsers = profiles.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || '',
        country: profile.country,
        field_of_study: profile.field_of_study,
        created_at: profile.created_at,
        last_login_at: profile.last_login_at,
        project_count: projectCountMap[profile.id] || 0,
      }));

      // Generate filename with date range info
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

  const handleClearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const getExportDescription = () => {
    if (startDate && endDate) {
      return `Users who signed up between ${format(startDate, 'PPP')} and ${format(endDate, 'PPP')}`;
    }
    if (startDate) {
      return `Users who signed up on or after ${format(startDate, 'PPP')}`;
    }
    if (endDate) {
      return `Users who signed up on or before ${format(endDate, 'PPP')}`;
    }
    return `All ${totalUsers} users`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Users to Excel</DialogTitle>
          <DialogDescription>
            Select a date range to filter users by signup date, or export all users.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Start Date */}
          <div className="grid gap-2">
            <Label htmlFor="start-date">Signed up from</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date > new Date() || (endDate ? date > endDate : false)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="grid gap-2">
            <Label htmlFor="end-date">Signed up until</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="end-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Preview */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              <strong>Will export:</strong> {getExportDescription()}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {(startDate || endDate) && (
            <Button variant="ghost" onClick={handleClearDates}>
              Clear dates
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
