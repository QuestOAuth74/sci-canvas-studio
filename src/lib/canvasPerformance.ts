import { Canvas, FabricObject } from "fabric";
import { ObjectCullingManager, createThrottledCuller } from "./objectCulling";
import { calculateObjectComplexity, applyComplexityOptimizations } from "./objectComplexity";

export interface PerformanceConfig {
  enableCulling: boolean;
  enableBatchMode: boolean;
  enableInteractionOptimization: boolean;
  cullingMargin: number;
  throttleDelay: number;
  objectCountThreshold: number;  // Auto-enable optimizations above this count
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableCulling: true,
  enableBatchMode: true,
  enableInteractionOptimization: true,
  cullingMargin: 100,
  throttleDelay: 100,
  objectCountThreshold: 50,
};

/**
 * Canvas Performance Manager
 * Centralizes all performance optimizations for Fabric.js canvas
 */
export class CanvasPerformanceManager {
  private canvas: Canvas | null = null;
  private config: PerformanceConfig;
  private cullingManager: ObjectCullingManager;
  private throttledCull: (() => void) | null = null;
  private isInteracting: boolean = false;
  private originalRenderOnAddRemove: boolean = true;
  private interactionQualityApplied: boolean = false;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cullingManager = new ObjectCullingManager();
  }

  /**
   * Initialize the performance manager with a canvas
   */
  initialize(canvas: Canvas): void {
    this.canvas = canvas;
    this.cullingManager.setCanvas(canvas);
    this.cullingManager.setMargin(this.config.cullingMargin);
    this.throttledCull = createThrottledCuller(this.cullingManager, this.config.throttleDelay);

    // Enable Fabric's built-in optimizations
    canvas.skipOffscreen = true;

    // Setup event listeners for interaction optimization
    if (this.config.enableInteractionOptimization) {
      this.setupInteractionListeners();
    }
  }

  /**
   * Setup listeners for pan/zoom/drag interactions
   */
  private setupInteractionListeners(): void {
    if (!this.canvas) return;

    // Mouse wheel (zoom)
    this.canvas.on("mouse:wheel", () => {
      this.onInteractionStart();
      // Debounce end of interaction
      this.scheduleInteractionEnd(150);
    });

    // Object dragging
    this.canvas.on("object:moving", () => {
      if (!this.isInteracting) {
        this.onInteractionStart();
      }
    });

    this.canvas.on("object:scaling", () => {
      if (!this.isInteracting) {
        this.onInteractionStart();
      }
    });

    this.canvas.on("object:rotating", () => {
      if (!this.isInteracting) {
        this.onInteractionStart();
      }
    });

    // End of object manipulation
    this.canvas.on("object:modified", () => {
      this.onInteractionEnd();
    });

    // Mouse up as fallback
    this.canvas.on("mouse:up", () => {
      if (this.isInteracting) {
        this.scheduleInteractionEnd(50);
      }
    });
  }

  private interactionEndTimeout: ReturnType<typeof setTimeout> | null = null;

  private scheduleInteractionEnd(delay: number): void {
    if (this.interactionEndTimeout) {
      clearTimeout(this.interactionEndTimeout);
    }
    this.interactionEndTimeout = setTimeout(() => {
      this.onInteractionEnd();
      this.interactionEndTimeout = null;
    }, delay);
  }

  /**
   * Called when user starts interacting (dragging, scaling, panning)
   */
  private onInteractionStart(): void {
    if (!this.canvas || this.isInteracting) return;
    this.isInteracting = true;

    // Apply lower quality rendering during interaction
    if (this.shouldOptimize()) {
      this.applyInteractionQuality();
    }
  }

  /**
   * Called when interaction ends
   */
  private onInteractionEnd(): void {
    if (!this.canvas || !this.isInteracting) return;
    this.isInteracting = false;

    // Restore full quality
    if (this.interactionQualityApplied) {
      this.restoreFullQuality();
    }

    // Apply culling after viewport change
    if (this.config.enableCulling && this.throttledCull) {
      this.throttledCull();
    }
  }

  /**
   * Check if optimizations should be applied based on object count
   */
  private shouldOptimize(): boolean {
    if (!this.canvas) return false;
    return this.canvas.getObjects().length >= this.config.objectCountThreshold;
  }

  /**
   * Apply lower quality settings during interaction
   */
  private applyInteractionQuality(): void {
    if (!this.canvas) return;

    this.interactionQualityApplied = true;

    // Reduce image smoothing
    const ctx = this.canvas.getContext();
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }

    // Hide controls on non-selected objects temporarily
    const activeObject = this.canvas.getActiveObject();
    this.canvas.getObjects().forEach((obj) => {
      if (obj !== activeObject) {
        (obj as any)._interactionHasControls = obj.hasControls;
        (obj as any)._interactionHasBorders = obj.hasBorders;
        obj.hasControls = false;
        obj.hasBorders = false;
      }
    });
  }

  /**
   * Restore full quality after interaction
   */
  private restoreFullQuality(): void {
    if (!this.canvas) return;

    this.interactionQualityApplied = false;

    // Restore image smoothing
    const ctx = this.canvas.getContext();
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
    }

    // Restore controls
    this.canvas.getObjects().forEach((obj) => {
      if ((obj as any)._interactionHasControls !== undefined) {
        obj.hasControls = (obj as any)._interactionHasControls;
        obj.hasBorders = (obj as any)._interactionHasBorders;
        delete (obj as any)._interactionHasControls;
        delete (obj as any)._interactionHasBorders;
      }
    });

    this.canvas.requestRenderAll();
  }

  /**
   * Start batch mode - disables render on add/remove for bulk operations
   */
  startBatchMode(): void {
    if (!this.canvas || !this.config.enableBatchMode) return;
    this.originalRenderOnAddRemove = this.canvas.renderOnAddRemove;
    this.canvas.renderOnAddRemove = false;
  }

  /**
   * End batch mode - re-enables render and does a single render
   */
  endBatchMode(): void {
    if (!this.canvas) return;
    this.canvas.renderOnAddRemove = this.originalRenderOnAddRemove;
    this.canvas.requestRenderAll();
  }

  /**
   * Execute a function in batch mode
   */
  batch<T>(fn: () => T): T {
    this.startBatchMode();
    try {
      const result = fn();
      return result;
    } finally {
      this.endBatchMode();
    }
  }

  /**
   * Add multiple objects efficiently
   */
  addObjectsBatch(objects: FabricObject[]): void {
    if (!this.canvas) return;

    this.batch(() => {
      objects.forEach((obj) => {
        // Enable caching for each object
        obj.set({ objectCaching: true });

        // Apply complexity-based optimizations
        const metrics = calculateObjectComplexity(obj);
        applyComplexityOptimizations(obj, metrics);

        this.canvas!.add(obj);
      });
    });
  }

  /**
   * Remove multiple objects efficiently
   */
  removeObjectsBatch(objects: FabricObject[]): void {
    if (!this.canvas) return;

    this.batch(() => {
      objects.forEach((obj) => {
        this.canvas!.remove(obj);
      });
    });
  }

  /**
   * Trigger viewport culling
   */
  cullViewport(): void {
    if (this.config.enableCulling) {
      this.cullingManager.cullObjects();
    }
  }

  /**
   * Restore all culled objects (call before export/save)
   */
  restoreAllObjects(): void {
    this.cullingManager.showAllObjects();
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    objectCount: number;
    visibleCount: number;
    culledCount: number;
    isInteracting: boolean;
    optimizationsActive: boolean;
  } {
    const cullingStats = this.cullingManager.getStats();
    return {
      objectCount: cullingStats.total,
      visibleCount: cullingStats.visible,
      culledCount: cullingStats.culled,
      isInteracting: this.isInteracting,
      optimizationsActive: this.shouldOptimize(),
    };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    this.cullingManager.setEnabled(this.config.enableCulling);
    this.cullingManager.setMargin(this.config.cullingMargin);
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.interactionEndTimeout) {
      clearTimeout(this.interactionEndTimeout);
    }
    this.canvas = null;
  }
}

// Singleton instance for easy access
let performanceManager: CanvasPerformanceManager | null = null;

export function getPerformanceManager(): CanvasPerformanceManager {
  if (!performanceManager) {
    performanceManager = new CanvasPerformanceManager();
  }
  return performanceManager;
}

export function initializePerformanceManager(
  canvas: Canvas,
  config?: Partial<PerformanceConfig>
): CanvasPerformanceManager {
  performanceManager = new CanvasPerformanceManager(config);
  performanceManager.initialize(canvas);
  return performanceManager;
}
