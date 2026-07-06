"use client";

import { useId, useState } from "react";
import { CheckCircle2, UploadCloud, X } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn, formatFileSize } from "@/lib/utils";

export function FileDropField({
  label,
  required,
  accept,
  hint,
  file,
  onChange,
}: {
  label: string;
  required?: boolean;
  accept: string;
  hint: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const id = useId();
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    onChange(files?.[0] ?? null);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-5 text-center shadow-soft transition-all hover:-translate-y-0.5",
          dragOver
            ? "border-foreground bg-accent"
            : file
              ? "border-emerald-700 bg-emerald-100"
              : "border-foreground bg-white hover:bg-accent/40"
        )}
      >
        <input
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {file ? (
          <>
            <CheckCircle2 className="h-6 w-6 text-emerald-700" />
            <p className="max-w-full truncate text-sm font-bold text-emerald-800">{file.name}</p>
            <p className="font-mono text-xs text-emerald-800/80">
              {formatFileSize(file.size)} · 点击可重新选择
            </p>
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-1 rounded-md border-2 border-emerald-800 bg-white px-2 py-1 text-xs font-bold text-emerald-800"
              onClick={(e) => {
                e.preventDefault();
                onChange(null);
              }}
            >
              <X className="h-3 w-3" />
              移除文件
            </button>
          </>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">点击或拖拽文件到这里</p>
            <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
          </>
        )}
      </label>
    </div>
  );
}
