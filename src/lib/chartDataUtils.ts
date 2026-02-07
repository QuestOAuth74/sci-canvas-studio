// Utilities for parsing and processing chart data

export interface DataPoint {
  label: string;
  value: number;
  category?: string;
}

export interface ScatterDataPoint {
  x: number;
  y: number;
  label?: string;
}

export interface LineDataPoint {
  x: string | number;
  y: number;
  series?: string;
}

export interface HeatmapDataPoint {
  x: string;
  y: string;
  value: number;
}

export interface BoxPlotStats {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

// Parse CSV string to data points
export const parseCSV = (csvString: string): { headers: string[]; rows: string[][] } => {
  const lines = csvString.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map(line => 
    line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );
  
  return { headers, rows };
};

// Convert CSV to simple data points (label, value)
export const csvToDataPoints = (csvString: string): DataPoint[] => {
  const { headers, rows } = parseCSV(csvString);
  
  if (headers.length < 2) return [];
  
  return rows
    .filter(row => row.length >= 2 && !isNaN(parseFloat(row[1])))
    .map(row => ({
      label: row[0],
      value: parseFloat(row[1]),
      category: row[2] || undefined
    }));
};

// Convert CSV to heatmap data
export const csvToHeatmapData = (csvString: string): HeatmapDataPoint[] => {
  const { headers, rows } = parseCSV(csvString);
  
  if (headers.length < 2) return [];
  
  const data: HeatmapDataPoint[] = [];
  const yLabels = headers.slice(1);
  
  rows.forEach(row => {
    const xLabel = row[0];
    row.slice(1).forEach((cell, idx) => {
      const value = parseFloat(cell);
      if (!isNaN(value)) {
        data.push({
          x: xLabel,
          y: yLabels[idx],
          value
        });
      }
    });
  });
  
  return data;
};

// Calculate histogram bins from raw values
export const calculateHistogramBins = (values: number[], binCount: number = 10): DataPoint[] => {
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / binCount || 1;
  
  const bins: number[] = new Array(binCount).fill(0);
  
  values.forEach(v => {
    const binIndex = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
    bins[binIndex]++;
  });
  
  return bins.map((count, idx) => ({
    label: `${(min + idx * binWidth).toFixed(1)}-${(min + (idx + 1) * binWidth).toFixed(1)}`,
    value: count
  }));
};

// Calculate box plot statistics
export const calculateBoxPlotStats = (values: number[], label: string): BoxPlotStats => {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  if (n === 0) {
    return { label, min: 0, q1: 0, median: 0, q3: 0, max: 0, outliers: [] };
  }
  
  const q1Index = Math.floor(n * 0.25);
  const medianIndex = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);
  
  const q1 = sorted[q1Index];
  const median = sorted[medianIndex];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  
  const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
  const inliers = sorted.filter(v => v >= lowerFence && v <= upperFence);
  
  return {
    label,
    min: inliers.length > 0 ? Math.min(...inliers) : sorted[0],
    q1,
    median,
    q3,
    max: inliers.length > 0 ? Math.max(...inliers) : sorted[n - 1],
    outliers
  };
};

// Parse raw values from text (one per line or comma separated)
export const parseRawValues = (text: string): number[] => {
  const values = text
    .split(/[\n,]+/)
    .map(v => v.trim())
    .filter(v => v !== '')
    .map(v => parseFloat(v))
    .filter(v => !isNaN(v));
  
  return values;
};

