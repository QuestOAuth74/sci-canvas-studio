import { useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, FileText, Loader2, Pencil, Check, X, Upload, Save, ChevronLeft, ChevronRight, Search, BookOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  fuzzySearchIcons,
  loadTaxonomy,
  saveTaxonomy,
  parseTaxonomyCSV,
  TaxonomyEntry,
  SearchResult,
} from "@/lib/fuzzySearch";

interface IconData {
  id: string;
  name: string;
  category: string;
  created_at: string;
  altName: string;
  isDirty?: boolean;
}

const ALT_NAMES_KEY = "icon_alt_names";
const PAGE_SIZE = 1000;

const loadAltNames = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(ALT_NAMES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveAltNames = (altNames: Record<string, string>) => {
  localStorage.setItem(ALT_NAMES_KEY, JSON.stringify(altNames));
};

export default function ExportIconNames() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [icons, setIcons] = useState<IconData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [importStats, setImportStats] = useState<{ matched: number; notFound: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taxonomyFileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [taxonomy, setTaxonomy] = useState<TaxonomyEntry[]>(() => loadTaxonomy());
  const [similarityThreshold, setSimilarityThreshold] = useState(0.6);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasUnsavedChanges = icons.some((icon) => icon.isDirty);

  // Fuzzy search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return icons.map((item) => ({ item, score: 1, matchType: "exact" as const }));
    }
    return fuzzySearchIcons(icons, searchQuery, taxonomy, similarityThreshold);
  }, [icons, searchQuery, taxonomy, similarityThreshold]);

  const filteredIcons = searchResults.map((r) => r.item);
  const searchResultsMap = new Map(searchResults.map((r) => [r.item.id, r]));

  const fetchIconNames = async (page: number = 1) => {
    setLoading(true);
    try {
      const { count, error: countError } = await supabase
        .from("icons")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;
      setTotalCount(count || 0);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("icons")
        .select("id, name, category, created_at")
        .order("category", { ascending: true })
        .order("name", { ascending: true })
        .range(from, to);

      if (error) throw error;

      const storedAltNames = loadAltNames();

      setIcons(
        data?.map((icon) => ({
          id: icon.id,
          name: icon.name,
          category: icon.category,
          created_at: icon.created_at,
          altName: storedAltNames[icon.id] || "",
          isDirty: false,
        })) || []
      );
      setCurrentPage(page);
      setImportStats(null);
      toast.success(`Loaded ${data?.length || 0} icons (page ${page} of ${Math.ceil((count || 0) / PAGE_SIZE)})`);
    } catch (error) {
      console.error("Error fetching icons:", error);
      toast.error("Failed to fetch icon names");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    if (hasUnsavedChanges) {
      const confirm = window.confirm("You have unsaved changes. Continue without saving?");
      if (!confirm) return;
    }
    fetchIconNames(page);
  };

  const fetchAllIcons = async (): Promise<IconData[]> => {
    const allIcons: IconData[] = [];
    const storedAltNames = loadAltNames();
    let page = 0;
    const pageCount = Math.ceil(totalCount / PAGE_SIZE);

    while (page < pageCount) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("icons")
        .select("id, name, category, created_at")
        .order("category", { ascending: true })
        .order("name", { ascending: true })
        .range(from, to);

      if (error) throw error;

      if (data) {
        allIcons.push(
          ...data.map((icon) => ({
            id: icon.id,
            name: icon.name,
            category: icon.category,
            created_at: icon.created_at,
            altName: storedAltNames[icon.id] || "",
            isDirty: false,
          }))
        );
      }

      page++;
      setDownloadProgress(Math.round((page / pageCount) * 100));
    }

    return allIcons;
  };

  const downloadAllAsCsv = async () => {
    setDownloadingAll(true);
    setDownloadProgress(0);
    try {
      const allIcons = await fetchAllIcons();
      const headers = "Name,Alternative Name,Category,Date Added";
      const rows = allIcons.map(
        (icon) =>
          `"${icon.name.replace(/"/g, '""')}","${(icon.altName || "").replace(/"/g, '""')}","${icon.category}","${formatDate(icon.created_at)}"`
      );
      const content = [headers, ...rows].join("\n");
      const blob = new Blob([content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `svg_icon_names_all_${allIcons.length}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded all ${allIcons.length} icons as CSV`);
    } catch (error) {
      console.error("Error downloading all icons:", error);
      toast.error("Failed to download all icons");
    } finally {
      setDownloadingAll(false);
      setDownloadProgress(0);
    }
  };

  const saveChanges = () => {
    const altNames = loadAltNames();
    icons.forEach((icon) => {
      if (icon.altName) {
        altNames[icon.id] = icon.altName;
      } else {
        delete altNames[icon.id];
      }
    });
    saveAltNames(altNames);
    setIcons((prev) => prev.map((icon) => ({ ...icon, isDirty: false })));
    toast.success("Alternative names saved");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(icons[index].altName || "");
  };

  const saveEdit = (index: number) => {
    const updated = [...icons];
    const newAltName = editValue.trim();
    if (updated[index].altName !== newAltName) {
      updated[index].altName = newAltName;
      updated[index].isDirty = true;
    }
    setIcons(updated);
    setEditingIndex(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const parseCSV = (text: string): { name: string; altName: string }[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    const results: { name: string; altName: string }[] = [];

    const startIndex = lines[0]?.toLowerCase().includes("name") ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.match(/("([^"]|"")*"|[^,]*),("([^"]|"")*"|[^,]*)/);
      if (matches) {
        const name = matches[1].replace(/^"|"$/g, "").replace(/""/g, '"').trim();
        const altName = matches[3].replace(/^"|"$/g, "").replace(/""/g, '"').trim();
        if (name && altName) {
          results.push({ name, altName });
        }
      } else {
        const parts = line.split(",");
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const altName = parts[1].trim();
          if (name && altName) {
            results.push({ name, altName });
          }
        }
      }
    }
    return results;
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const importData = parseCSV(text);

      if (importData.length === 0) {
        toast.error("No valid data found in CSV. Expected format: Name, Alternative Name");
        return;
      }

      let matched = 0;

      const updated = icons.map((icon) => {
        const match = importData.find(
          (row) => row.name.toLowerCase() === icon.name.toLowerCase()
        );
        if (match && match.altName !== icon.altName) {
          matched++;
          return { ...icon, altName: match.altName, isDirty: true };
        }
        return icon;
      });

      const notFound = importData.length - matched;
      setIcons(updated);
      setImportStats({ matched, notFound });
      toast.success(`Imported ${matched} alternative names (unsaved)`);
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
    };

    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadAsTxt = () => {
    const content = icons
      .map((icon) => {
        const alt = icon.altName ? ` (Alt: ${icon.altName})` : "";
        return `${icon.category} - ${icon.name}${alt}`;
      })
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `svg_icon_names_page${currentPage}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as TXT");
  };

  const downloadAsCsv = () => {
    const headers = "Name,Alternative Name,Category,Date Added";
    const rows = icons.map(
      (icon) =>
        `"${icon.name.replace(/"/g, '""')}","${(icon.altName || "").replace(/"/g, '""')}","${icon.category}","${formatDate(icon.created_at)}"`
    );
    const content = [headers, ...rows].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `svg_icon_names_page${currentPage}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as CSV");
  };

  const downloadAsDocx = () => {
    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Arial;}}
