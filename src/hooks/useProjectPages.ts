import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Canvas as FabricCanvas } from 'fabric';
import { debounce } from '@/lib/performanceUtils';

export interface ProjectPage {
  id: string;
  project_id: string;
  page_number: number;
  page_name: string;
  canvas_data: any;
  canvas_width: number;
  canvas_height: number;
  paper_size: string;
  background_color: string;
  created_at: string;
  updated_at: string;
}

interface UseProjectPagesProps {
  projectId: string | null;
  canvas: FabricCanvas | null;
  userId: string | null;
}

export const useProjectPages = ({ projectId, canvas, userId }: UseProjectPagesProps) => {
  const [pages, setPages] = useState<ProjectPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const previousCanvasDataRef = useRef<string | null>(null);

  const currentPage = pages[currentPageIndex] || null;

  // Debounced auto-save for current page (2 second delay)
  const debouncedSavePage = useMemo(
    () => debounce(async (pageId: string, canvasData: any) => {
      if (!userId) return;
      
      setIsSavingPage(true);
      try {
        const { error } = await supabase
          .from('project_pages')
          .update({ 
            canvas_data: canvasData,
            updated_at: new Date().toISOString()
          })
          .eq('id', pageId);

        if (error) throw error;
        console.log('Page auto-saved:', pageId);
      } catch (error) {
        console.error('Failed to auto-save page:', error);
      } finally {
        setIsSavingPage(false);
      }
    }, 2000),
    [userId]
  );

  // Load pages for a project
  const loadPages = useCallback(async (projId: string) => {
    if (!projId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_pages')
        .select('*')
        .eq('project_id', projId)
        .order('page_number', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setPages(data as ProjectPage[]);
        setCurrentPageIndex(0);
      } else {
        // No pages exist - will need migration
        setPages([]);
      }
    } catch (error) {
      console.error('Failed to load pages:', error);
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Migrate existing project to pages (if no pages exist)
  const migrateToPages = useCallback(async (
    projId: string, 
    canvasData: any, 
    width: number, 
    height: number, 
    paperSize: string
  ) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('project_pages')
        .insert({
          project_id: projId,
          page_number: 1,
          page_name: 'Page 1',
          canvas_data: canvasData,
          canvas_width: width,
          canvas_height: height,
          paper_size: paperSize,
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setPages([data as ProjectPage]);
        setCurrentPageIndex(0);
        console.log('Migrated project to pages');
        return data as ProjectPage;
      }
    } catch (error) {
      console.error('Failed to migrate to pages:', error);
    }
    return null;
  }, [userId]);

  // Add a new page
  const addPage = useCallback(async () => {
    if (!projectId || !userId || !canvas) return;

    // First save current page
    if (currentPage) {
      const canvasData = canvas.toJSON();
      await supabase
        .from('project_pages')
        .update({ canvas_data: canvasData })
        .eq('id', currentPage.id);
    }

    const newPageNumber = pages.length + 1;
    
    try {
      const { data, error } = await supabase
        .from('project_pages')
        .insert({
          project_id: projectId,
          page_number: newPageNumber,
          page_name: `Page ${newPageNumber}`,
          canvas_data: { version: '6.0.0', objects: [] },
          canvas_width: currentPage?.canvas_width || 1200,
          canvas_height: currentPage?.canvas_height || 800,
          paper_size: currentPage?.paper_size || 'custom',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPages(prev => [...prev, data as ProjectPage]);
        // Switch to new page
        const newIndex = pages.length;
        setCurrentPageIndex(newIndex);
        
        // Clear canvas for new page
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
        
        toast.success(`Page ${newPageNumber} added`);
      }
    } catch (error) {
      console.error('Failed to add page:', error);
      toast.error('Failed to add page');
    }
  }, [projectId, userId, canvas, pages, currentPage]);

  // Switch to a different page
  const switchToPage = useCallback(async (pageIndex: number) => {
    if (!canvas || pageIndex === currentPageIndex || pageIndex < 0 || pageIndex >= pages.length) {
      return;
    }

    // Save current page before switching
    if (currentPage) {
      const canvasData = canvas.toJSON();
      await supabase
        .from('project_pages')
        .update({ canvas_data: canvasData })
        .eq('id', currentPage.id);
    }

    const targetPage = pages[pageIndex];
    if (!targetPage) return;

    try {
      // Load new page data
      canvas.clear();
      if (targetPage.canvas_data && typeof targetPage.canvas_data === 'object') {
        await canvas.loadFromJSON(targetPage.canvas_data);
      }
      canvas.backgroundColor = targetPage.background_color || '#ffffff';
      canvas.renderAll();
      
      setCurrentPageIndex(pageIndex);
      previousCanvasDataRef.current = JSON.stringify(targetPage.canvas_data);
      
      console.log(`Switched to page ${pageIndex + 1}`);
    } catch (error) {
      console.error('Failed to switch page:', error);
      toast.error('Failed to switch page');
    }
  }, [canvas, currentPageIndex, pages, currentPage]);

  // Delete a page
  const deletePage = useCallback(async (pageId: string) => {
    if (pages.length <= 1) {
      toast.error('Cannot delete the only page');
      return;
    }

    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    try {
      const { error } = await supabase
        .from('project_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      // Update local state
      const newPages = pages.filter(p => p.id !== pageId);
      
      // Renumber pages
      for (let i = 0; i < newPages.length; i++) {
        if (newPages[i].page_number !== i + 1) {
          await supabase
            .from('project_pages')
            .update({ page_number: i + 1 })
            .eq('id', newPages[i].id);
          newPages[i].page_number = i + 1;
        }
      }

      setPages(newPages);

      // Adjust current page index if needed
      if (currentPageIndex >= newPages.length) {
        await switchToPage(newPages.length - 1);
      } else if (pageIndex === currentPageIndex) {
        await switchToPage(Math.min(currentPageIndex, newPages.length - 1));
      }

      toast.success('Page deleted');
    } catch (error) {
      console.error('Failed to delete page:', error);
      toast.error('Failed to delete page');
    }
  }, [pages, currentPageIndex, switchToPage]);

  // Rename a page
  const renamePage = useCallback(async (pageId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('project_pages')
        .update({ page_name: newName })
        .eq('id', pageId);

      if (error) throw error;

      setPages(prev => prev.map(p => 
        p.id === pageId ? { ...p, page_name: newName } : p
      ));
    } catch (error) {
      console.error('Failed to rename page:', error);
      toast.error('Failed to rename page');
    }
  }, []);

  // Duplicate a page
  const duplicatePage = useCallback(async (pageId: string) => {
    if (!projectId || !userId) return;

    const sourcePage = pages.find(p => p.id === pageId);
    if (!sourcePage) return;

    const newPageNumber = pages.length + 1;

    try {
      const { data, error } = await supabase
        .from('project_pages')
        .insert({
          project_id: projectId,
          page_number: newPageNumber,
          page_name: `${sourcePage.page_name} (Copy)`,
          canvas_data: sourcePage.canvas_data,
          canvas_width: sourcePage.canvas_width,
          canvas_height: sourcePage.canvas_height,
          paper_size: sourcePage.paper_size,
          background_color: sourcePage.background_color,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPages(prev => [...prev, data as ProjectPage]);
        toast.success('Page duplicated');
      }
    } catch (error) {
      console.error('Failed to duplicate page:', error);
      toast.error('Failed to duplicate page');
    }
  }, [projectId, userId, pages]);

  // Save current page immediately
  const saveCurrentPage = useCallback(async () => {
    if (!canvas || !currentPage) return;

    setIsSavingPage(true);
    try {
      const canvasData = canvas.toJSON();
      const { error } = await supabase
        .from('project_pages')
        .update({ 
          canvas_data: canvasData,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentPage.id);

      if (error) throw error;
      
      // Update local state
      setPages(prev => prev.map(p => 
        p.id === currentPage.id ? { ...p, canvas_data: canvasData } : p
      ));
      
      previousCanvasDataRef.current = JSON.stringify(canvasData);
    } catch (error) {
      console.error('Failed to save page:', error);
    } finally {
      setIsSavingPage(false);
    }
  }, [canvas, currentPage]);

  // Track canvas changes for auto-save
  const handleCanvasChange = useCallback(() => {
    if (!canvas || !currentPage) return;
    
    const canvasData = canvas.toJSON();
    const canvasDataStr = JSON.stringify(canvasData);
    
    // Only save if data has changed
    if (canvasDataStr !== previousCanvasDataRef.current) {
      previousCanvasDataRef.current = canvasDataStr;
      debouncedSavePage(currentPage.id, canvasData);
    }
  }, [canvas, currentPage, debouncedSavePage]);

  // Setup canvas event listeners for auto-save
  useEffect(() => {
    if (!canvas || !currentPage) return;

    const events = ['object:modified', 'object:added', 'object:removed'];
    
    events.forEach(event => {
      canvas.on(event as any, handleCanvasChange);
    });

    return () => {
      events.forEach(event => {
        canvas.off(event as any, handleCanvasChange);
      });
    };
  }, [canvas, currentPage, handleCanvasChange]);

  // Load pages when project changes
  useEffect(() => {
    if (projectId) {
      loadPages(projectId);
    } else {
      setPages([]);
      setCurrentPageIndex(0);
    }
  }, [projectId, loadPages]);

  return {
    pages,
    currentPage,
    currentPageIndex,
    isLoading,
    isSavingPage,
    addPage,
    switchToPage,
    deletePage,
    renamePage,
    duplicatePage,
    saveCurrentPage,
    loadPages,
    migrateToPages,
    setPages,
    setCurrentPageIndex,
  };
};
