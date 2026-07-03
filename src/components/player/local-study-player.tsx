"use client";

import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Mic,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  Square,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type StudyVideo = {
  id: string;
  title: string;
  fileName: string;
  streamUrl: string;
};

type Segment = {
  id: string;
  index: number;
  start: number;
  end: number;
};

const SEGMENT_SECONDS = 5;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function makeSegments(duration: number) {
  const safeDuration = Math.max(duration, SEGMENT_SECONDS);
  const count = Math.ceil(safeDuration / SEGMENT_SECONDS);
  return Array.from({ length: count }, (_, index) => {
    const start = index * SEGMENT_SECONDS;
    const end = Math.min(start + SEGMENT_SECONDS, safeDuration);
    return {
      id: `segment-${index + 1}`,
      index,
      start,
      end,
    };
  });
}

export function LocalStudyPlayer({ video }: { video: StudyVideo }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.75);
  const [loopSegment, setLoopSegment] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [error, setError] = useState("");

  const noteKey = `shadow-local-notes:${video.id}`;
  const segments = useMemo(() => makeSegments(duration), [duration]);
  const activeSegment =
    segments.find(
      (segment) => currentTime >= segment.start && currentTime < segment.end,
    ) ?? segments[0];

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
      const nextSegment =
        segments.find(
          (segment) => nextTime >= segment.start && nextTime < segment.end,
        ) ?? segments[0];

      if (loopSegment && nextSegment && nextTime >= nextSegment.end - 0.04) {
        mediaEl.currentTime = nextSegment.start;
        setCurrentTime(nextSegment.start);
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
  }, [loopSegment, segments]);

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
    seek(segment.start);
  }

  function moveSegment(offset: -1 | 1) {
    const nextIndex = Math.min(
      Math.max(activeSegment.index + offset, 0),
      segments.length - 1,
    );
    seekSegment(segments[nextIndex]);
  }

  function replaySegment() {
    seekSegment(activeSegment);
    if (isPlaying) {
      void videoRef.current?.play();
    }
  }

  function saveNotes(nextNotes = notes) {
    window.localStorage.setItem(noteKey, JSON.stringify(nextNotes));
  }

  function updateNote(value: string) {
    const nextNotes = { ...notes, [activeSegment.id]: value };
    setNotes(nextNotes);
    saveNotes(nextNotes);
  }

  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("当前浏览器不支持录音。");
      return;
    }

    try {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
        setRecordingUrl("");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setRecordingUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError("无法访问麦克风，请检查浏览器权限。");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-white text-[#14131f]">
      <section className="demo-grid grid min-h-[calc(100vh-4rem)]">
        <div className="min-w-0 border-r border-[#eee9f3] bg-white">
          <div className="relative bg-[#303030]">
            <video
              ref={videoRef}
              src={video.streamUrl}
              className="aspect-video w-full bg-[#303030] object-contain"
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
                <Expand size={17} />
              </div>
            </div>
          </div>

          <div className="flex h-[54px] items-center justify-between border-b border-[#f4edf8] px-6 text-sm font-semibold text-[#9a91a7]">
            <span>视频简介</span>
            <span className="max-w-[60%] truncate text-[#6e6478]">
              {video.fileName}
            </span>
          </div>

          <div className="mx-auto flex h-[78px] max-w-[560px] items-center justify-between border-b-4 border-[#f2e8fb] px-4 text-[#7d738b]">
            <button
              type="button"
              title="片段循环"
              onClick={() => setLoopSegment((value) => !value)}
              className={`grid size-11 place-items-center rounded-md ${
                loopSegment ? "text-[#9b4bf4]" : "text-[#7d738b]"
              }`}
            >
              <RefreshCw size={22} />
            </button>
            <button
              type="button"
              title="上一段"
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
              title="下一段"
              onClick={() => moveSegment(1)}
              className="grid size-11 place-items-center rounded-md"
            >
              <ChevronRight size={25} />
            </button>
            <button
              type="button"
              title="重播当前段"
              onClick={replaySegment}
              className="grid size-11 place-items-center rounded-md"
            >
              <RotateCcw size={22} />
            </button>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col bg-white">
          <div className="flex h-[58px] items-center justify-between border-b border-[#eee9f3] px-4">
            <h2 className="text-base font-black">听力练习</h2>
            <div className="flex items-center gap-4 text-xs font-black text-[#b08ee4]">
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
              <button type="button" onClick={() => setLoopSegment((v) => !v)}>
                {loopSegment ? "循环" : "顺序"}
              </button>
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                className="flex items-center gap-1"
              >
                {recording ? <Square size={13} /> : <Mic size={13} />}
                跟读
              </button>
            </div>
          </div>

          <section className="border-b border-[#f2edf6] bg-[#fbf8ff] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[#b08ee4]">
                  {formatTime(activeSegment.start)} - {formatTime(activeSegment.end)}
                </p>
                <h3 className="mt-1 text-lg font-black">
                  听写片段 {String(activeSegment.index + 1).padStart(2, "0")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => saveNotes()}
                className="grid size-10 place-items-center rounded-xl bg-white text-[#9b4bf4] shadow-sm"
                aria-label="保存听写"
              >
                <Save size={18} />
              </button>
            </div>
            <textarea
              value={notes[activeSegment.id] ?? ""}
              onChange={(event) => updateNote(event.target.value)}
              placeholder="写下你听到的英文..."
              className="mt-4 min-h-32 w-full resize-none rounded-2xl border border-[#eadff2] bg-white p-4 text-base font-semibold leading-7 text-[#202033] placeholder:text-[#c0b3cc]"
            />
            {recordingUrl && (
              <audio controls src={recordingUrl} className="mt-4 w-full">
                <track kind="captions" />
              </audio>
            )}
            {error && (
              <p className="mt-3 rounded-xl bg-[#fff1f2] px-3 py-2 text-sm font-semibold text-[#be123c]">
                {error}
              </p>
            )}
          </section>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {segments.map((segment) => {
              const active = segment.id === activeSegment.id;
              return (
                <button
                  key={segment.id}
                  type="button"
                  onClick={() => seekSegment(segment)}
                  className={`mb-3 block w-full rounded-2xl border px-4 py-4 text-left ${
                    active
                      ? "border-[#d7c2f4] bg-[#fbf8ff]"
                      : "border-[#f2edf6] bg-white hover:bg-[#fbf8ff]"
                  }`}
                >
                  <span className="text-xs font-black text-[#b9a5d4]">
                    {formatTime(segment.start)} - {formatTime(segment.end)}
                  </span>
                  <span className="mt-2 block text-base font-black text-[#151522]">
                    听写片段 {String(segment.index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-[#8b8192]">
                    {notes[segment.id] ? notes[segment.id] : "暂无听写内容"}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}
