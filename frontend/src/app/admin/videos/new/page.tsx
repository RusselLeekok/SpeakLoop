"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

import { FileDropField } from "@/components/file-drop-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadWithProgress } from "@/lib/api";
import type { UploadResult } from "@/lib/types";
import { cn } from "@/lib/utils";

function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(isFinite(el.duration) ? el.duration : null);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    el.src = url;
  });
}

function readFirstFrameCover(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.muted = true;
    el.playsInline = true;

    const cleanup = () => URL.revokeObjectURL(url);
    const fail = () => {
      cleanup();
      resolve(null);
    };

    el.onerror = fail;
    el.onloadedmetadata = () => {
      el.currentTime = Math.min(0.1, Math.max(0, (el.duration || 1) - 0.1));
    };
    el.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = el.videoWidth || 1280;
        canvas.height = el.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          fail();
          return;
        }
        ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          cleanup();
          resolve(blob);
        }, "image/jpeg", 0.86);
      } catch {
        fail();
      }
    };

    el.src = url;
  });
}

export default function AdminVideoNewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [enFile, setEnFile] = useState<File | null>(null);
  const [zhFile, setZhFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [firstFrameCover, setFirstFrameCover] = useState<Blob | null>(null);
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFirstFrameCover(null);
    setFirstFrameUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (!videoFile) return;

    readFirstFrameCover(videoFile).then((blob) => {
      if (cancelled || !blob) return;
      setFirstFrameCover(blob);
      setFirstFrameUrl(URL.createObjectURL(blob));
    });

    return () => {
      cancelled = true;
    };
  }, [videoFile]);

  useEffect(() => {
    return () => {
      if (firstFrameUrl) URL.revokeObjectURL(firstFrameUrl);
    };
  }, [firstFrameUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!videoFile) {
      setError("请选择视频文件（.mp4 / .webm）。");
      return;
    }
    if (!enFile) {
      setError("请选择英文字幕文件（.vtt / .srt）。");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const duration = await readVideoDuration(videoFile);
      const fd = new FormData();
      fd.set("title", title.trim());
      if (description.trim()) fd.set("description", description.trim());
      if (category.trim()) fd.set("category", category.trim());
      fd.set("publish_now", String(publishNow));
      if (duration != null) fd.set("duration", String(duration));
      fd.set("video_file", videoFile);
      fd.set("en_subtitle_file", enFile);
      if (zhFile) fd.set("zh_subtitle_file", zhFile);
      if (coverFile) fd.set("cover_file", coverFile);
      else if (firstFrameCover) fd.set("cover_file", firstFrameCover, "cover-first-frame.jpg");

      const res = await uploadWithProgress<UploadResult>("/api/admin/videos", fd, setProgress);
      setResult(res);
      void queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/videos" aria-label="返回视频列表">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-normal">新增视频</h1>
          <p className="text-sm font-semibold text-muted-foreground">上传视频与字幕，系统会解析字幕并生成逐句练习。</p>
        </div>
      </div>

      <Card className="bg-white">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">
                视频标题 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：日常口语 · 咖啡店点单"
                required
                maxLength={255}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="例如：基础口语 / TED / 电影精选"
                  maxLength={100}
                />
              </div>
              <div className="flex items-end pb-1.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
                  <Switch checked={publishNow} onCheckedChange={setPublishNow} />
                  解析成功后立即发布
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">视频简介</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简单介绍视频内容、适合的学习水平或练习重点。"
                rows={3}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FileDropField label="视频文件" required accept=".mp4,.webm" hint="支持 .mp4 / .webm" file={videoFile} onChange={setVideoFile} />
              <FileDropField label="封面图" accept=".jpg,.jpeg,.png,.webp" hint="可选；不上传时自动使用视频第一帧" file={coverFile} onChange={setCoverFile} />
              <FileDropField label="英文字幕" required accept=".vtt,.srt" hint="支持 .vtt / .srt，推荐 .vtt" file={enFile} onChange={setEnFile} />
              <FileDropField label="中文字幕" accept=".vtt,.srt" hint="可选；按时间轴自动对齐英文字幕" file={zhFile} onChange={setZhFile} />
            </div>

            {videoFile && (
              <div className="doodle-note rounded-md p-3">
                <div className="flex flex-wrap items-center gap-3">
                  {coverFile ? (
                    <p className="text-sm font-bold">已选择自定义封面：{coverFile.name}</p>
                  ) : firstFrameUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={firstFrameUrl} alt="视频第一帧封面预览" className="aspect-video w-32 rounded-md border-2 border-foreground object-cover" />
                      <p className="text-sm font-bold">未选择封面图，将自动使用视频第一帧。</p>
                    </>
                  ) : (
                    <p className="text-sm font-bold">正在读取视频第一帧作为默认封面...</p>
                  )}
                </div>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-muted-foreground">
                  <span>{progress < 100 ? "正在上传..." : "上传完成，正在解析字幕..."}</span>
                  <span>{progress}%</span>
                </div>
                <ProgressBar value={progress} />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-md border-2 border-destructive bg-red-50 px-4 py-3 text-sm font-bold text-destructive">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" variant="brand" disabled={uploading}>
                {uploading ? "上传中..." : "保存并解析字幕"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/videos">取消</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && <UploadResultCard result={result} onGoList={() => router.push("/admin/videos")} />}
    </div>
  );
}

function UploadResultCard({
  result,
  onGoList,
}: {
  result: UploadResult;
  onGoList: () => void;
}) {
  const failed = result.status === "failed";
  return (
    <Card className={cn("animate-fade-up bg-white shadow-soft", failed ? "border-red-700" : "border-emerald-700")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          {failed ? (
            <>
              <XCircle className="h-5 w-5 text-red-700" />
              字幕解析失败
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              {result.status === "published" ? "已上传并发布" : "上传成功，等待发布"}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm font-semibold">
        {failed ? (
          <p className="text-red-700">{result.message}</p>
        ) : (
          <p className="text-muted-foreground">
            共解析出 <span className="font-bold text-foreground">{result.subtitle_count}</span> 句字幕。
          </p>
        )}
        {result.warnings.length > 0 && (
          <div className="space-y-2 rounded-md border-2 border-amber-700 bg-amber-50 p-3">
            {result.warnings.map((w, i) => (
              <p key={i} className="flex items-start gap-2 text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {!failed && (
            <Button size="sm" asChild>
              <Link href={`/admin/videos/${result.video_id}/subtitles`}>检查字幕解析结果</Link>
            </Button>
          )}
          {failed && (
            <Button size="sm" asChild>
              <Link href={`/admin/videos/${result.video_id}/edit`}>重新上传字幕</Link>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onGoList}>
            返回视频列表
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
