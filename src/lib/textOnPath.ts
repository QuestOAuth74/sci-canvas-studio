import { Canvas as FabricCanvas, Path, Text, Group } from "fabric";

/**
 * Create text that follows along a curved path
 */
export function createTextOnPath(
  canvas: FabricCanvas,
  text: string,
  pathData: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    spacing?: number;
  } = {}
): Group | null {
  const {
    fontSize = 20,
    fontFamily = 'Inter',
    fill = '#000000',
    spacing = 1,
  } = options;

  try {
    // Create the path
    const path = new Path(pathData, {
      stroke: 'transparent',
      fill: 'transparent',
      strokeWidth: 1,
      selectable: false,
      evented: false,
    });

    const pathLength = path.path ? getPathLength(path) : 0;
    const chars = text.split('');
    const textElements: Text[] = [];

    let currentPosition = 0;

    chars.forEach((char) => {
      if (char === ' ') {
        currentPosition += fontSize * 0.3 * spacing;
        return;
      }

      // Get point and angle along the path
      const point = getPointOnPath(path, currentPosition / pathLength);
      if (!point) return;

      // Create text element for each character
      const textElement = new Text(char, {
        fontSize,
        fontFamily,
        fill,
        left: point.x,
        top: point.y,
        originX: 'center',
        originY: 'center',
        angle: point.angle,
        selectable: false,
        evented: false,
      });

      textElements.push(textElement);
      currentPosition += fontSize * 0.6 * spacing; // Approximate character width
    });

    if (textElements.length === 0) return null;

    // Group all text elements together
    const group = new Group([...textElements], {
      selectable: true,
      hasControls: true,
    });

    // Store metadata for editing
    (group as any).isTextOnPath = true;
    (group as any).originalText = text;
    (group as any).pathData = pathData;
    (group as any).textOptions = options;

    return group;
  } catch (error) {
    console.error('Error creating text on path:', error);
    return null;
  }
}

/**
 * Get approximate length of a path
 */
function getPathLength(path: Path): number {
  if (!path.path) return 0;
  
  let length = 0;
  let lastPoint = { x: 0, y: 0 };

  path.path.forEach((segment: any) => {
    const command = segment[0];
    
    if (command === 'M' || command === 'L') {
      const point = { x: segment[1], y: segment[2] };
      if (lastPoint) {
        length += Math.sqrt(
          Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2)
        );
      }
      lastPoint = point;
    } else if (command === 'C') {
      // Cubic bezier approximation
      const point = { x: segment[5], y: segment[6] };
      if (lastPoint) {
        length += Math.sqrt(
          Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2)
        );
      }
      lastPoint = point;
    } else if (command === 'Q') {
      // Quadratic bezier approximation
      const point = { x: segment[3], y: segment[4] };
      if (lastPoint) {
        length += Math.sqrt(
          Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2)
        );
      }
      lastPoint = point;
    }
  });

  return length;
}

/**
 * Get point and angle at a position along the path (0 to 1)
 */
function getPointOnPath(
  path: Path,
  t: number
): { x: number; y: number; angle: number } | null {
  if (!path.path || path.path.length === 0) return null;

  t = Math.max(0, Math.min(1, t));

  // Simple linear interpolation for now
  // For production, this should use proper bezier curve calculations
  const segments = path.path;
  const totalSegments = segments.length - 1;
  const segmentIndex = Math.floor(t * totalSegments);
  const segment = segments[Math.min(segmentIndex, segments.length - 1)];
  const nextSegment = segments[Math.min(segmentIndex + 1, segments.length - 1)];

  if (!segment || !nextSegment) return null;

  const getPoint = (seg: any) => {
    const cmd = seg[0];
    if (cmd === 'M' || cmd === 'L') return { x: seg[1], y: seg[2] };
    if (cmd === 'C') return { x: seg[5], y: seg[6] };
    if (cmd === 'Q') return { x: seg[3], y: seg[4] };
    return { x: 0, y: 0 };
  };

  const p1 = getPoint(segment);
  const p2 = getPoint(nextSegment);

  const localT = (t * totalSegments) - segmentIndex;
  
  const x = p1.x + (p2.x - p1.x) * localT;
  const y = p1.y + (p2.y - p1.y) * localT;

  // Calculate angle
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;

  return { x, y, angle };
}

/**
 * Update text on path when edited
 */
export function updateTextOnPath(
  canvas: FabricCanvas,
  group: Group,
  newText: string
): Group | null {
  const pathData = (group as any).pathData;
  const textOptions = (group as any).textOptions;

  if (!pathData || !textOptions) return null;

  // Remove old group
  canvas.remove(group);

  // Create new text on path
  const newGroup = createTextOnPath(canvas, newText, pathData, textOptions);
  
  if (newGroup) {
    // Preserve position and transformations
    newGroup.set({
      left: group.left,
      top: group.top,
      scaleX: group.scaleX,
      scaleY: group.scaleY,
      angle: group.angle,
    });
    
    canvas.add(newGroup);
    canvas.setActiveObject(newGroup);
  }

  return newGroup;
}

/**
 * Create a simple curved path for text (arc shape)
 */
export function createArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number = 0,
  endAngle: number = 180
): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const startX = centerX + radius * Math.cos(startRad);
  const startY = centerY + radius * Math.sin(startRad);
  const endX = centerX + radius * Math.cos(endRad);
  const endY = centerY + radius * Math.sin(endRad);

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
}

/**
 * Create a wave path for text
 */
export function createWavePath(
  startX: number,
  startY: number,
  width: number,
  amplitude: number = 30,
  frequency: number = 2
): string {
  const points: string[] = [`M ${startX} ${startY}`];
  const segments = 50;

  for (let i = 1; i <= segments; i++) {
    const x = startX + (width * i) / segments;
    const y = startY + amplitude * Math.sin((i / segments) * frequency * Math.PI * 2);
    points.push(`L ${x} ${y}`);
  }

  return points.join(' ');
}
