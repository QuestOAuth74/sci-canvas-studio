import { useState, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3,
  PieChart,
  BoxSelect,
  Grid3X3,
  BarChart,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

import { DataInputPanel } from './DataInputPanel';
import { ChartCustomizationPanel } from './ChartCustomizationPanel';
import { ChartPreview } from './ChartPreview';
import {
  ChartType,
  CHART_TYPES,
  SCIENTIFIC_PRESETS,
  csvToDataPoints,
  csvToHeatmapData,
  calculateHistogramBins,
  calculateBoxPlotStats,
  parseRawValues,
  DataPoint,
  BoxPlotStats,
  HeatmapDataPoint,
} from '@/lib/chartDataUtils';
import { useCanvas } from '@/contexts/CanvasContext';

interface DataVisualizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHART_ICONS: Record<ChartType, typeof BarChart> = {
  bar: BarChart,
  histogram: BarChart3,
  pie: PieChart,
  boxplot: BoxSelect,
  heatmap: Grid3X3,
};

export const DataVisualizationDialog = ({
  open,
  onOpenChange,
}: DataVisualizationDialogProps) => {
  const { canvas } = useCanvas();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Chart state
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [rawData, setRawData] = useState('');
  
  // Customization state
  const [title, setTitle] = useState('');
  const [xAxisLabel, setXAxisLabel] = useState('');
  const [yAxisLabel, setYAxisLabel] = useState('');
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showDataLabels, setShowDataLabels] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('nature');
  const [binCount, setBinCount] = useState(10);
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Parse and process data based on chart type
  const processedData = useMemo((): DataPoint[] | BoxPlotStats[] | HeatmapDataPoint[] => {
    if (!rawData.trim()) return [];

    try {
      switch (chartType) {
        case 'bar':
        case 'pie':
          return csvToDataPoints(rawData);
        
        case 'histogram': {
          const values = parseRawValues(rawData);
          return calculateHistogramBins(values, binCount);
        }
        
        case 'boxplot': {
          const values = parseRawValues(rawData);
          return [calculateBoxPlotStats(values, 'Distribution')];
        }
        
        case 'heatmap':
          return csvToHeatmapData(rawData);
        
        default:
          return [];
      }
    } catch (error) {
      console.error('Error processing data:', error);
      return [];
    }
  }, [rawData, chartType, binCount]);

  const colors = SCIENTIFIC_PRESETS[selectedPreset as keyof typeof SCIENTIFIC_PRESETS]?.colors || SCIENTIFIC_PRESETS.nature.colors;

  const handleAddToCanvas = async () => {
    if (!canvas || processedData.length === 0) {
      toast.error('No data to add to canvas');
      return;
    }

    setIsGenerating(true);

    try {
      // Find the recharts SVG element in the preview
      const chartContainer = chartContainerRef.current;
      if (!chartContainer) {
        throw new Error('Chart container not found');
      }

      const svgElement = chartContainer.querySelector('svg.recharts-surface');
      if (!svgElement) {
        throw new Error('Chart SVG not found');
      }

      // Clone the SVG and prepare it for export
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Set proper dimensions
      const width = svgElement.getAttribute('width') || '400';
      const height = svgElement.getAttribute('height') || '300';
      clonedSvg.setAttribute('width', width);
      clonedSvg.setAttribute('height', height);
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Add title if present
      if (title) {
        const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        titleElement.setAttribute('x', String(parseInt(width) / 2));
        titleElement.setAttribute('y', '15');
        titleElement.setAttribute('text-anchor', 'middle');
        titleElement.setAttribute('font-size', '14');
        titleElement.setAttribute('font-weight', 'bold');
        titleElement.setAttribute('fill', '#333');
        titleElement.textContent = title;
        clonedSvg.insertBefore(titleElement, clonedSvg.firstChild);
      }

      // Convert to string
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(clonedSvg);
      
      // Create a data URL
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Load into fabric
      const { FabricImage } = await import('fabric');
      
      FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
        // Scale to reasonable size
        const scale = Math.min(400 / (img.width || 400), 300 / (img.height || 300));
        img.scale(scale);
        
        // Center on canvas
        img.set({
          left: (canvas.width || 800) / 2 - (img.getScaledWidth() / 2),
          top: (canvas.height || 600) / 2 - (img.getScaledHeight() / 2),
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();

        URL.revokeObjectURL(url);
        toast.success('Chart added to canvas');
        onOpenChange(false);
      }).catch((err) => {
        console.error('Failed to load chart as image:', err);
        toast.error('Failed to add chart to canvas');
      });
    } catch (error) {
      console.error('Error adding chart to canvas:', error);
      toast.error('Failed to generate chart');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetState = () => {
    setRawData('');
    setTitle('');
    setXAxisLabel('');
    setYAxisLabel('');
    setShowLegend(true);
    setShowGrid(true);
    setShowDataLabels(false);
    setBinCount(10);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) resetState();
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">Create Data Visualization</DialogTitle>
          <DialogDescription>
            Enter data manually or upload a CSV to create scientific charts for your figures.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex min-h-0">
          {/* Left Panel - Chart Type & Data Input */}
          <div className="w-80 border-r flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Chart Type Selection */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Chart Type</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(CHART_TYPES) as ChartType[]).map((type) => {
                      const Icon = CHART_ICONS[type];
                      const config = CHART_TYPES[type];
                      return (
                        <Card
                          key={type}
                          className={`cursor-pointer transition-all hover:border-primary ${
                            chartType === type ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                          }`}
                          onClick={() => setChartType(type)}
                        >
                          <CardContent className="p-3 flex flex-col items-center gap-2">
                            <Icon className="h-6 w-6" />
                            <span className="text-xs font-medium text-center">{config.name}</span>
                            {chartType === type && (
                              <Check className="h-4 w-4 text-primary absolute top-1 right-1" />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Data Input */}
                <DataInputPanel
                  chartType={chartType}
                  rawData={rawData}
                  onDataChange={setRawData}
                />
              </div>
            </ScrollArea>
          </div>

          {/* Center - Preview */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b bg-muted/30">
              <h4 className="text-sm font-semibold">Preview</h4>
            </div>
            <div 
              ref={chartContainerRef}
              className="flex-1 p-4 bg-white"
            >
              <ChartPreview
                type={chartType}
                data={processedData}
                colors={colors}
                title={title}
                xAxisLabel={xAxisLabel}
                yAxisLabel={yAxisLabel}
                showLegend={showLegend}
                showGrid={showGrid}
                showDataLabels={showDataLabels}
              />
            </div>
          </div>

          {/* Right Panel - Customization */}
          <div className="w-72 border-l flex flex-col">
            <div className="p-4 border-b bg-muted/30">
              <h4 className="text-sm font-semibold">Customize</h4>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <ChartCustomizationPanel
                  chartType={chartType}
                  title={title}
                  onTitleChange={setTitle}
                  xAxisLabel={xAxisLabel}
                  onXAxisLabelChange={setXAxisLabel}
                  yAxisLabel={yAxisLabel}
                  onYAxisLabelChange={setYAxisLabel}
                  showLegend={showLegend}
                  onShowLegendChange={setShowLegend}
                  showGrid={showGrid}
                  onShowGridChange={setShowGrid}
                  showDataLabels={showDataLabels}
                  onShowDataLabelsChange={setShowDataLabels}
                  selectedPreset={selectedPreset}
                  onPresetChange={setSelectedPreset}
                  binCount={binCount}
                  onBinCountChange={setBinCount}
                />
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between items-center bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {processedData.length > 0 
              ? `${processedData.length} data point${processedData.length !== 1 ? 's' : ''} loaded`
              : 'Enter data to see preview'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddToCanvas}
              disabled={processedData.length === 0 || isGenerating}
            >
              {isGenerating ? 'Adding...' : 'Add to Canvas'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
