import { Page, Locator } from '@playwright/test';
import { IconLibraryTestIds } from '@/lib/test-ids';

/**
 * Page Object Model for Icon Library
 * Handles icon library panel interactions
 */
export class IconLibraryPage {
  readonly page: Page;

  readonly libraryPanel: Locator;
  readonly libraryToggle: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly uploadButton: Locator;
  readonly uploadDialog: Locator;
  readonly uploadFileInput: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;

    this.libraryPanel = page.getByTestId(IconLibraryTestIds.LIBRARY_PANEL);
    this.libraryToggle = page.getByTestId(IconLibraryTestIds.LIBRARY_TOGGLE);
    this.searchInput = page.getByTestId(IconLibraryTestIds.SEARCH_INPUT);
    this.categoryFilter = page.getByTestId(IconLibraryTestIds.CATEGORY_FILTER);
    this.uploadButton = page.getByTestId(IconLibraryTestIds.UPLOAD_BUTTON);
    this.uploadDialog = page.getByTestId(IconLibraryTestIds.UPLOAD_DIALOG);
    this.uploadFileInput = page.getByTestId(IconLibraryTestIds.UPLOAD_FILE_INPUT);
    this.loadingIndicator = page.getByTestId(IconLibraryTestIds.LOADING_INDICATOR);
  }

  /**
   * Open icon library
   */
  async open(): Promise<void> {
    await this.libraryToggle.click();
    await this.libraryPanel.waitFor({ state: 'visible' });
  }

  /**
   * Close icon library
   */
  async close(): Promise<void> {
    await this.libraryToggle.click();
    await this.libraryPanel.waitFor({ state: 'hidden' });
  }

  /**
   * Search for icons
   * @param query Search query
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // Debounce
  }

  /**
   * Get icon item by index
   * @param index Icon index
   */
  getIconItem(index: number): Locator {
    return this.page.getByTestId(`${IconLibraryTestIds.ICON_ITEM}-${index}`);
  }

  /**
   * Get all visible icons
   */
  getAllIcons(): Locator {
    return this.page.getByTestId(IconLibraryTestIds.ICON_ITEM);
  }

  /**
   * Upload custom asset
   * @param filePath Path to file to upload
   */
  async uploadAsset(filePath: string): Promise<void> {
    await this.uploadButton.click();
    await this.uploadDialog.waitFor({ state: 'visible' });
    await this.uploadFileInput.setInputFiles(filePath);
  }

  /**
   * Delete icon by index
   * @param index Icon index
   */
  async deleteIcon(index: number): Promise<void> {
    const deleteButton = this.page.getByTestId(`${IconLibraryTestIds.DELETE_ICON_BUTTON}-${index}`);
    await deleteButton.click();
  }

  /**
   * Wait for library to finish loading
   */
  async waitForLoadComplete(): Promise<void> {
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Check if library loaded within time limit
   * @param maxMs Maximum time in milliseconds
   * @returns True if loaded within time limit
   */
  async isLoadedWithinTime(maxMs: number): Promise<boolean> {
    const startTime = Date.now();
    try {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: maxMs });
      const loadTime = Date.now() - startTime;
      return loadTime <= maxMs;
    } catch {
      return false;
    }
  }
}
