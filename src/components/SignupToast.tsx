import { useEffect, useState } from "react";
import { Users, Sparkles, Globe, TrendingUp, Zap, PartyPopper, X } from "lucide-react";
import { toast } from "sonner";

interface SignupToastProps {
  count: number;
  topCountries?: Array<{ country: string; count: number }>;
  totalWithLocation?: number;
}

const STORAGE_KEY = "biosketch_signup_toast_last_shown";
const DISMISS_KEY = "biosketch_signup_toast_dismissed";
const SHOW_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const getCountryFlag = (countryName: string): string => {
  const flagMap: Record<string, string> = {
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'India': '🇮🇳',
    'Brazil': '🇧🇷',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'Netherlands': '🇳🇱',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Finland': '🇫🇮',
    'Poland': '🇵🇱',
    'Mexico': '🇲🇽',
    'Argentina': '🇦🇷',
    'Chile': '🇨🇱',
    'South Korea': '🇰🇷',
    'Singapore': '🇸🇬',
    'Switzerland': '🇨🇭',
    'Belgium': '🇧🇪',
    'Austria': '🇦🇹',
    'Portugal': '🇵🇹',
    'Ireland': '🇮🇪',
    'New Zealand': '🇳🇿',
    'South Africa': '🇿🇦',
  };
  return flagMap[countryName] || '🌍';
};

export const SignupToast = ({ count, topCountries = [], totalWithLocation = 0 }: SignupToastProps) => {
  const [hasShown, setHasShown] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [toastId, setToastId] = useState<string | number | undefined>();

  const isDismissedFor24Hours = () => {
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (!dismissed) return false;
      
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      
      return (now - dismissedTime) < DISMISS_DURATION;
    } catch {
      return false;
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    if (toastId) {
      toast.dismiss(toastId);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
    setIsMinimized(false);
    if (toastId) {
      toast.dismiss(toastId);
    }
  };

  const handleExpandMinimized = () => {
    setIsMinimized(false);
    showToast();
  };

  const renderToastContent = () => {
    return (
      <div className="relative w-full">
        {/* Simple icon */}
        <div className="flex justify-center items-center mb-3">
          <Users className="h-7 w-7 text-gray-700" />
        </div>

        {/* Main content */}
        <div className="text-center">
          {/* Big number with clean badge style */}
          <div className="mb-3">
            <div className="inline-flex items-baseline gap-2 px-5 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-5xl font-black text-gray-900">
                {count}
              </span>
              <span className="text-xl font-bold text-gray-700">
                people
              </span>
            </div>
          </div>

          {/* Location with flags */}
          {topCountries.length > 0 ? (
            <>
              <div className="text-base font-medium text-gray-900 mb-1 flex flex-wrap justify-center gap-2">
                {topCountries.slice(0, 2).map((c, idx) => (
                  <span key={c.country} className="inline-flex items-center gap-1">
                    <span className="text-xl">{getCountryFlag(c.country)}</span>
                    <span>{c.country}</span>
                  </span>
                ))}
                {totalWithLocation - topCountries.slice(0, 2).reduce((sum, c) => sum + c.count, 0) > 0 && (
                  <span>
                    +{totalWithLocation - topCountries.slice(0, 2).reduce((sum, c) => sum + c.count, 0)} more
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-2">
                <span>joined today</span>
                <PartyPopper className="h-4 w-4 inline" />
              </div>
            </>
          ) : (
            <div className="text-base font-semibold text-gray-700 flex items-center justify-center gap-2">
              <span>joined today</span>
              <PartyPopper className="h-4 w-4 inline" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={handleMinimize}
            className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Minimize
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Hide for 24h
          </button>
        </div>
      </div>
    );
  };

  const showToast = () => {
    const id = toast(
      renderToastContent(),
      {
        duration: 3000,
        position: "bottom-right",
        className: "professional-signup-toast",
        onAutoClose: () => {
          setIsMinimized(true);
        },
        style: {
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
          color: "#000000",
          minWidth: "380px",
          padding: "24px",
        },
      }
    );
    setToastId(id);
  };

  useEffect(() => {
    if (count <= 2 || hasShown || isDismissed) return;

    // Check if dismissed for 24 hours
    if (isDismissedFor24Hours()) {
      setIsDismissed(true);
      return;
    }

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
          showToast();

          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ count, timestamp: Date.now() })
          );
          setHasShown(true);
        }
      }, 2000); // 2 second delay after page load
    };

    showToastWithDelay();
  }, [count, hasShown, isDismissed, topCountries, totalWithLocation]);

  // Minimized Badge Component
  if (isMinimized && !isDismissed) {
    return (
      <div 
        className="fixed bottom-6 right-6 z-50 cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300"
        onClick={handleExpandMinimized}
      >
        <div className="bg-background border-2 border-border rounded-full shadow-lg px-4 py-3 flex items-center gap-2 hover:shadow-xl hover:scale-105 transition-all">
          <Users className="h-4 w-4 text-foreground" />
          <span className="font-bold text-foreground">{count}</span>
          <PartyPopper className="h-4 w-4 text-foreground" />
        </div>
      </div>
    );
  }

  return null;
};
