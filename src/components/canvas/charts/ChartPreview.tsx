import { useMemo, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Rectangle,
  Scatter,
  ScatterChart,
  ZAxis,
  LineChart,
  Line,
} from 'recharts';
import {
  DataPoint,
  BoxPlotStats,
  HeatmapDataPoint,
  ScatterDataPoint,
  LineDataPoint,
  ChartType,
} from '@/lib/chartDataUtils';

interface ChartPreviewProps {
  type: ChartType;
  data: DataPoint[] | BoxPlotStats[] | HeatmapDataPoint[] | ScatterDataPoint[] | LineDataPoint[];
  colors: string[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showDataLabels?: boolean;
  // Heatmap-specific options
  heatmapCellRounding?: number;
  heatmapShowValues?: boolean;
  heatmapCellGap?: number;
}

// Custom Box Plot shape
const BoxPlotShape = (props: any) => {
  const { x, y, width, payload, yAxisScale, colors } = props;
  if (!payload || !yAxisScale) return null;

  const boxWidth = width * 0.6;
  const boxX = x + (width - boxWidth) / 2;
  
  const minY = yAxisScale(payload.min);
  const q1Y = yAxisScale(payload.q1);
  const medianY = yAxisScale(payload.median);
  const q3Y = yAxisScale(payload.q3);
  const maxY = yAxisScale(payload.max);
  
  const color = colors[0] || '#4C72B0';
  
  return (
    <g>
      {/* Whisker line */}
      <line
        x1={x + width / 2}
        y1={minY}
        x2={x + width / 2}
        y2={maxY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Min whisker cap */}
      <line
        x1={boxX + boxWidth * 0.25}
        y1={minY}
        x2={boxX + boxWidth * 0.75}
        y2={minY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Max whisker cap */}
      <line
        x1={boxX + boxWidth * 0.25}
        y1={maxY}
        x2={boxX + boxWidth * 0.75}
        y2={maxY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Box */}
      <rect
        x={boxX}
        y={q3Y}
        width={boxWidth}
        height={q1Y - q3Y}
        fill={color}
        fillOpacity={0.3}
        stroke={color}
        strokeWidth={1}
      />
      {/* Median line */}
      <line
        x1={boxX}
        y1={medianY}
        x2={boxX + boxWidth}
        y2={medianY}
        stroke={color}
        strokeWidth={2}
      />
      {/* Outliers */}
      {payload.outliers?.map((outlier: number, idx: number) => (
        <circle
          key={idx}
          cx={x + width / 2}
          cy={yAxisScale(outlier)}
          r={3}
          fill="none"
          stroke={color}
          strokeWidth={1}
        />
      ))}
    </g>
  );
};

// Color interpolation utilities for smooth gradients
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const interpolateColor = (color1: string, color2: string, factor: number): string => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(
    c1.r + (c2.r - c1.r) * factor,
    c1.g + (c2.g - c1.g) * factor,
    c1.b + (c2.b - c1.b) * factor
  );
};

const createSmoothColorScale = (colors: string[], minVal: number, maxVal: number) => {
  return (value: number): string => {
    if (colors.length === 0) return '#cccccc';
    if (colors.length === 1) return colors[0];

    const ratio = Math.max(0, Math.min(1, (value - minVal) / (maxVal - minVal || 1)));
    const scaledPos = ratio * (colors.length - 1);
    const lowerIdx = Math.floor(scaledPos);
    const upperIdx = Math.min(lowerIdx + 1, colors.length - 1);
    const localRatio = scaledPos - lowerIdx;

    return interpolateColor(colors[lowerIdx], colors[upperIdx], localRatio);
  };
};

