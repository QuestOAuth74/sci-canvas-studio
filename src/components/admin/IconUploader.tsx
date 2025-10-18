import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { iconStorage } from "@/lib/iconStorage";
import { IconCategory } from "@/types/icon";
import { toast } from "sonner";
import { Upload, FileArchive } from "lucide-react";
import JSZip from "jszip";

export const IconUploader = () => {
  const [categories] = useState<IconCategory[]>(iconStorage.getCategories());
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [iconName, setIconName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    reader.onload = (e) => {
      const svgData = e.target?.result as string;
      
      iconStorage.saveIcon({
        id: Date.now().toString(),
        name: iconName,
        category: selectedCategory,
        svgData,
        thumbnail: svgData,
        createdAt: Date.now(),
      });

      toast.success("Icon uploaded successfully!");
      setIconName("");
      setFile(null);
      setSelectedCategory("");
    };

    reader.readAsDataURL(file);
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
          
          // Convert SVG text to data URL
          const blob = new Blob([content], { type: 'image/svg+xml' });
          const reader = new FileReader();
          
          await new Promise((resolve) => {
            reader.onload = () => {
              const svgData = reader.result as string;
              
              iconStorage.saveIcon({
                id: `${Date.now()}-${uploadedCount}`,
                name: iconName,
                category: selectedCategory,
                svgData,
                thumbnail: svgData,
                createdAt: Date.now(),
              });
              
              uploadedCount++;
              resolve(null);
            };
            reader.readAsDataURL(blob);
          });
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
            Upload SVG or ICO files to your icon library
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
            <Label htmlFor="file">Icon File (SVG/ICO)</Label>
            <Input
              id="file"
              type="file"
              accept=".svg,.ico"
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
