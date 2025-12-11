/**
 * Canvas Icon System using Phosphor Icons
 * Provides professional, polished icons with duotone variants for active states
 */

import {
  Cursor,
  PenNib,
  Scribble,
  TextT,
  Image,
  Eraser,
  Crop,
  Shapes,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Diamond,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowsLeftRight,
  LineSegment,
  BezierCurve,
  FlowArrow,
  ArrowCounterClockwise,
  ArrowClockwise,
  Scissors,
  Copy,
  ClipboardText,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  CaretDoubleUp,
  CaretUp,
  CaretDown,
  CaretDoubleDown,
  SelectionAll,
  SplitVertical,
  GridFour,
  Ruler,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  CornersOut,
  Plus,
  CaretCircleDown,
  Lightbulb,
  Command,
  FilePpt,
  ImageSquare,
  Waves,
  GitBranch,
  Path,
  ArrowBendRightDown,
  ArrowBendDownRight,
  ArrowBendUpRight,
  ArrowBendRightUp,
  TrendUp,
  TrendDown,
  TreeStructure,
  Clock,
  FileText,
  Palette,
  ArrowsClockwise,
  GraduationCap,
  Article,
} from "@phosphor-icons/react";

// Export regular weight icons for inactive states
export const CanvasIcons = {
  // Selection & Drawing
  cursor: Cursor,
  penNib: PenNib,
  scribble: Scribble,
  bezierCurve: BezierCurve,
  
  // Text & Content
  textT: TextT,
  image: Image,
  imagePlus: ImageSquare,
  waves: Waves,
  
  // Tools
  eraser: Eraser,
  crop: Crop,
  
  // Shapes
  shapes: Shapes,
  square: Square,
  circle: Circle,
  triangle: Triangle,
  hexagon: Hexagon,
  diamond: Diamond,
  
  // Arrows
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  arrowsLeftRight: ArrowsLeftRight,
  
  // Lines & Connectors
  lineSegment: LineSegment,
  gitBranch: GitBranch,
  path: Path,
  flowArrow: FlowArrow,
  treeStructure: TreeStructure,
  
  // Bend arrows
  arrowBendRightDown: ArrowBendRightDown,
  arrowBendDownRight: ArrowBendDownRight,
  arrowBendUpRight: ArrowBendUpRight,
  arrowBendRightUp: ArrowBendRightUp,
  trendUp: TrendUp,
  trendDown: TrendDown,
  
  // Edit Actions
  undo: ArrowCounterClockwise,
  redo: ArrowClockwise,
  scissors: Scissors,
  copy: Copy,
  clipboard: ClipboardText,
  
  // Alignment
  alignLeft: TextAlignLeft,
  alignCenter: TextAlignCenter,
  alignRight: TextAlignRight,
  
  // Layer Controls
  bringToFront: CaretDoubleUp,
  bringForward: CaretUp,
  sendBackward: CaretDown,
  sendToBack: CaretDoubleDown,
  
  // Grouping
  group: SelectionAll,
  ungroup: SplitVertical,
  
  // View Options
  grid: GridFour,
  ruler: Ruler,
  
  // Zoom
  zoomIn: MagnifyingGlassPlus,
  zoomOut: MagnifyingGlassMinus,
  fitScreen: CornersOut,
  
  // Bottom Bar
  plus: Plus,
  caretDown: CaretCircleDown,
  lightbulb: Lightbulb,
  command: Command,
  
  // Export
  filePpt: FilePpt,
  fileText: FileText,
  
  // Tools menu
  palette: Palette,
  refresh: ArrowsClockwise,
  graduationCap: GraduationCap,
  clock: Clock,
  article: Article,
} as const;

// Type for icon names
export type CanvasIconName = keyof typeof CanvasIcons;

// Helper to get icon component
export const getCanvasIcon = (name: CanvasIconName) => CanvasIcons[name];
