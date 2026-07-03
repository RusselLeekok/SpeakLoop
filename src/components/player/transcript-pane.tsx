"use client";

import { EyeOff, Languages, Star } from "lucide-react";
import type { SubtitleLine, SubtitleMode } from "@/lib/types";

type FontSize = "sm" | "md" | "lg";

type TranscriptPaneProps = {
  lines: SubtitleLine[];
  activeLineId: string;
  favorites: string[];
  subtitleMode: SubtitleMode;
  fontSize: FontSize;
  onSeekLine: (line: SubtitleLine) => void;
  onFavoriteToggle: (lineId: string) => void;
  onSubtitleModeChange: (mode: SubtitleMode) => void;
  onFontSizeChange: (size: FontSize) => void;
};

const fontClasses: Record<FontSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

function formatStamp(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function TranscriptPane({
  lines,
  activeLineId,
  favorites,
  subtitleMode,
  fontSize,
  onSeekLine,
  onFavoriteToggle,
  onSubtitleModeChange,
  onFontSizeChange,
}: TranscriptPaneProps) {
  return (
    <aside className="flex min-h-[560px] flex-col rounded-lg border border-[#e5deef] bg-white shadow-sm">
      <div className="border-b border-[#ece7f4] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-[#7c3aed]">
              transcript
            </p>
            <h2 className="text-lg font-black">动态字幕</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="字幕：双语"
              onClick={() => onSubtitleModeChange("bilingual")}
              className={`grid size-9 place-items-center rounded-md border ${
                subtitleMode === "bilingual"
                  ? "border-[#c4b5fd] bg-[#f4f0ff] text-[#6d28d9]"
                  : "border-[#ece7f4] text-[#746a80] hover:bg-[#fbfaff]"
              }`}
            >
              <Languages size={17} />
            </button>
            <button
              type="button"
              title="字幕：仅英文"
              onClick={() => onSubtitleModeChange("english")}
              className={`h-9 rounded-md border px-2 text-xs font-black ${
                subtitleMode === "english"
                  ? "border-[#c4b5fd] bg-[#f4f0ff] text-[#6d28d9]"
                  : "border-[#ece7f4] text-[#746a80] hover:bg-[#fbfaff]"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              title="隐藏字幕"
              onClick={() => onSubtitleModeChange("hidden")}
              className={`grid size-9 place-items-center rounded-md border ${
                subtitleMode === "hidden"
                  ? "border-[#c4b5fd] bg-[#f4f0ff] text-[#6d28d9]"
                  : "border-[#ece7f4] text-[#746a80] hover:bg-[#fbfaff]"
              }`}
            >
              <EyeOff size={17} />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {(["sm", "md", "lg"] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onFontSizeChange(size)}
              className={`h-8 rounded-md px-3 text-xs font-black ${
                fontSize === size
                  ? "bg-[#171421] text-white"
                  : "bg-[#f4f0f8] text-[#62586f] hover:bg-[#ebe5f3]"
              }`}
            >
              字{size === "sm" ? "小" : size === "md" ? "中" : "大"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {lines.map((line) => {
          const active = line.id === activeLineId;
          const favorited = favorites.includes(line.id);
          return (
            <article
              key={line.id}
              className={`mb-3 rounded-lg border p-3 ${
                active
                  ? "border-[#c4b5fd] bg-[#f4f0ff]"
                  : "border-[#eee8f5] bg-[#fbfaff] hover:border-[#ddd4ea]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSeekLine(line)}
                  className="rounded-md px-1 text-xs font-black text-[#8b7c99] hover:bg-white"
                >
                  {formatStamp(line.startTime)}
                </button>
                <button
                  type="button"
                  onClick={() => onFavoriteToggle(line.id)}
                  className={`grid size-8 place-items-center rounded-md ${
                    favorited
                      ? "text-[#d97706]"
                      : "text-[#b3a8c0] hover:bg-white hover:text-[#7c3aed]"
                  }`}
                  aria-label={favorited ? "取消收藏" : "收藏句子"}
                >
                  <Star size={17} fill={favorited ? "currentColor" : "none"} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onSeekLine(line)}
                className="mt-1 block w-full rounded-md p-1 text-left hover:bg-white/70"
              >
                {subtitleMode !== "hidden" && (
                  <p
                    className={`${fontClasses[fontSize]} font-black leading-7 text-[#21192e]`}
                  >
                    {line.english}
                  </p>
                )}
                {subtitleMode === "bilingual" && (
                  <p className="mt-1 text-sm leading-6 text-[#71687d]">
                    {line.chinese}
                  </p>
                )}
                {subtitleMode === "hidden" && (
                  <p className="text-sm font-semibold text-[#8b7c99]">
                    字幕已隐藏，点击仍可跳转到这一句。
                  </p>
                )}
              </button>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
