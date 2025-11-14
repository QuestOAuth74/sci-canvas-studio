import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "newsletter_popup_dismissed";
const SHOW_DELAY = 5000; // Wait 5 seconds before enabling exit intent
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const emailSchema = z.string().email("Please enter a valid email address");

export const NewsletterPopupModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [canShowPopup, setCanShowPopup] = useState(false);
  const hasShownRef = useRef(false);
  const { user } = useAuth();

  // Check if popup was dismissed recently
  const isDismissed = () => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) return false;
      
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      
      return (now - dismissedTime) < DISMISS_DURATION;
    } catch {
      return false;
    }
  };

  // Enable popup after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanShowPopup(true);
    }, SHOW_DELAY);

    return () => clearTimeout(timer);
  }, []);

  // Exit intent detection
  useEffect(() => {
    if (!canShowPopup || hasShownRef.current || isDismissed() || user) {
      return; // Don't show if: too early, already shown, dismissed, or user is logged in
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Detect mouse leaving from top of viewport (intent to close tab/navigate away)
      if (e.clientY <= 0 && !hasShownRef.current) {
        hasShownRef.current = true;
        setIsOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [canShowPopup, user]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate email
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('subscribe-newsletter', {
        body: { 
          email: email.trim().toLowerCase(), 
          source: 'exit_popup',
          userId: user?.id 
        }
      });

      if (invokeError) throw invokeError;

      if (data.alreadySubscribed) {
        toast.info("You're already subscribed!", {
          description: "Check your inbox for our newsletters."
        });
        handleClose();
      } else {
        setIsSuccess(true);
        toast.success("Welcome to the community!", {
          description: "Check your email for confirmation."
        });
        
        // Close after showing success for 2 seconds
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Newsletter subscription error:', err);
      setError("Something went wrong. Please try again.");
      toast.error("Subscription failed", {
        description: "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <DialogTitle className="text-xl">Wait! Before you go...</DialogTitle>
                </div>
              </div>
              <DialogDescription className="text-base pt-2">
                Join <span className="font-semibold text-primary">2,000+ scientists</span> getting weekly tips on creating stunning scientific illustrations.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Benefits */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Weekly tips</strong> on scientific illustration best practices
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Early access</strong> to new features and tools
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Community highlights</strong> and inspiration from fellow scientists
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className={error ? "border-destructive" : ""}
                    disabled={isSubmitting}
                    autoFocus
                  />
                  {error && (
                    <p className="text-sm text-destructive mt-1">{error}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Subscribing..." : "Get Weekly Tips"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Maybe Later
                  </Button>
                </div>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                No spam, unsubscribe anytime. We respect your privacy.
              </p>
            </div>
          </>
        ) : (
          // Success State
          <div className="py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <DialogTitle className="text-2xl mb-2">You're In! 🎉</DialogTitle>
            <DialogDescription className="text-base">
              Check your email for a confirmation message. We'll send you awesome content soon!
            </DialogDescription>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
