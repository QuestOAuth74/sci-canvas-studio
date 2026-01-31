/**
 * useDiagramManager - React hook for diagram JSON operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import {
  DiagramManager,
  DiagramScene,
  DiagramNode,
  DiagramConnector,
  DiagramText,
  DiagramOp,
  ImportResult,
  ExportResult,
  quickImport,
  quickExport,
  validateJson,
  createEmptyScene,
} from '@/lib/diagram';
import { toast } from 'sonner';

export interface UseDiagramManagerOptions {
  canvas: FabricCanvas | null;
  autoSave?: boolean;
  onSceneChange?: (scene: DiagramScene) => void;
}

export interface UseDiagramManagerReturn {
  // State
  isLoading: boolean;
  lastError: string | null;
  hasUnsavedChanges: boolean;
  
  // Import/Export
  importFromJson: (json: string) => Promise<ImportResult>;
  importFromFile: (file: File) => Promise<ImportResult>;
  exportToJson: () => ExportResult;
  exportToFile: (filename?: string) => void;
  copyToClipboard: () => Promise<boolean>;
  
  // Validation
  validateScene: (json: string) => { valid: boolean; errors: string[] };
  
  // Operations
  addNode: (node: DiagramNode) => Promise<boolean>;
  removeNode: (nodeId: string) => Promise<boolean>;
  updateNode: (nodeId: string, changes: Partial<DiagramNode>) => Promise<boolean>;
  addConnector: (connector: DiagramConnector) => Promise<boolean>;
  removeConnector: (connectorId: string) => Promise<boolean>;
  addText: (text: DiagramText) => Promise<boolean>;
  removeText: (textId: string) => Promise<boolean>;
  replaceIcon: (nodeId: string, newIconId: string) => Promise<boolean>;
  
  // Bulk operations
  executeBatch: (ops: DiagramOp[]) => Promise<boolean[]>;
  
  // Scene management
  clearScene: () => void;
  getScene: () => DiagramScene | null;
  
  // Getters
  getNode: (nodeId: string) => DiagramNode | undefined;
  getConnector: (connectorId: string) => DiagramConnector | undefined;
  getText: (textId: string) => DiagramText | undefined;
  getAllNodes: () => DiagramNode[];
  getAllConnectors: () => DiagramConnector[];
  getAllTexts: () => DiagramText[];
}

export function useDiagramManager(
  options: UseDiagramManagerOptions
): UseDiagramManagerReturn {
  const { canvas, autoSave = false, onSceneChange } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const managerRef = useRef<DiagramManager | null>(null);
  
  // Initialize manager when canvas is available
  useEffect(() => {
    if (canvas && !managerRef.current) {
      managerRef.current = new DiagramManager(canvas);
    }
    
    return () => {
      managerRef.current = null;
    };
  }, [canvas]);
  
  // Track changes
  useEffect(() => {
    if (!canvas) return;
    
    const handleModified = () => {
      setHasUnsavedChanges(true);
      if (onSceneChange && managerRef.current) {
        const result = managerRef.current.exportScene();
        if (result.success) {
          try {
            const scene = JSON.parse(result.json);
            onSceneChange(scene);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    };
    
    canvas.on('object:modified', handleModified);
    canvas.on('object:added', handleModified);
    canvas.on('object:removed', handleModified);
    
    return () => {
      canvas.off('object:modified', handleModified);
      canvas.off('object:added', handleModified);
      canvas.off('object:removed', handleModified);
    };
  }, [canvas, onSceneChange]);
  
  // Import from JSON string
  const importFromJson = useCallback(async (json: string): Promise<ImportResult> => {
    if (!canvas) {
      return {
        success: false,
        errors: ['Canvas not available'],
        warnings: [],
        stats: { nodesImported: 0, connectorsImported: 0, textsImported: 0, iconsFetched: 0, timeMs: 0 },
      };
    }
    
    setIsLoading(true);
    setLastError(null);
    
    try {
      const result = await quickImport(canvas, json, { clear: true });
      
      if (result.success) {
        setHasUnsavedChanges(false);
        toast.success(`Imported ${result.stats.nodesImported} nodes, ${result.stats.connectorsImported} connectors`);
      } else {
        setLastError(result.errors.join(', '));
        toast.error('Import failed: ' + result.errors[0]);
      }
      
      return result;
    } catch (error) {
      const errorMsg = String(error);
      setLastError(errorMsg);
      toast.error('Import failed: ' + errorMsg);
      
      return {
        success: false,
        errors: [errorMsg],
        warnings: [],
        stats: { nodesImported: 0, connectorsImported: 0, textsImported: 0, iconsFetched: 0, timeMs: 0 },
      };
    } finally {
      setIsLoading(false);
    }
  }, [canvas]);
  
  // Import from file
  const importFromFile = useCallback(async (file: File): Promise<ImportResult> => {
    setIsLoading(true);
    
    try {
      const text = await file.text();
      return await importFromJson(text);
    } catch (error) {
      const errorMsg = `Failed to read file: ${error}`;
      setLastError(errorMsg);
      toast.error(errorMsg);
      
      return {
        success: false,
        errors: [errorMsg],
        warnings: [],
        stats: { nodesImported: 0, connectorsImported: 0, textsImported: 0, iconsFetched: 0, timeMs: 0 },
      };
    } finally {
      setIsLoading(false);
    }
  }, [importFromJson]);
  
  // Export to JSON
  const exportToJson = useCallback((): ExportResult => {
    if (!canvas) {
      return {
        success: false,
        json: '',
        scene: null,
        errors: ['Canvas not available'],
        stats: { nodesExported: 0, connectorsExported: 0, textsExported: 0 },
      };
    }
    
    try {
      const json = quickExport(canvas);
      return {
        success: true,
        json,
        scene: JSON.parse(json),
        errors: [],
        stats: { nodesExported: 0, connectorsExported: 0, textsExported: 0 },
      };
    } catch (error) {
      return {
        success: false,
        json: '',
        scene: null,
        errors: [String(error)],
        stats: { nodesExported: 0, connectorsExported: 0, textsExported: 0 },
      };
    }
  }, [canvas]);
  
  // Export to file
  const exportToFile = useCallback((filename: string = 'diagram.json') => {
    const result = exportToJson();
    
    if (!result.success) {
      toast.error('Export failed: ' + result.errors.join(', '));
      return;
    }
    
    const blob = new Blob([result.json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    setHasUnsavedChanges(false);
    toast.success('Diagram exported successfully');
  }, [exportToJson]);
  
  // Copy to clipboard
  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    const result = exportToJson();
    
    if (!result.success) {
      toast.error('Export failed: ' + result.errors.join(', '));
      return false;
    }
    
    try {
      await navigator.clipboard.writeText(result.json);
      toast.success('Diagram JSON copied to clipboard');
      return true;
    } catch (error) {
      toast.error('Failed to copy to clipboard');
      return false;
    }
  }, [exportToJson]);
  
  // Validate scene
  const validateSceneJson = useCallback((json: string) => {
    return validateJson(json);
  }, []);
  
  // Node operations
  const addNode = useCallback(async (node: DiagramNode): Promise<boolean> => {
    if (!managerRef.current) return false;
    const result = await managerRef.current.execute({ type: 'addNode', node });
    if (!result.success) toast.error(result.error);
    return result.success;
  }, []);
  
  const removeNode = useCallback(async (nodeId: string): Promise<boolean> => {
    if (!managerRef.current) return false;
    const result = await managerRef.current.execute({ type: 'removeNode', nodeId });
    if (!result.success) toast.error(result.error);
    return result.success;
  }, []);
  
  const updateNode = useCallback(async (nodeId: string, changes: Partial<DiagramNode>): Promise<boolean> => {
    if (!managerRef.current) return false;
    const result = await managerRef.current.execute({ type: 'updateNode', nodeId, changes });
    if (!result.success) toast.error(result.error);
    return result.success;
  }, []);
  
  // Connector operations
  const addConnector = useCallback(async (connector: DiagramConnector): Promise<boolean> => {
    if (!managerRef.current) return false;
    const result = await managerRef.current.execute({ type: 'addConnector', connector });
    if (!result.success) toast.error(result.error);
    return result.success;
  }, []);
  
  const removeConnector = useCallback(async (connectorId: string): Promise<boolean> => {
    if (!managerRef.current) return false;
    const result = await managerRef.current.execute({ type: 'removeConnector', connectorId });
    if (!result.success) toast.error(result.error);
    return result.success;
  }, []);
  
  // Text operations
  const addText = useCallback(async (text: DiagramText): Promise<boolean> => {
    if (!managerRef.current) return false;
    const result = await managerRef.current.execute({ type: 'addText', text });
    if (!result.success) toast.error(result.error);
    return result.success;
  }, []);
  
  const removeText = useCallback(async (textId: string): Promise<boolean> => {
    if (!managerRef.current) return false;
    const result = await managerRef.current.execute({ type: 'removeText', textId });
    if (!result.success) toast.error(result.error);
    return result.success;
  }, []);
  
  // Replace icon
  const replaceIcon = useCallback(async (nodeId: string, newIconId: string): Promise<boolean> => {
    if (!managerRef.current) return false;
    const result = await managerRef.current.execute({ type: 'replaceIcon', nodeId, newIconId });
    if (!result.success) toast.error(result.error);
    return result.success;
  }, []);
  
  // Batch operations
  const executeBatch = useCallback(async (ops: DiagramOp[]): Promise<boolean[]> => {
    if (!managerRef.current) return ops.map(() => false);
    const results = await managerRef.current.executeBatch(ops);
    return results.map(r => r.success);
  }, []);
  
  // Scene management
  const clearScene = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.clear();
      setHasUnsavedChanges(false);
    }
  }, []);
  
  const getScene = useCallback((): DiagramScene | null => {
    const result = exportToJson();
    return result.success ? result.scene : null;
  }, [exportToJson]);
  
  // Getters
  const getNode = useCallback((nodeId: string) => {
    return managerRef.current?.getNode(nodeId);
  }, []);
  
  const getConnector = useCallback((connectorId: string) => {
    return managerRef.current?.getConnector(connectorId);
  }, []);
  
  const getText = useCallback((textId: string) => {
    return managerRef.current?.getText(textId);
  }, []);
  
  const getAllNodes = useCallback(() => {
    return managerRef.current?.getAllNodes() || [];
  }, []);
  
  const getAllConnectors = useCallback(() => {
    return managerRef.current?.getAllConnectors() || [];
  }, []);
  
  const getAllTexts = useCallback(() => {
    return managerRef.current?.getAllTexts() || [];
  }, []);
  
  return {
    isLoading,
    lastError,
    hasUnsavedChanges,
    importFromJson,
    importFromFile,
    exportToJson,
    exportToFile,
    copyToClipboard,
    validateScene: validateSceneJson,
    addNode,
    removeNode,
    updateNode,
    addConnector,
    removeConnector,
    addText,
    removeText,
    replaceIcon,
    executeBatch,
    clearScene,
    getScene,
    getNode,
    getConnector,
    getText,
    getAllNodes,
    getAllConnectors,
    getAllTexts,
  };
}
