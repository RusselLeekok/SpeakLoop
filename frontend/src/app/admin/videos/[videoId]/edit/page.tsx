"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

import { FileDropField } from "@/components/file-drop-field";
import { StatusBadge } from "@/components/status-badge";
import { VideoCover } from "@/components/video-cover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api, uploadWithProgress } from "@/lib/api";
import type { ReuploadResult, VideoAdmin, VideoStatus } from "@/lib/types";
import { formatDuration, formatFileSize } from "@/lib/utils";

function parseTagsInput(value: string) {
  const seen = new Set<string>();
  return value
    .split(/[,，、\n]/)
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export default function AdminVideoEditPage() {
  const params = useParams<{ videoId: string }>();
  const videoId = Number(params.videoId);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: video, isLoading } = useQuery({
    queryKey: ["admin-video", videoId],
    queryFn: () => api.get<VideoAdmin>(`/api/admin/videos/${videoId}`),
    enabled: Number.isFinite(videoId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-video", videoId] });
    void queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  if (isLoading || !video) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/videos" aria-label="返回视频列表">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl font-bold tracking-normal">{video.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold text-muted-foreground">
            <StatusBadge status={video.status} />
            <span>{formatDuration(video.duration)}</span>
            <span>{formatFileSize(video.file_size)}</span>
            <span>{video.subtitle_count} 句字幕</span>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/videos/${video.id}/subtitles`}>字幕预览</Link>
        </Button>
      </div>

      <BasicInfoCard video={video} onSaved={invalidate} />
      <CoverCard video={video} onSaved={invalidate} />
      <ReuploadCard video={video} onSaved={invalidate} />
      <DangerCard video={video} onChanged={invalidate} onDeleted={() => router.push("/admin/videos")} />
    </div>
  );
}

function BasicInfoCard({ video, onSaved }: { video: VideoAdmin; onSaved: () => void }) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description ?? "");
  const [tagsInput, setTagsInput] = useState((video.tags?.length ? video.tags : video.category ? [video.category] : []).join("，"));
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setTitle(video.title);
    setDescription(video.description ?? "");
    setTagsInput((video.tags?.length ? video.tags : video.category ? [video.category] : []).join("，"));
  }, [video]);

  const mutation = useMutation({
    mutationFn: () => {
      const tags = parseTagsInput(tagsInput);
      if (tags.length > 4) throw new Error("一个视频最多只能设置 4 个标签。");
      return api.put(`/api/admin/videos/${video.id}`, {
        title: title.trim(),
        description,
        tags,
      });
    },
    onSuccess: () => {
      setMessage("已保存");
      onSaved();
    },
    onError: (e) => setMessage(e instanceof Error ? e.message : "保存失败"),
  });

  return (
    <section className="surface bg-white p-6">
      <h2 className="text-2xl font-bold">基本信息</h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          mutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="title">标题</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">标签（最多 4 个）</Label>
          <Input
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="例如：A1入门，生活vlog，美食"
          />
          <p className="text-xs font-semibold text-muted-foreground">用逗号、顿号或换行分隔。</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">简介</Label>
          <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="brand" disabled={mutation.isPending}>
            {mutation.isPending ? "保存中..." : "保存修改"}
          </Button>
          {message && <span className="text-sm font-bold text-muted-foreground">{message}</span>}
        </div>
      </form>
    </section>
  );
}

function CoverCard({ video, onSaved }: { video: VideoAdmin; onSaved: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function upload() {
    if (!file) return;
    setPending(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.set("cover_file", file);
      await uploadWithProgress(`/api/admin/videos/${video.id}/cover`, fd, () => {});
      setMessage("封面已更新");
      setFile(null);
      onSaved();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "上传失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="surface bg-white p-6">
      <h2 className="text-2xl font-bold">封面</h2>
      <div className="mt-4 flex flex-wrap items-start gap-5">
        <VideoCover src={video.cover_url} alt={video.title} className="w-52 rounded-lg border-2 border-foreground shadow-soft" />
        <div className="min-w-52 flex-1 space-y-3">
          <FileDropField label="替换封面" accept=".jpg,.jpeg,.png,.webp" hint="支持 .jpg / .png / .webp" file={file} onChange={setFile} />
          <div className="flex items-center gap-3">
            <Button size="sm" variant="brand" onClick={upload} disabled={!file || pending}>
              {pending ? "上传中..." : "替换封面"}
            </Button>
            {message && <span className="text-sm font-bold text-muted-foreground">{message}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReuploadCard({ video, onSaved }: { video: VideoAdmin; onSaved: () => void }) {
  const [enFile, setEnFile] = useState<File | null>(null);
  const [zhFile, setZhFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ReuploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!enFile) {
      setError("请选择英文字幕文件。");
      return;
    }
    setError(null);
    setResult(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("en_subtitle_file", enFile);
      if (zhFile) fd.set("zh_subtitle_file", zhFile);
      const res = await uploadWithProgress<ReuploadResult>(`/api/admin/videos/${video.id}/subtitles/reupload`, fd, setProgress);
      setResult(res);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setPending(false);
    }
  }

  const failed = result?.message != null;

  return (
    <section className="surface bg-white p-6">
      <h2 className="text-2xl font-bold">重新上传字幕</h2>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">
        会替换现有字幕并重新解析；已发布视频在替换成功后保持发布状态。
      </p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FileDropField label="英文字幕" required accept=".vtt,.srt" hint="支持 .vtt / .srt" file={enFile} onChange={setEnFile} />
          <FileDropField label="中文字幕（可选）" accept=".vtt,.srt" hint="按时间轴自动对齐英文字幕" file={zhFile} onChange={setZhFile} />
        </div>
        {pending && <ProgressBar value={progress} />}
        {error && (
          <p className="flex items-center gap-2 text-sm font-bold text-red-700">
            <XCircle className="h-4 w-4" />
            {error}
          </p>
        )}
        {result && (
          <div className={`space-y-2 rounded-md border-2 p-3 text-sm font-bold ${failed ? "border-red-700 bg-red-50" : "border-emerald-700 bg-emerald-50"}`}>
            {failed ? (
              <p className="flex items-start gap-2 text-red-700">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {result.message}（旧字幕保持不变）
              </p>
            ) : (
              <p className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                重新解析成功，共 {result.subtitle_count} 句字幕。
              </p>
            )}
            {result.warnings.map((w, i) => (
              <p key={i} className="flex items-start gap-2 text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}
        <Button type="submit" size="sm" variant="brand" disabled={pending}>
          {pending ? "解析中..." : "上传并重新解析"}
        </Button>
      </form>
    </section>
  );
}

function DangerCard({
  video,
  onChanged,
  onDeleted,
}: {
  video: VideoAdmin;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusMutation = useMutation({
    mutationFn: (newStatus: VideoStatus) => api.put(`/api/admin/videos/${video.id}`, { status: newStatus }),
    onSuccess: onChanged,
    onError: (e) => setError(e instanceof Error ? e.message : "操作失败"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/admin/videos/${video.id}`),
    onSuccess: onDeleted,
    onError: (e) => setError(e instanceof Error ? e.message : "删除失败"),
  });

  return (
    <section className="surface bg-white p-6">
      <h2 className="text-2xl font-bold">发布与删除</h2>
      <div className="mt-4 space-y-3">
        {error && <p className="text-sm font-bold text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-3">
          {(video.status === "ready" || video.status === "unpublished") && (
            <Button variant="brand" onClick={() => statusMutation.mutate("published")} disabled={statusMutation.isPending}>
              发布视频
            </Button>
          )}
          {video.status === "published" && (
            <Button variant="outline" onClick={() => statusMutation.mutate("unpublished")} disabled={statusMutation.isPending}>
              下架视频
            </Button>
          )}
          {video.status === "failed" && (
            <p className="self-center text-sm font-bold text-muted-foreground">
              字幕解析失败，重新上传字幕成功后即可发布。
            </p>
          )}
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            删除视频
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除视频</DialogTitle>
            <DialogDescription>
              确定删除“{video.title}”吗？视频文件、封面、字幕和学习进度都会被永久删除，无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              {deleteMutation.isPending ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
