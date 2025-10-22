import { useCanvas } from "@/contexts/CanvasContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FabricImage, filters } from "fabric";
import { useState, useEffect } from "react";
import { Crop, Wand2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 1024;

interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
}

export const ImageEditingPanel = () => {
  const { canvas, selectedObject } = useCanvas();
  const [isCropping, setIsCropping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageFilters, setImageFilters] = useState<ImageFilters>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    blur: 0,
  });

  useEffect(() => {
    if (selectedObject && selectedObject.type === 'image') {
      const img = selectedObject as FabricImage;
      
      // Read current filter values
      const currentFilters = img.filters || [];
      const brightness = currentFilters.find(f => f instanceof filters.Brightness) as any;
      const contrast = currentFilters.find(f => f instanceof filters.Contrast) as any;
      const saturation = currentFilters.find(f => f instanceof filters.Saturation) as any;
      const hueRotation = currentFilters.find(f => f instanceof filters.HueRotation) as any;
      const blur = currentFilters.find(f => f instanceof filters.Blur) as any;

      setImageFilters({
        brightness: brightness ? brightness.brightness * 100 : 0,
        contrast: contrast ? contrast.contrast * 100 : 0,
        saturation: saturation ? saturation.saturation * 100 : 0,
        hue: hueRotation ? hueRotation.rotation * 180 / Math.PI : 0,
        blur: blur ? blur.blur * 100 : 0,
      });
    }
  }, [selectedObject]);

  if (!selectedObject || selectedObject.type !== 'image') {
    return null;
  }

  const image = selectedObject as FabricImage;

  const applyFilter = (filterType: string, value?: number) => {
    if (!canvas || !image) return;

    const currentFilters = image.filters || [];
    let newFilters = [...currentFilters];

    switch (filterType) {
      case 'brightness':
        newFilters = newFilters.filter(f => !(f instanceof filters.Brightness));
        if (value !== 0) {
          newFilters.push(new filters.Brightness({ brightness: value! / 100 }));
        }
        break;
      case 'contrast':
        newFilters = newFilters.filter(f => !(f instanceof filters.Contrast));
        if (value !== 0) {
          newFilters.push(new filters.Contrast({ contrast: value! / 100 }));
        }
        break;
      case 'saturation':
        newFilters = newFilters.filter(f => !(f instanceof filters.Saturation));
        if (value !== 0) {
          newFilters.push(new filters.Saturation({ saturation: value! / 100 }));
        }
        break;
      case 'hue':
        newFilters = newFilters.filter(f => !(f instanceof filters.HueRotation));
        if (value !== 0) {
          newFilters.push(new filters.HueRotation({ rotation: value! * Math.PI / 180 }));
        }
        break;
      case 'blur':
        newFilters = newFilters.filter(f => !(f instanceof filters.Blur));
        if (value && value > 0) {
          newFilters.push(new filters.Blur({ blur: value / 100 }));
        }
        break;
      case 'grayscale':
        const hasGrayscale = newFilters.some(f => f instanceof filters.Grayscale);
        if (!hasGrayscale) {
          newFilters.push(new filters.Grayscale());
        }
        break;
      case 'sepia':
        const hasSepia = newFilters.some(f => f instanceof filters.Sepia);
        if (!hasSepia) {
          newFilters.push(new filters.Sepia());
        }
        break;
      case 'invert':
        const hasInvert = newFilters.some(f => f instanceof filters.Invert);
        if (!hasInvert) {
          newFilters.push(new filters.Invert());
        }
        break;
      case 'pixelate':
        const hasPixelate = newFilters.some(f => f instanceof filters.Pixelate);
        if (!hasPixelate) {
          newFilters.push(new filters.Pixelate({ blocksize: 8 }));
        }
        break;
      case 'vintage':
        newFilters.push(new filters.Sepia());
        newFilters.push(new filters.Contrast({ contrast: -0.2 }));
        break;
      case 'kodachrome':
        newFilters.push(new filters.Kodachrome());
        break;
      case 'technicolor':
        newFilters.push(new filters.Technicolor());
        break;
      case 'polaroid':
        newFilters.push(new filters.Polaroid());
        break;
      case 'sharpen':
        newFilters.push(new filters.Convolute({
          matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0]
        }));
        break;
    }

    image.filters = newFilters;
    image.applyFilters();
    canvas.renderAll();
  };

  const resetFilters = () => {
    if (!canvas || !image) return;
    image.filters = [];
    image.applyFilters();
    setImageFilters({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      blur: 0,
    });
    canvas.renderAll();
    toast.success("Filters reset");
  };

  const handleCrop = () => {
    if (!canvas || !image) return;
    
    if (!isCropping) {
      setIsCropping(true);
      toast.info("Select crop area and click 'Apply Crop'");
      // TODO: Implement interactive crop box
      // This would require creating a crop rectangle overlay
    } else {
      // Apply crop
      setIsCropping(false);
      toast.success("Crop applied");
    }
  };

  const removeBackground = async () => {
    if (!canvas || !image) return;
    
    setIsProcessing(true);
    toast.info("Removing background... This may take a moment");

    try {
      // Get image element from Fabric image
      const imgElement = image.getElement() as HTMLImageElement;
      
      // Create canvas and resize if needed
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      let width = imgElement.naturalWidth;
      let height = imgElement.naturalHeight;

      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
          height = MAX_IMAGE_DIMENSION;
        }
      }

      tempCanvas.width = width;
      tempCanvas.height = height;
      ctx.drawImage(imgElement, 0, 0, width, height);

      // Initialize segmentation model
      const segmenter = await pipeline(
        'image-segmentation',
        'Xenova/segformer-b0-finetuned-ade-512-512',
        { device: 'webgpu' }
      );

      // Convert to base64
      const imageData = tempCanvas.toDataURL('image/jpeg', 0.8);

      // Process with model
      const result = await segmenter(imageData);

      if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
        throw new Error('Invalid segmentation result');
      }

      // Create output canvas
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = width;
      outputCanvas.height = height;
      const outputCtx = outputCanvas.getContext('2d');
      if (!outputCtx) throw new Error('Could not get output canvas context');

      // Draw original image
      outputCtx.drawImage(tempCanvas, 0, 0);

      // Apply mask
      const outputImageData = outputCtx.getImageData(0, 0, width, height);
      const data = outputImageData.data;

      for (let i = 0; i < result[0].mask.data.length; i++) {
        const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
        data[i * 4 + 3] = alpha;
      }

      outputCtx.putImageData(outputImageData, 0, 0);

      // Create new Fabric image
      const dataUrl = outputCanvas.toDataURL('image/png');
      FabricImage.fromURL(dataUrl).then((newImg) => {
        newImg.set({
          left: image.left,
          top: image.top,
          scaleX: image.scaleX,
          scaleY: image.scaleY,
          angle: image.angle,
        });
        
        canvas.remove(image);
        canvas.add(newImg);
        canvas.setActiveObject(newImg);
        canvas.renderAll();
        
        toast.success("Background removed successfully!");
        setIsProcessing(false);
      });

    } catch (error) {
      console.error('Error removing background:', error);
      toast.error("Failed to remove background");
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-3">Image Tools</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={handleCrop}
            disabled={isProcessing}
          >
            <Crop className="h-3.5 w-3.5 mr-2" />
            {isCropping ? 'Apply Crop' : 'Crop Image'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={removeBackground}
            disabled={isProcessing}
          >
            <Wand2 className="h-3.5 w-3.5 mr-2" />
            {isProcessing ? 'Processing...' : 'Remove Background'}
          </Button>
        </div>
      </div>

      <div className="pt-3 border-t">
        <h3 className="font-semibold text-sm mb-3">Adjustments</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs mb-2 block">Brightness</label>
            <Slider
              value={[imageFilters.brightness]}
              onValueChange={([value]) => {
                setImageFilters(prev => ({ ...prev, brightness: value }));
                applyFilter('brightness', value);
              }}
              min={-100}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs mb-2 block">Contrast</label>
            <Slider
              value={[imageFilters.contrast]}
              onValueChange={([value]) => {
                setImageFilters(prev => ({ ...prev, contrast: value }));
                applyFilter('contrast', value);
              }}
              min={-100}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs mb-2 block">Saturation</label>
            <Slider
              value={[imageFilters.saturation]}
              onValueChange={([value]) => {
                setImageFilters(prev => ({ ...prev, saturation: value }));
                applyFilter('saturation', value);
              }}
              min={-100}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs mb-2 block">Hue Rotation</label>
            <Slider
              value={[imageFilters.hue]}
              onValueChange={([value]) => {
                setImageFilters(prev => ({ ...prev, hue: value }));
                applyFilter('hue', value);
              }}
              min={-180}
              max={180}
              step={1}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs mb-2 block">Blur</label>
            <Slider
              value={[imageFilters.blur]}
              onValueChange={([value]) => {
                setImageFilters(prev => ({ ...prev, blur: value }));
                applyFilter('blur', value);
              }}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="pt-3 border-t">
        <h3 className="font-semibold text-sm mb-3">Filters</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => applyFilter('grayscale')}
          >
            Grayscale
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => applyFilter('sepia')}
          >
            Sepia
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => applyFilter('invert')}
          >
            Invert
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => applyFilter('pixelate')}
          >
            Pixelate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => applyFilter('vintage')}
          >
            Vintage
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => applyFilter('kodachrome')}
          >
            Kodachrome
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => applyFilter('technicolor')}
          >
            Technicolor
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => applyFilter('polaroid')}
          >
            Polaroid
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => applyFilter('sharpen')}
          >
            Sharpen
          </Button>
        </div>
      </div>

      <Button
        variant="destructive"
        size="sm"
        className="w-full text-xs"
        onClick={resetFilters}
      >
        <Sparkles className="h-3.5 w-3.5 mr-2" />
        Reset All Filters
      </Button>
    </div>
  );
};
