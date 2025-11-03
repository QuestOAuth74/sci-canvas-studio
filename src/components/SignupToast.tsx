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
        <style>
          {`
            @keyframes gradient-shift {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            @keyframes icon-float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
            @keyframes icon-spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse-glow {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
          `}
        </style>
        
        {/* Animated icons row */}
        <div className="flex justify-center items-center gap-3 mb-4">
          <Sparkles 
            className="h-6 w-6 text-white" 
            style={{ animation: 'icon-float 2s ease-in-out infinite' }}
          />
          <Globe 
            className="h-6 w-6 text-white" 
            style={{ animation: 'icon-spin-slow 8s linear infinite' }}
          />
          <TrendingUp 
            className="h-6 w-6 text-white" 
            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
          />
          <Zap 
            className="h-6 w-6 text-white" 
            style={{ animation: 'icon-float 2s ease-in-out infinite 0.3s' }}
          />
        </div>

        {/* Main content */}
        <div className="text-center">
          {/* Big number with badge style */}
          <div className="mb-3">
            <div className="inline-flex items-baseline gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40">
              <span className="text-5xl font-black text-white drop-shadow-lg">
                {count}
              </span>
              <span className="text-xl font-bold text-white">
                people
              </span>
            </div>
          </div>

          {/* Location with flags */}
          {topCountries.length > 0 ? (
            <>
              <div className="text-base font-medium text-white mb-1 flex flex-wrap justify-center gap-2">
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
              <div className="text-sm font-semibold text-white/90 flex items-center justify-center gap-2">
                <span>joined today</span>
                <PartyPopper className="h-4 w-4 inline" />
              </div>
            </>
          ) : (
            <div className="text-base font-semibold text-white/90 flex items-center justify-center gap-2">
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
              className: "colorful-signup-toast",
              style: {
                background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(var(--secondary)) 100%)",
                backgroundSize: "200% 200%",
                animation: "gradient-shift 6s ease infinite",
                border: "4px solid white",
                boxShadow: "0 12px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 60px rgba(255, 255, 255, 0.3)",
                color: "white",
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
