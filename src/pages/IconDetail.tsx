import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEO/SEOHead";
import { 
  ArrowLeft, Download, Lock, Atom, Tag, Calendar, 
  Copy, Check, ExternalLink, Grid3X3 
} from "lucide-react";
import { toast } from "sonner";

interface IconData {
  id: string;
  name: string;
  category: string;
  svg_content: string;
  thumbnail: string | null;
  created_at: string;
}

interface RelatedIcon {
  id: string;
  name: string;
  thumbnail: string | null;
}

export default function IconDetail() {
  const { iconId } = useParams<{ iconId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [icon, setIcon] = useState<IconData | null>(null);
  const [relatedIcons, setRelatedIcons] = useState<RelatedIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (iconId) {
      loadIcon();
    }
  }, [iconId]);

  const loadIcon = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("icons")
        .select("*")
        .eq("id", iconId)
        .single();

      if (error) throw error;
      setIcon(data);

      // Load related icons from same category
      if (data?.category) {
        const { data: related } = await supabase
          .from("icons")
          .select("id, name, thumbnail")
          .or(`category.eq.${data.category},category.ilike.%${data.category}%`)
          .neq("id", iconId)
          .limit(8);
        
        setRelatedIcons(related || []);
      }
    } catch (error) {
      console.error("Error loading icon:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSVG = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!icon?.svg_content) {
      toast.error("SVG content not available");
      return;
    }

    setDownloading(true);
    try {
      const blob = new Blob([icon.svg_content], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${icon.name.toLowerCase().replace(/\s+/g, "-")}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Icon downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download icon");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!icon?.svg_content) {
      toast.error("SVG content not available");
      return;
    }

    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      const svgBlob = new Blob([icon.svg_content], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = 512;
        canvas.height = 512;
        ctx?.drawImage(img, 0, 0, 512, 512);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = `${icon.name.toLowerCase().replace(/\s+/g, "-")}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pngUrl);
          }
          URL.revokeObjectURL(url);
          toast.success("Icon downloaded as PNG!");
          setDownloading(false);
        }, "image/png");
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error("Failed to convert to PNG");
        setDownloading(false);
      };
      
      img.src = url;
    } catch (error) {
      toast.error("Failed to download icon");
      setDownloading(false);
    }
  };

  const handleCopySVG = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!icon?.svg_content) {
      toast.error("SVG content not available");
      return;
    }

    try {
      await navigator.clipboard.writeText(icon.svg_content);
      setCopied(true);
      toast.success("SVG copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy SVG");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!icon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Atom className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Icon not found</h2>
          <p className="text-muted-foreground mb-4">
            This icon may have been removed or doesn't exist.
          </p>
          <Button onClick={() => navigate("/icons")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Icon Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${icon.name} - Scientific Icon | BioSketch`}
        description={`Download the ${icon.name} icon for your scientific illustrations. High-quality SVG and PNG formats available.`}
        canonical={`https://biosketch.art/icons/${icon.id}`}
        keywords={`${icon.name}, scientific icon, biomedical icon, ${icon.category} icon`}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/icons" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Grid3X3 className="h-4 w-4" />
            Icon Library
          </Link>
          <span>/</span>
          <span className="text-foreground">{icon.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Icon Preview */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center p-12">
                  {icon.thumbnail ? (
                    <div
                      className="w-full h-full flex items-center justify-center max-w-[300px] max-h-[300px]"
                      dangerouslySetInnerHTML={{
                        __html: icon.thumbnail.startsWith("<svg")
                          ? icon.thumbnail
                          : `<img src="${icon.thumbnail}" alt="${icon.name}" class="max-w-full max-h-full object-contain" />`,
                      }}
                    />
                  ) : (
                    <Atom className="h-32 w-32 text-muted-foreground/30" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Color Preview Swatches */}
            <div className="flex gap-2">
              {["bg-background", "bg-muted", "bg-foreground"].map((bg, i) => (
                <div
                  key={i}
                  className={`flex-1 aspect-square rounded-xl ${bg} border border-border flex items-center justify-center p-4`}
                >
                  {icon.thumbnail && (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      dangerouslySetInnerHTML={{
                        __html: icon.thumbnail.startsWith("<svg")
                          ? icon.thumbnail
                          : `<img src="${icon.thumbnail}" alt="${icon.name}" class="max-w-full max-h-full object-contain" />`,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Icon Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-3">
                {icon.name}
              </h1>
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                  <Tag className="h-4 w-4" />
                  {icon.category}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4" />
                  {new Date(icon.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Download Actions */}
            {user ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Download Icon</h3>
                <div className="grid gap-3">
                  <Button
                    size="lg"
                    onClick={handleDownloadSVG}
                    disabled={downloading}
                    className="w-full justify-center"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download SVG
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleDownloadPNG}
                    disabled={downloading}
                    className="w-full justify-center"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download PNG (512×512)
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={handleCopySVG}
                    className="w-full justify-center"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 mr-2 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5 mr-2" />
                    )}
                    {copied ? "Copied!" : "Copy SVG Code"}
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center space-y-4">
                  <Lock className="h-10 w-10 text-primary mx-auto" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Sign in to Download
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Create a free account to download icons in SVG and PNG formats.
                    </p>
                  </div>
                  <Button onClick={() => navigate("/auth")} className="w-full">
                    Sign In to Download
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Use in Canvas */}
            {user && (
              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => navigate("/canvas")}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Use in Canvas Editor
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Related Icons */}
        {relatedIcons.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Related Icons
              </h2>
              <Button
                variant="ghost"
                onClick={() => navigate(`/icons?category=${icon.category}`)}
                className="text-muted-foreground"
              >
                View all in {icon.category}
                <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
              </Button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {relatedIcons.map((relIcon) => (
                <button
                  key={relIcon.id}
                  onClick={() => navigate(`/icons/${relIcon.id}`)}
                  className="group aspect-square rounded-xl bg-card border border-border/30 hover:border-primary/50 hover:shadow-lg transition-all flex items-center justify-center p-3"
                >
                  {relIcon.thumbnail ? (
                    <div
                      className="w-full h-full flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all"
                      dangerouslySetInnerHTML={{
                        __html: relIcon.thumbnail.startsWith("<svg")
                          ? relIcon.thumbnail
                          : `<img src="${relIcon.thumbnail}" alt="${relIcon.name}" class="max-w-full max-h-full object-contain" />`,
                      }}
                    />
                  ) : (
                    <Atom className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
