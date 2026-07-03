"use client";

import { Mic, RotateCcw, Square, Waves } from "lucide-react";
import { useRef, useState } from "react";
import type { SubtitleLine } from "@/lib/types";

type RecordingPanelProps = {
  activeLine: SubtitleLine;
  panelRef: React.RefObject<HTMLDivElement | null>;
};

export function RecordingPanel({ activeLine, panelRef }: RecordingPanelProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function startRecording() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("当前浏览器不支持录音。");
      return;
    }

    try {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl("");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setAudioUrl(URL.createObjectURL(blob));
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

  function resetRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    setError("");
  }

  return (
    <section
      ref={panelRef}
      className="rounded-lg border border-[#e5deef] bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-[#7c3aed]">
            shadowing
          </p>
          <h2 className="mt-1 text-lg font-black">录音跟读</h2>
        </div>
        <span className="grid size-9 place-items-center rounded-lg bg-[#ecfeff] text-[#0e7490]">
          <Waves size={18} />
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-[#eee8f5] bg-[#fbfaff] p-3">
        <p className="text-sm font-black leading-6 text-[#171421]">
          {activeLine.english}
        </p>
        <p className="mt-1 text-sm leading-6 text-[#71687d]">
          {activeLine.chinese}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            className="flex h-10 items-center gap-2 rounded-md bg-[#7c3aed] px-4 text-sm font-bold text-white hover:bg-[#6d28d9]"
          >
            <Mic size={17} />
            开始录音
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex h-10 items-center gap-2 rounded-md bg-[#dc2626] px-4 text-sm font-bold text-white hover:bg-[#b91c1c]"
          >
            <Square size={16} />
            停止录音
          </button>
        )}
        <button
          type="button"
          onClick={resetRecording}
          className="flex h-10 items-center gap-2 rounded-md border border-[#ddd4ea] px-4 text-sm font-bold text-[#3a3048] hover:bg-[#f7f2ff]"
        >
          <RotateCcw size={16} />
          重录
        </button>
      </div>

      {audioUrl && (
        <audio controls src={audioUrl} className="mt-4 w-full">
          <track kind="captions" />
        </audio>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-[#fff1f2] px-3 py-2 text-sm font-semibold text-[#be123c]">
          {error}
        </p>
      )}
    </section>
  );
}
