import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Microscope, Palette, Settings } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Microscope className="h-12 w-12 text-primary" />
              <h1 className="text-5xl font-bold text-foreground">
                Science Canvas Creator
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A free, powerful tool for scientists to create beautiful scientific
              illustrations using drag-and-drop vector graphics. Perfect for
              publications, presentations, and educational materials.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button size="lg" onClick={() => navigate("/canvas")} className="min-w-[200px]">
              <Palette className="h-5 w-5 mr-2" />
              Start Creating
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/admin")}
              className="min-w-[200px]"
            >
              <Settings className="h-5 w-5 mr-2" />
              Admin Panel
            </Button>
          </div>

          <div className="pt-16 grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-2">Drag & Drop</h3>
              <p className="text-muted-foreground">
                Easily add vector icons to your canvas and arrange them however you need
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-2">Organized Library</h3>
              <p className="text-muted-foreground">
                Icons organized by scientific categories for quick access
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-2">Export Ready</h3>
              <p className="text-muted-foreground">
                Export high-quality images perfect for publications and presentations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
