import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LocalStudyPlayer } from "@/components/player/local-study-player";
import { formatFileSize, loadLearningAsset } from "@/lib/local-videos";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = await loadLearningAsset(id);

  if (!asset) {
    notFound();
  }

  const studyVideo = {
    cards: asset.cards,
    fileName: asset.fileName,
    id: asset.id,
    streamUrl: asset.streamUrl,
    subtitleLines: asset.subtitleLines,
    title: asset.title,
  };

  return (
    <AppShell>
      <section className="border-b border-[#eee9f3] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/library"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#eadff2] bg-white px-4 text-sm font-black text-[#665b73] hover:text-[#a129f0]"
            >
              <ArrowLeft size={17} />
              返回视频库
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black">{asset.title}</h1>
              <p className="truncate text-xs font-semibold text-[#91869c]">
                {asset.hasSubtitle ? "动态字幕学习" : "5 秒听写 fallback"} ·{" "}
                {formatFileSize(asset.size)}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#f4ecfb] px-4 py-2 text-xs font-black text-[#a129f0]">
            单句循环 · 动态字幕 · 精读卡片
          </span>
        </div>
      </section>
      <LocalStudyPlayer video={studyVideo} />
    </AppShell>
  );
}