// Scientific color presets
export const SCIENTIFIC_PRESETS = {
  nature: {
    name: 'Nature',
    colors: ['#4C72B0', '#55A868', '#C44E52', '#8172B3', '#CCB974', '#64B5CD'],
    description: 'Classic scientific palette'
  },
  viridis: {
    name: 'Viridis',
    colors: ['#440154', '#482878', '#3e4989', '#31688e', '#26838f', '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725'],
    description: 'Perceptually uniform colormap'
  },
  plasma: {
    name: 'Plasma',
    colors: ['#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fb9f3a', '#fdca26', '#f0f921'],
    description: 'High contrast sequential'
  },
  inferno: {
    name: 'Inferno',
    colors: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#f7d13d', '#fcffa4'],
    description: 'High contrast, warm tones'
  },
  magma: {
    name: 'Magma',
    colors: ['#000004', '#180f3d', '#440f76', '#721f81', '#9e2f7f', '#cd4071', '#f1605d', '#fd9668', '#feca8d', '#fcfdbf'],
    description: 'Warm perceptually uniform'
  },
  colorblindSafe: {
    name: 'Colorblind Safe',
    colors: ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#D55E00', '#56B4E9'],
    description: 'Accessible to colorblind viewers'
  },
  coolWarm: {
    name: 'Cool-Warm',
    colors: ['#3b4cc0', '#5977e3', '#7b9ff9', '#9ebeff', '#c0d4f5', '#f2cbb7', '#f7ac8e', '#ee8468', '#d65244', '#b40426'],
    description: 'Diverging blue to red'
  },
  blueRed: {
    name: 'Blue-Red',
    colors: ['#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7', '#fddbc7', '#f4a582', '#d6604d', '#b2182b'],
    description: 'Classic diverging heatmap'
  },
  ocean: {
    name: 'Ocean',
    colors: ['#081d58', '#253494', '#225ea8', '#1d91c0', '#41b6c4', '#7fcdbb', '#c7e9b4', '#edf8b1', '#ffffd9'],
    description: 'Deep ocean blues'
  },
  sunset: {
    name: 'Sunset',
    colors: ['#0d0887', '#5b02a3', '#9c179e', '#cb4679', '#eb7852', '#fcb43a', '#f0f921'],
    description: 'Warm sunset gradient'
  },
  forest: {
    name: 'Forest',
    colors: ['#00441b', '#006d2c', '#238b45', '#41ae76', '#66c2a4', '#99d8c9', '#ccece6', '#e5f5f9', '#f7fcfd'],
    description: 'Natural green tones'
  },
  grayscale: {
    name: 'Grayscale',
    colors: ['#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3', '#cccccc', '#e6e6e6'],
    description: 'Print-friendly monochrome'
  }
};

// Chart type configurations
export const CHART_TYPES = {
  bar: {
    name: 'Bar Chart',
    description: 'Compare categories',
    icon: 'BarChart',
    dataFormat: 'Label,Value per row'
  },
  histogram: {
    name: 'Histogram',
    description: 'Distribution of values',
    icon: 'BarChart3',
    dataFormat: 'One value per line'
  },
  pie: {
    name: 'Pie Chart',
    description: 'Part-to-whole ratios',
    icon: 'PieChart',
    dataFormat: 'Label,Value per row'
  },
  boxplot: {
    name: 'Box & Whisker',
    description: 'Statistical distribution',
    icon: 'BoxSelect',
    dataFormat: 'One value per line'
  },
  heatmap: {
    name: 'Heat Map',
    description: 'Matrix of values',
    icon: 'Grid3X3',
    dataFormat: 'CSV matrix with headers'
  },
  scatter: {
    name: 'Scatter Plot',
    description: 'Correlation analysis',
    icon: 'ScatterChart',
    dataFormat: 'X,Y per row'
  },
  line: {
    name: 'Line Chart',
    description: 'Time series & trends',
    icon: 'LineChart',
    dataFormat: 'X,Y per row'
  }
} as const;

export type ChartType = keyof typeof CHART_TYPES;

// Parse scatter/line data from CSV
export const parseScatterData = (csvString: string): ScatterDataPoint[] => {
  const lines = csvString.trim().split('\n');
  const results: ScatterDataPoint[] = [];
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim());
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    if (!isNaN(x) && !isNaN(y)) {
      results.push({ x, y, label: parts[2] || undefined });
    }
  }
  return results;
};

export const parseLineData = (csvString: string): LineDataPoint[] => {
  const lines = csvString.trim().split('\n');
  const results: LineDataPoint[] = [];
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim());
    const xRaw = parts[0];
    const y = parseFloat(parts[1]);
    if (!isNaN(y)) {
      const x = isNaN(parseFloat(xRaw)) ? xRaw : parseFloat(xRaw);
      results.push({ x, y, series: parts[2] || undefined });
    }
  }
  return results;
};
