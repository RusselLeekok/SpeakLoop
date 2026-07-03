"use client";

import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { LoopMode, PracticeVideo } from "@/lib/types";

type VideoPaneProps = {
  video: PracticeVideo;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  loopMode: LoopMode;
  isMuted: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onLoopModeChange: (mode: LoopMode) => void;
  onMutedChange: (muted: boolean) => void;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function VideoPane({
  video,
  videoRef,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  loopMode,
  isMuted,
  onPlayPause,
  onSeek,
  onPlaybackRateChange,
  onLoopModeChange,
  onMutedChange,
}: VideoPaneProps) {
  function toggleMute() {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    onMutedChange(nextMuted);
  }

  function requestFullscreen() {
    videoRef.current?.parentElement?.requestFullscreen?.();
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#1e1b29] bg-[#0f0d17] text-white shadow-sm">
      <div className="relative">
        <video
          ref={videoRef}
          className="aspect-video w-full bg-black object-cover"
          poster={video.posterUrl}
          playsInline
          preload="metadata"
        />

        <button
          type="button"
          aria-label={isPlaying ? "暂停" : "播放"}
          onClick={onPlayPause}
          className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#7c3aed] text-white shadow-lg hover:scale-105 hover:bg-[#6d28d9]"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={30} />}
        </button>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-4 pt-16">
          <input
            aria-label="视频进度"
            type="range"
            min={0}
            max={duration || video.duration}
            step={0.05}
            value={Math.min(currentTime, duration || video.duration)}
            onChange={(event) => onSeek(Number(event.target.value))}
            className="w-full accent-[#a78bfa]"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold text-white/85">
            <span>
              {formatTime(currentTime)} / {formatTime(duration || video.duration)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleMute}
                className="grid size-8 place-items-center rounded-md hover:bg-white/15"
                aria-label={isMuted ? "取消静音" : "静音"}
              >
                {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
              {[0.75, 1, 1.25].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => onPlaybackRateChange(rate)}
                  className={`h-8 rounded-md px-2 text-xs font-black ${
                    playbackRate === rate
                      ? "bg-white text-[#171421]"
                      : "hover:bg-white/15"
                  }`}
                >
                  {rate}x
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  onLoopModeChange(loopMode === "sentence" ? "off" : "sentence")
                }
                className={`h-8 rounded-md px-2 text-xs font-black ${
                  loopMode === "sentence"
                    ? "bg-[#facc15] text-[#211a00]"
                    : "hover:bg-white/15"
                }`}
              >
                循环
              </button>
              <button
                type="button"
                onClick={requestFullscreen}
                className="grid size-8 place-items-center rounded-md hover:bg-white/15"
                aria-label="全屏"
              >
                <Maximize2 size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
