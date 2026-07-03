import Link from "next/link";
import { CalendarClock, FolderOpen, Play, Video } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { formatFileSize, getLocalVideos } from "@/lib/local-videos";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

export default async function LibraryPage() {
  const videos = await getLocalVideos();

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="mb-7 rounded-[24px] border border-[#ece4f4] bg-white/88 p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black text-[#a129f0]">MY VLOGS</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                登录后视频库
              </h1>
              <p className="mt-3 text-sm font-semibold text-[#81758e]">
                已读取本地目录 D:\videoes，点击任意卡片进入播放页。
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-[#fbf7ff] px-4 py-3 text-sm font-black text-[#665b73]">
              <FolderOpen className="text-[#a129f0]" size={20} />
              {videos.length} 个视频
            </div>
          </div>
        </section>

        {videos.length === 0 ? (
          <section className="grid min-h-[360px] place-items-center rounded-[24px] border border-dashed border-[#d9cbe7] bg-white/82 p-8 text-center">
            <div>
              <Video className="mx-auto text-[#a129f0]" size={42} />
              <h2 className="mt-5 text-2xl font-black">还没有找到视频</h2>
              <p className="mt-3 text-sm font-semibold text-[#81758e]">
                请把 .mp4 / .webm / .mov / .m4v 文件放到 D:\videoes。
              </p>
            </div>
          </section>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {videos.map((video, index) => (
              <Link
                key={video.id}
                href={`/watch/${video.id}`}
                className="group overflow-hidden rounded-[22px] border border-[#ece4f4] bg-white shadow-sm hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(112,73,132,.15)]"
              >
                <div className="relative aspect-[9/16] bg-[#1f1b29]">
                  <video
                    src={`${video.streamUrl}#t=0.1`}
                    className="h-full w-full object-cover opacity-95"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-black/10" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-[#a129f0]">
                    #{String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-r from-[#a129f0] to-[#ed3d9a] text-white shadow-lg group-hover:scale-110">
                    <Play size={25} fill="currentColor" />
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <h2 className="line-clamp-2 text-lg font-black leading-6">
                      {video.title}
                    </h2>
                    <p className="mt-2 text-xs font-semibold text-white/78">
                      {video.fileName}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 p-4 text-xs font-black text-[#81758e]">
                  <span className="flex items-center gap-2">
                    <Video size={15} className="text-[#a129f0]" />
                    {formatFileSize(video.size)} · {video.extension}
                  </span>
                  <span className="flex items-center gap-2">
                    <CalendarClock size={15} className="text-[#a129f0]" />
                    {formatDate(video.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
    </AppShell>
  );
}
