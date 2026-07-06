"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { AdminSubtitles, Subtitle, VideoAdmin } from "@/lib/types";
import { cn, formatMs } from "@/lib/utils";

function findIndexAt(currentMs: number, subtitles: Subtitle[]): number {
  let left = 0;
  let right = subtitles.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const item = subtitles[mid];
    if (currentMs < item.start_ms) right = mid - 1;
    else if (currentMs >= item.end_ms) left = mid + 1;
    else return mid;
  }
  return -1;
}

export default function AdminSubtitlesPage() {
  const params = useParams<{ videoId: string }>();
  const videoId = Number(params.videoId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const currentIndexRef = useRef(-1);

  const { data: video } = useQuery({
    queryKey: ["admin-video", videoId],
    queryFn: () => api.get<VideoAdmin>(`/api/admin/videos/${videoId}`),
    enabled: Number.isFinite(videoId),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subtitles", videoId],
    queryFn: () => api.get<AdminSubtitles>(`/api/admin/videos/${videoId}/subtitles`),
    enabled: Number.isFinite(videoId),
  });

  const subtitles = data?.subtitles;

  useEffect(() => {
    if (!subtitles || subtitles.length === 0) return;
    let rafId: number;
    const sync = () => {
      const el = videoRef.current;
      if (el) {
        const idx = findIndexAt(Math.floor(el.currentTime * 1000), subtitles);
        if (idx !== currentIndexRef.current) {
          currentIndexRef.current = idx;
          setCurrentIndex(idx);
        }
      }
      rafId = requestAnimationFrame(sync);
    };
    rafId = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(rafId);
  }, [subtitles]);

  function seekTo(sub: Subtitle) {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = sub.start_ms / 1000 + 0.001;
    void el.play();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/videos/${videoId}/edit`} aria-label="返回编辑页">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl font-bold tracking-normal">
            字幕预览{video ? ` · ${video.title}` : ""}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
            {video && <StatusBadge status={video.status} />}
            <span>点击任意字幕行可跳转播放，检查时间轴是否匹配。</span>
          </p>
        </div>
      </div>

      {data && data.warnings.length > 0 && (
        <Card className="border-amber-700 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              解析警告（{data.warnings.length}）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-bold text-amber-900">
            {data.warnings.map((w) => (
              <p key={w.id}>· {w.message}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="order-2 bg-white lg:order-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">
              字幕列表{data ? `（${data.subtitle_count} 句）` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : subtitles && subtitles.length > 0 ? (
              <div className="thin-scrollbar max-h-[70vh] overflow-y-auto p-3">
                <table className="w-full overflow-hidden rounded-md border-2 border-foreground bg-white text-sm shadow-soft">
                  <thead className="sticky top-0 bg-accent text-xs text-foreground">
                    <tr className="border-b-2 border-foreground">
                      <th className="px-3 py-2 text-left font-mono font-bold">#</th>
                      <th className="px-3 py-2 text-left font-mono font-bold">start</th>
                      <th className="px-3 py-2 text-left font-mono font-bold">end</th>
                      <th className="px-3 py-2 text-left font-bold">内容</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subtitles.map((s, i) => (
                      <tr
                        key={s.id}
                        onClick={() => seekTo(s)}
                        className={cn(
                          "cursor-pointer border-b-2 border-foreground/15 transition-colors",
                          i === currentIndex ? "bg-accent/70" : "hover:bg-accent/30"
                        )}
                      >
                        <td className="px-3 py-2 align-top font-mono text-muted-foreground">
                          {s.sort_order + 1}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 align-top font-mono text-muted-foreground">
                          {s.start_ms}
                          <span className="block text-[11px]">{formatMs(s.start_ms)}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 align-top font-mono text-muted-foreground">
                          {s.end_ms}
                          <span className="block text-[11px]">{formatMs(s.end_ms)}</span>
                        </td>
                        <td className="px-3 py-2">
                          <p className={cn("font-semibold", i === currentIndex && "font-bold text-foreground")}>
                            {s.en_text}
                          </p>
                          {s.zh_text && <p className="text-xs font-semibold text-muted-foreground">{s.zh_text}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="doodle-note m-4 rounded-md py-12 text-center text-sm font-bold text-foreground">
                没有字幕数据。请在编辑页重新上传字幕。
              </p>
            )}
          </CardContent>
        </Card>

        <div className="order-1 lg:order-2">
          <div className="sticky top-6 overflow-hidden rounded-lg border-2 border-foreground bg-secondary shadow-soft">
            {video ? (
              <video ref={videoRef} src={video.file_url} controls className="aspect-video w-full" />
            ) : (
              <Skeleton className="aspect-video w-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
