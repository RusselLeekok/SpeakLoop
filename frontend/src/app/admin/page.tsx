"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clapperboard, FileClock, Plus } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<AdminStats>("/api/admin/stats"),
  });

  const cards = [
    { label: "视频总数", value: stats?.total, icon: Clapperboard, tint: "bg-brand/18 text-foreground" },
    { label: "已发布", value: stats?.published, icon: CheckCircle2, tint: "bg-emerald-100 text-emerald-800" },
    { label: "待处理", value: (stats?.ready ?? 0) + (stats?.draft ?? 0), icon: FileClock, tint: "bg-accent/70 text-foreground" },
    { label: "解析失败", value: stats?.failed, icon: AlertTriangle, tint: "bg-red-100 text-red-800" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="swiss-label text-brand">Dashboard</div>
          <h1 className="mt-1 text-4xl font-black tracking-[-0.04em]">内容概览</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">管理视频、字幕与发布状态。</p>
        </div>
        <Button variant="brand" className="rounded-xl" asChild>
          <Link href="/admin/videos/new">
            <Plus />
            新增视频
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="transition-all hover:-translate-y-0.5 hover:shadow-elevated">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="swiss-label text-muted-foreground">{c.label}</p>
                {isLoading ? <Skeleton className="mt-2 h-8 w-12" /> : <p className="text-4xl font-black tracking-[-0.04em] tabular-nums">{c.value ?? 0}</p>}
              </div>
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-foreground/10 shadow-sm ${c.tint}`}>
                <c.icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">最近上传</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stats && stats.recent.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时长</TableHead>
                  <TableHead>字幕</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recent.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Link href={`/admin/videos/${v.id}/edit`} className="font-bold text-brand underline-offset-4 hover:underline">
                        {v.title}
                      </Link>
                    </TableCell>
                    <TableCell><StatusBadge status={v.status} /></TableCell>
                    <TableCell>{formatDuration(v.duration)}</TableCell>
                    <TableCell>{v.subtitle_count} 句</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(v.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="doodle-note py-10 text-center text-sm font-semibold text-foreground">
              还没有视频。点击“新增视频”开始上传。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
