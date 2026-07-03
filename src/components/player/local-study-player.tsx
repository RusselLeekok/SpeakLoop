"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Star,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StudyCard, SubtitleLine } from "@/lib/local-videos";

type StudyVideo = {
  id: string;
  title: string;
  fileName: string;
  streamUrl: string;
  subtitleLines: SubtitleLine[];
  cards: StudyCard[];
};

type Segment = {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  english: string;
  chinese: string;
  cardIds: string[];
};

const SEGMENT_SECONDS = 5;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function makeFallbackSegments(duration: number): Segment[] {
  const safeDuration = Math.max(duration, SEGMENT_SECONDS);
  const count = Math.ceil(safeDuration / SEGMENT_SECONDS);
  return Array.from({ length: count }, (_, index) => {
    const startTime = index * SEGMENT_SECONDS;
    const endTime = Math.min(startTime + SEGMENT_SECONDS, safeDuration);
    return {
      cardIds: [],
      chinese: "请在后台导入字幕后显示中文翻译。",
      endTime,
      english: `听写片段 ${String(index + 1).padStart(2, "0")}`,
      id: `segment-${index + 1}`,
      index,
      startTime,
    };
  });
}

function normalizeSubtitleLines(lines: SubtitleLine[]): Segment[] {
  return lines.map((line, index) => ({
    cardIds: line.cardIds,
    chinese: line.chinese,
    endTime: line.endTime,
    english: line.english,
    id: line.id,
    index,
    startTime: line.startTime,
  }));
}

function findActiveSegment(segments: Segment[], currentTime: number) {
  return (
    segments.find(
      (segment) =>
        currentTime >= segment.startTime && currentTime < segment.endTime,
    ) ?? segments[0]
  );
}

