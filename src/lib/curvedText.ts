import { FabricObject, util } from 'fabric';

export interface CurvedTextOptions {
  text?: string;
  diameter?: number;
  kerning?: number;
  flipped?: boolean;
  fill?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  left?: number;
  top?: number;
}

export class CurvedText extends FabricObject {
  text: string;
  diameter: number;
  kerning: number;
  flipped: boolean;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  fontStyle: string;
  textFill: string;
  private internalCanvas: HTMLCanvasElement | null = null;

  static type = 'curvedText';

  constructor(text: string = '', options: CurvedTextOptions = {}) {
    super(options);
    
    this.text = text || 'Curved Text';
    this.diameter = options.diameter || 400;
    this.kerning = options.kerning !== undefined ? options.kerning : 0;
    this.flipped = options.flipped || false;
    this.fontSize = options.fontSize || 40;
    this.fontFamily = options.fontFamily || 'Inter';
    this.fontWeight = options.fontWeight || 'normal';
    this.fontStyle = options.fontStyle || 'normal';
    this.textFill = options.fill || '#000000';
    
    this.width = this.diameter;
    this.height = this.diameter / 2;
    
    this.setControlsVisibility({
      mt: false,
      mb: false,
      ml: true,
      mr: true,
      bl: true,
      br: true,
      tl: true,
      tr: true,
      mtr: true,
    });
  }

  private getCircularText(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const radius = this.diameter / 2;
    
    // Set canvas size
    canvas.width = this.diameter;
    canvas.height = this.diameter;
    
    // Set font
    ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    ctx.fillStyle = this.textFill;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate text metrics
    const text = this.text;
    const numChars = text.length;
    
    // Calculate total text width with kerning
    let totalWidth = 0;
    for (let i = 0; i < numChars; i++) {
      totalWidth += ctx.measureText(text[i]).width + this.kerning;
    }
    
    // Calculate arc angle based on text width and radius
    const arcAngle = totalWidth / radius;
    const startAngle = -arcAngle / 2;
    
    // Center the canvas
    ctx.translate(radius, radius);
    
    // Flip if needed
    if (this.flipped) {
      ctx.rotate(Math.PI);
    }
    
    // Draw each character
    let angle = startAngle;
    for (let i = 0; i < numChars; i++) {
      const char = text[i];
      const charWidth = ctx.measureText(char).width;
      const charAngle = (charWidth + this.kerning) / radius;
      
      ctx.save();
      ctx.rotate(angle + charAngle / 2);
      ctx.translate(0, this.flipped ? radius - this.fontSize / 2 : -radius + this.fontSize / 2);
      
      if (this.flipped) {
        ctx.rotate(Math.PI);
      }
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
      
      angle += charAngle;
    }
    
    return this.cropCanvas(canvas);
  }

  private cropCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = sourceCanvas.getContext('2d')!;
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const { data } = imageData;
    
    let minX = w, minY = h, maxX = 0, maxY = 0;
    
    // Find bounds
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // Add padding
    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(w, maxX + padding);
    maxY = Math.min(h, maxY + padding);
    
    const cropW = maxX - minX;
    const cropH = maxY - minY;
    
    // Create cropped canvas
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const croppedCtx = croppedCanvas.getContext('2d')!;
    croppedCtx.drawImage(sourceCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    
    return croppedCanvas;
  }

  _render(ctx: CanvasRenderingContext2D): void {
    // Generate the curved text canvas
    this.internalCanvas = this.getCircularText();
    
    // Update dimensions based on cropped canvas
    this.width = this.internalCanvas.width;
    this.height = this.internalCanvas.height;
    
    // Draw the canvas on the fabric canvas
    ctx.drawImage(
      this.internalCanvas,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
  }

  toObject(propertiesToInclude: string[] = []): any {
    return {
      ...super.toObject(propertiesToInclude),
      type: 'curvedText',
      text: this.text,
      diameter: this.diameter,
      kerning: this.kerning,
      flipped: this.flipped,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle,
      fill: this.textFill,
    };
  }

  static fromObject(object: any): Promise<CurvedText> {
    return Promise.resolve(
      new CurvedText(object.text, {
        ...object,
      })
    );
  }
}
