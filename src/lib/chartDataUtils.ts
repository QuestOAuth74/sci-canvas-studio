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
    colors: ['#440154', '#414487', '#2A788E', '#22A884', '#7AD151', '#FDE725'],
    description: 'Perceptually uniform colormap'
  },
  plasma: {
    name: 'Plasma',
    colors: ['#0D0887', '#6A00A8', '#B12A90', '#E16462', '#FCA636', '#F0F921'],
    description: 'High contrast sequential'
  },
  colorblindSafe: {
    name: 'Colorblind Safe',
    colors: ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#D55E00', '#56B4E9'],
    description: 'Accessible to colorblind viewers'
  },
  grayscale: {
    name: 'Grayscale',
    colors: ['#1a1a1a', '#4d4d4d', '#808080', '#b3b3b3', '#cccccc', '#e6e6e6'],
    description: 'Print-friendly monochrome'
  },
  coolWarm: {
    name: 'Cool-Warm',
    colors: ['#3B4CC0', '#6B8DF4', '#ADC8E8', '#F7B799', '#E26952', '#B40426'],
    description: 'Diverging for +/- values'
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
