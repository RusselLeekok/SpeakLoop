"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Captions, Clock, Play, RotateCcw } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { VideoCover } from "@/components/video-cover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { getLocalProgress } from "@/lib/local-progress";
import type { Progress, VideoDetail } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

export default function VideoDetailPage() {
  const params = useParams<{ videoId: string }>();
  const videoId = Number(params.videoId);
  const token = useAuthStore((s) => s.token);

  const { data: video, isLoading, error } = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => api.get<VideoDetail>(`/api/videos/${videoId}`),
    enabled: Number.isFinite(videoId),
  });

  const { data: serverProgress } = useQuery({
    queryKey: ["progress", videoId, token],
    queryFn: () => api.get<Progress | null>(`/api/videos/${videoId}/progress`),
    enabled: !!token && Number.isFinite(videoId),
  });

  const progressMs =
    serverProgress?.last_time_ms ?? getLocalProgress(videoId)?.last_time_ms ?? 0;
  const hasProgress = progressMs > 3000;

  return (
    <div className="min-h-screen bg-aurora">
      <SiteHeader />
      <main className="container max-w-5xl py-8 sm:py-10">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error || !video ? (
          <div className="surface flex flex-col items-center gap-4 rounded-lg border-dashed py-20 text-center">
            <p className="text-lg font-bold">视频不存在或暂未发布</p>
            <Button variant="outline" asChild>
              <Link href="/">返回首页</Link>
            </Button>
          </div>
        ) : (
          <article className="surface animate-fade-up overflow-hidden rounded-lg bg-white p-4 md:p-5">
            <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
              <Link
                href={`/learn/${video.id}`}
                className="group relative block overflow-hidden rounded-lg border border-foreground/12 bg-[#f4efe3] shadow-elevated ring-1 ring-white/80"
                aria-label={`播放 ${video.title}`}
              >
                <VideoCover src={video.cover_url} alt={video.title} className="rounded-lg" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,42,0.72),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,0.12),transparent_26%)]" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-foreground shadow-soft backdrop-blur">
                  素材预览
                </span>
                <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-foreground/78 px-3 py-1 text-xs font-black text-white shadow-soft backdrop-blur">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(video.duration)}
                </span>
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/88 text-foreground shadow-elevated backdrop-blur transition-transform group-hover:scale-105">
                  <Play className="ml-1 h-7 w-7" />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="line-clamp-2 text-xl font-black leading-tight drop-shadow md:text-2xl">
                    {video.title}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold text-white/86">
                    <Captions className="h-4 w-4" />
                    {video.subtitle_count} 句字幕 · 点击进入练习
                  </p>
                </div>
              </Link>
              <div className="flex flex-col justify-between p-6 md:p-8">
                <div className="space-y-5">
                  <div className="swiss-label text-brand">素材详情</div>
                  <div className="flex flex-wrap items-center gap-3">
                    {video.category && <Badge variant="secondary">{video.category}</Badge>}
                    <span className="flex items-center gap-1 rounded-md border-2 border-foreground bg-white px-2 py-1 text-sm font-bold shadow-soft">
                      <Clock className="h-4 w-4" />
                      {formatDuration(video.duration)}
                    </span>
                    <span className="flex items-center gap-1 rounded-md border-2 border-foreground bg-white px-2 py-1 text-sm font-bold shadow-soft">
                      <Captions className="h-4 w-4" />
                      {video.subtitle_count} 句字幕
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold leading-tight tracking-normal md:text-5xl">
                    {video.title}
                  </h1>
                  <p className="doodle-note whitespace-pre-wrap rounded-md p-4 text-sm font-semibold leading-7 text-foreground">
                    {video.description || "暂无简介。可以直接开始练习，边听边建立自己的句子节奏。"}
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button size="lg" variant="brand" asChild>
                    <Link href={`/learn/${video.id}`}>
                      {hasProgress ? <RotateCcw /> : <Play />}
                      {hasProgress
                        ? `继续学习（${formatDuration(progressMs / 1000)}）`
                        : "开始学习"}
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/#materials">返回列表</Link>
                  </Button>
                </div>
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
