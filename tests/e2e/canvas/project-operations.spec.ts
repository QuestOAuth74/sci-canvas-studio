import { test, expect } from '@playwright/test';
import { CanvasEditorPage } from '../utils/page-objects/CanvasEditorPage';
import { waitForAutosave } from '../utils/canvas-helpers';
import { generateProjectData } from '../fixtures/project-data';

test.describe('Project Operations', () => {
  let canvasPage: CanvasEditorPage;

  test.beforeEach(async ({ page }) => {
    canvasPage = new CanvasEditorPage(page);
  });

  test('User can create and save a new project', async ({ page }) => {
    // Navigate to canvas without project ID (new project)
    await canvasPage.goto();
    await canvasPage.waitForCanvasReady();

    // Create some content
    await canvasPage.createRectangle(100, 100, 150, 100);
    await page.waitForTimeout(500);

    // Verify object was created
    const objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(1);

    // Wait for autosave
    const saved = await waitForAutosave(page, 5000);
    expect(saved).toBe(true);

    // Verify URL contains project ID after save
    const url = page.url();
    expect(url).toMatch(/\/canvas\/[a-f0-9-]+/);
  });

  test('User can open and edit existing project', async ({ page }) => {
    // Create a new project first
    await canvasPage.goto();
    await canvasPage.waitForCanvasReady();

    await canvasPage.createRectangle(50, 50, 100, 100);
    await page.waitForTimeout(500);

    // Wait for autosave and get project ID
    await waitForAutosave(page, 5000);
    const url = page.url();
    const projectIdMatch = url.match(/\/canvas\/([a-f0-9-]+)/);
    expect(projectIdMatch).not.toBeNull();

    const projectId = projectIdMatch![1];

    // Navigate away and back to the project
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    await canvasPage.goto(projectId);
    await canvasPage.waitForCanvasReady();

    // Verify object still exists
    let objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(1);

    // Add another object
    await canvasPage.createCircle(200, 200, 50);
    await page.waitForTimeout(500);

    objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(2);

    // Wait for autosave
    const saved = await waitForAutosave(page, 5000);
    expect(saved).toBe(true);
  });

  test('User can delete a project', async ({ page }) => {
    // Create a new project
    await canvasPage.goto();
    await canvasPage.waitForCanvasReady();

    await canvasPage.createRectangle(100, 100, 100, 100);
    await page.waitForTimeout(500);

    // Wait for autosave
    await waitForAutosave(page, 5000);

    const url = page.url();
    const projectIdMatch = url.match(/\/canvas\/([a-f0-9-]+)/);
    expect(projectIdMatch).not.toBeNull();

    const projectId = projectIdMatch![1];

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Find and delete the project
    const deleteButton = page.getByTestId(`delete-project-${projectId}`);
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = page.getByRole('button', { name: /delete|confirm/i });
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
      await page.waitForTimeout(500);
    }

    // Verify project is deleted
    const projectCard = page.getByTestId(`project-card-${projectId}`);
    await expect(projectCard).not.toBeVisible();
  });

  test('Changes auto-save to database', async ({ page }) => {
    // Create new project
    await canvasPage.goto();
    await canvasPage.waitForCanvasReady();

    // Create initial object
    await canvasPage.createRectangle(50, 50, 80, 80);
    await page.waitForTimeout(500);

    // Wait for first autosave
    let saved = await waitForAutosave(page, 5000);
    expect(saved).toBe(true);

    // Make another change
    await canvasPage.createCircle(200, 200, 40);
    await page.waitForTimeout(500);

    // Wait for second autosave
    saved = await waitForAutosave(page, 5000);
    expect(saved).toBe(true);

    // Get project ID
    const url = page.url();
    const projectIdMatch = url.match(/\/canvas\/([a-f0-9-]+)/);
    expect(projectIdMatch).not.toBeNull();

    const projectId = projectIdMatch![1];

    // Reload page
    await page.reload();
    await canvasPage.waitForCanvasReady();

    // Verify both objects persisted
    const objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(2);
  });

  test('User can view and rollback to previous version', async ({ page }) => {
    // Create new project
    await canvasPage.goto();
    await canvasPage.waitForCanvasReady();

    // Create version 1: single rectangle
    await canvasPage.createRectangle(50, 50, 100, 100);
    await page.waitForTimeout(500);
    await waitForAutosave(page, 5000);

    let objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(1);

    // Create version 2: add circle
    await canvasPage.createCircle(200, 200, 50);
    await page.waitForTimeout(500);
    await waitForAutosave(page, 5000);

    objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(2);

    // Open version history
    const versionHistoryButton = page.getByTestId('version-history-button');
    await versionHistoryButton.click();
    await page.waitForTimeout(500);

    // Verify version history panel is visible
    const versionHistoryPanel = page.getByTestId('version-history-panel');
    await expect(versionHistoryPanel).toBeVisible();

    // Get all version items
    const versionItems = page.getByTestId('version-item');
    const versionCount = await versionItems.count();
    expect(versionCount).toBeGreaterThanOrEqual(2);

    // Select first version (oldest)
    const firstVersion = versionItems.first();
    await firstVersion.click();
    await page.waitForTimeout(500);

    // Verify preview shows only 1 object
    const previewObjectCount = await page.evaluate(() => {
      const previewCanvas = (window as any).previewCanvas;
      return previewCanvas ? previewCanvas.getObjects().length : 0;
    });
    expect(previewObjectCount).toBe(1);

    // Rollback to first version
    const rollbackButton = page.getByTestId('rollback-button');
    await rollbackButton.click();
    await page.waitForTimeout(500);

    // Confirm rollback
    const confirmRollbackButton = page.getByRole('button', { name: /confirm|rollback/i });
    if (await confirmRollbackButton.isVisible().catch(() => false)) {
      await confirmRollbackButton.click();
      await page.waitForTimeout(500);
    }

    // Wait for canvas to update
    await page.waitForTimeout(1000);

    // Verify canvas now has only 1 object
    objectCount = await canvasPage.getCanvasObjectCount();
    expect(objectCount).toBe(1);
  });

  test.todo('Project thumbnail generates correctly', async ({ page }) => {
    // TODO: Implement when thumbnail generation feature is ready
    // Expected behavior:
    // 1. Create project with content
    // 2. Wait for autosave
    // 3. Navigate to dashboard
    // 4. Verify project card shows thumbnail
    // 5. Verify thumbnail matches canvas content
  });

  test.todo('Project metadata (keywords, citations) saves and displays', async ({ page }) => {
    // TODO: Implement when metadata feature is ready
    // Expected behavior:
    // 1. Create project
    // 2. Open project settings
    // 3. Add keywords and citations
    // 4. Save metadata
    // 5. Reload project
    // 6. Verify metadata persisted
  });

  test.todo('Project search finds projects by keywords', async ({ page }) => {
    // TODO: Implement when project search feature is ready
    // Expected behavior:
    // 1. Create project with specific keywords
    // 2. Navigate to dashboard
    // 3. Use search to find project by keyword
    // 4. Verify project appears in search results
  });

  test.todo('Project duplication creates independent copy', async ({ page }) => {
    // TODO: Implement when project duplication feature is ready
    // Expected behavior:
    // 1. Create project with content
    // 2. Duplicate project
    // 3. Verify duplicate has same content
    // 4. Modify duplicate
    // 5. Verify original unchanged
  });
});
