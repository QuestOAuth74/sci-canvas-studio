/**
 * DiagramJsonDialog - Import/Export dialog for diagram JSON
 */

import React, { useState, useCallback, useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  Download,
  Copy,
  FileJson,
  Check,
  AlertCircle,
  Loader2,
  FileCode2,
  ClipboardPaste,
} from 'lucide-react';
import { useDiagramManager } from '@/hooks/useDiagramManager';
import { validateJson } from '@/lib/diagram';
import { toast } from 'sonner';

interface DiagramJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvas: FabricCanvas | null;
}

export function DiagramJsonDialog({
  open,
  onOpenChange,
  canvas,
}: DiagramJsonDialogProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importJson, setImportJson] = useState('');
  const [exportJson, setExportJson] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [filename, setFilename] = useState('diagram.json');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isLoading,
    importFromJson,
    importFromFile,
    exportToJson,
    exportToFile,
    copyToClipboard,
  } = useDiagramManager({ canvas });
  
  // Validate import JSON on change
  const handleImportJsonChange = useCallback((value: string) => {
    setImportJson(value);
    
    if (!value.trim()) {
      setIsValid(null);
      setValidationErrors([]);
      return;
    }
    
    const result = validateJson(value);
    setIsValid(result.valid);
    setValidationErrors(result.errors);
  }, []);
  
  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      handleImportJsonChange(text);
      setFilename(file.name);
    } catch (error) {
      toast.error('Failed to read file');
    }
    
    // Reset input
    e.target.value = '';
  }, [handleImportJsonChange]);
  
  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleImportJsonChange(text);
      toast.success('Pasted from clipboard');
    } catch (error) {
      toast.error('Failed to paste from clipboard');
    }
  }, [handleImportJsonChange]);
  
  // Import diagram
  const handleImport = useCallback(async () => {
    if (!isValid) {
      toast.error('Please fix validation errors before importing');
      return;
    }
    
    const result = await importFromJson(importJson);
    
    if (result.success) {
      onOpenChange(false);
      setImportJson('');
      setIsValid(null);
    }
  }, [importFromJson, importJson, isValid, onOpenChange]);
  
  // Generate export JSON
  const handleGenerateExport = useCallback(() => {
    const result = exportToJson();
    
    if (result.success) {
      setExportJson(result.json);
    } else {
      toast.error('Export failed: ' + result.errors.join(', '));
    }
  }, [exportToJson]);
  
  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as 'import' | 'export');
    
    if (value === 'export') {
      handleGenerateExport();
    }
  }, [handleGenerateExport]);
  
  // Copy export JSON
  const handleCopyExport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, [exportJson]);
  
  // Download export JSON
  const handleDownload = useCallback(() => {
    exportToFile(filename);
    onOpenChange(false);
  }, [exportToFile, filename, onOpenChange]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Diagram JSON
          </DialogTitle>
          <DialogDescription>
            Import or export diagram scenes as JSON for version control, sharing, or programmatic generation.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="flex-1 flex flex-col gap-4 mt-4">
            {/* File upload */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload JSON File
              </Button>
              <Button
                variant="outline"
                onClick={handlePaste}
              >
                <ClipboardPaste className="h-4 w-4 mr-2" />
                Paste
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {/* JSON textarea */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>JSON Content</Label>
                {isValid !== null && (
                  <Badge variant={isValid ? 'default' : 'destructive'}>
                    {isValid ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Valid
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Invalid
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <Textarea
                value={importJson}
                onChange={(e) => handleImportJsonChange(e.target.value)}
                placeholder='Paste your diagram JSON here...

{
  "version": "1.0.0",
  "nodes": [...],
  "connectors": [...],
  "texts": [...]
}'
                className="flex-1 font-mono text-sm min-h-[200px]"
              />
            </div>
            
            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {validationErrors.slice(0, 5).map((error, i) => (
                      <li key={i} className="text-sm">{error}</li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li className="text-sm">...and {validationErrors.length - 5} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Import button */}
            <Button
              onClick={handleImport}
              disabled={!isValid || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileCode2 className="h-4 w-4 mr-2" />
                  Import Diagram
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="export" className="flex-1 flex flex-col gap-4 mt-4">
            {/* Filename input */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="filename">Filename</Label>
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="diagram.json"
                />
              </div>
              <Button variant="outline" onClick={handleGenerateExport}>
                Refresh
              </Button>
            </div>
            
            {/* Export JSON preview */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Exported JSON</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyExport}
                  disabled={!exportJson}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <ScrollArea className="flex-1 rounded-md border bg-muted/30">
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all min-h-[200px]">
                  {exportJson || 'Click "Refresh" to generate export JSON'}
                </pre>
              </ScrollArea>
            </div>
            
            {/* Stats */}
            {exportJson && (
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span>{(exportJson.length / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span>{exportJson.split('\n').length} lines</span>
              </div>
            )}
            
            {/* Download button */}
            <Button
              onClick={handleDownload}
              disabled={!exportJson}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download {filename}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
