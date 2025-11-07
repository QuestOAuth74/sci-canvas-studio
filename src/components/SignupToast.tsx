import { useEffect, useState } from "react";
import { Users, Sparkles, Globe, TrendingUp, Zap, PartyPopper } from "lucide-react";
import { toast } from "sonner";

interface SignupToastProps {
  count: number;
  topCountries?: Array<{ country: string; count: number }>;
  totalWithLocation?: number;
}

const STORAGE_KEY = "biosketch_signup_toast_last_shown";
const SHOW_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

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
      </div>
    );
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
            renderToastContent(),
            {
              duration: 8000,
              position: "bottom-right",
              className: "professional-signup-toast",
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
