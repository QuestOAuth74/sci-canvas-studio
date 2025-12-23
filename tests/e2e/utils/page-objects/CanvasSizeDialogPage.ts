import { Page, Locator } from '@playwright/test';
import { CanvasSizeTestIds } from '@/lib/test-ids';

/**
 * Page Object Model for Canvas Size Dialog
 * Handles custom canvas dimension configuration
 */
export class CanvasSizeDialogPage {
  readonly page: Page;

  readonly dialog: Locator;
  readonly dialogTrigger: Locator;
  readonly widthInput: Locator;
  readonly heightInput: Locator;
  readonly unitSelect: Locator;
  readonly applyButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.dialog = page.getByTestId(CanvasSizeTestIds.SIZE_DIALOG);
    this.dialogTrigger = page.getByTestId(CanvasSizeTestIds.SIZE_DIALOG_TRIGGER);
    this.widthInput = page.getByTestId(CanvasSizeTestIds.WIDTH_INPUT);
    this.heightInput = page.getByTestId(CanvasSizeTestIds.HEIGHT_INPUT);
    this.unitSelect = page.getByTestId(CanvasSizeTestIds.UNIT_SELECT);
    this.applyButton = page.getByTestId(CanvasSizeTestIds.APPLY_BUTTON);
    this.cancelButton = page.getByTestId(CanvasSizeTestIds.CANCEL_BUTTON);
  }

  /**
   * Open canvas size dialog
   */
  async open(): Promise<void> {
    await this.dialogTrigger.click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  /**
   * Set canvas dimensions
   * @param width Width value
   * @param height Height value
   * @param unit Optional unit ('inches' | 'cm' | 'px')
   */
  async setDimensions(width: string, height: string, unit?: 'inches' | 'cm' | 'px'): Promise<void> {
    await this.widthInput.fill(width);
    await this.heightInput.fill(height);

    if (unit) {
      await this.selectUnit(unit);
    }
  }

  /**
   * Select dimension unit
   * @param unit Unit type ('inches' | 'cm' | 'px')
   */
  async selectUnit(unit: 'inches' | 'cm' | 'px'): Promise<void> {
    await this.unitSelect.click();
    const unitTestId =
      unit === 'inches'
        ? CanvasSizeTestIds.UNIT_INCHES
        : unit === 'cm'
        ? CanvasSizeTestIds.UNIT_CM
        : CanvasSizeTestIds.UNIT_PX;
    await this.page.getByTestId(unitTestId).click();
  }

  /**
   * Apply canvas size changes
   */
  async apply(): Promise<void> {
    await this.applyButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  /**
   * Cancel canvas size changes
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  /**
   * Get current canvas dimensions from page
   * @returns Canvas dimensions {width, height}
   */
  async getCanvasDimensions(): Promise<{ width: number; height: number }> {
    return await this.page.evaluate(() => {
      const canvas = (window as any).fabricCanvas;
      return {
        width: canvas.width,
        height: canvas.height,
      };
    });
  }
}
