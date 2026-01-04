import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface IconData {
  name: string;
  category: string;
  created_at: string;
}

export default function ExportIconNames() {
  const [loading, setLoading] = useState(false);
  const [icons, setIcons] = useState<IconData[]>([]);

  const fetchIconNames = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("icons")
        .select("name, category, created_at")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      setIcons(data || []);
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

  const downloadAsTxt = () => {
    const content = icons.map((icon) => `${icon.category} - ${icon.name}`).join("\n");
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
    const headers = "Name,Category,Date Added";
    const rows = icons.map(
      (icon) => `"${icon.name.replace(/"/g, '""')}","${icon.category}","${formatDate(icon.created_at)}"`
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
${icons.map((icon) => `${icon.category} - ${icon.name}`.replace(/\\/g, "\\\\") + "\\par").join("\n")}
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
    <div className="container max-w-2xl py-12">
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
              </div>
              <div className="max-h-64 overflow-auto rounded border bg-muted/50 p-3 text-sm">
                {icons.slice(0, 50).map((icon, i) => (
                  <div key={i} className="flex justify-between py-0.5">
                    <span>{icon.category} - {icon.name}</span>
                    <span className="text-muted-foreground text-xs">{formatDate(icon.created_at)}</span>
                  </div>
                ))}
                {icons.length > 50 && (
                  <div className="pt-2 text-muted-foreground">
                    ... and {icons.length - 50} more
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
