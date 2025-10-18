import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Plus, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChartData {
  labels: string[];
  values: number[];
  title: string;
}

interface ChartLibraryProps {
  chartType?: string;
  onChartCreate: (data: ChartData, type: string) => void;
}

export const ChartLibrary = ({ chartType, onChartCreate }: ChartLibraryProps) => {
  const [chartTitle, setChartTitle] = useState("My Chart");
  const [manualData, setManualData] = useState([{ label: "Item 1", value: 10 }]);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRow = () => {
    setManualData([...manualData, { label: `Item ${manualData.length + 1}`, value: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (manualData.length > 1) {
      setManualData(manualData.filter((_, i) => i !== index));
    }
  };

  const handleManualDataChange = (index: number, field: 'label' | 'value', value: string) => {
    const newData = [...manualData];
    if (field === 'label') {
      newData[index].label = value;
    } else {
      newData[index].value = parseFloat(value) || 0;
    }
    setManualData(newData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          toast.error("Excel file must have at least 2 rows (headers + data)");
          return;
        }

        // First column is X values (labels), second column is Y values
        const newData = jsonData.slice(1).map((row) => ({
          label: String(row[0] || ''),
          value: parseFloat(row[1]) || 0,
        })).filter(item => item.label && !isNaN(item.value));

        if (newData.length === 0) {
          toast.error("No valid data found in Excel file");
          return;
        }

        setManualData(newData);
        toast.success(`Loaded ${newData.length} data points from Excel`);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        toast.error("Failed to parse Excel file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCreateChart = () => {
    if (!chartType || !chartType.startsWith('chart-')) {
      toast.error("Please select a chart type first");
      return;
    }

    const type = chartType.replace('chart-', '');
    const chartData: ChartData = {
      title: chartTitle,
      labels: manualData.map(d => d.label),
      values: manualData.map(d => d.value),
    };

    onChartCreate(chartData, type);
    setOpen(false);
    toast.success("Chart added to canvas");
  };

  if (!chartType || !chartType.startsWith('chart-')) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Select a chart type from the toolbar to begin
        </p>
      </div>
    );
  }

  const chartTypeName = chartType.replace('chart-', '').replace('-', ' ');

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border/40">
        <h3 className="text-sm font-semibold mb-2 capitalize">{chartTypeName} Chart</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Chart
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Create {chartTypeName} Chart</DialogTitle>
              <DialogDescription>
                Enter data manually or upload an Excel file
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="manual" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="upload">Upload Excel</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="flex-1 overflow-hidden flex flex-col">
                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                  <div>
                    <Label htmlFor="chart-title">Chart Title</Label>
                    <Input
                      id="chart-title"
                      value={chartTitle}
                      onChange={(e) => setChartTitle(e.target.value)}
                      placeholder="Enter chart title"
                    />
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Data Points</Label>
                      <Button onClick={handleAddRow} size="sm" variant="outline">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Row
                      </Button>
                    </div>

                    <ScrollArea className="flex-1 border rounded-md p-2">
                      <div className="space-y-2">
                        {manualData.map((item, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <Input
                              placeholder="Label"
                              value={item.label}
                              onChange={(e) => handleManualDataChange(index, 'label', e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              placeholder="Value"
                              value={item.value}
                              onChange={(e) => handleManualDataChange(index, 'value', e.target.value)}
                              className="w-24"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveRow(index)}
                              disabled={manualData.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <Button onClick={handleCreateChart} className="w-full">
                    Create Chart
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <Label htmlFor="chart-title-upload">Chart Title</Label>
                    <Input
                      id="chart-title-upload"
                      value={chartTitle}
                      onChange={(e) => setChartTitle(e.target.value)}
                      placeholder="Enter chart title"
                    />
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      Upload an Excel file (.xlsx, .xls)<br />
                      <strong>Column 1 (X):</strong> Labels | <strong>Column 2 (Y):</strong> Values
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>

                  {manualData.length > 0 && (
                    <div className="space-y-2">
                      <Label>Preview Data ({manualData.length} rows)</Label>
                      <ScrollArea className="h-40 border rounded-md p-2">
                        <div className="space-y-1 text-xs">
                          {manualData.map((item, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="font-medium">{item.label}</span>
                              <span>{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <Button onClick={handleCreateChart} className="w-full">
                    Create Chart
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Click "Create Chart" to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Enter data manually (X & Y values)</li>
              <li>Upload Excel file (Column 1: X, Column 2: Y)</li>
              <li>Customize chart appearance</li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
