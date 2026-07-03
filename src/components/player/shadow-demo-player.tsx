"use client";

import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Mic,
  MoreVertical,
  Pause,
  PenLine,
  Play,
  RefreshCw,
  Star,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { PracticeVideo, SubtitleLine } from "@/lib/types";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function activeLineFor(lines: SubtitleLine[], time: number) {
  return (
    lines.find((line) => time >= line.startTime && time < line.endTime) ??
    lines[0]
  );
}

export function ShadowDemoPlayer({ video }: { video: PracticeVideo }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  const activeLine = useMemo(
    () => activeLineFor(video.subtitleLines, currentTime),
    [currentTime, video.subtitleLines],
  );

  useEffect(() => {
    const media = videoRef.current;
    if (!media) return;
    const mediaEl = media;
    mediaEl.src = video.videoUrl;

    function onLoadedMetadata() {
      setDuration(mediaEl.duration || video.duration);
    }

    function onTimeUpdate() {
      const next = mediaEl.currentTime;
      const line = activeLineFor(video.subtitleLines, next);
      if (loop && next >= line.endTime - 0.04) {
        mediaEl.currentTime = line.startTime;
        setCurrentTime(line.startTime);
        return;
      }
      setCurrentTime(next);
    }

    function onPlay() {
      setIsPlaying(true);
    }

    function onPause() {
      setIsPlaying(false);
    }

    mediaEl.addEventListener("loadedmetadata", onLoadedMetadata);
    mediaEl.addEventListener("timeupdate", onTimeUpdate);
    mediaEl.addEventListener("play", onPlay);
    mediaEl.addEventListener("pause", onPause);

    return () => {
      mediaEl.removeEventListener("loadedmetadata", onLoadedMetadata);
      mediaEl.removeEventListener("timeupdate", onTimeUpdate);
      mediaEl.removeEventListener("play", onPlay);
      mediaEl.removeEventListener("pause", onPause);
    };
  }, [loop, video.duration, video.subtitleLines, video.videoUrl]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
  }, [rate]);

  async function togglePlay() {
    const media = videoRef.current;
    if (!media) return;
    if (media.paused) {
      try {
        await media.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      media.pause();
    }
  }

  function seekLine(line: SubtitleLine) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = line.startTime;
    setCurrentTime(line.startTime);
  }

  function moveLine(offset: -1 | 1) {
    const current = video.subtitleLines.findIndex(
      (line) => line.id === activeLine.id,
    );
    const next = Math.min(
      Math.max(current + offset, 0),
      video.subtitleLines.length - 1,
    );
    seekLine(video.subtitleLines[next]);
  }

  function toggleFavorite(lineId: string) {
    setFavorites((value) =>
      value.includes(lineId)
        ? value.filter((id) => id !== lineId)
        : [...value, lineId],
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#14131f]">
      <div className="flex h-11 items-center justify-between bg-gradient-to-r from-[#a129f0] to-[#ed3d9a] px-4 text-sm font-black text-white">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-white/20 px-2 py-1">🎁 试看</span>
          <span>完整功能体验中 · 注册解锁 200+ 视频 + 跟读 + 收藏</span>
        </div>
        <Link
          href="/register"
          className="rounded-md bg-white px-5 py-2 text-xs font-black text-[#a129f0]"
        >
          立即注册
        </Link>
      </div>

      <header className="flex h-[54px] items-center justify-between border-b border-[#eee9f3] bg-white px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm font-semibold text-[#8a8295]"
          >
            <ChevronLeft size={16} />
            注册
          </Link>
          <span className="h-6 w-px bg-[#eee9f3]" />
          <h1 className="truncate text-sm font-black">
            新手做视频：先完成，再完美
          </h1>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-[#a098aa]">
          <span>⏱ 2分钟</span>
          <span>★ 中级</span>
        </div>
      </header>

      <section className="demo-grid grid min-h-[calc(100vh-98px)]">
        <div className="min-w-0 border-r border-[#eee9f3] bg-white">
          <div className="relative bg-[#303030]">
            <video
              ref={videoRef}
              poster={video.posterUrl}
              className="aspect-video w-full bg-[#303030] object-cover"
              playsInline
              preload="metadata"
            />
            <button
              type="button"
              aria-label={isPlaying ? "暂停" : "播放"}
              onClick={togglePlay}
              className="absolute left-1/2 top-1/2 grid size-[74px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-[#8538f2] to-[#e43d9b] text-white shadow-[0_12px_32px_rgba(0,0,0,.28)]"
            >
              {isPlaying ? (
                <Pause size={34} fill="currentColor" />
              ) : (
                <Play size={34} fill="currentColor" />
              )}
            </button>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/88 to-transparent px-5 pb-4 pt-20 text-white">
              <div className="flex items-center gap-3 text-sm">
                <button type="button" onClick={togglePlay}>
                  {isPlaying ? (
                    <Pause size={17} fill="currentColor" />
                  ) : (
                    <Play size={17} fill="currentColor" />
                  )}
                </button>
                <span>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.05}
                  value={Math.min(currentTime, duration)}
                  onChange={(event) => {
                    if (!videoRef.current) return;
                    const next = Number(event.target.value);
                    videoRef.current.currentTime = next;
                    setCurrentTime(next);
                  }}
                  className="min-w-0 flex-1 accent-white"
                  aria-label="视频进度"
                />
                <Volume2 size={18} />
                <Expand size={17} />
                <MoreVertical size={18} />
              </div>
            </div>
          </div>

          <div className="h-[54px] border-b border-[#f4edf8] px-6 py-4 text-sm font-semibold text-[#9a91a7]">
            📖 视频简介
          </div>

          <div className="mx-auto flex h-[74px] max-w-[480px] items-center justify-between border-b-4 border-[#f2e8fb] px-4 text-[#7d738b]">
            <button
              type="button"
              title="循环：循环"
              onClick={() => setLoop((value) => !value)}
              className={`grid size-11 place-items-center rounded-md ${
                loop ? "text-[#9b4bf4]" : "text-[#7d738b]"
              }`}
            >
              <RefreshCw size={22} />
            </button>
            <button
              type="button"
              title="上一句"
              onClick={() => moveLine(-1)}
              className="grid size-11 place-items-center rounded-md"
            >
              <ChevronLeft size={25} />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="grid size-12 place-items-center rounded-md text-[#697184]"
            >
              {isPlaying ? (
                <Pause size={30} fill="currentColor" />
              ) : (
                <Play size={30} fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              title="下一句"
              onClick={() => moveLine(1)}
              className="grid size-11 place-items-center rounded-md"
            >
              <ChevronRight size={25} />
            </button>
            <button
              type="button"
              title="练习模式"
              className="grid size-11 place-items-center rounded-md"
            >
              <PenLine size={22} />
            </button>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col bg-white">
          <div className="flex h-[58px] items-center justify-between border-b border-[#eee9f3] px-4">
            <h2 className="text-base font-black">动态字幕</h2>
            <div className="flex items-center gap-4 text-xs font-black text-[#b08ee4]">
              <button type="button">双语</button>
              <button type="button" onClick={() => setRate(rate === 1 ? 1.25 : 1)}>
                {rate}x
              </button>
              <button type="button" onClick={() => setLoop((value) => !value)}>
                {loop ? "循环" : "顺序"}
              </button>
              <button type="button">字中</button>
              <button type="button" className="flex items-center gap-1">
                <Mic size={13} /> 练习
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {video.subtitleLines.map((line) => {
              const active = line.id === activeLine.id;
              const starred = favorites.includes(line.id);
              return (
                <article
                  key={line.id}
                  className={`border-b border-[#f2edf6] px-1 py-4 ${
                    active ? "bg-[#fbf8ff]" : "bg-white"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => seekLine(line)}
                      className="text-xs font-black text-[#b9a5d4]"
                    >
                      {formatTime(line.startTime)}
                    </button>
                    <button
                      type="button"
                      aria-label={starred ? "取消收藏" : "收藏"}
                      onClick={() => toggleFavorite(line.id)}
                      className="text-[#ddb7ef]"
                    >
                      <Star size={20} fill={starred ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => seekLine(line)}
                    className="block w-full text-left"
                  >
                    <p className="text-[17px] font-black leading-8 text-[#151522]">
                      {line.english}
                    </p>
                    <p className="mt-1 text-[15px] leading-7 text-[#8b8192]">
                      {line.chinese}
                    </p>
                  </button>
                </article>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}
