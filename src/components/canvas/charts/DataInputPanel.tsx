import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, Keyboard } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { ChartType, CHART_TYPES } from '@/lib/chartDataUtils';

interface DataInputPanelProps {
  chartType: ChartType;
  rawData: string;
  onDataChange: (data: string) => void;
}

export const DataInputPanel = ({ chartType, rawData, onDataChange }: DataInputPanelProps) => {
  const [inputMode, setInputMode] = useState<'manual' | 'csv'>('manual');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onDataChange(text);
      };
      reader.readAsText(file);
    }
  }, [onDataChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  const chartConfig = CHART_TYPES[chartType];
  
  const getPlaceholder = () => {
    switch (chartType) {
      case 'bar':
      case 'pie':
        return `Control,45
Treatment A,67
Treatment B,52
Treatment C,78`;
      case 'histogram':
      case 'boxplot':
        return `12.5
14.2
11.8
15.1
13.7
12.9
14.5
11.2
13.3
15.8`;
      case 'heatmap':
        return `,Gene1,Gene2,Gene3
Sample1,2.5,1.2,3.8
Sample2,1.8,3.1,2.2
Sample3,3.2,2.4,1.5`;
      case 'scatter':
        return `1.2,3.4
2.5,5.1
3.1,4.8
4.2,7.2
5.0,6.5`;
      case 'line':
        return `0,1.2
1,2.5
2,3.1
3,4.8
4,5.2
5,6.1`;
      default:
        return '';
    }
  };

  const getSampleData = () => {
    switch (chartType) {
      case 'bar':
        return `Control,42.3
Compound A,58.7
Compound B,71.2
Compound C,45.8
Compound D,63.4`;
      case 'pie':
        return `Protein A,35
Protein B,25
Protein C,20
Protein D,12
Other,8`;
      case 'histogram':
        return `23.5
25.1
24.8
26.2
22.9
25.7
24.3
23.8
25.4
26.8
24.1
25.9
23.2
24.6
25.3
22.7
26.1
24.9
25.6
23.9`;
      case 'boxplot':
        return `12.3
14.5
11.8
15.2
13.7
12.9
14.1
11.5
13.3
15.8
12.6
14.3
11.9
13.1
14.7`;
      case 'heatmap':
        return `,Hour 0,Hour 6,Hour 12,Hour 24
Gene A,1.0,2.3,3.5,2.1
Gene B,0.5,1.8,4.2,3.8
Gene C,2.1,1.2,0.8,1.5
Gene D,1.5,3.2,2.9,4.1
Gene E,0.8,0.9,1.1,0.7`;
      case 'scatter':
        return `0.5,2.1,Sample 1
1.2,3.5,Sample 2
2.1,4.2,Sample 3
2.8,5.8,Sample 4
3.5,6.1,Sample 5
4.2,7.5,Sample 6
5.0,8.2,Sample 7
5.8,9.1,Sample 8
6.5,10.3,Sample 9
7.2,11.0,Sample 10`;
      case 'line':
        return `Day 1,12.5
Day 2,15.2
Day 3,18.7
Day 4,22.1
Day 5,25.8
Day 6,28.3
Day 7,31.2
Day 8,33.8
Day 9,35.1
Day 10,36.9`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Data Input</Label>
        <span className="text-xs text-muted-foreground">
          Format: {chartConfig.dataFormat}
        </span>
      </div>

      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'manual' | 'csv')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="gap-2">
            <Keyboard className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="csv" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            CSV Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-3">
          <Textarea
            value={rawData}
            onChange={(e) => onDataChange(e.target.value)}
            placeholder={getPlaceholder()}
            className="min-h-[200px] font-mono text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDataChange(getSampleData())}
            className="w-full"
          >
            Load Sample Data
          </Button>
        </TabsContent>

        <TabsContent value="csv" className="space-y-3">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm text-primary font-medium">Drop your CSV file here...</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Drag & drop a CSV file here, or click to select
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .csv and .txt files
                </p>
              </>
            )}
          </div>

          {rawData && (
            <div className="space-y-2">
              <Label className="text-sm">Preview:</Label>
              <Textarea
                value={rawData}
                onChange={(e) => onDataChange(e.target.value)}
                className="min-h-[120px] font-mono text-xs"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
