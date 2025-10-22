import { Control, FabricObject } from "fabric";

/**
 * Custom render function for rotation control
 * Draws a curved arrow icon instead of default circle
 */
const renderRotationIcon = (
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  styleOverride: any,
  fabricObject: FabricObject
) => {
  const size = 24; // Icon size
  
  ctx.save();
  ctx.translate(left, top);
  
  // Draw circular background
  ctx.fillStyle = '#0D9488'; // Teal color matching theme
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Draw rotation arrow icon (curved arrow)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Draw curved arrow path (3/4 circle)
  ctx.beginPath();
  ctx.arc(0, 0, 6, -Math.PI / 4, Math.PI * 1.5, false);
  
  // Arrow head (pointing clockwise)
  ctx.moveTo(4, 4);
  ctx.lineTo(0, 6);
  ctx.lineTo(-2, 2);
  
  ctx.stroke();
  ctx.restore();
};

/**
 * Create custom rotation control
 */
export const createCustomRotationControl = () => {
  return new Control({
    x: 0,
    y: -0.5,
    offsetY: -40,
    cursorStyle: 'grab',
    actionName: 'rotate',
    render: renderRotationIcon,
  });
};

/**
 * Apply custom rotation control to all Fabric objects
 */
export const applyCustomRotationControl = () => {
  const customControl = createCustomRotationControl();
  
  // Apply to base FabricObject (affects all object types)
  FabricObject.prototype.controls.mtr = customControl;
};
