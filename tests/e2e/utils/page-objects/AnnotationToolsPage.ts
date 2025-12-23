import { Page, Locator } from '@playwright/test';
import { AnnotationTestIds } from '@/lib/test-ids';

/**
 * Page Object Model for Annotation Tools
 * Handles numbered callouts, leader lines, and legend generation
 */
export class AnnotationToolsPage {
  readonly page: Page;

  readonly calloutTool: Locator;
  readonly leaderLineTool: Locator;
  readonly presetArrowText: Locator;
  readonly presetBracketLabel: Locator;
  readonly legendGeneratorButton: Locator;
  readonly legendOutput: Locator;

  constructor(page: Page) {
    this.page = page;

    this.calloutTool = page.getByTestId(AnnotationTestIds.CALLOUT_TOOL);
    this.leaderLineTool = page.getByTestId(AnnotationTestIds.LEADER_LINE_TOOL);
    this.presetArrowText = page.getByTestId(AnnotationTestIds.PRESET_ARROW_TEXT);
    this.presetBracketLabel = page.getByTestId(AnnotationTestIds.PRESET_BRACKET_LABEL);
    this.legendGeneratorButton = page.getByTestId(AnnotationTestIds.LEGEND_GENERATOR_BUTTON);
    this.legendOutput = page.getByTestId(AnnotationTestIds.LEGEND_OUTPUT);
  }

  /**
   * Add numbered callout to canvas
   * @param x X coordinate relative to canvas
   * @param y Y coordinate relative to canvas
   */
  async addCallout(x: number, y: number): Promise<void> {
    await this.calloutTool.click();

    const canvas = this.page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await this.page.mouse.click(box.x + x, box.y + y);
  }

  /**
   * Get callout number element
   * @param index Callout index
   */
  getCalloutNumber(index: number): Locator {
    return this.page.getByTestId(`${AnnotationTestIds.CALLOUT_NUMBER}-${index}`);
  }

  /**
   * Create leader line
   * @param startX Start x coordinate
   * @param startY Start y coordinate
   * @param endX End x coordinate
   * @param endY End y coordinate
   * @param text Text label for leader line
   */
  async createLeaderLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    text: string
  ): Promise<void> {
    await this.leaderLineTool.click();

    const canvas = this.page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw line
    await this.page.mouse.move(box.x + startX, box.y + startY);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + endX, box.y + endY);
    await this.page.mouse.up();

    // Add text if dialog appears
    const textInput = this.page.getByTestId(AnnotationTestIds.LEADER_LINE_TEXT);
    if (await textInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await textInput.fill(text);
      await this.page.keyboard.press('Enter');
    }
  }

  /**
   * Apply annotation preset
   * @param preset Preset type ('arrow-text' | 'bracket-label')
   */
  async applyPreset(preset: 'arrow-text' | 'bracket-label'): Promise<void> {
    if (preset === 'arrow-text') {
      await this.presetArrowText.click();
    } else {
      await this.presetBracketLabel.click();
    }
  }

  /**
   * Generate legend
   */
  async generateLegend(): Promise<void> {
    await this.legendGeneratorButton.click();
  }

  /**
   * Get legend output text
   * @returns Legend text content
   */
  async getLegendText(): Promise<string | null> {
    return await this.legendOutput.textContent();
  }

  /**
   * Count callouts on canvas
   * @returns Number of callouts
   */
  async getCalloutCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      if (!canvas) return 0;

      const objects = canvas.getObjects();
      return objects.filter((obj: any) => obj.type === 'callout').length;
    });
  }
}
