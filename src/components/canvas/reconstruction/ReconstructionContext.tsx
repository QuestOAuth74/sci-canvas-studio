/**
 * Reconstruction Context
 * Manages state for the figure reconstruction workflow
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  AnyDetectedElement,
  SceneGraph,
  FigureVersion,
  ReconstructionState,
  DetectedIcon,
} from '@/types/figureReconstruction';
import { detectFigureElements, createSceneGraph, updateSceneGraph, searchIconMatches } from '@/lib/figureDetection';

interface IconMatch {
  id: string;
  name: string;
  category: string;
  thumbnail?: string;
  svgContent?: string;
  score: number;
}

interface ReconstructionContextType extends ReconstructionState {
  // Actions
  startDetection: (imageBase64: string) => Promise<void>;
  selectElement: (elementId: string | null) => void;
  acceptElement: (elementId: string) => void;
  editElement: (elementId: string) => void;
  deleteElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<AnyDetectedElement>) => void;
  
  // Icon matching
  iconMatches: IconMatch[];
  loadingIconMatches: boolean;
  searchIconsForElement: (elementId: string) => Promise<void>;
  assignIconToElement: (elementId: string, iconId: string, iconName: string, svgContent: string) => void;
  
  // Scene graph
  getSceneGraph: () => SceneGraph | null;
  getFabricJson: () => object | null;
  setFabricJson: (json: object) => void;
  
  // State management
  reset: () => void;
  setSourceImage: (imageUrl: string) => void;
  sourceImageUrl: string | null;
}

const ReconstructionContext = createContext<ReconstructionContextType | undefined>(undefined);

export function useReconstruction() {
  const context = useContext(ReconstructionContext);
  if (!context) {
    throw new Error('useReconstruction must be used within ReconstructionProvider');
  }
  return context;
}

interface ReconstructionProviderProps {
  children: ReactNode;
}

export function ReconstructionProvider({ children }: ReconstructionProviderProps) {
  const [figureVersion, setFigureVersion] = useState<FigureVersion | null>(null);
  const [elements, setElements] = useState<AnyDetectedElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [fabricJson, setFabricJsonState] = useState<object | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // Icon matching state
  const [iconMatches, setIconMatches] = useState<IconMatch[]>([]);
  const [loadingIconMatches, setLoadingIconMatches] = useState(false);

  const startDetection = useCallback(async (imageBase64: string) => {
    setIsDetecting(true);
    setDetectionProgress(0);
    setError(null);

    const result = await detectFigureElements(imageBase64, (stage, progress) => {
      setDetectionProgress(progress);
    });

    if (result.success) {
      setElements(result.elements);
      setCanvasSize({ width: result.canvasWidth, height: result.canvasHeight });
      setSourceImageUrl(imageBase64);
    } else {
      setError(result.error || 'Detection failed');
    }

    setIsDetecting(false);
    setDetectionProgress(100);
  }, []);

  const selectElement = useCallback((elementId: string | null) => {
    setSelectedElementId(elementId);
    
    // Auto-search for icon matches when selecting an icon element
    if (elementId) {
      const element = elements.find(e => e.id === elementId);
      if (element?.type === 'icon') {
        searchIconsForElement(elementId);
      }
    }
  }, [elements]);

  const acceptElement = useCallback((elementId: string) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, status: 'accepted' as const } : el
    ));
  }, []);

  const editElement = useCallback((elementId: string) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, status: 'editing' as const } : el
    ));
    setSelectedElementId(elementId);
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  const updateElement = useCallback((elementId: string, updates: Partial<AnyDetectedElement>) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } as AnyDetectedElement : el
    ));
  }, []);

  const searchIconsForElement = useCallback(async (elementId: string) => {
    const element = elements.find(e => e.id === elementId);
    if (!element || element.type !== 'icon') return;

    setLoadingIconMatches(true);
    const iconElement = element as DetectedIcon;
    const matches = await searchIconMatches(iconElement.queryTerms);
    setIconMatches(matches);
    setLoadingIconMatches(false);
  }, [elements]);

  const assignIconToElement = useCallback((elementId: string, iconId: string, iconName: string, svgContent: string) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId && el.type === 'icon') {
        return {
          ...el,
          matchedIconId: iconId,
          matchedIconName: iconName,
          status: 'accepted' as const,
        } as DetectedIcon;
      }
      return el;
    }));
  }, []);

  const getSceneGraph = useCallback((): SceneGraph | null => {
    if (!sourceImageUrl) return null;
    return createSceneGraph(sourceImageUrl, elements, canvasSize.width, canvasSize.height);
  }, [sourceImageUrl, elements, canvasSize]);

  const getFabricJson = useCallback(() => fabricJson, [fabricJson]);
  
  const setFabricJson = useCallback((json: object) => {
    setFabricJsonState(json);
  }, []);

  const reset = useCallback(() => {
    setFigureVersion(null);
    setElements([]);
    setSelectedElementId(null);
    setIsDetecting(false);
    setDetectionProgress(0);
    setError(null);
    setSourceImageUrl(null);
    setFabricJsonState(null);
    setIconMatches([]);
  }, []);

  const setSourceImage = useCallback((imageUrl: string) => {
    setSourceImageUrl(imageUrl);
  }, []);

  const value: ReconstructionContextType = {
    figureVersion,
    elements,
    selectedElementId,
    isDetecting,
    detectionProgress,
    error,
    sourceImageUrl,
    
    startDetection,
    selectElement,
    acceptElement,
    editElement,
    deleteElement,
    updateElement,
    
    iconMatches,
    loadingIconMatches,
    searchIconsForElement,
    assignIconToElement,
    
    getSceneGraph,
    getFabricJson,
    setFabricJson,
    
    reset,
    setSourceImage,
  };

  return (
    <ReconstructionContext.Provider value={value}>
      {children}
    </ReconstructionContext.Provider>
  );
}
