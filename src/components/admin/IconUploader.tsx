import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileArchive, AlertTriangle, CheckCircle, Info } from "lucide-react";
import JSZip from "jszip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Category {
  id: string;
  name: string;
}

interface ValidationResult {
  isValid: boolean;
  content?: string;
  error?: string;
  debugInfo?: {
    fileType: string;
    fileSize: number;
    firstChars: string;
    hasXmlDeclaration: boolean;
    hasSvgTag: boolean;
    hasSvgNamespace: boolean;
  };
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
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);

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

  // Enhanced SVG validation with multiple checks and better error messages
  const validateSVGContent = (content: string, file: File): ValidationResult => {
    try {
      // Remove BOM if present
      const cleanContent = content.replace(/^\uFEFF/, '');
      
      // Get first 500 characters for debugging
      const preview = cleanContent.substring(0, 500);
      const lower = cleanContent.toLowerCase();
      
      // Multiple validation checks
      const hasXmlDeclaration = lower.includes('<?xml') || lower.includes('xml version');
      const hasSvgTag = lower.includes('<svg');
      const hasSvgNamespace = lower.includes('xmlns="http://www.w3.org/2000/svg"') || 
                             lower.includes("xmlns='http://www.w3.org/2000/svg'");
      const hasClosingSvgTag = lower.includes('</svg>');
      
      const debugInfo = {
        fileType: file.type || 'unknown',
        fileSize: file.size,
        firstChars: preview.substring(0, 100),
        hasXmlDeclaration,
        hasSvgTag,
        hasSvgNamespace
      };

      console.log('SVG Validation Debug:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        hasXmlDeclaration,
        hasSvgTag,
        hasSvgNamespace,
        hasClosingSvgTag,
        firstChars: preview.substring(0, 100)
      });

      // Validation logic
      if (!hasSvgTag) {
        return {
          isValid: false,
          error: "No SVG tag found. This file doesn't contain valid SVG markup.",
          debugInfo
        };
      }

      if (!hasClosingSvgTag) {
        return {
          isValid: false,
          error: "Incomplete SVG file. Missing closing </svg> tag.",
          debugInfo
        };
      }

      if (!hasSvgNamespace) {
        console.warn('SVG missing namespace declaration, but proceeding...');
      }

      return {
        isValid: true,
        content: cleanContent,
        debugInfo
      };
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  // Try reading file with multiple methods
  const readFileWithFallback = async (file: File): Promise<ValidationResult> => {
    // Method 1: Try reading as text (UTF-8)
    try {
      const textContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file, 'UTF-8');
      });

      return validateSVGContent(textContent, file);
    } catch (error) {
      console.warn('UTF-8 reading failed, trying ArrayBuffer...', error);
    }

    // Method 2: Try reading as ArrayBuffer and manually decode
    try {
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      // Try UTF-8 decoding
      const decoder = new TextDecoder('utf-8');
      const textContent = decoder.decode(arrayBuffer);
      
      return validateSVGContent(textContent, file);
    } catch (error) {
      console.error('ArrayBuffer reading failed:', error);
    }

    // Method 3: Try Latin-1 encoding as last resort
    try {
      const textContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file, 'ISO-8859-1');
      });

      return validateSVGContent(textContent, file);
    } catch (error) {
      console.error('All reading methods failed:', error);
    }

    return {
      isValid: false,
      error: 'Failed to read file. The file may be corrupted or in an unsupported format.'
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileSize(selectedFile.size);
      setValidationWarning("");
      setDebugInfo("");
      setFilePreview(null);
      
      // Check file extension first
      if (!selectedFile.name.toLowerCase().endsWith('.svg')) {
        setValidationWarning("File must have .svg extension");
        setDebugInfo(`File type: ${selectedFile.type}, Name: ${selectedFile.name}`);
        return;
      }

      // Validate and preview with enhanced validation
      const result = await readFileWithFallback(selectedFile);
      
      if (!result.isValid) {
        setValidationWarning(result.error || "Invalid SVG file");
        
        if (result.debugInfo) {
          const debugText = `
File Type: ${result.debugInfo.fileType}
File Size: ${(result.debugInfo.fileSize / 1024).toFixed(2)} KB
Has XML Declaration: ${result.debugInfo.hasXmlDeclaration ? 'Yes' : 'No'}
Has SVG Tag: ${result.debugInfo.hasSvgTag ? 'Yes' : 'No'}
Has SVG Namespace: ${result.debugInfo.hasSvgNamespace ? 'Yes' : 'No'}
First 100 characters:
${result.debugInfo.firstChars}
          `.trim();
          setDebugInfo(debugText);
        }
        
        return;
      }
      
      // Success - valid SVG
      setValidationWarning("");
      setFilePreview(result.content || "");
      
      if (result.debugInfo) {
        const debugText = `✓ Valid SVG detected
File Size: ${(result.debugInfo.fileSize / 1024).toFixed(2)} KB
Has XML Declaration: ${result.debugInfo.hasXmlDeclaration ? 'Yes' : 'No'}
Has SVG Namespace: ${result.debugInfo.hasSvgNamespace ? 'Yes' : 'No'}`;
        setDebugInfo(debugText);
      }
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

    if (validationWarning) {
      toast.error("Please fix validation errors before uploading");
      return;
    }

    setIsUploading(true);
    
    try {
      const result = await readFileWithFallback(file);
      
      if (!result.isValid || !result.content) {
        toast.error(result.error || "Invalid SVG file");
        setIsUploading(false);
        return;
      }
      
      const thumbnail = generateThumbnail(result.content);
      const sanitizedName = sanitizeFileName(iconName);
      
      const { error } = await supabase
        .from('icons')
        .insert([{
          name: sanitizedName,
          category: selectedCategory,
          svg_content: result.content,
          thumbnail: thumbnail || result.content
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
        setDebugInfo("");
        setSelectedCategory("");
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload icon");
    } finally {
      setIsUploading(false);
    }
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
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">{validationWarning}</p>
                  {debugInfo && (
                    <Collapsible open={showDebug} onOpenChange={setShowDebug}>
                      <CollapsibleTrigger className="flex items-center gap-2 text-xs hover:underline">
                        <Info className="h-3 w-3" />
                        {showDebug ? 'Hide' : 'Show'} Debug Info
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                          {debugInfo}
                        </pre>
                        <p className="mt-2 text-xs text-muted-foreground">
                          💡 Try re-exporting the SVG from your design tool or opening it in a text editor to verify its structure.
                        </p>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!validationWarning && debugInfo && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <Collapsible open={showDebug} onOpenChange={setShowDebug}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-xs hover:underline">
                    <Info className="h-3 w-3" />
                    {showDebug ? 'Hide' : 'Show'} Validation Details
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                      {debugInfo}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              </AlertDescription>
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
            disabled={isUploading || !file || !!validationWarning}
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
