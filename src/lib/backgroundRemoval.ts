import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 1024;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting background removal process...');
    const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
      device: 'webgpu',
    });
    
    // Convert HTMLImageElement to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Resize image if needed and draw it to canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);
    
    // Get image data as base64 (PNG for lossless quality)
    const imageData = canvas.toDataURL('image/png');
    console.log('Image converted to base64');
    
    // Process the image with the segmentation model
    console.log('Processing with segmentation model...');
    const result = await segmenter(imageData);
    
    console.log('Segmentation result:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error('Invalid segmentation result');
    }
    
    // Find the mask with the highest average value (likely the subject)
    let bestMask = result[0];
    let maxAverage = 0;

    for (const segment of result) {
      if (!segment.mask) continue;
      
      // Calculate average mask value
      let sum = 0;
      for (let i = 0; i < segment.mask.data.length; i++) {
        sum += segment.mask.data[i];
      }
      const average = sum / segment.mask.data.length;
      
      console.log(`Segment "${segment.label}": average coverage = ${(average * 100).toFixed(2)}%`);
      
      if (average > maxAverage) {
        maxAverage = average;
        bestMask = segment;
      }
    }

    console.log(`Selected mask: "${bestMask.label}" with ${(maxAverage * 100).toFixed(2)}% coverage`);

    if (!bestMask.mask) {
      throw new Error('No valid mask found in segmentation result');
    }
    
    // Create a new canvas for the masked image
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Apply the mask
    const outputImageData = outputCtx.getImageData(
      0, 0,
      outputCanvas.width,
      outputCanvas.height
    );
    const data = outputImageData.data;
    
    // Apply inverted mask to alpha channel with anti-aliasing
    for (let i = 0; i < bestMask.mask.data.length; i++) {
      // Get the mask value (0 to 1)
      const maskValue = bestMask.mask.data[i];
      
      // Invert to keep subject instead of background
      let alpha = 1 - maskValue;
      
      // Apply smoothing curve for better edge quality
      // Use a cubic easing function for smoother transitions
      alpha = alpha * alpha * (3 - 2 * alpha);
      
      // Add edge feathering - expand the alpha range slightly
      alpha = Math.max(0, Math.min(1, alpha * 1.1 - 0.05));
      
      // Convert to 0-255 range
      data[i * 4 + 3] = Math.floor(alpha * 255);
    }
    
    // Fix white edges by premultiplying alpha
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      
      if (alpha > 0 && alpha < 1) {
        // Only process semi-transparent pixels to remove white fringing
        data[i] = Math.round(data[i] * alpha);     // Red
        data[i + 1] = Math.round(data[i + 1] * alpha); // Green
        data[i + 2] = Math.round(data[i + 2] * alpha); // Blue
      }
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('Mask applied successfully');
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Successfully created final blob');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
