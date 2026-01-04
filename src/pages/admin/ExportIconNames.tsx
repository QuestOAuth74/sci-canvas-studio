import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ExportIconNames() {
  const [loading, setLoading] = useState(false);
  const [iconNames, setIconNames] = useState<string[]>([]);

  const fetchIconNames = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("icons")
        .select("name, category")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      const names = data?.map((icon) => `${icon.category} - ${icon.name}`) || [];
      setIconNames(names);
      toast.success(`Found ${names.length} icons`);
    } catch (error) {
      console.error("Error fetching icons:", error);
      toast.error("Failed to fetch icon names");
    } finally {
      setLoading(false);
    }
  };

  const downloadAsTxt = () => {
    const content = iconNames.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "svg_icon_names.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as TXT");
  };

  const downloadAsDocx = () => {
    // Create simple RTF format (opens in Word)
    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Arial;}}
\\f0\\fs24
SVG Icon Names from Database\\par
\\par
${iconNames.map((name) => name.replace(/\\/g, "\\\\") + "\\par").join("\n")}
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

          {iconNames.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                Found {iconNames.length} icons. Download as:
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadAsTxt}>
                  <Download className="h-4 w-4" />
                  Notepad (.txt)
                </Button>
                <Button variant="outline" onClick={downloadAsDocx}>
                  <Download className="h-4 w-4" />
                  Word (.rtf)
                </Button>
              </div>
              <div className="max-h-64 overflow-auto rounded border bg-muted/50 p-3 text-sm">
                {iconNames.slice(0, 50).map((name, i) => (
                  <div key={i} className="py-0.5">{name}</div>
                ))}
                {iconNames.length > 50 && (
                  <div className="pt-2 text-muted-foreground">
                    ... and {iconNames.length - 50} more
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
