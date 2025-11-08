import { Canvas as FabricCanvas } from 'fabric';
import * as LZString from 'lz-string';

export interface HistoryEntry {
  compressed: string;
  timestamp: number;
  objectCount?: number;
}

export interface DifferentialHistoryEntry extends HistoryEntry {
  isDiff: boolean;
  baseIndex?: number;
}

/**
 * Differential History Manager
 * Stores only changes between states instead of full canvas JSON
 * Uses compression to reduce memory footprint
 */
export class HistoryManager {
  private history: DifferentialHistoryEntry[] = [];
  private currentStep: number = -1;
  private readonly maxSize: number;
  private readonly diffThreshold: number = 0.3; // If diff is >30% of full state, store full state

  constructor(maxSize: number = 20) {
    this.maxSize = maxSize;
  }

  /**
   * Save current canvas state
   * Automatically determines whether to store full state or differential
   */
  saveState(canvas: FabricCanvas): void {
    const currentJson = JSON.stringify(canvas.toJSON());
    const objectCount = canvas.getObjects().length;

    // If this is the first entry or we're at a full state checkpoint, store full state
    const shouldStoreFullState = 
      this.history.length === 0 || 
      this.currentStep === -1 ||
      (this.currentStep + 1) % 5 === 0; // Full state every 5 steps

    if (shouldStoreFullState) {
      const compressed = LZString.compress(currentJson);
      const entry: DifferentialHistoryEntry = {
        compressed,
        timestamp: Date.now(),
        objectCount,
        isDiff: false
      };

      this.addEntry(entry);
    } else {
      // Calculate differential from previous state
      const prevEntry = this.history[this.currentStep];
      if (prevEntry && !prevEntry.isDiff) {
        const prevJson = LZString.decompress(prevEntry.compressed);
        const diff = this.calculateDiff(prevJson!, currentJson);
        const diffCompressed = LZString.compress(JSON.stringify(diff));

        // If diff is too large, store full state instead
        if (diffCompressed.length > currentJson.length * this.diffThreshold) {
          const compressed = LZString.compress(currentJson);
          const entry: DifferentialHistoryEntry = {
            compressed,
            timestamp: Date.now(),
            objectCount,
            isDiff: false
          };
          this.addEntry(entry);
        } else {
          const entry: DifferentialHistoryEntry = {
            compressed: diffCompressed,
            timestamp: Date.now(),
            objectCount,
            isDiff: true,
            baseIndex: this.currentStep
          };
          this.addEntry(entry);
        }
      } else {
        // Fallback to full state
        const compressed = LZString.compress(currentJson);
        const entry: DifferentialHistoryEntry = {
          compressed,
          timestamp: Date.now(),
          objectCount,
          isDiff: false
        };
        this.addEntry(entry);
      }
    }
  }

  /**
   * Add entry to history and manage size limits
   */
  private addEntry(entry: DifferentialHistoryEntry): void {
    // Remove any entries after current step
    this.history = this.history.slice(0, this.currentStep + 1);
    
    // Add new entry
    this.history.push(entry);
    
    // Limit history size
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(-this.maxSize);
    }
    
