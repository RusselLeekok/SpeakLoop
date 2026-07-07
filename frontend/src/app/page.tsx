"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  Captions,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Filter,
  Home,
  Library,
  LogIn,
  LogOut,
  Menu,
  Radio,
  Search,
  Settings,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";

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
const durationFilters = [
  { value: "all", label: "全部时长" },
  { value: "short", label: "10 分钟内" },
  { value: "medium", label: "10-20 分钟" },
  { value: "long", label: "20 分钟以上" },
] as const;
const progressFilters = [
  { value: "all", label: "全部进度" },
  { value: "learning", label: "学习中" },
  { value: "fresh", label: "未开始" },
] as const;

type DurationFilter = (typeof durationFilters)[number]["value"];
type ProgressFilter = (typeof progressFilters)[number]["value"];

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { token, user, logout, hydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const showUser = mounted && hydrated;

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

  const rawVideos = videos ?? [];
  const categoryOptions = categories && categories.length > 0 ? categories : fallbackCategories;
  const getProgressMs = (video: VideoPublic) => progressMap.get(video.id) ?? getLocalProgress(video.id)?.last_time_ms ?? 0;
  const visibleVideos = useMemo(
    () =>
      rawVideos.filter((video) => {
        const minutes = (video.duration ?? 0) / 60;
        if (duration === "short" && !(minutes > 0 && minutes < 10)) return false;
        if (duration === "medium" && !(minutes >= 10 && minutes <= 20)) return false;
        if (duration === "long" && !(minutes > 20)) return false;
        const hasProgress = getProgressMs(video) > 3000;
        if (progressFilter === "learning" && !hasProgress) return false;
        if (progressFilter === "fresh" && hasProgress) return false;
        return true;
      }),
    [rawVideos, duration, progressFilter, progressMap]
  );
  const learnedCount = rawVideos.filter((video) => getProgressMs(video) > 3000).length;
  const totalMinutes = rawVideos.reduce((sum, video) => sum + Math.max(0, video.duration ?? 0) / 60, 0);
  const activeFilterCount = [category, duration !== "all", progressFilter !== "all"].filter(Boolean).length;

  const resetFilters = () => {
    setCategory(null);
    setDuration("all");
    setProgressFilter("all");
  };

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-foreground">
      <div className="flex min-h-screen">
        <LearningSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
          learnedCount={learnedCount}
          videoCount={rawVideos.length}
          minutes={Math.round(totalMinutes)}
          showUser={showUser}
          userName={user?.username}
          isAdmin={user?.role === "admin"}
          onLogout={logout}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-[#e5e7f0] bg-[#fbfbff]/92 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-4 px-4 lg:px-7">
              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e4ee] bg-white text-muted-foreground shadow-sm transition-colors hover:text-foreground lg:hidden"
                title="展开侧边栏"
              >
                <Menu className="h-4 w-4" />
              </button>

              <nav className="hidden items-center gap-8 text-sm font-black text-muted-foreground md:flex">
                <Link href="/" className="text-[#5d57d8]">
                  首页
                </Link>
                <Link href="/#main-content" className="transition-colors hover:text-foreground">
                  视频库
                </Link>
                <Link href="/#main-content" className="transition-colors hover:text-foreground">
                  我的学习
                </Link>
              </nav>

              <form
                className="mx-auto flex w-full max-w-xl"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearch(keyword.trim());
                }}
              >
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="搜索视频或关键词..."
                    className="h-11 rounded-full border-0 bg-white pl-11 pr-4 shadow-sm ring-1 ring-[#e7e8f2] focus-visible:ring-[#8f8af4]"
                  />
                </div>
              </form>

              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm ring-1 ring-[#e7e8f2] transition-colors hover:text-foreground sm:inline-flex"
                title="通知"
              >
                <Bell className="h-4 w-4" />
              </button>
              {showUser && user ? (
                <span className="hidden h-10 min-w-10 items-center justify-center rounded-full bg-white px-3 text-sm font-black text-[#5d57d8] shadow-sm ring-1 ring-[#e7e8f2] sm:inline-flex">
                  {user.username.slice(0, 1).toUpperCase()}
                </span>
              ) : (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/login">
                    <LogIn className="h-4 w-4" />
                    登录
                  </Link>
                </Button>
              )}
            </div>
          </header>

          <main id="main-content" className="min-w-0 flex-1 px-4 py-6 lg:px-7">
            <div className="mx-auto max-w-[1440px]">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-2 text-sm font-black text-[#5d57d8]">探索</p>
                  <h1 className="text-3xl font-black leading-tight tracking-[-0.02em] text-[#1b1d2a]">
                    探索英语视频
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
                    精选优质英语视频，边听边练句子、词汇和表达。
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="hidden text-sm font-black text-foreground md:block">
                    {isError ? "素材库未连接" : isLoading ? "加载中" : `${visibleVideos.length} 个视频`}
                  </p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setFiltersOpen((prev) => !prev)}
                      className={cn(
                        "inline-flex h-11 items-center gap-2 rounded-xl border border-[#e1e3ef] bg-white px-4 text-sm font-black shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                        filtersOpen && "border-[#8f8af4] text-[#5d57d8]"
                      )}
                    >
                      <Filter className="h-4 w-4" />
                      筛选
                      {activeFilterCount > 0 && (
                        <span className="rounded-full bg-[#5d57d8] px-1.5 py-0.5 text-[10px] text-white">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                    {filtersOpen && (
                      <FilterPanel
                        categories={categoryOptions}
                        category={category}
                        duration={duration}
                        progressFilter={progressFilter}
                        onCategoryChange={setCategory}
                        onDurationChange={setDuration}
                        onProgressChange={setProgressFilter}
                        onReset={resetFilters}
                        onClose={() => setFiltersOpen(false)}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap items-center gap-2 text-sm font-bold text-muted-foreground">
                <QuickTab active={category === null} onClick={() => setCategory(null)}>
                  全部
                </QuickTab>
                {categoryOptions.slice(0, 4).map((item) => (
                  <QuickTab key={item} active={category === item} onClick={() => setCategory(category === item ? null : item)}>
                    {item}
                  </QuickTab>
                ))}
              </div>

              {isLoading ? (
                <VideoGridSkeleton />
              ) : visibleVideos.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {visibleVideos.map((video, index) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      delay={index}
                      progressMs={getProgressMs(video)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyVideoState connectionError={isError} hasFilter={!!(search || activeFilterCount)} />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function LearningSidebar({
  collapsed,
  onToggle,
  learnedCount,
  videoCount,
  minutes,
  showUser,
  userName,
  isAdmin,
  onLogout,
}: {
  collapsed: boolean;
  onToggle: () => void;
  learnedCount: number;
  videoCount: number;
  minutes: number;
  showUser: boolean;
  userName?: string;
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const nav = [
    { label: "首页", icon: Home, active: true, href: "/" },
    { label: "视频库", icon: Library, active: false, href: "/#main-content" },
    { label: "精听", icon: BookOpen, active: false, href: "/#main-content" },
    { label: "生词卡", icon: Sparkles, active: false, href: "/#main-content" },
    { label: "我的", icon: UserIcon, active: false, href: "/login" },
  ];

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r border-[#e5e7f0] bg-white/88 backdrop-blur-xl transition-[width] duration-300 lg:flex lg:flex-col",
        collapsed ? "w-[76px]" : "w-[232px]"
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <span className="wave-field liquid-accent flex h-10 w-10 shrink-0 items-center justify-center">
          <Radio className="relative z-10 h-4 w-4" />
        </span>
        {!collapsed && <span className="text-lg font-black tracking-tight">SpeakLoop</span>}
        <button
          type="button"
          onClick={onToggle}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[#f1f2fb] hover:text-foreground"
          title={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="space-y-1 px-3 py-3" aria-label="学习导航">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-black transition-colors",
                item.active ? "bg-[#efefff] text-[#5d57d8]" : "text-muted-foreground hover:bg-[#f6f7fb] hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-4">
          <p className="mb-3 text-xs font-black text-muted-foreground">学习累计</p>
          <div className="space-y-2">
            <SidebarStat label="已学视频" value={learnedCount} />
            <SidebarStat label="素材总数" value={videoCount} />
            <SidebarStat label="今日学习(分钟)" value={minutes} />
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-muted-foreground">
              <span>Jul 2026</span>
              <span>‹ ›</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground">
              {Array.from({ length: 35 }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "flex h-5 items-center justify-center rounded-full",
                    [7, 14, 20, 21, 27, 30].includes(index) && "bg-[#5d57d8] text-white"
                  )}
                >
                  {(index % 31) + 1}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto border-t border-[#edf0f6] p-3">
        {showUser && userName ? (
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#efefff] text-sm font-black text-[#5d57d8]">
              {userName.slice(0, 1).toUpperCase()}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{userName}</p>
                <div className="mt-1 flex gap-1">
                  {isAdmin && (
                    <Link href="/admin" className="rounded-md px-1.5 py-0.5 text-xs font-bold text-muted-foreground hover:bg-[#f6f7fb]">
                      后台
                    </Link>
                  )}
                  <button type="button" onClick={onLogout} className="rounded-md px-1.5 py-0.5 text-xs font-bold text-muted-foreground hover:bg-[#f6f7fb]">
                    退出
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Button variant="outline" size={collapsed ? "icon" : "sm"} className="w-full" asChild>
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              {!collapsed && "登录"}
            </Link>
          </Button>
        )}
      </div>
    </aside>
  );
}

function SidebarStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#f7f8fc] px-3 py-2">
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <span className="rounded-lg bg-white px-2 py-1 text-xs font-black shadow-sm">{value}</span>
    </div>
  );
}

function FilterPanel({
  categories,
  category,
  duration,
  progressFilter,
  onCategoryChange,
  onDurationChange,
  onProgressChange,
  onReset,
  onClose,
}: {
  categories: string[];
  category: string | null;
  duration: DurationFilter;
  progressFilter: ProgressFilter;
  onCategoryChange: (value: string | null) => void;
  onDurationChange: (value: DurationFilter) => void;
  onProgressChange: (value: ProgressFilter) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-13 z-50 w-[min(88vw,360px)] rounded-2xl border border-[#e4e6f2] bg-white p-4 text-left shadow-[0_24px_70px_rgba(34,39,69,0.18)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-black">筛选视频</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-[#f6f7fb] hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <FilterGroup label="视频主题">
        <FilterPill active={category === null} onClick={() => onCategoryChange(null)}>
          全部
        </FilterPill>
        {categories.map((item) => (
          <FilterPill key={item} active={category === item} onClick={() => onCategoryChange(category === item ? null : item)}>
            {item}
          </FilterPill>
        ))}
      </FilterGroup>

      <FilterGroup label="时长">
        {durationFilters.map((item) => (
          <FilterPill key={item.value} active={duration === item.value} onClick={() => onDurationChange(item.value)}>
            {item.label}
          </FilterPill>
        ))}
      </FilterGroup>

      <FilterGroup label="学习进度">
        {progressFilters.map((item) => (
          <FilterPill key={item.value} active={progressFilter === item.value} onClick={() => onProgressChange(item.value)}>
            {item.label}
          </FilterPill>
        ))}
      </FilterGroup>

      <div className="mt-4 flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onReset}>
          重置
        </Button>
        <Button type="button" variant="brand" className="flex-1" onClick={onClose}>
          完成
        </Button>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[#eff1f6] py-4 first:border-t-0 first:pt-0">
      <p className="mb-2 text-xs font-black text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-xs font-black transition-all active:translate-y-px",
        active ? "border-[#5d57d8] bg-[#efefff] text-[#5d57d8]" : "border-[#e5e7f0] bg-[#fafbff] text-muted-foreground hover:bg-white hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function QuickTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 transition-colors",
        active ? "bg-white text-[#5d57d8] shadow-sm ring-1 ring-[#e4e5f4]" : "hover:bg-white hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="rounded-2xl bg-white p-2 shadow-sm">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="space-y-2 px-2 py-3">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
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
    <div className="rounded-3xl border border-dashed border-[#d8dcea] bg-white px-6 py-20 text-center">
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
  const tags = video.tags?.length ? video.tags.slice(0, 4) : video.category ? [video.category] : [];

  return (
    <Link
      href={`/videos/${video.id}`}
      style={{ animationDelay: `${Math.min(delay, 12) * 18}ms` }}
      className="group animate-fade-up block rounded-2xl bg-white p-2 shadow-sm ring-1 ring-[#e9ebf3] transition-all hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(34,39,69,0.13)]"
    >
      <div className="relative overflow-hidden rounded-xl bg-secondary">
        <VideoCover src={video.cover_url} alt={video.title} className="rounded-xl" />
        {tags[0] && (
          <span className="absolute left-2 top-2 rounded-lg bg-[#1f8eea] px-2 py-1 text-[11px] font-black text-white shadow-sm">
            {tags[0].slice(0, 2)}
          </span>
        )}
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/72 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">
          <Clock className="h-3 w-3" />
          {formatDuration(video.duration)}
        </span>
        {progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-white/70">
            <div className="h-full rounded-r-full bg-[#5d57d8]" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      <div className="px-2 pb-3 pt-3">
        <h2 className="line-clamp-2 min-h-[2.5rem] text-[15px] font-black leading-snug tracking-[-0.01em] text-[#202333] group-hover:text-[#5d57d8]">
          {video.title}
        </h2>
        {video.description && (
          <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-muted-foreground">
            {video.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-1 text-[#f2a900]">★★★★★</span>
          <Badge variant="secondary">{hasProgress ? "继续学习" : "新素材"}</Badge>
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
          <span className="flex items-center gap-1">
            <Captions className="h-3.5 w-3.5" />
            {video.subtitle_count} 句
          </span>
        </div>
      </div>
    </Link>
  );
}