// Heatmap color legend component
const HeatmapColorLegend = ({
  colors,
  minVal,
  maxVal,
  height = 200,
  width = 20
}: {
  colors: string[];
  minVal: number;
  maxVal: number;
  height?: number;
  width?: number;
}) => {
  const gradientId = `heatmap-gradient-${Date.now()}`;
  const stops = colors.map((color, idx) => ({
    offset: `${(idx / (colors.length - 1)) * 100}%`,
    color
  }));

  return (
    <svg width={width + 40} height={height + 20} style={{ marginLeft: 8 }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
          {stops.map((stop, idx) => (
            <stop key={idx} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>
      <rect
        x={0}
        y={10}
        width={width}
        height={height}
        fill={`url(#${gradientId})`}
        rx={3}
        ry={3}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
      <text x={width + 4} y={16} fontSize={9} fill="#666">{maxVal.toFixed(1)}</text>
      <text x={width + 4} y={height / 2 + 10} fontSize={9} fill="#666">
        {((minVal + maxVal) / 2).toFixed(1)}
      </text>
      <text x={width + 4} y={height + 10} fontSize={9} fill="#666">{minVal.toFixed(1)}</text>
    </svg>
  );
};

// Enhanced Heatmap cell component with animations and styling
const HeatmapCell = ({
  cx,
  cy,
  payload,
  colorScale,
  cellWidth,
  cellHeight,
  gap = 1,
  rounding = 2,
  showValue = false,
  minVal,
  maxVal,
  isHovered = false,
  onHover,
  cellIndex
}: any) => {
  if (!payload || typeof payload.value !== 'number') return null;

  const color = colorScale(payload.value);
  const width = cellWidth - gap * 2;
  const height = cellHeight - gap * 2;

  // Calculate text color based on background luminance
  const rgb = hexToRgb(color);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const textColor = luminance > 0.5 ? '#1a1a1a' : '#ffffff';

  // Hover effect scale
  const scale = isHovered ? 1.05 : 1;
  const offsetX = isHovered ? (width * 0.05) / 2 : 0;
  const offsetY = isHovered ? (height * 0.05) / 2 : 0;

  return (
    <g
      style={{
        cursor: 'pointer',
        transition: 'transform 0.15s ease-out'
      }}
      onMouseEnter={() => onHover?.(cellIndex)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Cell background with shadow on hover */}
      {isHovered && (
        <rect
          x={cx - width / 2 - offsetX + 2}
          y={cy - height / 2 - offsetY + 2}
          width={width * scale}
          height={height * scale}
          fill="rgba(0,0,0,0.15)"
          rx={rounding}
          ry={rounding}
        />
      )}
      {/* Main cell */}
      <rect
        x={cx - width / 2 - offsetX}
        y={cy - height / 2 - offsetY}
        width={width * scale}
        height={height * scale}
        fill={color}
        rx={rounding}
        ry={rounding}
        stroke={isHovered ? '#333' : 'rgba(255,255,255,0.3)'}
        strokeWidth={isHovered ? 2 : 0.5}
        style={{
          filter: isHovered ? 'brightness(1.1)' : 'none',
          transition: 'all 0.15s ease-out'
        }}
      />
      {/* Value label */}
      {showValue && width > 25 && height > 20 && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={Math.min(10, width / 4)}
          fontWeight={500}
          fill={textColor}
          style={{
            pointerEvents: 'none',
            textShadow: luminance > 0.5 ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
          }}
        >
          {payload.value.toFixed(1)}
        </text>
      )}
    </g>
  );
};

export const ChartPreview = ({
  type,
  data,
  colors,
  title,
  xAxisLabel,
  yAxisLabel,
  showLegend = true,
  showGrid = true,
  showDataLabels = false,
  heatmapCellRounding = 2,
  heatmapShowValues = false,
  heatmapCellGap = 1,
}: ChartPreviewProps) => {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  const handleCellHover = useCallback((cellIndex: number | null) => {
    setHoveredCell(cellIndex);
  }, []);

  const chartElement = useMemo(() => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No data to display
        </div>
      );
    }

    switch (type) {
      case 'bar':
      case 'histogram': {
        const barData = data as DataPoint[];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
                label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 40 } : undefined}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip />
              {showLegend && <Legend />}
              <Bar dataKey="value" fill={colors[0] || '#4C72B0'} radius={[2, 2, 0, 0]}>
                {barData.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case 'pie': {
        const pieData = data as DataPoint[];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={showDataLabels ? ({ label, percent }) => 
                  `${label}: ${(percent * 100).toFixed(1)}%` : false}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case 'boxplot': {
        const boxData = data as BoxPlotStats[];
        const allValues = boxData.flatMap(d => [d.min, d.max, ...d.outliers]);
        const yMin = Math.min(...allValues) * 0.9;
        const yMax = Math.max(...allValues) * 1.1;
        
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={boxData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
              <XAxis 
                dataKey="label"
                tick={{ fontSize: 10 }}
                label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 40 } : undefined}
              />
              <YAxis 
                domain={[yMin, yMax]}
                tick={{ fontSize: 10 }}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip 
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload as BoxPlotStats;
                  return (
                    <div className="bg-background border rounded p-2 text-xs shadow-lg">
                      <p className="font-semibold">{d.label}</p>
                      <p>Max: {d.max.toFixed(2)}</p>
                      <p>Q3: {d.q3.toFixed(2)}</p>
                      <p>Median: {d.median.toFixed(2)}</p>
                      <p>Q1: {d.q1.toFixed(2)}</p>
                      <p>Min: {d.min.toFixed(2)}</p>
                      {d.outliers.length > 0 && <p>Outliers: {d.outliers.length}</p>}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="median"
                shape={(props: any) => (
                  <BoxPlotShape
                    {...props}
                    yAxisScale={(val: number) => {
                      const height = 300;
                      const range = yMax - yMin;
                      return ((yMax - val) / range) * height + 20;
                    }}
                    colors={colors}
                  />
                )}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
      }

      case 'heatmap': {
        const heatmapData = data as HeatmapDataPoint[];
        const values = heatmapData.map(d => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);

        // Create smooth color scale
        const colorScale = createSmoothColorScale(colors, minVal, maxVal);

        // Get unique x and y values
        const xLabels = [...new Set(heatmapData.map(d => d.x))];
        const yLabels = [...new Set(heatmapData.map(d => d.y))];

        // Calculate dynamic cell size based on data dimensions
        const chartWidth = 340; // Approximate available width
        const chartHeight = 260; // Approximate available height
        const cellWidth = Math.max(20, Math.min(50, chartWidth / xLabels.length));
        const cellHeight = Math.max(20, Math.min(50, chartHeight / yLabels.length));

        // Transform data for scatter chart representation
        const scatterData = heatmapData.map((d, idx) => ({
          x: xLabels.indexOf(d.x),
          y: yLabels.indexOf(d.y),
          value: d.value,
          xLabel: d.x,
          yLabel: d.y,
          cellIndex: idx,
        }));

        return (
          <div className="flex h-full">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{
                    top: 20,
                    right: 20,
                    left: 60,
                    bottom: 60
                  }}
                >
                  {showGrid && (
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e0e0e0"
                      opacity={0.5}
                    />
                  )}
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[-0.5, xLabels.length - 0.5]}
                    ticks={xLabels.map((_, i) => i)}
                    tickFormatter={(i) => xLabels[i] || ''}
                    tick={{ fontSize: 10, fill: '#666' }}
                    angle={-45}
                    textAnchor="end"
                    axisLine={{ stroke: '#ccc' }}
                    tickLine={{ stroke: '#ccc' }}
                    label={
                      xAxisLabel
                        ? {
                            value: xAxisLabel,
                            position: 'bottom',
                            offset: 45,
                            style: { fontSize: 11, fill: '#444' }
                          }
                        : undefined
                    }
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={[-0.5, yLabels.length - 0.5]}
                    ticks={yLabels.map((_, i) => i)}
                    tickFormatter={(i) => yLabels[i] || ''}
                    tick={{ fontSize: 10, fill: '#666' }}
                    axisLine={{ stroke: '#ccc' }}
                    tickLine={{ stroke: '#ccc' }}
                    label={
                      yAxisLabel
                        ? {
                            value: yAxisLabel,
                            angle: -90,
                            position: 'insideLeft',
                            offset: -10,
                            style: { fontSize: 11, fill: '#444' }
                          }
                        : undefined
                    }
                  />
                  <ZAxis dataKey="value" range={[400, 400]} />
                  <Tooltip
                    cursor={false}
                    content={({ payload }) => {
                      if (!payload?.[0]) return null;
                      const d = payload[0].payload;
                      const color = colorScale(d.value);
                      return (
                        <div
                          className="rounded-lg p-3 text-xs shadow-xl border"
                          style={{
                            background: 'rgba(255,255,255,0.98)',
                            backdropFilter: 'blur(8px)'
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: color }}
                            />
                            <span className="font-semibold text-gray-800">
                              {d.value.toFixed(2)}
                            </span>
                          </div>
                          <div className="space-y-0.5 text-gray-600">
                            <p>
                              <span className="text-gray-400">Row:</span>{' '}
                              {d.xLabel}
                            </p>
                            <p>
                              <span className="text-gray-400">Col:</span>{' '}
                              {d.yLabel}
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="flex justify-between text-gray-500">
                              <span>Min: {minVal.toFixed(1)}</span>
                              <span>Max: {maxVal.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter
                    data={scatterData}
                    shape={(props: any) => (
                      <HeatmapCell
                        {...props}
                        colorScale={colorScale}
                        cellWidth={cellWidth}
                        cellHeight={cellHeight}
                        gap={heatmapCellGap}
                        rounding={heatmapCellRounding}
                        showValue={heatmapShowValues}
                        minVal={minVal}
                        maxVal={maxVal}
                        isHovered={hoveredCell === props.payload?.cellIndex}
                        onHover={handleCellHover}
                        cellIndex={props.payload?.cellIndex}
                      />
                    )}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            {/* Color Legend */}
            {showLegend && (
              <div className="flex-shrink-0">
                <HeatmapColorLegend
                  colors={colors}
                  minVal={minVal}
                  maxVal={maxVal}
                  height={180}
                  width={16}
                />
              </div>
            )}
          </div>
        );
      }

      case 'scatter': {
        const scatterData = data as ScatterDataPoint[];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
              <XAxis 
                type="number"
                dataKey="x"
                tick={{ fontSize: 10 }}
                label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 40 } : undefined}
              />
              <YAxis 
                type="number"
                dataKey="y"
                tick={{ fontSize: 10 }}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip 
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload as ScatterDataPoint;
                  return (
                    <div className="bg-background border rounded p-2 text-xs shadow-lg">
                      {d.label && <p className="font-semibold">{d.label}</p>}
                      <p>X: {d.x}</p>
                      <p>Y: {d.y}</p>
                    </div>
                  );
                }}
              />
              {showLegend && <Legend />}
              <Scatter 
                name="Data" 
                data={scatterData} 
                fill={colors[0] || '#4C72B0'}
              >
                {scatterData.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );
      }

      case 'line': {
        const lineData = data as LineDataPoint[];
        // Group by series if present
        const series = [...new Set(lineData.map(d => d.series || 'default'))];
        const groupedData = lineData.reduce((acc, point) => {
          const existing = acc.find(d => d.x === point.x);
          const seriesKey = point.series || 'default';
          if (existing) {
            existing[seriesKey] = point.y;
          } else {
            acc.push({ x: point.x, [seriesKey]: point.y });
          }
          return acc;
        }, [] as any[]);

        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={groupedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
              <XAxis 
                dataKey="x"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
                label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 40 } : undefined}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              />
              <Tooltip />
              {showLegend && <Legend />}
              {series.map((s, idx) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: colors[idx % colors.length], r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      }

      default:
        return null;
    }
  }, [type, data, colors, title, xAxisLabel, yAxisLabel, showLegend, showGrid, showDataLabels, heatmapCellRounding, heatmapShowValues, heatmapCellGap, hoveredCell, handleCellHover]);

  return (
    <div className="w-full h-full flex flex-col">
      {title && (
        <h3 className="text-center font-semibold text-sm mb-2">{title}</h3>
      )}
      <div className="flex-1 min-h-0">
        {chartElement}
      </div>
    </div>
  );
};
