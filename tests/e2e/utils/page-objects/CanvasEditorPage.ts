import { Page, Locator } from '@playwright/test';
import { CanvasEditorTestIds } from '@/lib/test-ids';

/**
 * Page Object Model for Canvas Editor page (/canvas)
 * Handles canvas interactions, tools, layers, and object manipulation
 */
export class CanvasEditorPage {
  readonly page: Page;

  // Page elements
  readonly pageContainer: Locator;
  readonly canvasElement: Locator;
  readonly canvasWrapper: Locator;

  // Toolbar
  readonly toolbar: Locator;
  readonly undoButton: Locator;
  readonly redoButton: Locator;

  // Tools
  readonly selectTool: Locator;
  readonly rectangleTool: Locator;
  readonly circleTool: Locator;
  readonly textTool: Locator;
  readonly lineTool: Locator;

  // Grid & Snapping
  readonly gridToggle: Locator;
  readonly snapToGridToggle: Locator;

  // Layers Panel
  readonly layersPanel: Locator;

  // Properties Panel
  readonly propertiesPanel: Locator;
  readonly objectWidthInput: Locator;
  readonly objectHeightInput: Locator;
  readonly objectXInput: Locator;
  readonly objectYInput: Locator;

  // Actions
  readonly groupButton: Locator;
  readonly ungroupButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize all locators using test IDs
    this.pageContainer = page.getByTestId(CanvasEditorTestIds.PAGE_CONTAINER);
    this.canvasElement = page.getByTestId(CanvasEditorTestIds.CANVAS_ELEMENT);
    this.canvasWrapper = page.getByTestId(CanvasEditorTestIds.CANVAS_WRAPPER);

    this.toolbar = page.getByTestId(CanvasEditorTestIds.TOOLBAR);
    this.undoButton = page.getByTestId(CanvasEditorTestIds.UNDO_BUTTON);
    this.redoButton = page.getByTestId(CanvasEditorTestIds.REDO_BUTTON);

    this.selectTool = page.getByTestId(CanvasEditorTestIds.SELECT_TOOL);
    this.rectangleTool = page.getByTestId(CanvasEditorTestIds.RECTANGLE_TOOL);
    this.circleTool = page.getByTestId(CanvasEditorTestIds.CIRCLE_TOOL);
    this.textTool = page.getByTestId(CanvasEditorTestIds.TEXT_TOOL);
    this.lineTool = page.getByTestId(CanvasEditorTestIds.LINE_TOOL);

    this.gridToggle = page.getByTestId(CanvasEditorTestIds.GRID_TOGGLE);
    this.snapToGridToggle = page.getByTestId(CanvasEditorTestIds.SNAP_TO_GRID_TOGGLE);

    this.layersPanel = page.getByTestId(CanvasEditorTestIds.LAYERS_PANEL);
    this.propertiesPanel = page.getByTestId(CanvasEditorTestIds.PROPERTIES_PANEL);

    this.objectWidthInput = page.getByTestId(CanvasEditorTestIds.OBJECT_WIDTH_INPUT);
    this.objectHeightInput = page.getByTestId(CanvasEditorTestIds.OBJECT_HEIGHT_INPUT);
    this.objectXInput = page.getByTestId(CanvasEditorTestIds.OBJECT_X_INPUT);
    this.objectYInput = page.getByTestId(CanvasEditorTestIds.OBJECT_Y_INPUT);

