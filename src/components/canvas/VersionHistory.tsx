import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { History, Clock, Tag, Trash2, RotateCcw, FileText, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getVersions,
  restoreVersion,
  deleteVersion,
  nameVersion,
  VersionSnapshot,
} from "@/lib/versionManager";

interface VersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  onVersionRestored?: () => void;
}

type FilterType = "all" | "manual" | "named";

export function VersionHistory({
  open,
  onOpenChange,
  projectId,
  onVersionRestored,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [filteredVersions, setFilteredVersions] = useState<VersionSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [versionToDelete, setVersionToDelete] = useState<string | null>(null);
  const [versionToRestore, setVersionToRestore] = useState<VersionSnapshot | null>(null);
  const [namingVersion, setNamingVersion] = useState<string | null>(null);
  const [newVersionName, setNewVersionName] = useState("");

  // Load versions when sheet opens
  useEffect(() => {
    if (open && projectId) {
      loadVersions();
    }
  }, [open, projectId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...versions];

    // Apply type filter
    if (filter === "manual") {
      filtered = filtered.filter((v) => !v.isAutoSave);
    } else if (filter === "named") {
      filtered = filtered.filter((v) => v.versionName);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.versionName?.toLowerCase().includes(query) ||
          v.versionNumber.toString().includes(query)
      );
    }

    setFilteredVersions(filtered);
  }, [versions, filter, searchQuery]);

  const loadVersions = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const data = await getVersions(projectId);
      setVersions(data);
    } catch (error) {
      console.error("Failed to load versions:", error);
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!versionToRestore || !projectId) return;

    try {
      await restoreVersion(projectId, versionToRestore.id);
      toast.success("Version restored successfully");
      setVersionToRestore(null);
      onVersionRestored?.();
      onOpenChange(false);
      
      // Reload the page to show restored version
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Failed to restore version:", error);
      toast.error("Failed to restore version");
    }
  };

  const handleDelete = async () => {
    if (!versionToDelete) return;

    try {
      await deleteVersion(versionToDelete);
      toast.success("Version deleted");
      setVersionToDelete(null);
      loadVersions();
    } catch (error) {
      console.error("Failed to delete version:", error);
      toast.error("Failed to delete version");
    }
  };

  const handleNameVersion = async (versionId: string) => {
    if (!newVersionName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    try {
      await nameVersion(versionId, newVersionName.trim());
      toast.success("Version named successfully");
      setNamingVersion(null);
      setNewVersionName("");
      loadVersions();
    } catch (error) {
      console.error("Failed to name version:", error);
      toast.error("Failed to name version");
    }
  };

  const estimatedStorageUsed = (versions.length * 0.15).toFixed(1); // Rough estimate

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </SheetTitle>
            <SheetDescription>
              {versions.length} version{versions.length !== 1 ? "s" : ""} saved • ~
              {estimatedStorageUsed}MB used
            </SheetDescription>
          </SheetHeader>

          {/* Filters */}
          <div className="px-6 py-4 border-b space-y-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="manual">Manual Saves</TabsTrigger>
                <TabsTrigger value="named">Named</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search versions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Version List */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-3">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))
              ) : filteredVersions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No versions found"
                      : filter === "manual"
                      ? "No manual saves yet"
                      : filter === "named"
                      ? "No named versions yet"
                      : "No versions saved yet"}
                  </p>
                </div>
              ) : (
                filteredVersions.map((version, index) => (
                  <VersionCard
                    key={version.id}
                    version={version}
                    isLatest={index === 0}
                    onRestore={() => setVersionToRestore(version)}
                    onDelete={() => setVersionToDelete(version.id)}
                    onName={() => {
                      setNamingVersion(version.id);
                      setNewVersionName(version.versionName || "");
                    }}
                    isNaming={namingVersion === version.id}
                    newVersionName={newVersionName}
                    setNewVersionName={setNewVersionName}
                    onSaveName={() => handleNameVersion(version.id)}
                    onCancelName={() => {
                      setNamingVersion(null);
                      setNewVersionName("");
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!versionToRestore} onOpenChange={() => setVersionToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current canvas with{" "}
              <strong>
                Version #{versionToRestore?.versionNumber}
                {versionToRestore?.versionName && ` (${versionToRestore.versionName})`}
              </strong>
              . Your current work will be saved as a new version before restoring.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>Restore Version</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!versionToDelete} onOpenChange={() => setVersionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this version?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This version will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface VersionCardProps {
  version: VersionSnapshot;
  isLatest: boolean;
  onRestore: () => void;
  onDelete: () => void;
  onName: () => void;
  isNaming: boolean;
  newVersionName: string;
  setNewVersionName: (name: string) => void;
  onSaveName: () => void;
  onCancelName: () => void;
}

function VersionCard({
  version,
  isLatest,
  onRestore,
  onDelete,
  onName,
  isNaming,
  newVersionName,
  setNewVersionName,
  onSaveName,
  onCancelName,
}: VersionCardProps) {
  const relativeTime = formatDistanceToNow(new Date(version.createdAt), { addSuffix: true });

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isNaming ? (
            <div className="flex gap-2 mb-2">
              <Input
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="Enter version name"
                className="h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSaveName();
                  } else if (e.key === "Escape") {
                    onCancelName();
                  }
                }}
              />
              <Button size="sm" onClick={onSaveName} className="h-8">
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelName} className="h-8">
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">
                  Version #{version.versionNumber}
                </h4>
                {isLatest && (
                  <Badge variant="secondary" className="text-xs">
                    Latest
                  </Badge>
                )}
                {version.isAutoSave ? (
                  <Badge variant="outline" className="text-xs">
                    Auto
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-xs">
                    Manual
                  </Badge>
                )}
              </div>
              {version.versionName && (
                <div className="flex items-center gap-1 mb-1">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {version.versionName}
                  </span>
                </div>
              )}
            </>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{relativeTime}</span>
          </div>
        </div>

        {/* Restore count badge */}
        {version.restoreCount > 0 && (
          <Badge variant="outline" className="text-xs shrink-0">
            <RotateCcw className="h-3 w-3 mr-1" />
            {version.restoreCount}
          </Badge>
        )}
      </div>

      {/* Canvas Info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          <span>
            {version.canvasWidth} × {version.canvasHeight}
          </span>
        </div>
        {version.paperSize && version.paperSize !== "custom" && (
          <span className="uppercase">{version.paperSize}</span>
        )}
      </div>

      {/* Actions */}
      {!isNaming && (
        <div className="flex gap-2">
          <Button size="sm" onClick={onRestore} className="flex-1">
            <RotateCcw className="h-3 w-3 mr-1.5" />
            Restore
          </Button>
          <Button size="sm" variant="outline" onClick={onName}>
            <Tag className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
