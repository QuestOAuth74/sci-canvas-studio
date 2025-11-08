// Performance utility functions for canvas optimization

/**
 * Throttle function - limits execution to once per wait period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastRan: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (lastRan === null || now - lastRan >= wait) {
      func.apply(this, args);
      lastRan = now;
    } else if (!timeout) {
      timeout = setTimeout(
        () => {
          func.apply(this, args);
          lastRan = Date.now();
          timeout = null;
        },
        wait - (now - lastRan)
      );
    }
  };
}

/**
 * Debounce function - delays execution until after wait period of inactivity
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func.apply(this, args);
      timeout = null;
    }, wait);
  };
}

/**
 * Render scheduler for batching canvas render calls
 */
export class RenderScheduler {
  private scheduled: boolean = false;
  private canvas: any = null;

  constructor(canvas?: any) {
    this.canvas = canvas;
  }

  setCanvas(canvas: any) {
    this.canvas = canvas;
  }

  scheduleRender() {
    if (this.scheduled || !this.canvas) return;
    
    this.scheduled = true;
    requestAnimationFrame(() => {
      if (this.canvas) {
        this.canvas.requestRenderAll();
      }
      this.scheduled = false;
    });
  }

  renderNow() {
    if (this.canvas) {
      this.canvas.requestRenderAll();
    }
    this.scheduled = false;
  }
}
