import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LocalStudyPlayer } from "@/components/player/local-study-player";
import {
  formatFileSize,
  getLocalVideoById,
  getLocalVideos,
} from "@/lib/local-videos";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await getLocalVideoById(id);
  const videos = await getLocalVideos();

  if (!video) {
    notFound();
  }

  const otherVideos = videos.filter((item) => item.id !== video.id).slice(0, 6);
  const studyVideo = {
    fileName: video.fileName,
    id: video.id,
    streamUrl: video.streamUrl,
    title: video.title,
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
              <h1 className="truncate text-base font-black">{video.title}</h1>
              <p className="truncate text-xs font-semibold text-[#91869c]">
                听力训练 · {formatFileSize(video.size)}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#f4ecfb] px-4 py-2 text-xs font-black text-[#a129f0]">
            片段循环 · 听写 · 跟读
          </span>
        </div>
      </section>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_310px]">
        <LocalStudyPlayer video={studyVideo} />

        <aside className="hidden border-l border-[#eee9f3] bg-[#fbf7ff] p-4 xl:block">
          <section className="rounded-[24px] border border-[#ece4f4] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-black">
              <FolderOpen className="text-[#a129f0]" size={20} />
              继续学习
            </div>
            <div className="space-y-3">
              {otherVideos.map((item) => (
                <Link
                  key={item.id}
                  href={`/watch/${item.id}`}
                  className="grid grid-cols-[72px_1fr] gap-3 rounded-2xl border border-[#f0e8f6] p-2 hover:bg-[#fbf7ff]"
                >
                  <video
                    src={`${item.streamUrl}#t=0.1`}
                    className="aspect-[9/12] rounded-xl bg-[#1f1b29] object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <span className="min-w-0 self-center">
                    <span className="line-clamp-2 text-sm font-black leading-5">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-[#91869c]">
                      {formatFileSize(item.size)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
