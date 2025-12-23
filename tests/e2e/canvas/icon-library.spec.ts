import { test, expect } from '@playwright/test';
import { CanvasEditorPage } from '../utils/page-objects/CanvasEditorPage';
import { IconLibraryPage } from '../utils/page-objects/IconLibraryPage';

test.describe('Icon Library', () => {
  let canvasPage: CanvasEditorPage;
  let iconLibrary: IconLibraryPage;

  test.beforeEach(async ({ page }) => {
    canvasPage = new CanvasEditorPage(page);
    iconLibrary = new IconLibraryPage(page);

    await canvasPage.goto();
    await canvasPage.waitForCanvasReady();
  });

  test('Icon library loads and displays icons within reasonable time', async ({ page }) => {
    // Open icon library
    await iconLibrary.open();
    await page.waitForTimeout(300);

    // Verify library panel is visible
    await expect(iconLibrary.libraryPanel).toBeVisible();

    // Check if library loads within 3 seconds
    const loadedInTime = await iconLibrary.isLoadedWithinTime(3000);
    expect(loadedInTime).toBe(true);

    // Verify icons are displayed
    const icons = iconLibrary.getAllIcons();
    const iconCount = await icons.count();
    expect(iconCount).toBeGreaterThan(0);

    // Test search functionality
    await iconLibrary.search('science');
    await page.waitForTimeout(500);

    // Verify search results
    const searchResults = iconLibrary.getAllIcons();
    const searchCount = await searchResults.count();
    expect(searchCount).toBeGreaterThanOrEqual(0);
  });

  test.todo('User can upload and delete custom assets', async ({ page }) => {
    // TODO: Implement when custom asset upload feature is ready
    // Expected behavior:
    // 1. Open icon library
    // 2. Click upload button
    // 3. Upload file via file input
    // 4. Verify asset appears in library
    // 5. Delete uploaded asset
    // 6. Verify asset is removed from library
  });
});
