import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileArchive } from "lucide-react";
import JSZip from "jszip";

interface Category {
  id: string;
  name: string;
}

export const IconUploader = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [iconName, setIconName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('icon_categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedCategory || !iconName) {
      toast.error("Please fill all fields");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const svgContent = e.target?.result as string;
      
      const { error } = await supabase
        .from('icons')
        .insert([{
          name: iconName,
          category: selectedCategory,
          svg_content: svgContent
        }]);

      if (error) {
        toast.error("Failed to upload icon");
        console.error(error);
      } else {
        toast.success("Icon uploaded successfully!");
        setIconName("");
        setFile(null);
        setSelectedCategory("");
      }
    };

    reader.readAsText(file);
  };

  const handleZipUpload = async () => {
    if (!zipFile || !selectedCategory) {
      toast.error("Please select a ZIP file and category");
      return;
    }

    setIsUploading(true);
    
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipFile);
      let uploadedCount = 0;

      const svgFiles = Object.keys(zipContent.files).filter(
        (filename) => filename.toLowerCase().endsWith('.svg') && !filename.startsWith('__MACOSX')
      );

      for (const filename of svgFiles) {
        const file = zipContent.files[filename];
        if (!file.dir) {
          const content = await file.async('text');
          const iconName = filename.split('/').pop()?.replace('.svg', '') || `icon-${Date.now()}`;
          
          const { error } = await supabase
            .from('icons')
            .insert([{
              name: iconName,
              category: selectedCategory,
              svg_content: content
            }]);

          if (!error) {
            uploadedCount++;
          }
        }
      }

      toast.success(`Successfully uploaded ${uploadedCount} icons!`);
      setZipFile(null);
      setSelectedCategory("");
    } catch (error) {
      console.error('Error processing ZIP file:', error);
      toast.error("Failed to process ZIP file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleZipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setZipFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Single Icon Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Single Icon</CardTitle>
          <CardDescription>
            Upload SVG files to your icon library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="icon-name">Icon Name</Label>
            <Input
              id="icon-name"
              placeholder="e.g., Cell Membrane"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Icon File (SVG)</Label>
            <Input
              id="file"
              type="file"
              accept=".svg"
              onChange={handleFileChange}
            />
          </div>

          <Button onClick={handleUpload} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Upload Icon
          </Button>
        </CardContent>
      </Card>

      {/* Bulk ZIP Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload from ZIP</CardTitle>
          <CardDescription>
            Upload a ZIP file containing multiple SVG files. All icons will be added to the selected category.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zip-category">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip-file">ZIP File (containing SVG files)</Label>
            <Input
              id="zip-file"
              type="file"
              accept=".zip"
              onChange={handleZipFileChange}
            />
          </div>

          <Button 
            onClick={handleZipUpload} 
            className="w-full" 
            disabled={isUploading}
          >
            <FileArchive className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload ZIP"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