\\f0\\fs24
SVG Icon Names from Database (Page ${currentPage} of ${totalPages})\\par
\\par
${icons
  .map((icon) => {
    const alt = icon.altName ? ` (Alt: ${icon.altName})` : "";
    return `${icon.category} - ${icon.name}${alt}`.replace(/\\/g, "\\\\") + "\\par";
  })
  .join("\n")}
}`;
    const blob = new Blob([rtfContent], { type: "application/rtf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `svg_icon_names_page${currentPage}.rtf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as RTF (opens in Word)");
  };

  const downloadTemplateCsv = () => {
    const headers = "Name,Alternative Name";
    const sampleRows = icons.slice(0, 5).map((icon) => `"${icon.name.replace(/"/g, '""')}",""`);
    const content = [headers, ...sampleRows].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alt_names_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const exportAltNamesJson = () => {
    const altNames = loadAltNames();
    const blob = new Blob([JSON.stringify(altNames, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "icon_alt_names_backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Alt names backup downloaded");
  };

  // Taxonomy handlers
  const handleTaxonomyImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const newTaxonomy = parseTaxonomyCSV(text);

      if (newTaxonomy.length === 0) {
        toast.error("No valid data found. Format: OriginalName, Alt1, Alt2, ...");
        return;
      }

      // Merge with existing taxonomy
      const existingMap = new Map(taxonomy.map((t) => [t.originalName.toLowerCase(), t]));
      newTaxonomy.forEach((entry) => {
        const key = entry.originalName.toLowerCase();
        if (existingMap.has(key)) {
          const existing = existingMap.get(key)!;
          const mergedAlts = [...new Set([...existing.alternativeNames, ...entry.alternativeNames])];
          existingMap.set(key, { ...existing, alternativeNames: mergedAlts });
        } else {
          existingMap.set(key, entry);
        }
      });

      const merged = Array.from(existingMap.values());
      setTaxonomy(merged);
      saveTaxonomy(merged);
      toast.success(`Imported ${newTaxonomy.length} taxonomy entries (total: ${merged.length})`);
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
    };

    reader.readAsText(file);

    if (taxonomyFileInputRef.current) {
      taxonomyFileInputRef.current.value = "";
    }
  };

  const downloadTaxonomyTemplate = () => {
    const headers = "OriginalName,Alternative1,Alternative2,Alternative3";
    const examples = [
      "cell membrane,plasma membrane,lipid bilayer,cell wall",
      "mitochondria,mitochondrion,powerhouse,energy organelle",
      "DNA helix,double helix,dna strand,genetic material",
    ];
    const content = [headers, ...examples].join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "taxonomy_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Taxonomy template downloaded");
  };

  const clearTaxonomy = () => {
    setTaxonomy([]);
    saveTaxonomy([]);
    toast.success("Taxonomy cleared");
  };

  const getMatchTypeBadge = (matchType: SearchResult<IconData>["matchType"]) => {
    const badges: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      exact: { label: "Exact", variant: "default" },
      partial: { label: "Partial", variant: "secondary" },
      word: { label: "Word", variant: "secondary" },
      taxonomy: { label: "Taxonomy", variant: "outline" },
      similar: { label: "Similar", variant: "outline" },
    };
    return badges[matchType] || badges.exact;
  };

  return (
    <div className="container max-w-3xl py-12 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export SVG Icon Names
          </CardTitle>
          <CardDescription>
            Fetch icons in batches of {PAGE_SIZE}, add alternative names, and export. Alt names are saved locally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => fetchIconNames(1)} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              "Fetch Icon Names from Database"
            )}
          </Button>

          {icons.length > 0 && (
            <>
              {/* Pagination Controls */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({totalCount} total icons)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) goToPage(val);
                      }}
                      className="h-8 w-16 text-center text-sm"
                    />
                    <span className="text-sm text-muted-foreground">/ {totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Search & Taxonomy Section */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">Fuzzy Search</h4>
                  <Badge variant="secondary" className="text-xs">
                    {searchQuery ? `${filteredIcons.length} matches` : `${icons.length} icons`}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Search icons by name (partial, similar, or taxonomy match)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  {searchQuery && (
                    <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Similarity Threshold */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Similarity threshold</span>
                    <span className="text-xs font-mono">{(similarityThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[similarityThreshold]}
                    onValueChange={([val]) => setSimilarityThreshold(val)}
                    min={0.3}
                    max={0.9}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                {/* Taxonomy Upload */}
                <div className="rounded border bg-background/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Search Taxonomy</span>
                      {taxonomy.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {taxonomy.length} entries
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={downloadTaxonomyTemplate}>
                        <Download className="h-3 w-3" />
                        Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => taxonomyFileInputRef.current?.click()}
                      >
                        <Upload className="h-3 w-3" />
                        Import
                      </Button>
                      {taxonomy.length > 0 && (
                        <Button variant="outline" size="sm" onClick={clearTaxonomy}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <input
                        ref={taxonomyFileInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleTaxonomyImport}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    CSV format: OriginalName, Alt1, Alt2, Alt3... Maps alternative terms to icon names.
                  </p>
                  {taxonomy.length > 0 && (
                    <div className="max-h-20 overflow-y-auto">
                      <div className="flex flex-wrap gap-1">
                        {taxonomy.slice(0, 10).map((entry, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {entry.originalName} ({entry.alternativeNames.length} alts)
                          </Badge>
                        ))}
                        {taxonomy.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{taxonomy.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              {hasUnsavedChanges && (
                <Alert className="border-primary/50 bg-primary/5">
                  <AlertDescription className="flex items-center justify-between">
                    <span className="text-sm">You have unsaved changes</span>
                    <Button size="sm" onClick={saveChanges} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Import Section */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Bulk Import Alternative Names</h4>
                    <p className="text-xs text-muted-foreground">
                      Upload a CSV with columns: Name, Alternative Name
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={downloadTemplateCsv}>
                      <Download className="h-3 w-3" />
                      Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3 w-3" />
                      Import CSV
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileImport}
                    />
                  </div>
                </div>
                {importStats && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      ✓ Matched {importStats.matched} icons
                      {importStats.notFound > 0 && (
                        <span className="text-muted-foreground">
                          {" "}· {importStats.notFound} names in CSV not found in database
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Export Buttons */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Showing {icons.length} icons on this page. Download as:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={downloadAsTxt}>
                    <Download className="h-4 w-4" />
                    Notepad (.txt)
                  </Button>
                  <Button variant="outline" onClick={downloadAsCsv}>
                    <Download className="h-4 w-4" />
                    Excel (.csv)
                  </Button>
                  <Button variant="outline" onClick={downloadAsDocx}>
                    <Download className="h-4 w-4" />
                    Word (.rtf)
                  </Button>
                  <Button variant="outline" onClick={exportAltNamesJson}>
                    <Download className="h-4 w-4" />
                    Backup Alt Names
                  </Button>
                </div>

                {/* Download All Section */}
                <div className="rounded-lg border border-dashed bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Download All Pages</p>
                      <p className="text-xs text-muted-foreground">
                        Fetch and export all {totalCount} icons into a single CSV file
                      </p>
                    </div>
                    <Button
                      onClick={downloadAllAsCsv}
                      disabled={downloadingAll || totalCount === 0}
                    >
                      {downloadingAll ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {downloadProgress}%
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download All ({totalCount})
                        </>
                      )}
                    </Button>
                  </div>
                  {downloadingAll && (
                    <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Icon List */}
              <ScrollArea className="h-80 rounded border bg-muted/50">
                <div className="p-3 space-y-1">
                  {filteredIcons.length === 0 && searchQuery ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No icons match "{searchQuery}"</p>
                      <p className="text-xs mt-1">Try a different term or adjust the similarity threshold</p>
                    </div>
                  ) : (
                    filteredIcons.map((icon) => {
                      const searchResult = searchResultsMap.get(icon.id);
                      const matchBadge = searchQuery && searchResult ? getMatchTypeBadge(searchResult.matchType) : null;
                      const originalIndex = icons.findIndex((i) => i.id === icon.id);
                      
                      return (
                        <div
                          key={icon.id}
                          className={`flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/80 text-sm ${
                            icon.isDirty ? "bg-primary/5 border-l-2 border-primary" : ""
                          }`}
                        >
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <div>
                              <span className="font-medium">{icon.name}</span>
                              <span className="text-muted-foreground"> · {icon.category}</span>
                              {icon.altName && (
                                <span className="ml-2 text-primary text-xs">
                                  Alt: {icon.altName}
                                </span>
                              )}
                            </div>
                            {matchBadge && (
                              <Badge variant={matchBadge.variant} className="text-xs h-5">
                                {matchBadge.label}
                                {searchResult && searchResult.score < 1 && (
                                  <span className="ml-1 opacity-70">
                                    {(searchResult.score * 100).toFixed(0)}%
                                  </span>
                                )}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-muted-foreground text-xs whitespace-nowrap">
                              {formatDate(icon.created_at)}
                            </span>
                            {editingIndex === originalIndex ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  placeholder="Alt name..."
                                  className="h-7 w-32 text-xs"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit(originalIndex);
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => saveEdit(originalIndex)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={cancelEdit}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => startEdit(originalIndex)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Bottom Pagination */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
