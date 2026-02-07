import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SCIENTIFIC_PRESETS, ChartType } from '@/lib/chartDataUtils';

interface ChartCustomizationPanelProps {
  chartType: ChartType;
  title: string;
  onTitleChange: (title: string) => void;
  xAxisLabel: string;
  onXAxisLabelChange: (label: string) => void;
  yAxisLabel: string;
  onYAxisLabelChange: (label: string) => void;
  showLegend: boolean;
  onShowLegendChange: (show: boolean) => void;
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  showDataLabels: boolean;
  onShowDataLabelsChange: (show: boolean) => void;
  selectedPreset: string;
  onPresetChange: (preset: string) => void;
  binCount: number;
  onBinCountChange: (count: number) => void;
  // Heatmap-specific options
  heatmapCellRounding?: number;
  onHeatmapCellRoundingChange?: (value: number) => void;
  heatmapShowValues?: boolean;
  onHeatmapShowValuesChange?: (show: boolean) => void;
  heatmapCellGap?: number;
  onHeatmapCellGapChange?: (value: number) => void;
}

export const ChartCustomizationPanel = ({
  chartType,
  title,
  onTitleChange,
  xAxisLabel,
  onXAxisLabelChange,
  yAxisLabel,
  onYAxisLabelChange,
  showLegend,
  onShowLegendChange,
  showGrid,
  onShowGridChange,
  showDataLabels,
  onShowDataLabelsChange,
  selectedPreset,
  onPresetChange,
  binCount,
  onBinCountChange,
  heatmapCellRounding = 2,
  onHeatmapCellRoundingChange,
  heatmapShowValues = false,
  onHeatmapShowValuesChange,
  heatmapCellGap = 1,
  onHeatmapCellGapChange,
}: ChartCustomizationPanelProps) => {
  return (
    <div className="space-y-6">
      {/* Labels Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Labels</h4>
        
        <div className="space-y-2">
          <Label htmlFor="chart-title" className="text-xs">Chart Title</Label>
          <Input
            id="chart-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter chart title..."
            className="h-8 text-sm"
          />
        </div>

        {chartType !== 'pie' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="x-axis" className="text-xs">X-Axis Label</Label>
              <Input
                id="x-axis"
                value={xAxisLabel}
                onChange={(e) => onXAxisLabelChange(e.target.value)}
                placeholder="X-axis label..."
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="y-axis" className="text-xs">Y-Axis Label</Label>
              <Input
                id="y-axis"
                value={yAxisLabel}
                onChange={(e) => onYAxisLabelChange(e.target.value)}
                placeholder="Y-axis label..."
                className="h-8 text-sm"
              />
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Display Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Display Options</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show-legend" className="text-xs cursor-pointer">Show Legend</Label>
          <Switch
            id="show-legend"
            checked={showLegend}
            onCheckedChange={onShowLegendChange}
          />
        </div>

        {chartType !== 'pie' && (
          <div className="flex items-center justify-between">
            <Label htmlFor="show-grid" className="text-xs cursor-pointer">Show Grid</Label>
            <Switch
              id="show-grid"
              checked={showGrid}
              onCheckedChange={onShowGridChange}
            />
          </div>
        )}

        {(chartType === 'pie' || chartType === 'bar') && (
          <div className="flex items-center justify-between">
            <Label htmlFor="show-labels" className="text-xs cursor-pointer">Show Data Labels</Label>
            <Switch
              id="show-labels"
              checked={showDataLabels}
              onCheckedChange={onShowDataLabelsChange}
            />
          </div>
        )}

        {chartType === 'histogram' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Number of Bins: {binCount}</Label>
            </div>
            <Slider
              value={[binCount]}
              onValueChange={(v) => onBinCountChange(v[0])}
              min={5}
              max={30}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {/* Heatmap-specific options */}
        {chartType === 'heatmap' && (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="heatmap-values" className="text-xs cursor-pointer">
                Show Values on Cells
              </Label>
              <Switch
                id="heatmap-values"
                checked={heatmapShowValues}
                onCheckedChange={onHeatmapShowValuesChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Cell Rounding: {heatmapCellRounding}px</Label>
              </div>
              <Slider
                value={[heatmapCellRounding]}
                onValueChange={(v) => onHeatmapCellRoundingChange?.(v[0])}
                min={0}
                max={12}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Cell Gap: {heatmapCellGap}px</Label>
              </div>
              <Slider
                value={[heatmapCellGap]}
                onValueChange={(v) => onHeatmapCellGapChange?.(v[0])}
                min={0}
                max={4}
                step={0.5}
                className="w-full"
              />
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Color Presets */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Scientific Color Presets</h4>
        
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(SCIENTIFIC_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant={selectedPreset === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPresetChange(key)}
              className="h-auto py-2 flex flex-col items-start gap-1"
            >
              <span className="text-xs font-medium">{preset.name}</span>
              <div className="flex gap-0.5">
                {preset.colors.slice(0, 6).map((color, idx) => (
                  <div
                    key={idx}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </Button>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground">
          {SCIENTIFIC_PRESETS[selectedPreset as keyof typeof SCIENTIFIC_PRESETS]?.description}
        </p>
      </div>
    </div>
  );
};
