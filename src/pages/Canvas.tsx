import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, HelpCircle, ChevronLeft, ChevronRight, Sparkles, Users } from "lucide-react";
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
import { CommandPalette } from "@/components/canvas/CommandPalette";
import { AlignmentGuides } from "@/components/canvas/AlignmentGuides";
import { CropTool } from "@/components/canvas/CropTool";
import { ExportDialog } from "@/components/canvas/ExportDialog";
import { CustomOrthogonalLineDialog } from "@/components/canvas/CustomOrthogonalLineDialog";
import { CustomCurvedLineDialog } from "@/components/canvas/CustomCurvedLineDialog";
import { CanvasContextMenu } from "@/components/canvas/CanvasContextMenu";
import { TemplatesGallery } from "@/components/canvas/TemplatesGallery";
import { ToolRatingWidget } from "@/components/canvas/ToolRatingWidget";
import { PanelLabelTool } from "@/components/canvas/PanelLabelTool";
import { OnboardingTutorial } from "@/components/canvas/OnboardingTutorial";
import { CollaborationPanel } from "@/components/canvas/CollaborationPanel";
import { useAuth } from "@/contexts/AuthContext";
import { FabricImage, Group } from "fabric";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

const CanvasContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [customOrthogonalDialogOpen, setCustomOrthogonalDialogOpen] = useState(false);
  const [customCurvedDialogOpen, setCustomCurvedDialogOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  const [panelLabelToolOpen, setPanelLabelToolOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [hasClipboard, setHasClipboard] = useState(false);
  const [hasHiddenObjects, setHasHiddenObjects] = useState(false);
  const [collaborationPanelOpen, setCollaborationPanelOpen] = useState(false);
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const { isAdmin, user } = useAuth();
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
  } = useCanvas();

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

  // Check if current user is project owner
  useEffect(() => {
    const checkOwnership = async () => {
      if (!currentProjectId || !user) {
        setIsProjectOwner(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('canvas_projects')
          .select('user_id')
          .eq('id', currentProjectId)
          .single();

        if (error) throw error;
        setIsProjectOwner(data.user_id === user.id);
      } catch (error) {
        console.error('Error checking project ownership:', error);
        setIsProjectOwner(false);
      }
    };

    checkOwnership();
  }, [currentProjectId, user]);

  // Handle collaboration invitation acceptance from URL
  useEffect(() => {
    const handleInvitationAcceptance = async () => {
      const invitationToken = searchParams.get('invitation');
      if (!invitationToken) return;

      try {
        // Check if user is logged in
        if (!user) {
          // Redirect to login with return URL
          navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }

        // Find invitation
        const { data: invitation, error: fetchError } = await supabase
          .from('project_collaboration_invitations')
          .select('*')
          .eq('invitation_token', invitationToken)
          .eq('status', 'pending')
          .single();

        if (fetchError || !invitation) {
          toast.error('Invalid or expired invitation');
          navigate('/canvas', { replace: true });
          return;
        }

        // Check if invitation has expired
        if (new Date(invitation.expires_at) < new Date()) {
          toast.error('This invitation has expired');
          navigate('/canvas', { replace: true });
          return;
        }

        // Check if user is already a collaborator
        const { data: existingCollab } = await supabase
          .from('project_collaborators')
          .select('id')
          .eq('project_id', invitation.project_id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingCollab) {
          toast.info('You are already a collaborator on this project');
          navigate(`/canvas?project=${invitation.project_id}`, { replace: true });
          return;
        }

        // Accept invitation - create collaborator record
        const { error: acceptError } = await supabase
          .from('project_collaborators')
          .insert({
            project_id: invitation.project_id,
            user_id: user.id,
            role: invitation.role,
            invited_by: invitation.inviter_id,
            accepted_at: new Date().toISOString()
          });

        if (acceptError) throw acceptError;

        // Update invitation status
        await supabase
          .from('project_collaboration_invitations')
          .update({
            status: 'accepted',
            responded_at: new Date().toISOString()
          })
          .eq('id', invitation.id);

        // Load the project
        if (canvas) {
          await loadProject(invitation.project_id);
          setCurrentProjectId(invitation.project_id);
        }
        
        toast.success('Invitation accepted! You can now collaborate on this project.');
        
        // Remove invitation token from URL
        navigate(`/canvas?project=${invitation.project_id}`, { replace: true });
      } catch (error: any) {
        console.error('Error accepting invitation:', error);
        toast.error('Failed to accept invitation');
        navigate('/canvas', { replace: true });
      }
    };

    handleInvitationAcceptance();
  }, [searchParams, user, canvas, loadProject, navigate]);

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
      <div className="h-screen bg-background flex flex-col">
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

      {/* Templates Gallery */}
      <TemplatesGallery
        open={templatesDialogOpen}
        onOpenChange={setTemplatesDialogOpen}
        onSelectTemplate={loadTemplate}
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

      {/* Panel Label Tool */}
      <PanelLabelTool 
        open={panelLabelToolOpen}
        onOpenChange={setPanelLabelToolOpen}
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
      <header className="glass-effect border-b shadow-sm">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://tljsbmpglwmzyaoxsqyj.supabase.co/storage/v1/object/sign/icon%20site/biosketch%20art-min.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zOWUxYTMwMi1lYjJkLTQxOGUtYjdkZS1hZGE0M2NhNTI0NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpY29uIHNpdGUvYmlvc2tldGNoIGFydC1taW4ucG5nIiwiaWF0IjoxNzYwODgyOTg3LCJleHAiOjIwNzYyNDI5ODd9.Z1uz-_XoJro6NP3bm6Ehexf5wAqUMfg03lRo73WPr1g"
              alt="BioSketch" 
              className="h-8 object-contain"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to Projects</TooltipContent>
            </Tooltip>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={saveName}
                  autoFocus
                  className="h-8 text-base font-semibold tracking-tight max-w-[300px] bg-background/50 border-primary/30 focus:border-primary"
                  maxLength={100}
                />
              </div>
            ) : (
              <button
                onClick={startEditingName}
                className="text-lg font-semibold tracking-tight hover:bg-accent/50 px-2.5 py-1 rounded border border-transparent hover:border-border/40 transition-all"
                title="Click to rename"
              >
                {projectName}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isSaving && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {currentProjectId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={collaborationPanelOpen ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setCollaborationPanelOpen(!collaborationPanelOpen)}
                    className="h-9 w-9"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Collaborate</TooltipContent>
              </Tooltip>
            )}
            <MenuBar 
              onTemplatesClick={() => setTemplatesDialogOpen(true)}
              onPanelLabelClick={() => setPanelLabelToolOpen(true)}
              onVersionHistoryClick={() => setVersionHistoryOpen(true)}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowShortcuts(true)}
                  className="h-9 w-9"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard Shortcuts (?)</TooltipContent>
            </Tooltip>
            {isAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiGeneratorOpen(true)}
                    className="h-9"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Generate
                    <Badge variant="secondary" className="ml-2">Admin</Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>AI Figure Generator</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => saveProject(true)} disabled={isSaving} variant="default" size="sm" className="h-9 shadow-sm">
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Project (Ctrl+S)</TooltipContent>
            </Tooltip>
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
        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar - Icon Categories & Assets */}
          <div className={`glass-effect border-r flex flex-col overflow-hidden min-h-0 h-full transition-all duration-300 ${isIconLibraryCollapsed ? 'w-12' : 'w-64'}`}>
            {isIconLibraryCollapsed ? (
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsIconLibraryCollapsed(false)}
                  className="w-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="p-2 border-b flex items-center justify-between">
                  <Tabs value={leftSidebarTab} onValueChange={(v) => setLeftSidebarTab(v as "icons" | "assets")} className="flex-1">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                      <TabsTrigger value="icons" className="text-xs">Icons</TabsTrigger>
                      <TabsTrigger value="assets" className="text-xs">My Assets</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsIconLibraryCollapsed(true)}
                    className="ml-1 h-8 w-8"
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
                        // Dispatch event to add asset to canvas
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

          {/* Vertical Toolbar */}
          <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />

        {/* Canvas */}
        <ScrollArea className="flex-1 relative min-h-0">
          <div className="p-8">
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

        {/* Right Sidebar - Properties & Layers */}
        <div className={`glass-effect border-l flex flex-col overflow-hidden min-h-0 transition-all duration-300 ${isPropertiesPanelCollapsed ? 'w-12' : 'w-64'}`}>
          {isPropertiesPanelCollapsed ? (
            <div className="p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPropertiesPanelCollapsed(false)}
                className="w-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-2 border-b flex items-center justify-between">
                <Tabs value={rightSidebarTab} onValueChange={(v) => setRightSidebarTab(v as "properties" | "layers")} className="flex-1">
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
                    <TabsTrigger value="layers" className="text-xs">Layers</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPropertiesPanelCollapsed(true)}
                  className="ml-1 h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
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
      </div>

      {/* Bottom Bar */}
      <BottomBar activeTool={activeTool} hasSelection={!!selectedObject} />

      {/* Rating Widget */}
      <ToolRatingWidget />

      {/* Contextual Toolbar - Appears when object is selected */}
      <ContextualToolbar />

      {/* Smart Suggestions - Context-aware tips */}
      <SmartSuggestions />

      {/* Collaboration Panel - Floating */}
      {collaborationPanelOpen && currentProjectId && (
        <div className="fixed right-4 top-20 bottom-4 w-96 z-50 animate-in slide-in-from-right duration-300">
          <CollaborationPanel
            projectId={currentProjectId}
            projectName={projectName}
            isOwner={isProjectOwner}
            onClose={() => setCollaborationPanelOpen(false)}
          />
        </div>
      )}
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
