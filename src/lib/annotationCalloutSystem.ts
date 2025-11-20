import { Group, Textbox, Line, Polygon, Rect, Path } from "fabric";

export type CalloutStyle = 'simple-arrow' | 'curved-arrow' | 'line' | 'elbow' | 'underline';

export interface CalloutOptions {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  lineColor?: string;
  lineWidth?: number;
  arrowSize?: number;
  hasBackground?: boolean;
  backgroundColor?: string;
  padding?: number;
}

const DEFAULT_OPTIONS: Required<CalloutOptions> = {
  text: "Label",
  fontSize: 14,
  fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  textColor: "#000000",
  lineColor: "#000000",
  lineWidth: 2,
  arrowSize: 10,
  hasBackground: false,
  backgroundColor: "#ffffff",
  padding: 4,
};

/**
 * Creates an arrow marker polygon at the specified position and angle
 */
export function createArrowMarker(
  x: number,
  y: number,
  angle: number,
  size: number,
  color: string
): Polygon {
  const points = [
    { x: 0, y: 0 },
    { x: -size, y: -size / 2 },
    { x: -size, y: size / 2 },
  ];

  return new Polygon(points, {
    left: x,
    top: y,
    fill: color,
    angle: angle,
    selectable: false,
    evented: false,
    originX: 'center',
    originY: 'center',
  });
}

/**
 * Calculates the angle in degrees from point A to point B
 */
function calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  return angle;
}

/**
 * Creates a text box with optional background
 */
function createTextBox(
  x: number,
  y: number,
  text: string,
  options: Required<CalloutOptions>
): Group {
  const textbox = new Textbox(text, {
    left: 0,
    top: 0,
    fontSize: options.fontSize,
    fontFamily: options.fontFamily,
    fill: options.textColor,
    width: 150,
    selectable: false,
    evented: false,
  });

  const elements: any[] = [textbox];

  if (options.hasBackground) {
    const bg = new Rect({
      left: -options.padding,
      top: -options.padding,
      width: textbox.width! + options.padding * 2,
      height: textbox.height! + options.padding * 2,
      fill: options.backgroundColor,
      stroke: options.lineColor,
      strokeWidth: 1,
      rx: 4,
      ry: 4,
      selectable: false,
      evented: false,
    });
    elements.unshift(bg);
  }

  const group = new Group(elements, {
    left: x,
    top: y,
    selectable: false,
    evented: false,
  });

  return group;
}

/**
 * Creates a simple arrow callout with straight line and arrowhead
 */
export function createSimpleArrowCallout(
  anchorX: number,
  anchorY: number,
  textX: number,
  textY: number,
  options: Partial<CalloutOptions> = {}
): Group {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create text box
  const textGroup = createTextBox(textX, textY, opts.text, opts);

  // Create line from anchor to text
  const line = new Line([anchorX, anchorY, textX, textY], {
    stroke: opts.lineColor,
    strokeWidth: opts.lineWidth,
    selectable: false,
    evented: false,
  });

  // Create arrow marker at anchor point
  const angle = calculateAngle(textX, textY, anchorX, anchorY);
  const arrow = createArrowMarker(anchorX, anchorY, angle, opts.arrowSize, opts.lineColor);

  // Group all elements
  const calloutGroup = new Group([line, arrow, textGroup], {
    selectable: true,
    hasControls: true,
  });

  // Store metadata
  (calloutGroup as any).data = {
    isAnnotationCallout: true,
    calloutStyle: 'simple-arrow',
    anchorPoint: { x: anchorX, y: anchorY },
    textPosition: { x: textX, y: textY },
  };

  return calloutGroup;
}

/**
 * Creates a curved arrow callout with bezier curve
 */
