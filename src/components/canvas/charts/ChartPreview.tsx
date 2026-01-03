import { useMemo } from 'react';
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
} from 'recharts';
import {
  DataPoint,
  BoxPlotStats,
  HeatmapDataPoint,
  ChartType,
} from '@/lib/chartDataUtils';

interface ChartPreviewProps {
  type: ChartType;
  data: DataPoint[] | BoxPlotStats[] | HeatmapDataPoint[];
  colors: string[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showDataLabels?: boolean;
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

// Heatmap cell component
const HeatmapCell = ({ cx, cy, payload, colorScale }: any) => {
  if (!payload || typeof payload.value !== 'number') return null;
  
  const color = colorScale(payload.value);
  const size = 30;
  
  return (
    <Rectangle
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      fill={color}
      stroke="#fff"
      strokeWidth={1}
    />
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
}: ChartPreviewProps) => {
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
        
        // Create color scale
        const colorScale = (value: number) => {
          const ratio = (value - minVal) / (maxVal - minVal || 1);
          const colorIdx = Math.floor(ratio * (colors.length - 1));
          return colors[colorIdx] || colors[0];
        };
        
        // Get unique x and y values
        const xLabels = [...new Set(heatmapData.map(d => d.x))];
        const yLabels = [...new Set(heatmapData.map(d => d.y))];
        
        // Transform data for scatter chart representation
        const scatterData = heatmapData.map(d => ({
          x: xLabels.indexOf(d.x),
          y: yLabels.indexOf(d.y),
          value: d.value,
        }));
        
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 60, left: 20, bottom: 60 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />}
              <XAxis 
                type="number"
                dataKey="x"
                domain={[-0.5, xLabels.length - 0.5]}
                ticks={xLabels.map((_, i) => i)}
                tickFormatter={(i) => xLabels[i] || ''}
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
              />
              <YAxis 
                type="number"
                dataKey="y"
                domain={[-0.5, yLabels.length - 0.5]}
                ticks={yLabels.map((_, i) => i)}
                tickFormatter={(i) => yLabels[i] || ''}
                tick={{ fontSize: 10 }}
              />
              <ZAxis dataKey="value" range={[400, 400]} />
              <Tooltip 
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-background border rounded p-2 text-xs shadow-lg">
                      <p>{xLabels[d.x]} × {yLabels[d.y]}</p>
                      <p className="font-semibold">Value: {d.value}</p>
                    </div>
                  );
                }}
              />
              <Scatter
                data={scatterData}
                shape={(props: any) => <HeatmapCell {...props} colorScale={colorScale} />}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );
      }

      default:
        return null;
    }
  }, [type, data, colors, title, xAxisLabel, yAxisLabel, showLegend, showGrid, showDataLabels]);

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
