"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Captions, Clock, Search } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { VideoCover } from "@/components/video-cover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { getLocalProgress } from "@/lib/local-progress";
import type { Progress, VideoPublic } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";

const fallbackCategories = ["热门", "基础口语", "电影精选", "商业演讲"];

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const token = useAuthStore((s) => s.token);

  const { data: videos, isError, isLoading } = useQuery({
    queryKey: ["videos", search, category],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("keyword", search);
      if (category) params.set("category", category);
      const qs = params.toString();
      return api.get<VideoPublic[]>(`/api/videos${qs ? `?${qs}` : ""}`);
    },
    retry: false,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<string[]>("/api/videos/categories"),
    retry: false,
  });

  const { data: serverProgress } = useQuery({
    queryKey: ["my-progress", token],
    queryFn: () => api.get<Progress[]>("/api/progress"),
    enabled: !!token,
  });

  const progressMap = useMemo(() => {
    const map = new Map<number, number>();
    serverProgress?.forEach((p) => map.set(p.video_id, p.last_time_ms));
    return map;
  }, [serverProgress]);

  const visibleVideos = videos ?? [];
  const categoryOptions = categories && categories.length > 0 ? categories : fallbackCategories;

  return (
    <div className="min-h-screen bg-aurora">
      <SiteHeader />

      <main id="main-content" className="container pb-14 pt-5">
        <div className="sticky top-16 z-30 -mx-1 mb-5 space-y-3 bg-background/86 px-1 py-3 backdrop-blur-xl">
          <form
            className="flex max-w-2xl gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(keyword.trim());
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索视频"
                className="h-11 rounded-full bg-white pl-10"
              />
            </div>
            <Button type="submit" variant="brand" className="h-11 rounded-full px-5">
              搜索
            </Button>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <CategoryChip active={category === null} onClick={() => setCategory(null)}>
              全部
            </CategoryChip>
            {categoryOptions.map((item) => (
              <CategoryChip
                key={item}
                active={category === item}
                onClick={() => setCategory(category === item ? null : item)}
              >
                {item}
              </CategoryChip>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-end justify-between gap-3">
          <h1 className="text-xl font-black tracking-[-0.02em]">
            {search || category ? "筛选结果" : "推荐素材"}
          </h1>
          <p className="text-sm font-semibold text-muted-foreground">
            {isError ? "素材库未连接" : isLoading ? "加载中" : `${visibleVideos.length} 个视频`}
          </p>
        </div>

        {isLoading ? (
          <VideoGridSkeleton />
        ) : visibleVideos.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleVideos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                delay={index}
                progressMs={progressMap.get(video.id) ?? getLocalProgress(video.id)?.last_time_ms ?? 0}
              />
            ))}
          </div>
        ) : (
          <EmptyVideoState connectionError={isError} hasFilter={!!(search || category)} />
        )}
      </main>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all active:translate-y-px",
        active
          ? "bg-foreground text-white shadow-soft"
          : "bg-white/76 text-foreground hover:bg-white hover:shadow-sm"
      )}
    >
      {children}
    </button>
  );
}

function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function EmptyVideoState({
  connectionError,
  hasFilter,
}: {
  connectionError: boolean;
  hasFilter: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div className="col-span-full py-16 text-center">
        <h2 className="text-lg font-black">
          {connectionError ? "暂时连不上素材库" : hasFilter ? "没有找到匹配视频" : "还没有公开视频"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-muted-foreground">
          {connectionError
            ? "启动后端服务后，这里会直接显示视频缩略图列表。"
            : hasFilter
              ? "换个关键词或分类再试。"
              : "管理员发布视频后，这里会直接进入视频流。"}
        </p>
      </div>
    </div>
  );
}

function VideoCard({
  video,
  progressMs,
  delay,
}: {
  video: VideoPublic;
  progressMs: number;
  delay: number;
}) {
  const hasProgress = progressMs > 3000;
  const progressPercent =
    hasProgress && video.duration ? Math.min(100, (progressMs / 1000 / video.duration) * 100) : 0;

  return (
    <Link
      href={`/videos/${video.id}`}
      style={{ animationDelay: `${Math.min(delay, 12) * 18}ms` }}
      className="group animate-fade-up block"
    >
      <div className="relative overflow-hidden rounded-2xl bg-secondary shadow-soft transition-all group-hover:-translate-y-0.5 group-hover:shadow-elevated">
        <VideoCover src={video.cover_url} alt={video.title} className="rounded-2xl" />
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-foreground/82 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">
          <Clock className="h-3 w-3" />
          {formatDuration(video.duration)}
        </span>
        {progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-white/70">
            <div className="h-full rounded-r-full bg-brand" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <h2 className="line-clamp-2 min-h-[2.6rem] text-[15px] font-black leading-snug tracking-[-0.01em] group-hover:text-brand">
          {video.title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-muted-foreground">
          {video.category && <Badge variant="secondary">{video.category}</Badge>}
          <span className="flex items-center gap-1">
            <Captions className="h-3.5 w-3.5" />
            {video.subtitle_count} 句
          </span>
          <span>{hasProgress ? "继续学习" : "开始学习"}</span>
        </div>
        {video.description && (
          <p className="line-clamp-2 text-sm font-medium leading-6 text-muted-foreground">
            {video.description}
          </p>
        )}
      </div>
    </Link>
  );
}
