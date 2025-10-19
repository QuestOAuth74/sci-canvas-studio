import { Canvas as FabricCanvas } from "fabric";
import { supabase } from "@/integrations/supabase/client";

export async function generateIconThumbnail(svgContent: string): Promise<string> {
  try {
    // For icons, create a simple thumbnail by converting SVG to data URL
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 200, 200);
          
          // Calculate scaling to fit within canvas while maintaining aspect ratio
          const scale = Math.min(180 / img.width, 180 / img.height);
          const x = (200 - img.width * scale) / 2;
          const y = (200 - img.height * scale) / 2;
          
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
        
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        // Return a simple data URL as fallback
        resolve(`data:image/svg+xml;base64,${btoa(svgContent)}`);
      };
      
      img.src = url;
    });
  } catch (error) {
    console.error('Error generating icon thumbnail:', error);
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  }
}

export async function generateProjectThumbnail(
  canvasData: any,
  canvasWidth: number,
  canvasHeight: number,
  projectId: string,
  userId: string
): Promise<string | null> {
  try {
    // Create a temporary canvas for thumbnail generation
    const tempCanvas = new FabricCanvas(null, {
      width: canvasWidth,
      height: canvasHeight,
    });

    // Load the canvas data
    await tempCanvas.loadFromJSON(canvasData);
    tempCanvas.renderAll();

    // Calculate thumbnail dimensions (max 800x600, maintain aspect ratio)
    const maxWidth = 800;
    const maxHeight = 600;
    const scale = Math.min(
      maxWidth / canvasWidth,
      maxHeight / canvasHeight,
      1 // Don't scale up
    );
    
    const thumbnailWidth = Math.floor(canvasWidth * scale);
    const thumbnailHeight = Math.floor(canvasHeight * scale);

    // Generate thumbnail as data URL
    const dataUrl = tempCanvas.toDataURL({
      format: 'jpeg',
      quality: 0.8,
      multiplier: scale,
    });

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const fileName = `${userId}/${projectId}-${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-thumbnails')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading thumbnail:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-thumbnails')
      .getPublicUrl(uploadData.path);

    // Cleanup
    tempCanvas.dispose();

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}