export function createCurvedArrowCallout(
  anchorX: number,
  anchorY: number,
  textX: number,
  textY: number,
  options: Partial<CalloutOptions> = {}
): Group {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create text box
  const textGroup = createTextBox(textX, textY, opts.text, opts);

  // Calculate control points for bezier curve
  const dx = textX - anchorX;
  const dy = textY - anchorY;
  const cx1 = anchorX + dx * 0.33;
  const cy1 = anchorY;
  const cx2 = anchorX + dx * 0.67;
  const cy2 = textY;

  // Create curved path
  const pathData = `M ${anchorX} ${anchorY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${textX} ${textY}`;
  const curvePath = new Path(pathData, {
    stroke: opts.lineColor,
    strokeWidth: opts.lineWidth,
    fill: '',
    selectable: false,
    evented: false,
  });

  // Create arrow marker at anchor point
  const angle = calculateAngle(cx1, cy1, anchorX, anchorY);
  const arrow = createArrowMarker(anchorX, anchorY, angle, opts.arrowSize, opts.lineColor);

  // Group all elements
  const calloutGroup = new Group([curvePath, arrow, textGroup], {
    selectable: true,
    hasControls: true,
  });

  // Store metadata
  (calloutGroup as any).data = {
    isAnnotationCallout: true,
    calloutStyle: 'curved-arrow',
    anchorPoint: { x: anchorX, y: anchorY },
    textPosition: { x: textX, y: textY },
  };

  return calloutGroup;
}

/**
 * Creates a line callout without arrow
 */
export function createLineCallout(
  anchorX: number,
  anchorY: number,
  textX: number,
  textY: number,
  options: Partial<CalloutOptions> = {}
): Group {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create text box
  const textGroup = createTextBox(textX, textY, opts.text, opts);

  // Create line from anchor to text
  const line = new Line([anchorX, anchorY, textX, textY], {
    stroke: opts.lineColor,
    strokeWidth: opts.lineWidth,
    selectable: false,
    evented: false,
  });

  // Group all elements
  const calloutGroup = new Group([line, textGroup], {
    selectable: true,
    hasControls: true,
  });

  // Store metadata
  (calloutGroup as any).data = {
    isAnnotationCallout: true,
    calloutStyle: 'line',
    anchorPoint: { x: anchorX, y: anchorY },
    textPosition: { x: textX, y: textY },
  };

  return calloutGroup;
}

/**
 * Creates an elbow callout with orthogonal line
 */
export function createElbowCallout(
  anchorX: number,
  anchorY: number,
  textX: number,
  textY: number,
  options: Partial<CalloutOptions> = {}
): Group {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create text box
  const textGroup = createTextBox(textX, textY, opts.text, opts);

  // Create elbow path (orthogonal)
  const midX = (anchorX + textX) / 2;
  const pathData = `M ${anchorX} ${anchorY} L ${midX} ${anchorY} L ${midX} ${textY} L ${textX} ${textY}`;
  
  const elbowPath = new Path(pathData, {
    stroke: opts.lineColor,
    strokeWidth: opts.lineWidth,
    fill: '',
    selectable: false,
    evented: false,
  });

  // Group all elements
  const calloutGroup = new Group([elbowPath, textGroup], {
    selectable: true,
    hasControls: true,
  });

  // Store metadata
  (calloutGroup as any).data = {
    isAnnotationCallout: true,
    calloutStyle: 'elbow',
    anchorPoint: { x: anchorX, y: anchorY },
    textPosition: { x: textX, y: textY },
  };

  return calloutGroup;
}

/**
 * Creates an underline callout (text at target with underline)
 */
export function createUnderlineCallout(
  x: number,
  y: number,
  options: Partial<CalloutOptions> = {}
): Group {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Create text box
  const textbox = new Textbox(opts.text, {
    left: 0,
    top: 0,
    fontSize: opts.fontSize,
    fontFamily: opts.fontFamily,
    fill: opts.textColor,
    width: 150,
    selectable: false,
    evented: false,
  });

  // Create underline
  const underline = new Line([0, textbox.height! + 2, textbox.width!, textbox.height! + 2], {
    stroke: opts.lineColor,
    strokeWidth: opts.lineWidth,
    selectable: false,
    evented: false,
  });

  // Group elements
  const calloutGroup = new Group([textbox, underline], {
    left: x,
    top: y,
    selectable: true,
    hasControls: true,
  });

  // Store metadata
  (calloutGroup as any).data = {
    isAnnotationCallout: true,
    calloutStyle: 'underline',
    textPosition: { x, y },
  };

  return calloutGroup;
}
