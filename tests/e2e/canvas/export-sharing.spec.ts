import { test, expect } from '@playwright/test';
import { CanvasEditorPage } from '../utils/page-objects/CanvasEditorPage';
import { ExportDialogPage } from '../utils/page-objects/ExportDialogPage';
import { ShareDialogPage } from '../utils/page-objects/ShareDialogPage';
import { waitForAutosave } from '../utils/canvas-helpers';

test.describe('Export and Sharing', () => {
  let canvasPage: CanvasEditorPage;
  let exportDialog: ExportDialogPage;
  let shareDialog: ShareDialogPage;

  test.beforeEach(async ({ page }) => {
    canvasPage = new CanvasEditorPage(page);
    exportDialog = new ExportDialogPage(page);
    shareDialog = new ShareDialogPage(page);

    await canvasPage.goto();
    await canvasPage.waitForCanvasReady();

    // Create some content for export
    await canvasPage.createRectangle(100, 100, 150, 100);
    await page.waitForTimeout(500);
  });

  test('User can export canvas as PNG, JPEG, and SVG formats', async ({ page }) => {
    // Open export dialog
    await exportDialog.open();

    // Test PNG export
    await exportDialog.selectFormat('PNG');
    await page.waitForTimeout(300);

    const pngDownload = await exportDialog.export();
    expect(pngDownload).toBeTruthy();

    const pngFilename = pngDownload.suggestedFilename();
    expect(pngFilename).toMatch(/\.png$/i);

    // Close dialog and reopen for next format
    await page.waitForTimeout(500);
    await exportDialog.open();

    // Test JPEG export
    await exportDialog.selectFormat('JPEG');
    await page.waitForTimeout(300);

    const jpegDownload = await exportDialog.export();
    expect(jpegDownload).toBeTruthy();

    const jpegFilename = jpegDownload.suggestedFilename();
    expect(jpegFilename).toMatch(/\.jpe?g$/i);

    // Close dialog and reopen for next format
    await page.waitForTimeout(500);
    await exportDialog.open();

    // Test SVG export
    await exportDialog.selectFormat('SVG');
    await page.waitForTimeout(300);

    const svgDownload = await exportDialog.export();
    expect(svgDownload).toBeTruthy();

    const svgFilename = svgDownload.suggestedFilename();
    expect(svgFilename).toMatch(/\.svg$/i);
  });

  test('User can select export DPI options (150, 300, 600)', async ({ page }) => {
    // Open export dialog
    await exportDialog.open();

    // Select PNG format
    await exportDialog.selectFormat('PNG');
    await page.waitForTimeout(300);

    // Test 150 DPI
    await exportDialog.selectDPI(150);
    await page.waitForTimeout(300);

    let download = await exportDialog.export();
    let fileSize150 = await download.path().then(path => {
      if (!path) return 0;
      const fs = require('fs');
      return fs.statSync(path).size;
    });

    expect(fileSize150).toBeGreaterThan(0);

    // Reopen for 300 DPI
    await page.waitForTimeout(500);
    await exportDialog.open();
    await exportDialog.selectFormat('PNG');
    await exportDialog.selectDPI(300);
    await page.waitForTimeout(300);

    download = await exportDialog.export();
    let fileSize300 = await download.path().then(path => {
      if (!path) return 0;
      const fs = require('fs');
      return fs.statSync(path).size;
    });

    // 300 DPI should be larger than 150 DPI
    expect(fileSize300).toBeGreaterThan(fileSize150);

    // Reopen for 600 DPI
    await page.waitForTimeout(500);
    await exportDialog.open();
    await exportDialog.selectFormat('PNG');
    await exportDialog.selectDPI(600);
    await page.waitForTimeout(300);

    download = await exportDialog.export();
    let fileSize600 = await download.path().then(path => {
      if (!path) return 0;
      const fs = require('fs');
      return fs.statSync(path).size;
    });

    // 600 DPI should be larger than 300 DPI
    expect(fileSize600).toBeGreaterThan(fileSize300);
  });

  test('JPEG quality slider affects output file size', async ({ page }) => {
    // Open export dialog
    await exportDialog.open();

    // Select JPEG format
    await exportDialog.selectFormat('JPEG');
    await page.waitForTimeout(300);

    // Set quality to 50%
    await exportDialog.setQuality(50);
    await page.waitForTimeout(300);

    const quality50 = await exportDialog.getQuality();
    expect(quality50).toBe(50);

    const download50 = await exportDialog.export();
    const fileSize50 = await download50.path().then(path => {
      if (!path) return 0;
      const fs = require('fs');
      return fs.statSync(path).size;
    });

    expect(fileSize50).toBeGreaterThan(0);

    // Reopen and test with 100% quality
    await page.waitForTimeout(500);
    await exportDialog.open();
    await exportDialog.selectFormat('JPEG');
    await exportDialog.setQuality(100);
    await page.waitForTimeout(300);

    const quality100 = await exportDialog.getQuality();
    expect(quality100).toBe(100);

    const download100 = await exportDialog.export();
    const fileSize100 = await download100.path().then(path => {
      if (!path) return 0;
      const fs = require('fs');
      return fs.statSync(path).size;
    });

    // 100% quality should produce larger file than 50% quality
    expect(fileSize100).toBeGreaterThan(fileSize50);
  });

  test('User can share project via URL and shared URL loads correctly', async ({ page }) => {
    // Wait for project to save
    await waitForAutosave(page, 5000);

    // Get project ID from URL
    const url = page.url();
    const projectIdMatch = url.match(/\/canvas\/([a-f0-9-]+)/);
    expect(projectIdMatch).not.toBeNull();

    // Open share dialog
    await shareDialog.open();
    await page.waitForTimeout(500);

    // Verify share URL is displayed
    const shareUrl = await shareDialog.getShareUrl();
    expect(shareUrl).toBeTruthy();
    expect(shareUrl).toContain(projectIdMatch![1]);

    // Toggle public visibility
    await shareDialog.togglePublic();
    await page.waitForTimeout(500);

    // Copy link to clipboard
    await shareDialog.copyLink();
    await page.waitForTimeout(500);

    // Get clipboard content
    const clipboardUrl = await shareDialog.getClipboardUrl();
    expect(clipboardUrl).toBe(shareUrl);

    // Open shared URL in new context (simulating different user)
    const newContext = await page.context().browser()?.newContext();
    if (!newContext) throw new Error('Could not create new context');

    const newPage = await newContext.newPage();
    await newPage.goto(clipboardUrl);
    await page.waitForTimeout(1000);

    // Verify shared project loads
    const sharedCanvas = new CanvasEditorPage(newPage);
    await sharedCanvas.waitForCanvasReady();

    // Verify object exists in shared view
    const objectCount = await sharedCanvas.getCanvasObjectCount();
    expect(objectCount).toBe(1);

    // Clean up
    await newContext.close();
  });

  test.todo('Shared project displays in read-only mode for non-owners', async ({ page }) => {
    // TODO: Implement when read-only mode is implemented
    // Expected behavior:
    // 1. Create and share project
    // 2. Open shared URL as different user
    // 3. Verify editing tools are disabled
    // 4. Verify project can be viewed but not modified
  });

  test.todo('User can export high-resolution image for print', async ({ page }) => {
    // TODO: Implement when high-resolution export feature is ready
    // Expected behavior:
    // 1. Open export dialog
    // 2. Select high DPI (e.g., 600)
    // 3. Verify export dimensions meet print quality standards
    // 4. Verify exported image has correct DPI metadata
  });
});
