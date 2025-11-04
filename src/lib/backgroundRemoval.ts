import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = true;

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
      device: 'auto',
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
    
    // DEBUG: Log all segments for debugging
    if (import.meta.env.DEV) {
      console.group('🔍 Segmentation Debug');
      result.forEach((seg, idx) => {
        if (seg.mask) {
          let sum = 0;
          for (let i = 0; i < seg.mask.data.length; i++) {
            sum += seg.mask.data[i];
          }
          const coverage = (sum / seg.mask.data.length) * 100;
          console.log(`[${idx}] ${seg.label}: ${coverage.toFixed(2)}%`);
        }
      });
      console.groupEnd();
    }
    
    // Find the mask most likely to be the subject (not background or artifacts)
    let bestMask = result[0];
    let bestScore = -1;

    for (const segment of result) {
      if (!segment.mask) continue;
      
      // Calculate average mask value
      let sum = 0;
      for (let i = 0; i < segment.mask.data.length; i++) {
        sum += segment.mask.data[i];
      }
      const coverage = (sum / segment.mask.data.length) * 100;
      
      // Score the mask: prefer coverage between 20-80% (likely subject, not background)
      let score = 0;
      if (coverage >= 20 && coverage <= 80) {
        // Prefer masks in the "sweet spot"
        score = 100 - Math.abs(50 - coverage); // Peak score at 50% coverage
      } else if (coverage > 80) {
        // Penalize high coverage (likely background)
        score = Math.max(0, 20 - (coverage - 80)); // Low score for backgrounds
      } else {
        // Penalize low coverage (likely artifacts)
        score = coverage; // Very low score
      }
      
      // Bonus for subject-like labels
      const subjectLabels = ['person', 'object', 'shape', 'figure', 'entity', 'item'];
      const backgroundLabels = ['wall', 'floor', 'ceiling', 'sky', 'background', 'ground'];

      if (subjectLabels.some(label => segment.label?.toLowerCase().includes(label))) {
        score += 20; // Bonus for subject labels
      }
      if (backgroundLabels.some(label => segment.label?.toLowerCase().includes(label))) {
        score -= 30; // Penalty for background labels
      }
      
      console.log(`Segment "${segment.label}": coverage = ${coverage.toFixed(2)}%, score = ${score.toFixed(2)}`);
      
      if (score > bestScore) {
        bestScore = score;
        bestMask = segment;
      }
    }
    
    // Fallback: if no mask scored well, use the first one
    if (bestScore < 10) {
      console.warn('No good mask found, falling back to first segment');
      bestMask = result[0];
    }

    console.log(`Selected mask: "${bestMask.label}" with score ${bestScore.toFixed(2)}`);

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
    console.warn('Segmentation failed, using fast white removal fallback');
    try {
      return await removeWhiteByFloodFill(imageElement, { tolerance: 20 });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw error;
    }
  }
};

function removeWhiteByFloodFill(image: HTMLImageElement, { tolerance = 20 } = {}): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0);

      const { width, height } = canvas;
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const visited = new Uint8Array(width * height);

      const nearWhite = (r: number, g: number, b: number) =>
        (255 - r) <= tolerance && (255 - g) <= tolerance && (255 - b) <= tolerance;

      const q: number[] = [];

      const pushIfWhite = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        const i = (y * width + x);
        if (visited[i]) return;
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
        if (nearWhite(r, g, b)) {
          visited[i] = 1;
          q.push(i);
        }
      };

      // Seed from all borders
      for (let x = 0; x < width; x++) {
        pushIfWhite(x, 0);
        pushIfWhite(x, height - 1);
      }
      for (let y = 0; y < height; y++) {
        pushIfWhite(0, y);
        pushIfWhite(width - 1, y);
      }

      // Flood fill
      while (q.length) {
        const i = q.pop()!;
        const x = i % width;
        const y = (i - x) / width;

        // Set alpha to 0 for background
        data[i * 4 + 3] = 0;

        // Neighbors
        pushIfWhite(x + 1, y);
        pushIfWhite(x - 1, y);
        pushIfWhite(x, y + 1);
        pushIfWhite(x, y - 1);
      }

      // Premultiply edges to reduce white halo
      for (let p = 0; p < data.length; p += 4) {
        const a = data[p + 3] / 255;
        if (a > 0 && a < 1) {
          data[p] = Math.round(data[p] * a);
          data[p + 1] = Math.round(data[p + 1] * a);
          data[p + 2] = Math.round(data[p + 2] * a);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/png', 1.0);
    } catch (e) {
      reject(e);
    }
  });
}

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