export function LocalStudyPlayer({ video }: { video: StudyVideo }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loopSentence, setLoopSentence] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const hasTranscript = video.subtitleLines.length > 0;
  const noteKey = `shadow-local-notes:${video.id}`;

  const segments = useMemo(
    () =>
      hasTranscript
        ? normalizeSubtitleLines(video.subtitleLines)
        : makeFallbackSegments(duration),
    [duration, hasTranscript, video.subtitleLines],
  );
  const activeSegment = findActiveSegment(segments, currentTime);
  const activeCards = video.cards.filter((card) =>
    activeSegment?.cardIds.includes(card.id),
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(noteKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Record<string, string>;
      queueMicrotask(() => setNotes(parsed));
    } catch {
      window.localStorage.removeItem(noteKey);
    }
  }, [noteKey]);

  useEffect(() => {
    const media = videoRef.current;
    if (!media) return;
    media.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const media = videoRef.current;
    if (!media) return;
    const mediaEl = media;

    function onLoadedMetadata() {
      setDuration(mediaEl.duration || 0);
    }

    function onTimeUpdate() {
      const nextTime = mediaEl.currentTime;
      const segment = findActiveSegment(segments, nextTime);
      if (loopSentence && segment && nextTime >= segment.endTime - 0.04) {
        mediaEl.currentTime = segment.startTime;
        setCurrentTime(segment.startTime);
        return;
      }
      setCurrentTime(nextTime);
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
  }, [loopSentence, segments]);

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

  function seek(time: number) {
    if (!videoRef.current) return;
    const next = Math.max(0, Math.min(time, duration || time));
    videoRef.current.currentTime = next;
    setCurrentTime(next);
  }

  function seekSegment(segment: Segment) {
    seek(segment.startTime);
  }

  function moveSegment(offset: -1 | 1) {
    const currentIndex = activeSegment?.index ?? 0;
    const nextIndex = Math.min(
      Math.max(currentIndex + offset, 0),
      segments.length - 1,
    );
    seekSegment(segments[nextIndex]);
  }

  function replaySegment() {
    if (!activeSegment) return;
    seekSegment(activeSegment);
    if (isPlaying) void videoRef.current?.play();
  }

  function updateNote(value: string) {
    if (!activeSegment) return;
    const nextNotes = { ...notes, [activeSegment.id]: value };
    setNotes(nextNotes);
    window.localStorage.setItem(noteKey, JSON.stringify(nextNotes));
  }

  function toggleFavorite(segmentId: string) {
    setFavorites((current) =>
      current.includes(segmentId)
        ? current.filter((id) => id !== segmentId)
        : [...current, segmentId],
    );
  }

  return (
    <main className="h-[calc(100vh-7.5rem)] min-h-[680px] bg-white text-[#14131f]">
      <section className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_360px_360px]">
        <div className="flex min-w-0 flex-col border-r border-[#eee9f3] bg-white">
          <div className="relative flex-1 bg-[#303030]">
            <video
              ref={videoRef}
              src={video.streamUrl}
              className="h-full max-h-full w-full bg-[#303030] object-contain"
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
                  max={duration || SEGMENT_SECONDS}
                  step={0.05}
                  value={Math.min(currentTime, duration || SEGMENT_SECONDS)}
                  onChange={(event) => seek(Number(event.target.value))}
                  className="min-w-0 flex-1 accent-white"
                  aria-label="视频进度"
                />
                <Volume2 size={18} />
              </div>
            </div>
          </div>

          <div className="flex h-[54px] items-center justify-between border-b border-[#f4edf8] px-6 text-sm font-semibold text-[#9a91a7]">
            <span>视频简介</span>
            <span className="max-w-[60%] truncate text-[#6e6478]">
              {video.fileName}
            </span>
          </div>

          <div className="mx-auto flex h-[88px] w-full max-w-[560px] items-center justify-between border-b-4 border-[#f2e8fb] px-4 text-[#7d738b]">
            <button
              type="button"
              title="单句循环"
              onClick={() => setLoopSentence((value) => !value)}
              className={`grid size-11 place-items-center rounded-md ${
                loopSentence ? "text-[#9b4bf4]" : "text-[#7d738b]"
              }`}
            >
              <RefreshCw size={22} />
            </button>
            <button
              type="button"
              title="上一句"
              onClick={() => moveSegment(-1)}
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
              onClick={() => moveSegment(1)}
              className="grid size-11 place-items-center rounded-md"
            >
              <ChevronRight size={25} />
            </button>
            <button
              type="button"
              title="重播当前句"
              onClick={replaySegment}
              className="grid size-11 place-items-center rounded-md"
            >
              <RotateCcw size={22} />
            </button>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col bg-white">
          <div className="flex h-[58px] items-center justify-between border-b border-[#eee9f3] px-4">
            <h2 className="text-base font-black">动态字幕</h2>
            <div className="flex items-center gap-4 text-xs font-black text-[#b08ee4]">
              <button type="button">双语</button>
              {[0.75, 1, 1.25].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setPlaybackRate(rate)}
                  className={playbackRate === rate ? "text-[#7c2be8]" : ""}
                >
                  {rate}x
                </button>
              ))}
              <button type="button" onClick={() => setLoopSentence((v) => !v)}>
                {loopSentence ? "单句" : "顺序"}
              </button>
            </div>
          </div>

          {!hasTranscript && (
            <div className="border-b border-[#f2edf6] bg-[#fff8e6] px-4 py-3 text-sm font-bold text-[#8a5a00]">
              这个视频还没有导入字幕，当前使用 5 秒听写片段。请在后台导入 .srt 或字幕 JSON。
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {segments.map((segment) => {
              const active = activeSegment?.id === segment.id;
              const starred = favorites.includes(segment.id);
              return (
                <article
                  key={segment.id}
                  className={`border-b border-[#f2edf6] px-1 py-4 ${
                    active ? "bg-[#fbf8ff]" : "bg-white"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => seekSegment(segment)}
                      className="text-xs font-black text-[#b9a5d4]"
                    >
                      {formatTime(segment.startTime)}
                    </button>
                    <button
                      type="button"
                      aria-label={starred ? "取消收藏" : "收藏"}
                      onClick={() => toggleFavorite(segment.id)}
                      className="text-[#ddb7ef]"
                    >
                      <Star size={20} fill={starred ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => seekSegment(segment)}
                    className="block w-full text-left"
                  >
                    <p className="text-[17px] font-black leading-8 text-[#151522]">
                      {segment.english}
                    </p>
                    <p className="mt-1 text-[15px] leading-7 text-[#8b8192]">
                      {segment.chinese}
                    </p>
                  </button>
                  {!hasTranscript && active && (
                    <textarea
                      value={notes[segment.id] ?? ""}
                      onChange={(event) => updateNote(event.target.value)}
                      placeholder="写下你听到的英文..."
                      className="mt-3 min-h-24 w-full resize-none rounded-2xl border border-[#eadff2] bg-white p-3 text-sm font-semibold leading-6 text-[#202033] placeholder:text-[#c0b3cc]"
                    />
                  )}
                </article>
              );
            })}
          </div>
        </aside>

        <aside className="hidden min-h-0 flex-col border-l border-[#eee9f3] bg-[#fbfaff] xl:flex">
          <div className="flex h-[58px] items-center justify-between border-b border-[#eee9f3] bg-white px-4">
            <h2 className="flex items-center gap-2 text-base font-black">
              <BookOpen size={17} className="text-[#a129f0]" />
              精读卡片
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {activeCards.length === 0 ? (
              <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#dccdec] bg-white p-5 text-center text-sm font-bold leading-7 text-[#8b8192]">
                {video.cards.length === 0
                  ? "暂无精读卡片。可在后台导入 cards JSON。"
                  : "当前句没有关联精读卡片。"}
              </div>
            ) : (
              <div className="space-y-3">
                {activeCards.map((card) => (
                  <article
                    key={card.id}
                    className="rounded-2xl border border-[#eadff2] bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black">{card.term}</h3>
                        {card.phonetic && (
                          <p className="mt-1 text-xs font-black text-[#9b6ff2]">
                            {card.phonetic}
                          </p>
                        )}
                      </div>
                      <span className="rounded-xl bg-[#f4ecfb] px-3 py-1 text-xs font-black text-[#a129f0]">
                        {card.type}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-black leading-6 text-[#151522]">
                      {card.meaning}
                    </p>
                    {card.note && (
                      <p className="mt-2 text-sm leading-6 text-[#8b8192]">
                        {card.note}
                      </p>
                    )}
                    {card.example && (
                      <div className="mt-3 rounded-xl border-l-4 border-[#c9a7ff] bg-[#fbf8ff] p-3 text-sm italic leading-6 text-[#5f536f]">
                        “{card.example}”
                        {card.translation && (
                          <p className="mt-2 text-xs not-italic text-[#8b8192]">
                            {card.translation}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
