import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, FileText, Loader2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IconData {
  name: string;
  category: string;
  created_at: string;
  altName?: string;
}

export default function ExportIconNames() {
  const [loading, setLoading] = useState(false);
  const [icons, setIcons] = useState<IconData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const fetchIconNames = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("icons")
        .select("name, category, created_at")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      setIcons(data?.map((icon) => ({ ...icon, altName: "" })) || []);
      toast.success(`Found ${data?.length || 0} icons`);
    } catch (error) {
      console.error("Error fetching icons:", error);
      toast.error("Failed to fetch icon names");
    } finally {
      setLoading(false);
    }
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
    updated[index].altName = editValue.trim();
    setIcons(updated);
    setEditingIndex(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
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

  return (
    <div className="container max-w-3xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export SVG Icon Names
          </CardTitle>
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
              <p className="text-sm text-muted-foreground">
                Found {icons.length} icons. Click the pencil to add alternative names.
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
              </div>
              <ScrollArea className="h-80 rounded border bg-muted/50">
                <div className="p-3 space-y-1">
                  {icons.map((icon, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/80 text-sm"
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
