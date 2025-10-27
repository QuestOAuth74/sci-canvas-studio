import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";

interface SignupToastProps {
  count: number;
  topCountries?: Array<{ country: string; count: number }>;
  totalWithLocation?: number;
}

const STORAGE_KEY = "biosketch_signup_toast_last_shown";
const SHOW_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

export const SignupToast = ({ count, topCountries = [], totalWithLocation = 0 }: SignupToastProps) => {
  const [hasShown, setHasShown] = useState(false);

  const getLocationMessage = () => {
    if (topCountries.length === 0) {
      return `<strong>${count} people</strong> joined today!`;
    }

    const displayCountries = topCountries.slice(0, 2);
    const displayedCount = displayCountries.reduce((sum, c) => sum + c.count, 0);
    const remainingCount = totalWithLocation - displayedCount;
    
    const countryNames = displayCountries.map(c => c.country).join(', ');
    
    if (remainingCount > 0) {
      return `<strong>${count} people</strong> joined from ${countryNames} and ${remainingCount} other ${remainingCount === 1 ? 'country' : 'countries'} today!`;
    } else {
      return `<strong>${count} people</strong> from ${countryNames} joined today!`;
    }
  };

  useEffect(() => {
    if (count <= 2 || hasShown) return;

    const shouldShowToast = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return true;

        const { count: lastCount, timestamp: lastTimestamp } = JSON.parse(stored);
        const now = Date.now();

        // Show if count changed or more than 6 hours passed
        return count !== lastCount || (now - lastTimestamp) > SHOW_INTERVAL;
      } catch {
        return true;
      }
    };

    const showToastWithDelay = () => {
      setTimeout(() => {
        if (shouldShowToast()) {
          toast(
            <div className="flex items-center gap-3 text-white">
              <Users className="h-5 w-5 text-white" />
              <span dangerouslySetInnerHTML={{ __html: getLocationMessage() }} />
            </div>,
            {
              duration: 6000,
              position: "bottom-right",
              className: "colorful-signup-toast",
              style: {
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--secondary)))",
                border: "3px solid white",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                color: "white",
              },
            }
          );

          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ count, timestamp: Date.now() })
          );
          setHasShown(true);
        }
      }, 2000); // 2 second delay after page load
    };

    showToastWithDelay();
  }, [count, hasShown, topCountries, totalWithLocation]);

  return null;
};