    this.groupButton = page.getByTestId(CanvasEditorTestIds.GROUP_BUTTON);
    this.ungroupButton = page.getByTestId(CanvasEditorTestIds.UNGROUP_BUTTON);
  }

  /**
   * Navigate to canvas editor
   * @param projectId Optional project ID to open specific project
   */
  async goto(projectId?: string): Promise<void> {
    if (projectId) {
      await this.page.goto(`/canvas/${projectId}`);
    } else {
      await this.page.goto('/canvas');
    }
  }

  /**
   * Wait for canvas to be ready
   * Waits for canvas element to be visible and Fabric.js to initialize
   */
  async waitForCanvasReady(): Promise<void> {
    await this.canvasElement.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(500); // Allow Fabric.js to initialize
  }

  /**
   * Create a rectangle on canvas
   * @param x Starting x coordinate relative to canvas
   * @param y Starting y coordinate relative to canvas
   * @param width Width of the rectangle
   * @param height Height of the rectangle
   */
  async createRectangle(x: number, y: number, width: number, height: number): Promise<void> {
    await this.rectangleTool.click();

    const canvasBox = await this.canvasElement.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + x;
    const startY = canvasBox.y + y;
    const endX = startX + width;
    const endY = startY + height;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY);
    await this.page.mouse.up();
  }

  /**
   * Create a circle on canvas
   * @param x Center x coordinate relative to canvas
   * @param y Center y coordinate relative to canvas
   * @param radius Radius of the circle
   */
  async createCircle(x: number, y: number, radius: number): Promise<void> {
    await this.circleTool.click();

    const canvasBox = await this.canvasElement.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const centerX = canvasBox.x + x;
    const centerY = canvasBox.y + y;
    const edgeX = centerX + radius;
    const edgeY = centerY + radius;

    await this.page.mouse.move(centerX, centerY);
    await this.page.mouse.down();
    await this.page.mouse.move(edgeX, edgeY);
    await this.page.mouse.up();
  }

  /**
   * Click on canvas at specific coordinates
   * @param x X coordinate relative to canvas
   * @param y Y coordinate relative to canvas
   */
  async clickCanvas(x: number, y: number): Promise<void> {
    const canvasBox = await this.canvasElement.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    await this.page.mouse.click(canvasBox.x + x, canvasBox.y + y);
  }

  /**
   * Select object by clicking on it
   * @param x X coordinate of object
   * @param y Y coordinate of object
   */
  async selectObjectAt(x: number, y: number): Promise<void> {
    await this.selectTool.click();
    await this.clickCanvas(x, y);
  }

  /**
   * Multi-select objects using Shift+Click
   * @param positions Array of positions to click
   */
  async multiSelectObjectsAt(positions: { x: number; y: number }[]): Promise<void> {
    await this.selectTool.click();

    for (let i = 0; i < positions.length; i++) {
      if (i > 0) {
        await this.page.keyboard.down('Shift');
      }
      await this.clickCanvas(positions[i].x, positions[i].y);
      if (i > 0) {
        await this.page.keyboard.up('Shift');
      }
    }
  }

  /**
   * Toggle grid visibility
   */
  async toggleGrid(): Promise<void> {
    await this.gridToggle.click();
  }

  /**
   * Toggle snap to grid
   */
  async toggleSnapToGrid(): Promise<void> {
    await this.snapToGridToggle.click();
  }

  /**
   * Perform undo operation
   */
  async undo(): Promise<void> {
    await this.undoButton.click();
  }

  /**
   * Perform redo operation
   */
  async redo(): Promise<void> {
    await this.redoButton.click();
  }

  /**
   * Group selected objects
   */
  async groupSelected(): Promise<void> {
    await this.groupButton.click();
  }

  /**
   * Ungroup selected group
   */
  async ungroupSelected(): Promise<void> {
    await this.ungroupButton.click();
  }

  /**
   * Get layer item by index
   * @param index Layer index
   */
  getLayerItem(index: number): Locator {
    return this.page.getByTestId(`${CanvasEditorTestIds.LAYER_ITEM}-${index}`);
  }

  /**
   * Toggle layer visibility by index
   * @param index Layer index
   */
  async toggleLayerVisibility(index: number): Promise<void> {
    const toggle = this.page.getByTestId(`${CanvasEditorTestIds.LAYER_VISIBILITY_TOGGLE}-${index}`);
    await toggle.click();
  }

  /**
   * Toggle layer lock by index
   * @param index Layer index
   */
  async toggleLayerLock(index: number): Promise<void> {
    const toggle = this.page.getByTestId(`${CanvasEditorTestIds.LAYER_LOCK_TOGGLE}-${index}`);
    await toggle.click();
  }

  /**
   * Reorder layer (drag and drop)
   * @param fromIndex Source layer index
   * @param toIndex Target layer index
   */
  async reorderLayer(fromIndex: number, toIndex: number): Promise<void> {
    const sourceLayer = this.getLayerItem(fromIndex);
    const targetLayer = this.getLayerItem(toIndex);

    await sourceLayer.dragTo(targetLayer);
  }

  /**
   * Get canvas object count via page evaluation
   * @returns Number of objects on canvas
   */
  async getCanvasObjectCount(): Promise<number> {
    return await this.page.evaluate(() => {
      // Access Fabric.js canvas instance from window
      const canvas = (window as any).fabricCanvas;
      return canvas ? canvas.getObjects().length : 0;
    });
  }

  /**
   * Check if object is selected
   * @returns True if an object is selected
   */
  async hasSelectedObject(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return canvas && canvas.getActiveObject() !== null;
    });
  }

  /**
   * Set object width
   * @param width Width value as string
   */
  async setObjectWidth(width: string): Promise<void> {
    await this.objectWidthInput.fill(width);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Set object height
   * @param height Height value as string
   */
  async setObjectHeight(height: string): Promise<void> {
    await this.objectHeightInput.fill(height);
    await this.page.keyboard.press('Enter');
  }
}
