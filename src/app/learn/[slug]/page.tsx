import Link from "next/link";
import { ArrowLeft, Clock3, Gauge } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LearningPlayer } from "@/components/player/learning-player";
import { getVideoBySlug } from "@/lib/demo-data";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const video = getVideoBySlug(slug);

  return (
    <AppShell>
      <section className="border-b border-[#e5deef] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <Link
              href="/library"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#62586f] hover:text-[#171421]"
            >
              <ArrowLeft size={16} />
              素材库
            </Link>
            <h1 className="mt-2 truncate text-2xl font-black">{video.title}</h1>
            <p className="mt-1 text-sm text-[#71687d]">{video.description}</p>
          </div>
          <div className="flex gap-2 text-xs font-black text-[#62586f]">
            <span className="flex h-9 items-center gap-2 rounded-md bg-[#f4f0f8] px-3">
              <Clock3 size={15} />
              {Math.round(video.duration / 60)} min
            </span>
            <span className="flex h-9 items-center gap-2 rounded-md bg-[#f4f0f8] px-3">
              <Gauge size={15} />
              {video.level}
            </span>
          </div>
        </div>
      </section>
      <LearningPlayer video={video} />
    </AppShell>
  );
}
