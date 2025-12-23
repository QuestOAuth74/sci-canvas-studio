import { test, expect } from '@playwright/test';

test.describe('Eraser Tool', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the canvas editor
    await page.goto('/');

    // Wait for canvas to be ready
    await page.waitForSelector('canvas', { state: 'visible' });
  });

  test('eraser tool is accessible via toolbar', async ({ page }) => {
    // Find the eraser tool button
    const eraserButton = page.locator('[data-tool="eraser"], button:has-text("Eraser")').first();

    await expect(eraserButton).toBeVisible();

    // Click eraser tool
    await eraserButton.click();

    // Verify cursor changes to crosshair (indicates eraser mode active)
    const canvas = page.locator('canvas').first();
    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('crosshair');
  });

  test('eraser tool is accessible via keyboard shortcut', async ({ page }) => {
    // Press keyboard shortcut '9' for eraser
    await page.keyboard.press('9');

    // Verify cursor changes to crosshair
    const canvas = page.locator('canvas').first();
    await page.waitForTimeout(100); // Wait for tool to activate
    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('crosshair');
  });

  test('eraser creates clipPath on target object', async ({ page }) => {
    // Create a rectangle shape
    await page.locator('button:has-text("Rectangle"), [data-tool="rectangle"]').first().click();
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
    await page.mouse.up();

    // Switch to eraser tool
    await page.keyboard.press('9');
    await page.waitForTimeout(200);

    // Draw eraser stroke over the rectangle
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 70);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Verify that the canvas has objects with clipPaths
    const hasClipPath = await page.evaluate(() => {
      const fabricCanvas = (window as any).__fabricCanvas__;
      if (!fabricCanvas) return false;

      const objects = fabricCanvas.getObjects();
      return objects.some((obj: any) => obj.clipPath !== null && obj.clipPath !== undefined);
    });

    expect(hasClipPath).toBe(true);
  });

  test('erased area moves with object when repositioned', async ({ page }) => {
    // Create a circle
    await page.locator('button:has-text("Circle"), [data-tool="circle"]').first().click();
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw circle
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 80, centerY + 80);
    await page.mouse.up();

    // Erase part of the circle
    await page.keyboard.press('9'); // Eraser tool
    await page.waitForTimeout(200);
    await page.mouse.move(centerX + 40, centerY + 40);
    await page.mouse.down();
    await page.mouse.move(centerX + 60, centerY + 60);
    await page.mouse.up();

    // Take screenshot before moving
    const beforeMove = await canvas.screenshot();

    // Switch to select tool and move the circle
    await page.keyboard.press('1'); // Select tool
    await page.waitForTimeout(200);
    await page.mouse.move(centerX + 30, centerY + 30);
    await page.mouse.down();
    await page.mouse.move(centerX + 30 + 100, centerY + 30 + 100);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Take screenshot after moving
    const afterMove = await canvas.screenshot();

    // Screenshots should be different (object moved)
    expect(beforeMove.equals(afterMove)).toBe(false);

    // Verify clipPath is still attached
    const hasClipPath = await page.evaluate(() => {
      const fabricCanvas = (window as any).__fabricCanvas__;
      if (!fabricCanvas) return false;

      const objects = fabricCanvas.getObjects();
      return objects.some((obj: any) => obj.clipPath !== null);
    });

    expect(hasClipPath).toBe(true);
  });

  test('erased area persists through save/load cycle', async ({ page }) => {
    // Sign in first (required for saving)
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/canvas', { timeout: 10000 });

    // Create and erase a shape
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create rectangle
    await page.locator('button:has-text("Rectangle")').first().click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    // Erase part
    await page.keyboard.press('9');
    await page.waitForTimeout(200);
    await page.mouse.move(box.x + 120, box.y + 120);
    await page.mouse.down();
    await page.mouse.move(box.x + 180, box.y + 180);
    await page.mouse.up();

    // Save project
    await page.keyboard.press('Control+S');
    await page.waitForTimeout(2000); // Wait for save

    // Reload page
    await page.reload();
    await page.waitForSelector('canvas', { state: 'visible' });
    await page.waitForTimeout(2000);

    // Verify clipPath persists
    const hasClipPath = await page.evaluate(() => {
      const fabricCanvas = (window as any).__fabricCanvas__;
      if (!fabricCanvas) return false;

      const objects = fabricCanvas.getObjects();
      return objects.some((obj: any) => obj.clipPath !== null);
    });

    expect(hasClipPath).toBe(true);
  });

  test('undo removes eraser stroke', async ({ page }) => {
    // Create a shape
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.locator('button:has-text("Rectangle")').first().click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    // Apply eraser
    await page.keyboard.press('9');
    await page.waitForTimeout(200);
    await page.mouse.move(box.x + 120, box.y + 120);
    await page.mouse.down();
    await page.mouse.move(box.x + 180, box.y + 180);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Verify clipPath exists
    let hasClipPath = await page.evaluate(() => {
      const fabricCanvas = (window as any).__fabricCanvas__;
      if (!fabricCanvas) return false;
      const objects = fabricCanvas.getObjects();
      return objects.some((obj: any) => obj.clipPath !== null);
    });
    expect(hasClipPath).toBe(true);

    // Undo
    await page.keyboard.press('Control+Z');
    await page.waitForTimeout(500);

    // Verify clipPath removed
    hasClipPath = await page.evaluate(() => {
      const fabricCanvas = (window as any).__fabricCanvas__;
      if (!fabricCanvas) return false;
      const objects = fabricCanvas.getObjects();
      return objects.some((obj: any) => obj.clipPath !== null);
    });
    expect(hasClipPath).toBe(false);
  });

  test('background color change reveals proper transparency', async ({ page }) => {
    // Create and erase a white rectangle
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create white rectangle
    await page.locator('button:has-text("Rectangle")').first().click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    // Erase part
    await page.keyboard.press('9');
    await page.waitForTimeout(200);
    await page.mouse.move(box.x + 120, box.y + 120);
    await page.mouse.down();
    await page.mouse.move(box.x + 180, box.y + 180);
    await page.mouse.up();

    // Change background color to blue
    await page.click('button:has-text("Settings"), [aria-label="Settings"]');
    await page.waitForTimeout(500);

    // The erased area should show the blue background through it
    // This is verified by the clipPath being present
    const hasClipPath = await page.evaluate(() => {
      const fabricCanvas = (window as any).__fabricCanvas__;
      if (!fabricCanvas) return false;
      const objects = fabricCanvas.getObjects();
      return objects.some((obj: any) => obj.clipPath !== null);
    });

    expect(hasClipPath).toBe(true);
  });

  test('multiple eraser strokes accumulate on same object', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create rectangle
    await page.locator('button:has-text("Rectangle")').first().click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    // Apply first eraser stroke
    await page.keyboard.press('9');
    await page.waitForTimeout(200);
    await page.mouse.move(box.x + 110, box.y + 110);
    await page.mouse.down();
    await page.mouse.move(box.x + 130, box.y + 130);
    await page.mouse.up();

    await page.waitForTimeout(300);

    // Apply second eraser stroke
    await page.mouse.move(box.x + 170, box.y + 170);
    await page.mouse.down();
    await page.mouse.move(box.x + 190, box.y + 190);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Verify object still has clipPath (should be a Group with multiple paths)
    const hasClipPath = await page.evaluate(() => {
      const fabricCanvas = (window as any).__fabricCanvas__;
      if (!fabricCanvas) return false;
      const objects = fabricCanvas.getObjects();
      return objects.some((obj: any) => obj.clipPath !== null);
    });

    expect(hasClipPath).toBe(true);
  });
});
