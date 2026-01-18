/**
 * Types for AI Figure Reconstruction System
 * Used for converting AI-generated draft figures into editable Fabric.js objects
 */

export type ElementType = 'text' | 'icon' | 'arrow' | 'box';
export type ElementStatus = 'pending' | 'accepted' | 'editing';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedElement {
  id: string;
  type: ElementType;
  label: string;
  bbox: BoundingBox;
  status: ElementStatus;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface DetectedText extends DetectedElement {
  type: 'text';
  content: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
}

export interface DetectedIcon extends DetectedElement {
  type: 'icon';
  queryTerms: string[];
  matchedIconId?: string;
  matchedIconName?: string;
  matchScore?: number;
}

export interface DetectedArrow extends DetectedElement {
  type: 'arrow';
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  bendPoints?: { x: number; y: number }[];
  style: 'solid' | 'dashed' | 'dotted';
  headType: 'arrow' | 'open-arrow' | 'diamond' | 'circle' | 'none';
  tailType: 'none' | 'arrow' | 'circle';
  color?: string;
  strokeWidth?: number;
}

export interface DetectedBox extends DetectedElement {
  type: 'box';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export type AnyDetectedElement = DetectedText | DetectedIcon | DetectedArrow | DetectedBox;

export interface IconMatch {
  id: string;
  name: string;
  category: string;
  thumbnail?: string;
  svgContent?: string;
  score: number;
}

export interface SceneGraph {
  version: string;
  sourceImageUrl: string;
  canvasWidth: number;
  canvasHeight: number;
  elements: AnyDetectedElement[];
  createdAt: string;
  updatedAt: string;
}

export interface FigureVersion {
  id: string;
  sourceImageUrl: string;
  sceneGraph: SceneGraph;
  fabricJson: object;
  createdAt: string;
}

export interface ReconstructionState {
  figureVersion: FigureVersion | null;
  elements: AnyDetectedElement[];
  selectedElementId: string | null;
  isDetecting: boolean;
  detectionProgress: number;
  error: string | null;
}

// Arrow style presets
export const ARROW_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
] as const;

export const ARROW_HEAD_TYPES = [
  { value: 'arrow', label: 'Arrow' },
  { value: 'open-arrow', label: 'Open Arrow' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'circle', label: 'Circle' },
  { value: 'none', label: 'None' },
] as const;
