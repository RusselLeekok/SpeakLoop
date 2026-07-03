"use client";

import {
  ChevronLeft,
  ChevronRight,
  Mic,
  Pause,
  Play,
  Repeat2,
} from "lucide-react";
import type { LoopMode, SubtitleLine } from "@/lib/types";

type SentenceControlsProps = {
  activeLine: SubtitleLine;
  isPlaying: boolean;
  loopMode: LoopMode;
  onPrevious: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onReplayLine: () => void;
  onLoopModeChange: (mode: LoopMode) => void;
  onFocusRecording: () => void;
};

function formatStamp(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function SentenceControls({
  activeLine,
  isPlaying,
  loopMode,
  onPrevious,
  onNext,
  onPlayPause,
  onReplayLine,
  onLoopModeChange,
  onFocusRecording,
}: SentenceControlsProps) {
  return (
    <div className="rounded-lg border border-[#e5deef] bg-white p-3 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-xs font-black text-[#8b7c99]">
            {formatStamp(activeLine.startTime)} - {formatStamp(activeLine.endTime)}
          </p>
          <p className="mt-1 truncate text-sm font-black text-[#171421]">
            {activeLine.english}
          </p>
        </div>
        <div className="grid grid-cols-7 gap-2 sm:flex sm:items-center">
          <button
            type="button"
            onClick={() =>
              onLoopModeChange(loopMode === "sentence" ? "off" : "sentence")
            }
            className={`grid size-10 place-items-center rounded-md border ${
              loopMode === "sentence"
                ? "border-[#fde68a] bg-[#fef3c7] text-[#8a5a00]"
                : "border-[#e5deef] text-[#62586f] hover:bg-[#fbfaff]"
            }`}
            aria-label="单句循环"
            title="单句循环"
          >
            <Repeat2 size={18} />
          </button>
          <button
            type="button"
            onClick={onPrevious}
            className="grid size-10 place-items-center rounded-md border border-[#e5deef] text-[#62586f] hover:bg-[#fbfaff]"
            aria-label="上一句"
            title="上一句"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={onPlayPause}
            className="col-span-2 grid h-10 place-items-center rounded-md bg-[#171421] text-white hover:bg-[#2a2038] sm:w-12"
            aria-label={isPlaying ? "暂停" : "播放"}
            title={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={21} />}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="grid size-10 place-items-center rounded-md border border-[#e5deef] text-[#62586f] hover:bg-[#fbfaff]"
            aria-label="下一句"
            title="下一句"
          >
            <ChevronRight size={20} />
          </button>
          <button
            type="button"
            onClick={onReplayLine}
            className="grid size-10 place-items-center rounded-md border border-[#e5deef] text-[#62586f] hover:bg-[#fbfaff]"
            aria-label="重播当前句"
            title="重播当前句"
          >
            <Play size={17} />
          </button>
          <button
            type="button"
            onClick={onFocusRecording}
            className="grid size-10 place-items-center rounded-md bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
            aria-label="录音跟读"
            title="录音跟读"
          >
            <Mic size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
