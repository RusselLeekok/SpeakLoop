"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LoopMode, PracticeVideo, SubtitleLine, SubtitleMode } from "@/lib/types";
import { RecordingPanel } from "./recording-panel";
import { SentenceControls } from "./sentence-controls";
import { TranscriptPane } from "./transcript-pane";
import { VideoPane } from "./video-pane";
import { WordCardPanel } from "./word-card-panel";

type FontSize = "sm" | "md" | "lg";

type SavedProgress = {
  currentTime: number;
  activeLineId: string;
  favorites: string[];
};

function findActiveLine(lines: SubtitleLine[], currentTime: number) {
  return (
    lines.find(
      (line) => currentTime >= line.startTime && currentTime < line.endTime,
    ) ?? lines[0]
  );
}

export function LearningPlayer({ video }: { video: PracticeVideo }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recordingRef = useRef<HTMLDivElement | null>(null);
  const storageKey = `speakloop:${video.id}:progress`;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loopMode, setLoopMode] = useState<LoopMode>("sentence");
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>("bilingual");
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [activeLineId, setActiveLineId] = useState(video.subtitleLines[0].id);
  const [favorites, setFavorites] = useState<string[]>([]);

  const activeLine = useMemo(
    () =>
      video.subtitleLines.find((line) => line.id === activeLineId) ??
      video.subtitleLines[0],
    [activeLineId, video.subtitleLines],
  );

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const mediaEl = videoEl;

    let hls: {
      attachMedia: (media: HTMLMediaElement) => void;
      destroy: () => void;
      loadSource: (source: string) => void;
    } | null = null;
    const canPlayNativeHls = mediaEl.canPlayType(
      "application/vnd.apple.mpegurl",
    );

    async function attachSource() {
      if (video.videoUrl.endsWith(".m3u8") && !canPlayNativeHls) {
        const mod = await import("hls.js");
        const Hls = mod.default;
        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(video.videoUrl);
          hls.attachMedia(mediaEl);
        }
        return;
      }

      mediaEl.src = video.videoUrl;
    }

    attachSource();

    return () => {
      hls?.destroy();
      videoEl.removeAttribute("src");
      videoEl.load();
    };
  }, [video.videoUrl]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as SavedProgress;
      queueMicrotask(() => {
        setFavorites(saved.favorites ?? []);
        setCurrentTime(saved.currentTime ?? 0);
        setActiveLineId(saved.activeLineId ?? video.subtitleLines[0].id);
        if (videoRef.current && saved.currentTime) {
          videoRef.current.currentTime = saved.currentTime;
        }
      });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey, video.subtitleLines]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const mediaEl = videoEl;

    function handleLoadedMetadata() {
      setDuration(mediaEl.duration || video.duration);
    }

    function handleTimeUpdate() {
      const nextTime = mediaEl.currentTime;
      const nextLine = findActiveLine(video.subtitleLines, nextTime);

      if (loopMode === "sentence" && nextTime >= nextLine.endTime - 0.04) {
        mediaEl.currentTime = nextLine.startTime;
        setCurrentTime(nextLine.startTime);
        return;
      }

      setCurrentTime(nextTime);
      setActiveLineId(nextLine.id);
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          currentTime: nextTime,
          activeLineId: nextLine.id,
          favorites,
        } satisfies SavedProgress),
      );
    }

    function handlePlay() {
      setIsPlaying(true);
    }

    function handlePause() {
      setIsPlaying(false);
    }

    mediaEl.addEventListener("loadedmetadata", handleLoadedMetadata);
    mediaEl.addEventListener("timeupdate", handleTimeUpdate);
    mediaEl.addEventListener("play", handlePlay);
    mediaEl.addEventListener("pause", handlePause);

    return () => {
      mediaEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
      mediaEl.removeEventListener("timeupdate", handleTimeUpdate);
      mediaEl.removeEventListener("play", handlePlay);
      mediaEl.removeEventListener("pause", handlePause);
    };
  }, [favorites, loopMode, storageKey, video.duration, video.subtitleLines]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        currentTime,
        activeLineId,
        favorites,
      } satisfies SavedProgress),
    );
  }, [activeLineId, currentTime, favorites, storageKey]);

  async function togglePlay() {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (videoEl.paused) {
      try {
        await videoEl.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      videoEl.pause();
    }
  }

  function seek(time: number) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, time);
    setCurrentTime(time);
    setActiveLineId(findActiveLine(video.subtitleLines, time).id);
  }

  function seekLine(line: SubtitleLine) {
    seek(line.startTime);
  }

  function moveLine(direction: -1 | 1) {
    const currentIndex = video.subtitleLines.findIndex(
      (line) => line.id === activeLine.id,
    );
    const nextIndex = Math.min(
      Math.max(currentIndex + direction, 0),
      video.subtitleLines.length - 1,
    );
    seekLine(video.subtitleLines[nextIndex]);
  }

  function replayLine() {
    seekLine(activeLine);
    if (isPlaying) {
      void videoRef.current?.play();
    }
  }

  function toggleFavorite(lineId: string) {
    setFavorites((current) =>
      current.includes(lineId)
        ? current.filter((id) => id !== lineId)
        : [...current, lineId],
    );
  }

  function focusRecording() {
    recordingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <main className="space-y-4">
        <VideoPane
          video={video}
          videoRef={videoRef}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          loopMode={loopMode}
          isMuted={isMuted}
          onPlayPause={togglePlay}
          onSeek={seek}
          onPlaybackRateChange={setPlaybackRate}
          onLoopModeChange={setLoopMode}
          onMutedChange={setIsMuted}
        />
        <SentenceControls
          activeLine={activeLine}
          isPlaying={isPlaying}
          loopMode={loopMode}
          onPrevious={() => moveLine(-1)}
          onNext={() => moveLine(1)}
          onPlayPause={togglePlay}
          onReplayLine={replayLine}
          onLoopModeChange={setLoopMode}
          onFocusRecording={focusRecording}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <RecordingPanel activeLine={activeLine} panelRef={recordingRef} />
          <WordCardPanel activeLine={activeLine} wordCards={video.wordCards} />
        </div>
      </main>

      <TranscriptPane
        lines={video.subtitleLines}
        activeLineId={activeLine.id}
        favorites={favorites}
        subtitleMode={subtitleMode}
        fontSize={fontSize}
        onSeekLine={seekLine}
        onFavoriteToggle={toggleFavorite}
        onSubtitleModeChange={setSubtitleMode}
        onFontSizeChange={setFontSize}
      />
    </div>
  );
}
