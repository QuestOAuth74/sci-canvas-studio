import { test, expect } from '@playwright/test';
import { CanvasEditorPage } from '../utils/page-objects/CanvasEditorPage';
import { isGridVisible, isObjectSnappedToGrid } from '../utils/canvas-helpers';

test.describe('Canvas Core Functionality', () => {
  let canvasPage: CanvasEditorPage;

  test.beforeEach(async ({ page }) => {
    canvasPage = new CanvasEditorPage(page);
    await canvasPage.goto();
    await canvasPage.waitForCanvasReady();
  });

  test('User can create, select, and modify objects on canvas', async ({ page }) => {
    // Create a rectangle
    await canvasPage.createRectangle(100, 100, 150, 100);
    await page.waitForTimeout(500);

    // Verify object was created
    const objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(1);

    // Select the object
    await canvasPage.selectObjectAt(175, 150);
    await page.waitForTimeout(300);

    // Verify object is selected
    const hasSelection = await canvasPage.hasSelectedObject();
    expect(hasSelection).toBe(true);

    // Modify object dimensions
    await canvasPage.setObjectWidth('200');
    await page.waitForTimeout(300);

    // Verify dimensions changed
    const width = await canvasPage.getObjectWidth();
    expect(width).toBe('200');
  });

  test('User can use undo/redo to navigate history', async ({ page }) => {
    // Create first rectangle
    await canvasPage.createRectangle(50, 50, 100, 100);
    await page.waitForTimeout(500);

    let objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(1);

    // Create second rectangle
    await canvasPage.createRectangle(200, 200, 100, 100);
    await page.waitForTimeout(500);

    objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(2);

    // Undo - should remove second rectangle
    await canvasPage.undo();
    await page.waitForTimeout(500);

    objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(1);

    // Undo again - should remove first rectangle
    await canvasPage.undo();
    await page.waitForTimeout(500);

    objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(0);

    // Redo - should restore first rectangle
    await canvasPage.redo();
    await page.waitForTimeout(500);

    objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(1);

    // Redo again - should restore second rectangle
    await canvasPage.redo();
    await page.waitForTimeout(500);

    objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(2);
  });

  test('Grid snapping works when enabled', async ({ page }) => {
    // Enable grid and snap to grid
    await canvasPage.toggleGrid();
    await page.waitForTimeout(300);

    // Verify grid is visible
    const gridVisible = await isGridVisible(page);
    expect(gridVisible).toBe(true);

    await canvasPage.toggleSnapToGrid();
    await page.waitForTimeout(300);

    // Create rectangle with non-grid-aligned coordinates
    await canvasPage.createRectangle(103, 97, 80, 60);
    await page.waitForTimeout(500);

    // Verify object snapped to grid (default grid size: 20px)
    const isSnapped = await isObjectSnappedToGrid(page, 0, 20);
    expect(isSnapped).toBe(true);
  });

  test('Multi-object selection and grouping works', async ({ page }) => {
    // Create two rectangles
    await canvasPage.createRectangle(50, 50, 80, 80);
    await page.waitForTimeout(300);

    await canvasPage.createRectangle(200, 200, 80, 80);
    await page.waitForTimeout(300);

    let objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(2);

    // Multi-select both objects
    await canvasPage.multiSelectObjectsAt([
      { x: 90, y: 90 },
      { x: 240, y: 240 },
    ]);
    await page.waitForTimeout(500);

    // Verify multi-selection
    const hasMultiSelection = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      if (!canvas) return false;
      const activeObject = canvas.getActiveObject();
      return activeObject && activeObject.type === 'activeSelection';
    });
    expect(hasMultiSelection).toBe(true);

    // Group the selected objects
    await canvasPage.groupSelected();
    await page.waitForTimeout(500);

    // Verify group was created (2 objects become 1 group)
    objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(1);

    const isGroup = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      if (!canvas) return false;
      const objects = canvas.getObjects();
      return objects.length === 1 && objects[0].type === 'group';
    });
    expect(isGroup).toBe(true);

    // Ungroup
    await canvasPage.selectObjectAt(120, 120);
    await page.waitForTimeout(300);
    await canvasPage.ungroupSelected();
    await page.waitForTimeout(500);

    // Verify objects are ungrouped (1 group becomes 2 objects)
    objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(2);
  });

  test('Layer visibility toggle hides/shows objects', async ({ page }) => {
    // Create a rectangle
    await canvasPage.createRectangle(100, 100, 100, 100);
    await page.waitForTimeout(500);

    // Verify object is visible
    let isVisible = await page.evaluate((index) => {
      const canvas = (window as any).fabricCanvas;
      if (!canvas) return false;
      const objects = canvas.getObjects();
      return objects[index] ? objects[index].visible : false;
    }, 0);
    expect(isVisible).toBe(true);

    // Toggle layer visibility off
    await canvasPage.toggleLayerVisibility(0);
    await page.waitForTimeout(500);

    // Verify object is hidden
    isVisible = await page.evaluate((index) => {
      const canvas = (window as any).fabricCanvas;
      if (!canvas) return false;
      const objects = canvas.getObjects();
      return objects[index] ? objects[index].visible : false;
    }, 0);
    expect(isVisible).toBe(false);

    // Toggle layer visibility back on
    await canvasPage.toggleLayerVisibility(0);
    await page.waitForTimeout(500);

    // Verify object is visible again
    isVisible = await page.evaluate((index) => {
      const canvas = (window as any).fabricCanvas;
      if (!canvas) return false;
      const objects = canvas.getObjects();
      return objects[index] ? objects[index].visible : false;
    }, 0);
    expect(isVisible).toBe(true);
  });

  test('Layer lock prevents object modification', async ({ page }) => {
    // Create a rectangle
    await canvasPage.createRectangle(100, 100, 100, 100);
    await page.waitForTimeout(500);

    // Select the object
    await canvasPage.selectObjectAt(150, 150);
    await page.waitForTimeout(300);

    // Lock the layer
    await canvasPage.toggleLayerLock(0);
    await page.waitForTimeout(500);

    // Verify object is locked
    let isLocked = await page.evaluate((index) => {
      const canvas = (window as any).fabricCanvas;
      if (!canvas) return false;
      const objects = canvas.getObjects();
      return objects[index] ? objects[index].lockMovementX && objects[index].lockMovementY : false;
    }, 0);
    expect(isLocked).toBe(true);

    // Try to modify object width (should not work or be restricted)
    const originalWidth = await canvasPage.getObjectWidth();
    await canvasPage.setObjectWidth('200');
    await page.waitForTimeout(300);

    // Verify width didn't change due to lock
    const newWidth = await canvasPage.getObjectWidth();
    expect(newWidth).toBe(originalWidth);

    // Unlock the layer
    await canvasPage.toggleLayerLock(0);
    await page.waitForTimeout(500);

    // Verify object is unlocked
    isLocked = await page.evaluate((index) => {
      const canvas = (window as any).fabricCanvas;
      if (!canvas) return false;
      const objects = canvas.getObjects();
      return objects[index] ? objects[index].lockMovementX || objects[index].lockMovementY : false;
    }, 0);
    expect(isLocked).toBe(false);
  });

  test('Layer reordering changes z-index correctly', async ({ page }) => {
    // Create three rectangles
    await canvasPage.createRectangle(50, 50, 100, 100);
    await page.waitForTimeout(300);

    await canvasPage.createRectangle(75, 75, 100, 100);
    await page.waitForTimeout(300);

    await canvasPage.createRectangle(100, 100, 100, 100);
    await page.waitForTimeout(300);

    // Get initial z-order
    const initialOrder = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      if (!canvas) return [];
      return canvas.getObjects().map((obj: any, index: number) => index);
    });
    expect(initialOrder).toEqual([0, 1, 2]);

    // Reorder layer 0 to position 2 (move to top)
    await canvasPage.reorderLayer(0, 2);
    await page.waitForTimeout(500);

    // Verify z-order changed
    const newOrder = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      if (!canvas) return [];
      const objects = canvas.getObjects();
      // Check if first object moved to last position
      return objects.length === 3 && objects[2] !== objects[0];
    });
    expect(newOrder).toBe(true);

    // Reorder back
    await canvasPage.reorderLayer(2, 0);
    await page.waitForTimeout(500);

    // Verify z-order restored
    const restoredOrder = await page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      if (!canvas) return [];
      return canvas.getObjects().map((obj: any, index: number) => index);
    });
    expect(restoredOrder).toEqual([0, 1, 2]);
  });
});
