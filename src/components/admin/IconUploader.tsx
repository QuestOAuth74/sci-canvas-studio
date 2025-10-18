import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileArchive, AlertTriangle, CheckCircle } from "lucide-react";
import JSZip from "jszip";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [validationWarning, setValidationWarning] = useState<string>("");

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileSize(selectedFile.size);
      
      // Validate and preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        
        // Validate SVG (case-insensitive)
        const lower = content.toLowerCase();
        if (!lower.includes('<svg')) {
          setValidationWarning("This doesn't appear to be a valid SVG file");
          setFilePreview(null);
          return;
        }
        
        // No file size restrictions
        setValidationWarning("");
        
        setFilePreview(content);
      };
      reader.readAsText(selectedFile);
    }
  };
  
  // Sanitize filename
  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9-_\s]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 100);
  };

  // Generate optimized thumbnail from full SVG (target max 50KB)
  const generateThumbnail = (svgContent: string): string | null => {
    try {
      // Step 1: Remove only XML declarations, DOCTYPE, comments - keep defs for complex SVGs
      let optimized = svgContent
        .replace(/<\?xml[^>]*\?>/g, '')
        .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
        .replace(/<title>[\s\S]*?<\/title>/gi, '')
        .replace(/<desc>[\s\S]*?<\/desc>/gi, '')
        .trim();

      // Step 2: Ensure viewBox exists
      const viewBoxMatch = optimized.match(/viewBox=["']([^"']*)["']/);
      const widthMatch = optimized.match(/width=["']([^"']*)["']/);
      const heightMatch = optimized.match(/height=["']([^"']*)["']/);

      if (!viewBoxMatch && widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1]);
        const height = parseFloat(heightMatch[1]);
        if (!isNaN(width) && !isNaN(height)) {
          optimized = optimized.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
        }
      }

      // Step 3: Remove unnecessary attributes
      optimized = optimized
        .replace(/\s+id=["'][^"']*["']/g, '')
        .replace(/\s+class=["'][^"']*["']/g, '')
        .replace(/\s+style=["'][^"']*["']/g, '')
        .replace(/\s+data-[^=]*=["'][^"']*["']/g, '')
        .replace(/\s+xmlns:[^=]*=["'][^"']*["']/g, '');

      // Step 4: Reduce decimal precision aggressively
      optimized = optimized.replace(/(\d+\.\d{2,})/g, (match) => parseFloat(match).toFixed(1));

      // Step 5: Remove whitespace
      optimized = optimized
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();

      // Step 6: Validate result is still valid SVG (case-insensitive)
      if (!/\<svg[\s\S]*\<\/svg\>/i.test(optimized)) {
        console.warn('Optimization produced invalid SVG, using original');
        return svgContent; // Return original instead of null
      }

      console.log(`Thumbnail optimized: ${svgContent.length} → ${optimized.length} bytes`);
      return optimized;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return null;
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedCategory || !iconName) {
      toast.error("Please fill all fields");
      return;
    }

    if (validationWarning.includes("valid SVG")) {
      toast.error("Please select a valid SVG file");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const svgContent = e.target?.result as string;
      
      // Validate SVG content (case-insensitive)
      const lower = (svgContent || '').toLowerCase();
      if (!lower.includes('<svg')) {
        toast.error("Invalid SVG file");
        setIsUploading(false);
        return;
      }
      
      const thumbnail = generateThumbnail(svgContent);
      const sanitizedName = sanitizeFileName(iconName);
      
      const { error } = await supabase
        .from('icons')
        .insert([{
          name: sanitizedName,
          category: selectedCategory,
          svg_content: svgContent,
          thumbnail: thumbnail || svgContent // Use original if optimization fails
        }]);

      if (error) {
        toast.error("Failed to upload icon");
        console.error(error);
      } else {
        toast.success(`Icon "${sanitizedName}" uploaded successfully!`);
        setIconName("");
        setFile(null);
        setFilePreview(null);
        setValidationWarning("");
        setSelectedCategory("");
      }
      setIsUploading(false);
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
      let needThumbnails = 0;

      const svgFiles = Object.keys(zipContent.files).filter(
        (filename) => filename.toLowerCase().endsWith('.svg') && !filename.startsWith('__MACOSX')
      );

      for (const filename of svgFiles) {
        const file = zipContent.files[filename];
        if (!file.dir) {
          const content = await file.async('text');
          
          // Sanitize and validate SVG (case-insensitive)
          const sanitized = content.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
          const lower = sanitized.toLowerCase();
          if (!lower.includes('<svg')) {
            console.warn('Skipping invalid SVG:', filename);
            continue;
          }
          
          const rawName = filename.split('/').pop()?.replace('.svg', '') || `icon-${Date.now()}`;
          const iconName = sanitizeFileName(rawName);
          const thumbnail = generateThumbnail(sanitized);
          
          const { error } = await supabase
            .from('icons')
            .insert([{
              name: iconName,
              category: selectedCategory,
              svg_content: sanitized,
              thumbnail: thumbnail || sanitized // Use original if optimization fails
            }]);

          if (!error) {
            uploadedCount++;
          } else {
            console.error('Failed to upload:', iconName, error);
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
            {fileSize > 0 && (
              <p className="text-xs text-muted-foreground">
                File size: {(fileSize / 1024).toFixed(2)} KB
              </p>
            )}
          </div>

          {validationWarning && (
            <Alert variant={validationWarning.includes("valid") ? "destructive" : "default"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationWarning}</AlertDescription>
            </Alert>
          )}

          {filePreview && (
            <div className="border border-border rounded-lg p-4">
              <Label className="text-sm font-medium mb-2 block">Preview:</Label>
              <div className="w-24 h-24 mx-auto border border-border rounded-lg p-2 flex items-center justify-center bg-muted">
                <div 
                  dangerouslySetInnerHTML={{ __html: filePreview }}
                  className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                />
              </div>
            </div>
          )}

          <Button 
            onClick={handleUpload} 
            className="w-full" 
            disabled={isUploading || !file || validationWarning.includes("valid")}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Icon"}
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
