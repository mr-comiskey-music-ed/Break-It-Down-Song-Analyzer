import React, { useState, useEffect, useRef } from 'react';
import { extractYouTubeId } from '../utils/sharePayload';
import { Youtube, ClipboardPaste, ArrowUp } from 'lucide-react';

interface YouTubePlayerProps {
  youtubeUrl: string;
  youtubeId: string;
  onUrlChange: (url: string, id: string) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onAddSectionAtCurrentTime?: () => void;
  playerRefHandle: React.MutableRefObject<{
    seekTo: (seconds: number, play?: boolean) => void;
    togglePlay: () => void;
    play: () => void;
    pause: () => void;
  } | null>;
  isHighlighted?: boolean;
  isExampleSong?: boolean;
  standalone?: boolean;
}

export function YouTubePlayer({
  youtubeUrl,
  youtubeId,
  onUrlChange,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onDurationChange,
  onPlayingChange,
  playerRefHandle,
  isHighlighted = false,
  isExampleSong = false,
  standalone = true,
}: YouTubePlayerProps) {
  const [inputUrl, setInputUrl] = useState(youtubeUrl);
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerInstanceRef = useRef<any>(null);
  const [apiReady, setApiReady] = useState(false);
  const intervalRef = useRef<any>(null);

  // Sync internal input when props change
  useEffect(() => {
    setInputUrl(youtubeUrl);
    setOverlayDismissed(false);
  }, [youtubeUrl]);

  // Load YouTube Iframe API if not already present
  useEffect(() => {
    if ((window as any).YT && (window as any).YT.Player) {
      setApiReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      setApiReady(true);
    };
  }, []);

  // Initialize YT.Player on container when apiReady and youtubeId change
  useEffect(() => {
    if (!apiReady || !youtubeId) return;

    // Clear previous interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    try {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.destroy === 'function') {
        playerInstanceRef.current.destroy();
      }
    } catch {
      // Ignore cleanup error
    }

    try {
      playerInstanceRef.current = new (window as any).YT.Player('yt-player-frame', {
        videoId: youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            const dur = event.target.getDuration();
            if (dur && dur > 0) {
              onDurationChange(dur);
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
            if (event.data === 1) {
              onPlayingChange(true);
              setOverlayDismissed(true);
            } else if (event.data === 2 || event.data === 0) {
              onPlayingChange(false);
            }
          },
        },
      });
    } catch (e) {
      console.warn('YT Player initialization fallback:', e);
    }

    // Polling current time
    intervalRef.current = setInterval(() => {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.getCurrentTime === 'function') {
        try {
          const t = playerInstanceRef.current.getCurrentTime();
          const d = playerInstanceRef.current.getDuration();
          if (typeof t === 'number' && !isNaN(t)) {
            onTimeUpdate(t);
          }
          if (typeof d === 'number' && d > 0 && d !== duration) {
            onDurationChange(d);
          }
        } catch {
          // ignore
        }
      }
    }, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [apiReady, youtubeId]);

  // Expose player controller to parent
  useEffect(() => {
    playerRefHandle.current = {
      seekTo: (seconds: number, play = true) => {
        if (playerInstanceRef.current && typeof playerInstanceRef.current.seekTo === 'function') {
          playerInstanceRef.current.seekTo(seconds, true);
          if (play && typeof playerInstanceRef.current.playVideo === 'function') {
            playerInstanceRef.current.playVideo();
          }
        } else {
          onTimeUpdate(seconds);
        }
      },
      togglePlay: () => {
        if (!playerInstanceRef.current) return;
        if (isPlaying) {
          if (typeof playerInstanceRef.current.pauseVideo === 'function') {
            playerInstanceRef.current.pauseVideo();
          }
        } else {
          if (typeof playerInstanceRef.current.playVideo === 'function') {
            playerInstanceRef.current.playVideo();
          }
        }
      },
      play: () => {
        if (playerInstanceRef.current && typeof playerInstanceRef.current.playVideo === 'function') {
          playerInstanceRef.current.playVideo();
        }
      },
      pause: () => {
        if (playerInstanceRef.current && typeof playerInstanceRef.current.pauseVideo === 'function') {
          playerInstanceRef.current.pauseVideo();
        }
      },
    };
  }, [isPlaying, onTimeUpdate]);

  // Global keyboard listener for spacebar (play/pause) and left/right arrow keys (scrubbing 5s)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        const isEditable = target.isContentEditable;
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isEditable) {
          return; // let typing continue normally
        }
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        playerRefHandle.current?.togglePlay();
      } else if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft' || e.key === 'Left') {
        e.preventDefault();
        if (playerInstanceRef.current && typeof playerInstanceRef.current.getCurrentTime === 'function' && typeof playerInstanceRef.current.seekTo === 'function') {
          const ct = playerInstanceRef.current.getCurrentTime() || 0;
          const newTime = Math.max(0, ct - 5);
          playerInstanceRef.current.seekTo(newTime, true);
        }
      } else if (e.code === 'ArrowRight' || e.key === 'ArrowRight' || e.key === 'Right') {
        e.preventDefault();
        if (playerInstanceRef.current && typeof playerInstanceRef.current.getCurrentTime === 'function' && typeof playerInstanceRef.current.getDuration === 'function' && typeof playerInstanceRef.current.seekTo === 'function') {
          const ct = playerInstanceRef.current.getCurrentTime() || 0;
          const dur = playerInstanceRef.current.getDuration() || 0;
          const newTime = dur > 0 ? Math.min(dur, ct + 5) : ct + 5;
          playerInstanceRef.current.seekTo(newTime, true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoadUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;
    const extractedId = extractYouTubeId(inputUrl);
    onUrlChange(inputUrl.trim(), extractedId);
  };

  const handlePasteAndLoad = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const trimmed = text.trim();
          setInputUrl(trimmed);
          const extractedId = extractYouTubeId(trimmed);
          onUrlChange(trimmed, extractedId);
          return;
        }
      }
    } catch (err) {
      console.warn('Clipboard reading error:', err);
    }
    // Fallback if clipboard is empty or permission denied: load whatever is in the input box
    if (inputUrl.trim()) {
      const extractedId = extractYouTubeId(inputUrl);
      onUrlChange(inputUrl.trim(), extractedId);
    }
  };

  const content = (
    <>
      {/* URL Input Bar */}
      <form onSubmit={handleLoadUrl} className="flex flex-col sm:flex-row items-stretch gap-2">
        <button
          id="paste-load-video-btn"
          type="button"
          onClick={handlePasteAndLoad}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          title="Paste link from clipboard and load video"
        >
          <ClipboardPaste className="w-4 h-4" />
          <span>Paste Link &amp; Load Video</span>
        </button>

        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Youtube className="w-4 h-4 text-red-500" />
          </div>
          <input
            id="youtube-url-input"
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text');
              if (pasted && pasted.trim()) {
                const trimmed = pasted.trim();
                setTimeout(() => {
                  const extractedId = extractYouTubeId(trimmed);
                  onUrlChange(trimmed, extractedId);
                }, 50);
              }
            }}
            placeholder="Paste YouTube link or embed URL (e.g. https://www.youtube.com/watch?v=...)"
            className="w-full h-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-mono"
          />
        </div>
      </form>

      {/* Video Container & Playback Screen with optional blur overlay & Start Here button */}
      <div 
        className="relative aspect-video w-full max-w-lg mx-auto bg-slate-950 rounded-xl overflow-hidden shadow-inner border border-slate-800 group"
      >
        {youtubeId ? (
          <>
            <div 
              id="yt-player-frame" 
              className={`w-full h-full transition-all duration-300 ${!isExampleSong && !overlayDismissed ? 'filter backdrop-blur-[2px] contrast-95' : ''}`} 
            />
            
            {/* Blur & Attention Overlay with pointer pointing up-left (10 o'clock) to Paste Link & Load Video */}
            {!isExampleSong && (
              <div 
                className={`absolute inset-0 bg-slate-950/20 backdrop-blur-[1.5px] p-4 transition-all duration-300 flex items-center justify-center cursor-pointer ${overlayDismissed ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOverlayDismissed(true);
                  if (playerInstanceRef.current && typeof playerInstanceRef.current.playVideo === 'function') {
                    playerInstanceRef.current.playVideo();
                  }
                }}
              >
                <div className="absolute top-4 left-4 flex flex-col items-start animate-bounce">
                  <div className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-indigo-400/50">
                    <ArrowUp className="w-4 h-4 text-indigo-200" />
                    <span>Start Here</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400 relative">
            <Youtube className="w-12 h-12 text-slate-600 mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-slate-300">No YouTube Video Loaded</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Paste a YouTube link above to load the video.
            </p>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
              <div className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-indigo-400/50">
                <ArrowUp className="w-4 h-4 text-indigo-200" />
                <span>Start Here</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (!standalone) {
    return <div className="flex flex-col gap-4">{content}</div>;
  }

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-4 relative transition-all duration-300 ${isHighlighted ? 'ring-4 ring-amber-500/80 dark:ring-amber-400/80 shadow-2xl shadow-amber-500/25' : ''}`}>
      {isHighlighted && (
        <div className="absolute -top-3.5 right-4 z-30 bg-amber-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce pointer-events-none">
          <span>💡 Step 1</span>
        </div>
      )}
      {content}
    </div>
  );
}
