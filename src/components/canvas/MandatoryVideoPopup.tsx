import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, X, ExternalLink, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MandatoryVideoPopupProps {
  open: boolean;
  onComplete: () => void;
}

// YouTube video ID extracted from https://youtu.be/9u4uR2NrLqY
const YOUTUBE_VIDEO_ID = "9u4uR2NrLqY";
const MINIMUM_WATCH_TIME_SECONDS = 30; // Minimum time before allowing skip

export function MandatoryVideoPopup({ open, onComplete }: MandatoryVideoPopupProps) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!open) return;

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    // Load the YouTube IFrame API script
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up the callback
    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [open]);

  const initializePlayer = useCallback(() => {
    if (!containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: YOUTUBE_VIDEO_ID,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 1,
      },
      events: {
        onReady: (event: YT.PlayerEvent) => {
          event.target.playVideo();
          setIsPlaying(true);
          startProgressTracking();
        },
        onStateChange: (event: YT.OnStateChangeEvent) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            setVideoEnded(true);
            setCanProceed(true);
            setProgress(100);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          } else if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          }
        },
      },
    });
  }, []);

  const startProgressTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();

        if (duration > 0) {
          const progressPercent = (currentTime / duration) * 100;
          setProgress(progressPercent);
          setWatchedSeconds(Math.floor(currentTime));

          // Allow proceeding after minimum watch time or 80% of video
          if (currentTime >= MINIMUM_WATCH_TIME_SECONDS || progressPercent >= 80) {
            setCanProceed(true);
          }
        }
      }
    }, 500);
  }, []);

  const handleProceedToCanvas = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    // Mark as watched in localStorage
    localStorage.setItem('mandatory_video_watched', 'true');
    localStorage.setItem('mandatory_video_watched_date', new Date().toISOString());
    onComplete();
  };

  const handleGoToBlog = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    navigate('/blog');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-4xl w-[90vw] p-0 gap-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-violet-500/30"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Play className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Welcome to BioSketch</h2>
                <p className="text-sm text-slate-400">
                  {canProceed
                    ? "You can now proceed to the canvas!"
                    : `Please watch at least ${MINIMUM_WATCH_TIME_SECONDS} seconds to continue`}
                </p>
              </div>
            </div>
            {videoEnded && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Complete</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-black">
          <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full"
          />

          {/* Loading overlay */}
          {!isPlaying && !videoEnded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <span className="text-white/70 text-sm">Loading video...</span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Section */}
        <div className="px-6 py-4 bg-black/30 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                {videoEnded ? "Video completed" : `Watched: ${formatTime(watchedSeconds)}`}
              </span>
              <span className={`font-medium ${canProceed ? 'text-green-400' : 'text-slate-400'}`}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className="relative">
              <Progress
                value={progress}
                className="h-2 bg-slate-700"
              />
              {/* Animated glow effect when playing */}
              {isPlaying && !videoEnded && (
                <div
                  className="absolute top-0 h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse rounded-full"
                  style={{
                    left: `${Math.max(0, progress - 10)}%`,
                    width: '10%',
                    transition: 'left 0.5s ease-out'
                  }}
                />
              )}
            </div>
            {!canProceed && (
              <p className="text-xs text-slate-500 text-center">
                {MINIMUM_WATCH_TIME_SECONDS - watchedSeconds > 0
                  ? `${MINIMUM_WATCH_TIME_SECONDS - watchedSeconds} seconds remaining before you can proceed`
                  : "Almost there..."}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={handleGoToBlog}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Watch More Videos
            </Button>

            <Button
              onClick={handleProceedToCanvas}
              disabled={!canProceed}
              className={`min-w-[180px] ${
                canProceed
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {canProceed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Proceed to Canvas
                </>
              ) : (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />
                  Please Wait...
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// TypeScript declarations for YouTube IFrame API
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}
