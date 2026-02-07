import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface PageData {
  id: string;
  project_id: string;
  page_name: string;
  page_number: number;
  canvas_data: Json;
  canvas_width: number;
  canvas_height: number;
  paper_size: string | null;
  background_color: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreatePageParams {
  projectId: string;
  pageName?: string;
  pageNumber: number;
  canvasData?: Json;
  canvasWidth?: number;
  canvasHeight?: number;
  paperSize?: string;
  backgroundColor?: string;
}

export interface UpdatePageParams {
  pageName?: string;
  pageNumber?: number;
  canvasData?: Json;
  canvasWidth?: number;
  canvasHeight?: number;
  paperSize?: string;
  backgroundColor?: string;
}

/**
 * Get all pages for a project, ordered by page number
 */
export async function getProjectPages(projectId: string): Promise<PageData[]> {
  const { data, error } = await supabase
    .from('project_pages')
    .select('*')
    .eq('project_id', projectId)
    .order('page_number', { ascending: true });

  if (error) {
    console.error('Error fetching project pages:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new page for a project
 */
export async function createPage(params: CreatePageParams): Promise<PageData> {
  const insertData = {
    project_id: params.projectId,
    page_name: params.pageName || `Page ${params.pageNumber}`,
    page_number: params.pageNumber,
    canvas_data: params.canvasData || { version: '6.0.0', objects: [] },
    canvas_width: params.canvasWidth || 1200,
    canvas_height: params.canvasHeight || 800,
    paper_size: params.paperSize || 'custom',
    background_color: params.backgroundColor || '#ffffff',
  };

  const { data, error } = await supabase
    .from('project_pages')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Error creating page:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing page
 */
export async function updatePage(pageId: string, updates: UpdatePageParams): Promise<void> {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.pageName !== undefined) updateData.page_name = updates.pageName;
  if (updates.pageNumber !== undefined) updateData.page_number = updates.pageNumber;
  if (updates.canvasData !== undefined) updateData.canvas_data = updates.canvasData;
  if (updates.canvasWidth !== undefined) updateData.canvas_width = updates.canvasWidth;
  if (updates.canvasHeight !== undefined) updateData.canvas_height = updates.canvasHeight;
  if (updates.paperSize !== undefined) updateData.paper_size = updates.paperSize;
  if (updates.backgroundColor !== undefined) updateData.background_color = updates.backgroundColor;

  const { error } = await supabase
    .from('project_pages')
    .update(updateData)
    .eq('id', pageId);

  if (error) {
    console.error('Error updating page:', error);
    throw error;
  }
}

/**
 * Delete a page from a project
 */
export async function deletePage(pageId: string): Promise<void> {
  const { error } = await supabase
    .from('project_pages')
    .delete()
    .eq('id', pageId);

  if (error) {
    console.error('Error deleting page:', error);
    throw error;
  }
}

/**
 * Reorder pages in a project by updating their page_number values
 */
export async function reorderPages(projectId: string, pageIds: string[]): Promise<void> {
  // Update each page's page_number based on its position in the array
  const updates = pageIds.map((pageId, index) => ({
    id: pageId,
    page_number: index + 1,
    updated_at: new Date().toISOString(),
  }));

  // Perform batch updates
  for (const update of updates) {
    const { error } = await supabase
      .from('project_pages')
      .update({ page_number: update.page_number, updated_at: update.updated_at })
      .eq('id', update.id);

    if (error) {
      console.error('Error reordering pages:', error);
      throw error;
    }
  }
}

/**
 * Duplicate a page, creating a copy with a new page number
 */
export async function duplicatePage(pageId: string): Promise<PageData> {
  // First, fetch the source page
  const { data: sourcePage, error: fetchError } = await supabase
    .from('project_pages')
    .select('*')
    .eq('id', pageId)
    .single();

  if (fetchError) {
    console.error('Error fetching page to duplicate:', fetchError);
    throw fetchError;
  }

  if (!sourcePage) {
    throw new Error('Page not found');
  }

  // Get the highest page number in the project
  const { data: pages } = await supabase
    .from('project_pages')
    .select('page_number')
    .eq('project_id', sourcePage.project_id)
    .order('page_number', { ascending: false })
    .limit(1);

  const maxPageNumber = pages?.[0]?.page_number || 0;

  // Create the duplicate
  const newPageData = {
    project_id: sourcePage.project_id,
    page_name: `${sourcePage.page_name} (Copy)`,
    page_number: maxPageNumber + 1,
    canvas_data: sourcePage.canvas_data,
    canvas_width: sourcePage.canvas_width,
    canvas_height: sourcePage.canvas_height,
    paper_size: sourcePage.paper_size,
    background_color: sourcePage.background_color,
  };

  const { data: newPage, error: createError } = await supabase
    .from('project_pages')
    .insert([newPageData])
    .select()
    .single();

  if (createError) {
    console.error('Error duplicating page:', createError);
    throw createError;
  }

  return newPage;
}

/**
 * Initialize pages for a project that doesn't have any yet.
 * Creates the first page from the current canvas_data in canvas_projects.
 */
export async function initializePagesFromProject(
  projectId: string,
  canvasData: Json,
  canvasWidth: number,
  canvasHeight: number,
  paperSize: string,
  backgroundColor: string = '#ffffff'
): Promise<PageData> {
  // Check if pages already exist
  const existingPages = await getProjectPages(projectId);
  if (existingPages.length > 0) {
    return existingPages[0];
  }

  // Create the first page from current project data
  return createPage({
    projectId,
    pageName: 'Page 1',
    pageNumber: 1,
    canvasData,
    canvasWidth,
    canvasHeight,
    paperSize,
    backgroundColor,
  });
}

/**
 * Get a single page by ID
 */
export async function getPageById(pageId: string): Promise<PageData | null> {
  const { data, error } = await supabase
    .from('project_pages')
    .select('*')
    .eq('id', pageId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching page:', error);
    throw error;
  }

  return data;
}
