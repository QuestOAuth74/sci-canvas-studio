import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, HelpCircle, ChevronLeft, ChevronRight, Sparkles, Square, Image, Layers } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserMenu } from "@/components/auth/UserMenu";
import { FabricCanvas } from "@/components/canvas/FabricCanvas";
import { IconLibrary } from "@/components/canvas/IconLibrary";
import { UserAssetsLibrary } from "@/components/canvas/UserAssetsLibrary";
import { TopToolbar } from "@/components/canvas/TopToolbar";
import { ContextualToolbar } from "@/components/canvas/ContextualToolbar";
import { Toolbar } from "@/components/canvas/Toolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertiesPanel } from "@/components/canvas/PropertiesPanel";
import { LayersPanel } from "@/components/canvas/LayersPanel";
import { BottomBar } from "@/components/canvas/BottomBar";
import { SmartSuggestions } from "@/components/canvas/SmartSuggestions";
import { MenuBar } from "@/components/canvas/MenuBar";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CanvasProvider, useCanvas } from "@/contexts/CanvasContext";
import { toast } from "sonner";
import { MobileWarningDialog } from "@/components/canvas/MobileWarningDialog";
import { KeyboardShortcutsDialog } from "@/components/canvas/KeyboardShortcutsDialog";
import { VersionHistory } from "@/components/canvas/VersionHistory";
import { SaveUploadHandler } from "@/components/canvas/SaveUploadHandler";
import { AIFigureGenerator } from "@/components/canvas/AIFigureGenerator";
import { AIIconGenerator } from "@/components/canvas/AIIconGenerator";
import { StyleTransferDialog } from '@/components/canvas/StyleTransferDialog';
import { CommandPalette } from "@/components/canvas/CommandPalette";
import { AlignmentGuides } from "@/components/canvas/AlignmentGuides";
import { CropTool } from "@/components/canvas/CropTool";
import { ExportDialog } from "@/components/canvas/ExportDialog";
import { CustomOrthogonalLineDialog } from "@/components/canvas/CustomOrthogonalLineDialog";
import { CustomCurvedLineDialog } from "@/components/canvas/CustomCurvedLineDialog";
import { CanvasContextMenu } from "@/components/canvas/CanvasContextMenu";
import { CommunityTemplatesGallery } from "@/components/canvas/CommunityTemplatesGallery";
import { ToolRatingWidget } from "@/components/canvas/ToolRatingWidget";
import { PanelLabelTool } from "@/components/canvas/PanelLabelTool";
import { ScaleBarTool } from "@/components/canvas/ScaleBarTool";
import { OnboardingTutorial } from "@/components/canvas/OnboardingTutorial";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { WelcomeDialog } from "@/components/canvas/WelcomeDialog";
import { TipBanner } from "@/components/canvas/TipBanner";
import { useAuth } from "@/contexts/AuthContext";
import { FabricImage, Group } from "fabric";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useTheme } from "@/contexts/ThemeContext";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useProjectPages } from "@/hooks/useProjectPages";

const CanvasContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setCanvasMode } = useTheme();
  const [activeTool, setActiveTool] = useState<string>("select");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>("");
  const [isIconLibraryCollapsed, setIsIconLibraryCollapsed] = useState(false);
  const [isPropertiesPanelCollapsed, setIsPropertiesPanelCollapsed] = useState(false);
  const [leftSidebarTab, setLeftSidebarTab] = useState<"icons" | "assets">("icons");
  const [rightSidebarTab, setRightSidebarTab] = useState<"properties" | "layers">("properties");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [aiIconGeneratorOpen, setAiIconGeneratorOpen] = useState(false);
  const [styleTransferOpen, setStyleTransferOpen] = useState(false);
  const [customOrthogonalDialogOpen, setCustomOrthogonalDialogOpen] = useState(false);
  const [customCurvedDialogOpen, setCustomCurvedDialogOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  const [panelLabelToolOpen, setPanelLabelToolOpen] = useState(false);
  const [scaleBarToolOpen, setScaleBarToolOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [hasClipboard, setHasClipboard] = useState(false);
  const [hasHiddenObjects, setHasHiddenObjects] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const { isAdmin, user } = useAuth();
  const { startOnboarding } = useOnboarding();
  
  // State for resizable right panel width with localStorage persistence
  const [rightPanelWidth, setRightPanelWidth] = useState(() => {
    const saved = localStorage.getItem('canvas_right_panel_width');
    return saved ? Math.min(400, Math.max(200, parseInt(saved, 10))) : 280; // Default 280px, clamped 200-400
  });

  const {
    canvas,
    selectedObject,
    undo,
    redo,
    cut,
    copy,
    paste,
    deleteSelected,
    selectAll,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    groupSelected,
    ungroupSelected,
    flipHorizontal,
    flipVertical,
    projectName,
    setProjectName,
    isSaving,
    saveProject,
    loadProject,
    togglePin,
    cropMode,
    setCropMode,
    cropImage,
    nudgeObject,
    exportDialogOpen,
    setExportDialogOpen,
    exportAsPNG,
    exportAsPNGTransparent,
    exportAsJPG,
    cleanExport,
    canvasDimensions,
    checkForRecovery,
    recoverCanvas,
    duplicateSelected,
    pasteInPlace,
    deselectAll,
    toggleLockSelected,
    hideSelected,
    showAllHidden,
    rotateSelected,
    duplicateBelow,
    loadTemplate,
    paperSize,
  } = useCanvas();

  // Multi-page support
  const {
    pages,
    currentPageIndex,
    isSavingPage,
    addPage,
    switchToPage,
    deletePage,
    renamePage,
    duplicatePage,
    migrateToPages,
  } = useProjectPages({
    projectId: currentProjectId,
    canvas,
    userId: user?.id || null,
  });

  // Enable canvas workspace theme when component mounts
  useEffect(() => {
    setCanvasMode(true);
    return () => setCanvasMode(false);
  }, [setCanvasMode]);

  // Track clipboard status via copy/cut actions
  useEffect(() => {
    const handleCopy = () => setHasClipboard(true);
    const handleCut = () => setHasClipboard(true);
    
    // Listen for clipboard operations
    window.addEventListener('clipboardData', handleCopy);
    
    return () => {
      window.removeEventListener('clipboardData', handleCopy);
    };
  }, []);

  // Check for hidden objects
  useEffect(() => {
    if (!canvas) return;
    
    const checkHidden = () => {
      const objects = canvas.getObjects();
      const hasHidden = objects.some(obj => obj.visible === false);
      setHasHiddenObjects(hasHidden);
    };
    
    checkHidden();
    canvas.on('object:added', checkHidden);
    canvas.on('object:removed', checkHidden);
    canvas.on('object:modified', checkHidden);
    
    return () => {
      canvas.off('object:added', checkHidden);
      canvas.off('object:removed', checkHidden);
      canvas.off('object:modified', checkHidden);
    };
  }, [canvas]);

  // Load project from URL parameter
  useEffect(() => {
    const projectId = searchParams.get("project");
    if (projectId && canvas) {
      loadProject(projectId);
      setCurrentProjectId(projectId);
    }
  }, [searchParams, canvas, loadProject]);

  // Migrate existing project to pages if needed
  useEffect(() => {
    if (!currentProjectId || !canvas || !user?.id || pages.length > 0) return;
    
    // When a project is loaded but has no pages, migrate it
    const canvasData = canvas.toJSON();
    const hasObjects = canvasData.objects && canvasData.objects.length > 0;
    
    if (hasObjects) {
      migrateToPages(
        currentProjectId,
        canvasData,
        canvasDimensions.width,
        canvasDimensions.height,
        paperSize
      );
    }
  }, [currentProjectId, canvas, user?.id, pages.length, migrateToPages, canvasDimensions, paperSize]);

  // Check if first-time user and show welcome dialog
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('canvas_welcome_completed');
    const projectId = searchParams.get("project");
    
    // Only show welcome dialog if:
    // 1. User hasn't seen it before
    // 2. No specific project is being loaded
    // 3. Canvas exists and is empty
    if (!hasSeenWelcome && !projectId && canvas) {
      const isEmpty = canvas.getObjects().length === 0;
      if (isEmpty) {
        setShowWelcomeDialog(true);
      }
    }
  }, [canvas, searchParams]);

  // Check for recovery on load
  useEffect(() => {
    if (!canvas) return;
    
    // Don't offer recovery when loading a specific project from URL
    const projectId = searchParams.get("project");
    if (projectId) {
      // Clear any stale recovery data when loading explicit project
      localStorage.removeItem('canvas_recovery');
      return;
    }

    const recovery = checkForRecovery();
    if (recovery) {
      toast.info(
        `Found unsaved work from ${recovery.ageMinutes} minute${recovery.ageMinutes !== 1 ? 's' : ''} ago`,
        {
          duration: 10000,
          action: {
            label: 'Recover',
            onClick: () => recoverCanvas(recovery.data),
          },
        }
      );
    }
  }, [canvas, checkForRecovery, recoverCanvas, searchParams]);


  const handleExport = () => {
    toast("Export functionality will save your SVG file");
  };

  const handleShapeSelect = (shape: string) => {
    if (shape === 'orthogonal-line-custom') {
      setCustomOrthogonalDialogOpen(true);
    } else if (shape === 'curved-line-custom') {
      setCustomCurvedDialogOpen(true);
    } else {
      setActiveTool(shape);
      toast.success(`Selected ${shape}`);
    }
  };

  const handleCustomOrthogonalLine = (startMarker: string, endMarker: string) => {
    setActiveTool(`orthogonal-line-custom-${startMarker}-${endMarker}`);
    toast.success(`Custom orthogonal line selected: ${startMarker} → ${endMarker}`);
  };

  const handleCustomCurvedLine = (startMarker: string, endMarker: string) => {
    setActiveTool(`curved-line-custom-${startMarker}-${endMarker}`);
    toast.success(`Custom curved line selected: ${startMarker} → ${endMarker}`);
  };

  const handleShapeCreated = useCallback(() => {
    setActiveTool("select");
  }, []);

  const startEditingName = () => {
    setTempName(projectName);
    setIsEditingName(true);
  };

  const saveName = () => {
    const trimmedName = tempName.trim();
    if (trimmedName.length === 0) {
      toast.error("Canvas name cannot be empty");
      setTempName(projectName);
      setIsEditingName(false);
      return;
    }
    if (trimmedName.length > 100) {
      toast.error("Canvas name must be less than 100 characters");
      return;
    }
    setProjectName(trimmedName);
    setIsEditingName(false);
    toast.success("Canvas renamed");
  };

  const cancelEditing = () => {
    setTempName(projectName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveName();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  const handleExportImage = (format: 'png' | 'png-transparent' | 'jpg', dpi: 150 | 300 | 600, selectionOnly?: boolean) => {
    if (format === 'png') {
      exportAsPNG(dpi, selectionOnly);
    } else if (format === 'png-transparent') {
      exportAsPNGTransparent(dpi, selectionOnly);
    } else if (format === 'jpg') {
      exportAsJPG(dpi, selectionOnly);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Check if user is editing text - either canvas text OR HTML inputs
      const activeObject = canvas?.getActiveObject();
      const isEditingCanvasText = activeObject && 
        (activeObject.type === 'textbox' || activeObject.type === 'i-text' || activeObject.type === 'text') && 
        (activeObject as any).isEditing;

      // Check if focus is on any HTML input element
      const activeElement = document.activeElement;
      const isEditingHTMLInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      const isEditingText = isEditingCanvasText || isEditingHTMLInput;

      // Command Palette (Cmd/Ctrl+K)
      if (modifier && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Show shortcuts dialog with ?
      if (e.key === '?' && !modifier && !isEditingText) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      // Number keys for tool switching (1-9)
      if (!isEditingText && !modifier && /^[1-9]$/.test(e.key)) {
        const toolMap: Record<string, string> = {
          '1': 'select',
          '2': 'text',
          '3': 'rectangle',
          '4': 'circle',
          '5': 'straight-line',
          '6': 'arrow',
          '7': 'pen',
          '8': 'image',
          '9': 'eraser',
        };
        
        const tool = toolMap[e.key];
        if (tool) {
          e.preventDefault();
          setActiveTool(tool);
          toast.success(`Switched to ${tool} tool`, { duration: 1000 });
        }
        return;
      }

      // Tab key for cycling through objects
      if (e.key === 'Tab' && !isEditingText) {
        e.preventDefault();
        
        const allObjects = canvas?.getObjects().filter(obj => 
          obj.selectable !== false && !(obj as any).isGridLine && !(obj as any).isRuler
        ) || [];
        
        if (allObjects.length === 0) return;
        
        const currentIndex = selectedObject ? allObjects.indexOf(selectedObject) : -1;
        const nextIndex = e.shiftKey 
          ? (currentIndex - 1 + allObjects.length) % allObjects.length
          : (currentIndex + 1) % allObjects.length;
        
        const nextObject = allObjects[nextIndex];
        canvas?.setActiveObject(nextObject);
        canvas?.renderAll();
        
        toast.success(`Selected: ${nextObject.type}`, { duration: 800 });
        return;
      }

      // Clean Export (Cmd/Ctrl + E)
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        cleanExport();
        return;
      }

      // Save Project (Cmd/Ctrl + S)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveProject(true);
        return;
      }

      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }

      // Duplicate (Cmd/Ctrl + D)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      }

      // Paste in place (Cmd/Ctrl + Shift + V)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'v') {
        e.preventDefault();
        pasteInPlace();
      }

      // Deselect all (Cmd/Ctrl + Shift + A)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
        e.preventDefault();
        deselectAll();
      }

      // Lock/Unlock (Cmd/Ctrl + Shift + L)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'l') {
        e.preventDefault();
        toggleLockSelected();
      }

      // Hide selected (H)
      if (e.key === 'h' && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditingText) {
        e.preventDefault();
        hideSelected();
      }

      // Flip horizontal (Shift + H)
      if (e.key === 'H' && e.shiftKey && !e.metaKey && !e.ctrlKey && !isEditingText) {
        e.preventDefault();
        flipHorizontal();
      }

      // Flip vertical (Shift + V)
      if (e.key === 'V' && e.shiftKey && !e.metaKey && !e.ctrlKey && !isEditingText) {
        e.preventDefault();
        flipVertical();
      }

      // Version History (Cmd/Ctrl + H)
      if ((e.metaKey || e.ctrlKey) && e.key === 'h' && !e.shiftKey) {
        e.preventDefault();
        setVersionHistoryOpen(true);
        return;
      }

      // Show all hidden (Cmd/Ctrl + Shift + H)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'h') {
        e.preventDefault();
        showAllHidden();
      }

      // Rotate 90° clockwise (Cmd/Ctrl + R)
      if ((e.metaKey || e.ctrlKey) && e.key === 'r' && !e.shiftKey) {
        e.preventDefault();
        rotateSelected(90);
      }

      // Rotate 90° counter-clockwise (Cmd/Ctrl + Shift + R)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'r') {
        e.preventDefault();
        rotateSelected(-90);
      }

      // Duplicate and arrange below (Cmd/Ctrl + =)
      if ((e.metaKey || e.ctrlKey) && e.key === '=') {
        e.preventDefault();
        duplicateBelow();
      }

      // Cut/Copy/Paste
      if (modifier && e.key === 'x') {
        e.preventDefault();
        cut();
      } else if (modifier && e.key === 'c') {
        e.preventDefault();
        copy();
      } else if (modifier && e.key === 'v') {
        // Allow native paste when editing text
        if (!isEditingText) {
          e.preventDefault();
          paste();
        }
      } else if (modifier && e.key === 'a') {
        e.preventDefault();
        selectAll();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !modifier && !isEditingText) {
        // Only delete the object if not currently editing text
        e.preventDefault();
        deleteSelected();
      } else if (modifier && e.shiftKey && e.key === ']') {
        e.preventDefault();
        bringToFront();
      } else if (modifier && !e.shiftKey && e.key === ']') {
        e.preventDefault();
        bringForward();
      } else if (modifier && !e.shiftKey && e.key === '[') {
        e.preventDefault();
        sendBackward();
      } else if (modifier && e.shiftKey && e.key === '[') {
        e.preventDefault();
        sendToBack();
      } else if (modifier && e.key === 'l') {
        e.preventDefault();
        togglePin();
      } else if (modifier && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        groupSelected();
      } else if (modifier && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        ungroupSelected();
      } else if (!modifier && e.key.toLowerCase() === 'l' && !isEditingText) {
        e.preventDefault();
        setActiveTool("straight-line");
        toast.info("Straight line tool activated");
      } else if (!modifier && e.key.toLowerCase() === 'c' && !isEditingText) {
        e.preventDefault();
        const activeObject = canvas?.getActiveObject();
        if (activeObject && (activeObject.type === 'image' || activeObject.type === 'group')) {
          setCropMode(true);
          toast.info("Crop mode activated");
        }
      } else if (e.key === 'Escape' && cropMode) {
        e.preventDefault();
        setCropMode(false);
        toast.info("Crop mode cancelled");
      } else if (e.key === 'Enter' && cropMode && !isEditingText) {
        e.preventDefault();
        // Crop will be applied via CropTool's Apply button
      } else if (e.shiftKey && !modifier && !isEditingText) {
        // Shift+Arrow nudging for precise object movement
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          nudgeObject('up');
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          nudgeObject('down');
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          nudgeObject('left');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          nudgeObject('right');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, selectedObject, undo, redo, cut, copy, paste, selectAll, deleteSelected, bringToFront, sendToBack, bringForward, sendBackward, groupSelected, ungroupSelected, togglePin, cropMode, setCropMode, nudgeObject, duplicateSelected, pasteInPlace, deselectAll, toggleLockSelected, hideSelected, showAllHidden, rotateSelected, duplicateBelow]);

  return (
      <>
      <OnboardingTutorial />
      <div className="h-screen bg-gradient-to-br from-slate-100 via-blue-50/50 to-slate-100 flex flex-col">
      {/* Mobile Warning Dialog */}
      <MobileWarningDialog />
      
      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog 
        open={showShortcuts} 
        onOpenChange={setShowShortcuts}
      />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onToolChange={setActiveTool}
      />

      {/* Community Templates Gallery */}
      <CommunityTemplatesGallery
        open={templatesDialogOpen}
        onOpenChange={setTemplatesDialogOpen}
        onSelectTemplate={(projectId) => navigate(`/canvas?project=${projectId}`)}
        onBlankCanvas={() => setTemplatesDialogOpen(false)}
      />

      {/* Version History */}
      <VersionHistory
        open={versionHistoryOpen}
        onOpenChange={setVersionHistoryOpen}
        projectId={currentProjectId}
        onVersionRestored={() => {
          // Reload the project after restoration
          if (currentProjectId) {
            loadProject(currentProjectId);
          }
        }}
      />

      {/* Save Upload Handler */}
      <SaveUploadHandler />
      
      {/* AI Figure Generator */}
      <AIFigureGenerator 
        canvas={canvas}
        open={aiGeneratorOpen} 
        onOpenChange={setAiGeneratorOpen} 
      />
      
      {/* AI Icon Generator */}
      <AIIconGenerator
        open={aiIconGeneratorOpen}
        onOpenChange={setAiIconGeneratorOpen}
        onIconGenerated={() => {
          // Refresh icon library if needed
          toast.success("Icon added to library!");
        }}
      />

      {/* Style Transfer Dialog */}
      <StyleTransferDialog
        open={styleTransferOpen}
        onOpenChange={setStyleTransferOpen}
      />

      {/* Panel Label Tool */}
      <PanelLabelTool 
        open={panelLabelToolOpen}
        onOpenChange={setPanelLabelToolOpen}
      />

      {/* Scale Bar Tool */}
      <ScaleBarTool 
        open={scaleBarToolOpen}
        onOpenChange={setScaleBarToolOpen}
      />
      
      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExportImage}
        canvasWidth={canvasDimensions.width}
        canvasHeight={canvasDimensions.height}
        hasSelection={!!selectedObject}
      />
      
      {/* Custom Orthogonal Line Dialog */}
      <CustomOrthogonalLineDialog
        open={customOrthogonalDialogOpen}
        onOpenChange={setCustomOrthogonalDialogOpen}
        onConfirm={handleCustomOrthogonalLine}
      />
      
      {/* Custom Curved Line Dialog */}
      <CustomCurvedLineDialog
        open={customCurvedDialogOpen}
        onOpenChange={setCustomCurvedDialogOpen}
        onConfirm={handleCustomCurvedLine}
      />
      
      {/* Crop Tool */}
      {cropMode && canvas && (() => {
        // Check selectedObject first, fallback to canvas active object
        const objectToEdit = selectedObject && 
          (selectedObject.type === 'image' || selectedObject.type === 'group')
          ? selectedObject 
          : canvas.getActiveObject();
        
        const canCrop = objectToEdit && 
          (objectToEdit.type === 'image' || objectToEdit.type === 'group');
        
        if (!canCrop) return null;

        return (
          <CropTool
            canvas={canvas}
            selectedObject={objectToEdit as FabricImage | Group}
            onApply={cropImage}
            onCancel={() => setCropMode(false)}
          />
        );
      })()}

      {/* Top Header with Menu */}
      <header className="bg-blue-100/60 border-b border-blue-200/80 shadow-sm">
        <div className="px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODgyOTg3LCJleHAiOjIwNzYyNDI5ODd9.Z1uz-_XoJro6NP3bm6Ehexf5wAqUMfg03lRo73WPr1g"
              alt="BioSketch" 
              className="h-7 object-contain"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/")} 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to Projects</TooltipContent>
            </Tooltip>
            {isEditingName ? (
              <Input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={saveName}
                autoFocus
                className="h-7 text-sm font-medium max-w-[200px]"
                maxLength={100}
              />
            ) : (
              <button
                onClick={startEditingName}
                className="text-sm font-medium text-foreground hover:bg-muted px-2 py-1 rounded transition-colors"
                title="Click to rename"
              >
                {projectName}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isSaving && (
              <span className="text-xs flex items-center gap-1.5 px-2 py-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            <MenuBar 
              onTemplatesClick={() => setTemplatesDialogOpen(true)}
              onPanelLabelClick={() => setPanelLabelToolOpen(true)}
              onVersionHistoryClick={() => setVersionHistoryOpen(true)}
              onScaleBarClick={() => setScaleBarToolOpen(true)}
              onStyleTransferClick={() => setStyleTransferOpen(true)}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowShortcuts(true)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Shortcuts (?)</TooltipContent>
            </Tooltip>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiGeneratorOpen(true)}
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                AI
              </Button>
            )}
            <Button 
              onClick={() => saveProject(true)} 
              disabled={isSaving} 
              size="sm" 
              className="h-8 bg-primary hover:bg-primary/90"
              data-action="save"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

        {/* Top Toolbar */}
        <TopToolbar 
          onExport={handleExport} 
          activeTool={activeTool}
          onToolChange={setActiveTool}
        />

        {/* Main Editor Area */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          {/* Left Sidebar - Icon Categories & Assets */}
          <ResizablePanel 
            defaultSize={isIconLibraryCollapsed ? 3 : 16} 
            minSize={3} 
            maxSize={20}
            className="min-h-0"
          >
            <div className={`bg-blue-100/60 border-r border-blue-200/80 flex flex-col overflow-hidden min-h-0 h-full transition-all duration-200`}>
            {isIconLibraryCollapsed ? (
              <div className="p-2 flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsIconLibraryCollapsed(false)}
                  className="w-full text-muted-foreground hover:text-foreground hover:scale-105 transition-all duration-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {/* Vertical label when collapsed */}
                <span className="text-[10px] font-medium text-muted-foreground writing-mode-vertical transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
                  {leftSidebarTab === "icons" ? "Icons" : "Assets"}
                </span>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="p-2 border-b border-blue-300/60 bg-blue-200/40 flex items-center justify-between">
                  <Tabs value={leftSidebarTab} onValueChange={(v) => setLeftSidebarTab(v as "icons" | "assets")} className="flex-1">
                    <TabsList className="grid w-full grid-cols-2 h-9 bg-blue-200/70 p-0.5 rounded-lg">
                      <TabsTrigger 
                        value="icons" 
                        className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 rounded-md flex items-center gap-1.5"
                      >
                        <Square className="h-3 w-3" />
                        Icons
                      </TabsTrigger>
                      <TabsTrigger 
                        value="assets" 
                        className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 rounded-md flex items-center gap-1.5"
                      >
                        <Image className="h-3 w-3" />
                        Assets
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsIconLibraryCollapsed(true)}
                    className="ml-1 h-8 w-8 text-muted-foreground hover:text-foreground hover:scale-105 transition-all duration-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {leftSidebarTab === "icons" ? (
                    <IconLibrary 
                      selectedCategory={selectedIconCategory} 
                      onCategoryChange={setSelectedIconCategory}
                      isCollapsed={false}
                      onToggleCollapse={() => {}}
                      onAIIconGenerate={() => setAiIconGeneratorOpen(true)}
                    />
                  ) : (
                    <UserAssetsLibrary 
                      onAssetSelect={async (assetId, content) => {
                        window.dispatchEvent(new CustomEvent('addAssetToCanvas', {
                          detail: { content, assetId }
                        }));
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border/30 hover:bg-primary/50 transition-colors w-0.5" />

          {/* Middle Section - Toolbar + Canvas */}
          <ResizablePanel defaultSize={65} minSize={40}>
            <div className="flex h-full min-h-0">
              {/* Vertical Toolbar */}
              <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />

              {/* Canvas */}
              <ScrollArea className="flex-1 relative min-h-0 bg-slate-200/30">
          <div className="p-6">
            <CanvasContextMenu
              selectedObject={selectedObject}
              hasClipboard={hasClipboard}
              canUndo={true}
              canRedo={true}
              hasHiddenObjects={hasHiddenObjects}
              onCopy={() => {
                copy();
                setHasClipboard(true);
              }}
              onCut={() => {
                cut();
                setHasClipboard(true);
              }}
              onPaste={paste}
              onDuplicate={duplicateSelected}
              onDelete={deleteSelected}
              onLock={toggleLockSelected}
              onHide={hideSelected}
              onBringToFront={bringToFront}
              onBringForward={bringForward}
              onSendBackward={sendBackward}
              onSendToBack={sendToBack}
              onGroup={groupSelected}
              onUngroup={ungroupSelected}
              onSelectAll={selectAll}
              onUndo={undo}
              onRedo={redo}
              onShowAllHidden={showAllHidden}
              onOpenProperties={() => {
                setIsPropertiesPanelCollapsed(false);
                setRightSidebarTab("properties");
              }}
            >
              <FabricCanvas activeTool={activeTool} onShapeCreated={handleShapeCreated} onToolChange={setActiveTool} />
            </CanvasContextMenu>
          </div>
              <AlignmentGuides />
              <ScrollBar orientation="horizontal" />
              <ScrollBar orientation="vertical" />
            </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border/30 hover:bg-primary/50 transition-colors w-0.5" />

          {/* Right Sidebar - Properties & Layers */}
          <ResizablePanel 
            defaultSize={isPropertiesPanelCollapsed ? 3 : (rightPanelWidth / window.innerWidth * 100)}
            minSize={isPropertiesPanelCollapsed ? 3 : (200 / window.innerWidth * 100)}
            maxSize={isPropertiesPanelCollapsed ? 3 : (400 / window.innerWidth * 100)}
            onResize={(size) => {
              if (!isPropertiesPanelCollapsed) {
                const containerWidth = window.innerWidth;
                const panelWidth = (size / 100) * containerWidth;
                const clampedWidth = Math.min(400, Math.max(200, panelWidth));
                setRightPanelWidth(clampedWidth);
                localStorage.setItem('canvas_right_panel_width', clampedWidth.toString());
              }
            }}
            className="min-h-0"
          >
            <div className={`bg-blue-100/60 border-l border-blue-200/80 flex flex-col overflow-hidden min-h-0 h-full`}>
          {isPropertiesPanelCollapsed ? (
            <div className="p-2 flex flex-col items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPropertiesPanelCollapsed(false)}
                className="w-full text-muted-foreground hover:text-foreground hover:scale-105 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {/* Vertical label when collapsed */}
              <span className="text-[10px] font-medium text-muted-foreground" style={{ writingMode: 'vertical-rl' }}>
                {rightSidebarTab === "properties" ? "Properties" : "Layers"}
              </span>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-2 border-b border-blue-300/60 bg-blue-200/40 flex items-center justify-between">
                <Tabs value={rightSidebarTab} onValueChange={(v) => setRightSidebarTab(v as "properties" | "layers")} className="flex-1">
                  <TabsList className="grid w-full grid-cols-2 h-9 bg-blue-200/70 p-0.5 rounded-lg">
                    <TabsTrigger 
                      value="properties" 
                      className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 rounded-md flex items-center gap-1.5"
                    >
                      <Square className="h-3 w-3" />
                      Properties
                    </TabsTrigger>
                    <TabsTrigger 
                      value="layers" 
                      className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 rounded-md flex items-center gap-1.5"
                    >
                      <Layers className="h-3 w-3" />
                      Layers
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPropertiesPanelCollapsed(true)}
                  className="ml-1 h-8 w-8 text-muted-foreground hover:text-foreground hover:scale-105 transition-all duration-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden" data-panel="properties">
                {rightSidebarTab === "properties" ? (
                  <PropertiesPanel 
                    isCollapsed={false}
                    onToggleCollapse={() => {}}
                    activeTool={activeTool}
                  />
                ) : (
                  <LayersPanel />
                )}
              </div>
            </div>
          )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

      {/* Bottom Bar */}
      <BottomBar 
        activeTool={activeTool} 
        hasSelection={!!selectedObject}
        pages={pages}
        currentPageIndex={currentPageIndex}
        isSavingPage={isSavingPage}
        onSwitchPage={switchToPage}
        onAddPage={addPage}
        onDeletePage={deletePage}
        onRenamePage={renamePage}
        onDuplicatePage={duplicatePage}
      />

      {/* Rating Widget */}
      <ToolRatingWidget />

      {/* Contextual Toolbar - Appears when object is selected */}
      <ContextualToolbar />

      {/* Smart Suggestions - Context-aware tips */}
      <SmartSuggestions />

      {/* Welcome Dialog for First-Time Users */}
      <WelcomeDialog
        open={showWelcomeDialog}
        onOpenChange={setShowWelcomeDialog}
        onStartWithTemplate={() => {
          setTemplatesDialogOpen(true);
        }}
        onStartTutorial={() => {
          startOnboarding();
        }}
        onStartBlank={() => {
          // Load the Getting Started template to reduce blank canvas anxiety
          import('@/lib/templates').then(({ GETTING_STARTED_TEMPLATE }) => {
            loadTemplate(GETTING_STARTED_TEMPLATE);
            toast.success("Let's get started! Feel free to delete these examples and create your own.");
          });
          localStorage.setItem('canvas_welcome_completed', 'true');
        }}
        onSkipTutorial={() => {
          // Load Getting Started template and mark tutorial as completed
          import('@/lib/templates').then(({ GETTING_STARTED_TEMPLATE }) => {
            import('@/contexts/OnboardingContext').then(({ OnboardingProvider }) => {
              loadTemplate(GETTING_STARTED_TEMPLATE);
              // Mark tutorial as completed
              localStorage.setItem('biosketch-onboarding-completed', 'true');
              toast.success("Here's a starter template to help you begin! Tutorial marked as complete.");
            });
          });
          localStorage.setItem('canvas_welcome_completed', 'true');
        }}
      />

      {/* Tip Banner - Shows on first canvas load */}
      <TipBanner />
    </div>
    </>
  );
};

const Canvas = () => {
  return (
    <CanvasProvider>
      <TooltipProvider>
        <CanvasContent />
      </TooltipProvider>
    </CanvasProvider>
  );
};

export default Canvas;
