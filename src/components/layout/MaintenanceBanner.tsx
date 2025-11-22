import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MaintenanceBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const STORAGE_KEY = 'maintenance-banner-dismissed';
  const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  useEffect(() => {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      if (now - dismissedTime < DISMISS_DURATION) {
        setIsVisible(false);
        return;
      }
    }
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative w-full bg-amber-500/90 dark:bg-amber-600/90 text-white overflow-hidden">
      <div className="flex items-center h-12 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap inline-flex items-center gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="inline-flex items-center gap-2 px-6">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium text-sm">
                🚧 Site Under Maintenance - Performance may be slower than usual. We appreciate your patience!
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:bg-white/20 rounded-full"
        aria-label="Dismiss maintenance banner"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
