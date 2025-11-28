export interface GradientStop {
  color: string;
  offset: number; // 0-1
  opacity?: number;
}

export interface LinearGradientConfig {
  type: 'linear';
  angle: number; // degrees
  stops: GradientStop[];
}

export interface RadialGradientConfig {
  type: 'radial';
  centerX: number; // 0-1
  centerY: number; // 0-1
  radius: number;
  stops: GradientStop[];
}

export type GradientConfig = LinearGradientConfig | RadialGradientConfig;

export interface ShadowConfig {
  enabled: boolean;
  blur: number;
  offsetX: number;
  offsetY: number;
  color: string;
  opacity: number;
}

export interface GlowConfig {
  enabled: boolean;
  blur: number;
  color: string;
  opacity: number;
  spread?: number;
}

export interface LineGradientConfig {
  type: 'none' | 'fade-out' | 'fade-in' | 'color-transition' | 'signal-diminish' | 'custom';
  direction: 'along-path' | 'reverse';
  solidStartPercent: number; // 0-100, how much solid at start
  solidEndPercent: number;   // 0-100, how much solid at end
  stops: GradientStop[];
  startColor: string;
  endColor: string;
  endOpacity: number; // 0-1 for fade effects
}

// Gradient presets
export const GRADIENT_PRESETS = [
  {
    name: 'Sunset',
    type: 'linear' as const,
    angle: 135,
    stops: [
      { color: '#ff6b6b', offset: 0 },
      { color: '#feca57', offset: 1 }
    ]
  },
  {
    name: 'Ocean',
    type: 'linear' as const,
    angle: 90,
    stops: [
      { color: '#0077be', offset: 0 },
      { color: '#48dbfb', offset: 1 }
    ]
  },
  {
    name: 'Forest',
    type: 'linear' as const,
    angle: 180,
    stops: [
      { color: '#0fb9b1', offset: 0 },
      { color: '#55efc4', offset: 1 }
    ]
  },
  {
    name: 'Fire',
    type: 'radial' as const,
    centerX: 0.5,
    centerY: 0.5,
    radius: 100,
    stops: [
      { color: '#feca57', offset: 0 },
      { color: '#ff6b6b', offset: 0.5 },
      { color: '#ee5a6f', offset: 1 }
    ]
  },
  {
    name: 'Purple Haze',
    type: 'linear' as const,
    angle: 45,
    stops: [
      { color: '#a29bfe', offset: 0 },
      { color: '#fd79a8', offset: 1 }
    ]
  },
  {
    name: 'Emerald',
    type: 'linear' as const,
    angle: 90,
    stops: [
      { color: '#00b894', offset: 0 },
      { color: '#55efc4', offset: 1 }
    ]
  }
];

// Shadow presets
export const SHADOW_PRESETS = [
  {
    name: 'Soft',
    blur: 10,
    offsetX: 0,
    offsetY: 4,
    color: '#000000',
    opacity: 0.2
  },
  {
    name: 'Hard',
    blur: 0,
    offsetX: 4,
    offsetY: 4,
    color: '#000000',
    opacity: 0.4
  },
  {
    name: 'Long',
    blur: 15,
    offsetX: 0,
    offsetY: 10,
    color: '#000000',
    opacity: 0.3
  },
  {
    name: 'Lifted',
    blur: 20,
    offsetX: 0,
    offsetY: 8,
    color: '#000000',
    opacity: 0.15
  }
];
