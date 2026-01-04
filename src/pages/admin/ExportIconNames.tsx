import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, FileText, Loader2, Pencil, Check, X, Upload, Save } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface IconData {
  id: string;
  name: string;
  category: string;
  created_at: string;
  altName: string;
  isDirty?: boolean;
}

// Store alt names in localStorage as a simple persistence layer
const ALT_NAMES_KEY = "icon_alt_names";

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
  const [icons, setIcons] = useState<IconData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [importStats, setImportStats] = useState<{ matched: number; notFound: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasUnsavedChanges = icons.some((icon) => icon.isDirty);

  const fetchIconNames = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("icons")
        .select("id, name, category, created_at")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

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
      setImportStats(null);
      toast.success(`Found ${data?.length || 0} icons`);
    } catch (error) {
      console.error("Error fetching icons:", error);
      toast.error("Failed to fetch icon names");
    } finally {
      setLoading(false);
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
    a.download = "svg_icon_names.txt";
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
    a.download = "svg_icon_names.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as CSV");
  };

  const downloadAsDocx = () => {
    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Arial;}}
\\f0\\fs24
SVG Icon Names from Database\\par
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
    a.download = "svg_icon_names.rtf";
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

  return (
    <div className="container max-w-3xl py-12 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export SVG Icon Names
          </CardTitle>
          <CardDescription>
            Fetch icons, add alternative names, and export in various formats. Alt names are saved locally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={fetchIconNames} disabled={loading} className="w-full">
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
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Found {icons.length} icons. Download as:
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
              </div>

              {/* Icon List */}
              <ScrollArea className="h-80 rounded border bg-muted/50">
                <div className="p-3 space-y-1">
                  {icons.map((icon, i) => (
                    <div
                      key={icon.id}
                      className={`flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/80 text-sm ${
                        icon.isDirty ? "bg-primary/5 border-l-2 border-primary" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{icon.name}</span>
                        <span className="text-muted-foreground"> · {icon.category}</span>
                        {icon.altName && (
                          <span className="ml-2 text-primary text-xs">
                            Alt: {icon.altName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          {formatDate(icon.created_at)}
                        </span>
                        {editingIndex === i ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="Alt name..."
                              className="h-7 w-32 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(i);
                                if (e.key === "Escape") cancelEdit();
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => saveEdit(i)}
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
                            onClick={() => startEdit(i)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
