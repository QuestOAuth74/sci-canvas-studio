import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet } from "lucide-react";

const STORAGE_KEY = "biosketch_mobile_warning_dismissed";

export function MobileWarningDialog() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the warning
    const dismissed = localStorage.getItem(STORAGE_KEY);
    
    // Show dialog if on mobile and hasn't been dismissed
    if (isMobile && !dismissed) {
      setOpen(true);
    }
  }, [isMobile]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const handleContinue = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md stable-dialog" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-4">
          <div className="flex justify-center gap-3 mb-2">
            <Monitor className="w-12 h-12 text-primary" />
            <Tablet className="w-12 h-12 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Desktop or Tablet Recommended
          </DialogTitle>
          <DialogDescription className="text-center space-y-4">
            <p className="text-base">
              The Canvas editor is optimized for larger screens and works best on desktop or tablet devices.
            </p>
            
            <div className="text-left space-y-2 pt-2">
              <p className="font-semibold text-foreground">Why?</p>
              <ul className="space-y-1.5 text-sm list-disc list-inside">
                <li>Full precision for detailed editing</li>
                <li>Access to all tools and features</li>
                <li>Keyboard shortcuts for faster workflow</li>
                <li>Better performance with complex projects</li>
              </ul>
            </div>

            <p className="text-sm pt-2">
              You can continue on mobile, but the experience may be limited.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleDismiss} className="w-full">
            I Understand
          </Button>
          <Button onClick={handleContinue} variant="ghost" className="w-full">
            Continue Anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
