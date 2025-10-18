import { Canvas as FabricCanvas } from "fabric";
import { supabase } from "@/integrations/supabase/client";

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