    this.currentStep = this.history.length - 1;
  }

  /**
   * Calculate diff between two JSON strings
   */
  private calculateDiff(prevJson: string, currentJson: string): any {
    try {
      const prev = JSON.parse(prevJson);
      const current = JSON.parse(currentJson);

      const diff: any = {
        objects: {
          added: [],
          modified: [],
          removed: []
        }
      };

      // Compare objects
      const prevObjects = prev.objects || [];
      const currentObjects = current.objects || [];

      const prevMap = new Map(prevObjects.map((obj: any, idx: number) => [obj.id || idx, obj]));
      const currentMap = new Map(currentObjects.map((obj: any, idx: number) => [obj.id || idx, obj]));

      // Find added and modified objects
      currentObjects.forEach((obj: any, idx: number) => {
        const id = obj.id || idx;
        if (!prevMap.has(id)) {
          diff.objects.added.push(obj);
        } else {
          const prevObj = prevMap.get(id);
          if (JSON.stringify(prevObj) !== JSON.stringify(obj)) {
            diff.objects.modified.push(obj);
          }
        }
      });

      // Find removed objects
      prevObjects.forEach((obj: any, idx: number) => {
        const id = obj.id || idx;
        if (!currentMap.has(id)) {
          diff.objects.removed.push(id);
        }
      });

      // Compare other properties
      if (prev.background !== current.background) {
        diff.background = current.background;
      }

      return diff;
    } catch (error) {
      console.error('Error calculating diff:', error);
      return null;
    }
  }

  /**
   * Restore state at given step
   */
  async restoreState(canvas: FabricCanvas, step: number): Promise<void> {
    if (step < 0 || step >= this.history.length) {
      throw new Error('Invalid history step');
    }

    const entry = this.history[step];
    
    if (!entry.isDiff) {
      // Full state - just decompress and load
      const json = LZString.decompress(entry.compressed);
      if (json) {
        await canvas.loadFromJSON(json);
      }
    } else {
      // Differential state - need to reconstruct from base
      const baseIndex = entry.baseIndex!;
      const baseEntry = this.history[baseIndex];
      
      if (!baseEntry || baseEntry.isDiff) {
        throw new Error('Invalid base entry for differential state');
      }

      const baseJson = LZString.decompress(baseEntry.compressed);
      const diff = JSON.parse(LZString.decompress(entry.compressed)!);
      
      if (baseJson) {
        const base = JSON.parse(baseJson);
        const reconstructed = this.applyDiff(base, diff);
        await canvas.loadFromJSON(JSON.stringify(reconstructed));
      }
    }

    this.currentStep = step;
  }

  /**
   * Apply diff to base state
   */
  private applyDiff(base: any, diff: any): any {
    const result = { ...base };

    if (diff.objects) {
      const objects = [...(base.objects || [])];
      
      // Remove objects
      if (diff.objects.removed && diff.objects.removed.length > 0) {
        const removedIds = new Set(diff.objects.removed);
        result.objects = objects.filter((obj: any, idx: number) => {
          const id = obj.id || idx;
          return !removedIds.has(id);
        });
      } else {
        result.objects = objects;
      }

      // Add objects
      if (diff.objects.added && diff.objects.added.length > 0) {
        result.objects = [...result.objects, ...diff.objects.added];
      }

      // Modify objects
      if (diff.objects.modified && diff.objects.modified.length > 0) {
        const modifiedMap = new Map(
          diff.objects.modified.map((obj: any) => [obj.id, obj])
        );
        result.objects = result.objects.map((obj: any) => {
          const id = obj.id;
          return modifiedMap.has(id) ? modifiedMap.get(id) : obj;
        });
      }
    }

    // Apply other property changes
    if (diff.background !== undefined) {
      result.background = diff.background;
    }

    return result;
  }

  /**
   * Undo to previous state
   */
  async undo(canvas: FabricCanvas): Promise<boolean> {
    if (this.currentStep <= 0) return false;
    
    await this.restoreState(canvas, this.currentStep - 1);
    return true;
  }

  /**
   * Redo to next state
   */
  async redo(canvas: FabricCanvas): Promise<boolean> {
    if (this.currentStep >= this.history.length - 1) return false;
    
    await this.restoreState(canvas, this.currentStep + 1);
    return true;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentStep > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentStep < this.history.length - 1;
  }

  /**
   * Get current history step
   */
  getCurrentStep(): number {
    return this.currentStep;
  }

  /**
   * Get history length
   */
  getHistoryLength(): number {
    return this.history.length;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.currentStep = -1;
  }

  /**
   * Get memory usage estimate (in bytes)
   */
  getMemoryUsage(): number {
    return this.history.reduce((total, entry) => {
      return total + entry.compressed.length * 2; // UTF-16 characters
    }, 0);
  }
}
