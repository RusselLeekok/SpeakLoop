import { Database, FileJson, UploadCloud, Video } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

const fields = [
  { label: "视频标题", value: "New video workflow: done before perfect" },
  { label: "主题标签", value: "Daily vlog, Creator life, Mindset" },
  { label: "难度", value: "intermediate" },
];

export default function AdminPage() {
  return (
    <AppShell>
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-[#e5deef] bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#7c3aed]">Admin</p>
              <h1 className="mt-1 text-3xl font-black">素材管理</h1>
            </div>
            <span className="grid size-11 place-items-center rounded-lg bg-[#f4f0ff] text-[#7c3aed]">
              <Database size={21} />
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-dashed border-[#cfc4dd] bg-[#fbfaff] p-5">
              <Video className="mb-4 text-[#7c3aed]" size={24} />
              <h2 className="text-lg font-black">视频文件</h2>
              <p className="mt-2 text-sm leading-6 text-[#71687d]">
                MP4 或 HLS 地址会写入 videos.video_url。
              </p>
              <button className="mt-4 flex h-10 items-center gap-2 rounded-md bg-[#171421] px-4 text-sm font-bold text-white">
                <UploadCloud size={17} />
                选择视频
              </button>
            </div>
            <div className="rounded-lg border border-dashed border-[#cfc4dd] bg-[#fbfaff] p-5">
              <FileJson className="mb-4 text-[#7c3aed]" size={24} />
              <h2 className="text-lg font-black">字幕 JSON</h2>
              <p className="mt-2 text-sm leading-6 text-[#71687d]">
                每句包含 startTime、endTime、english、chinese 和 wordCardIds。
              </p>
              <button className="mt-4 flex h-10 items-center gap-2 rounded-md bg-[#171421] px-4 text-sm font-bold text-white">
                <UploadCloud size={17} />
                导入字幕
              </button>
            </div>
          </div>

          <form className="mt-5 grid gap-4">
            {fields.map((field) => (
              <label key={field.label} className="grid gap-2">
                <span className="text-sm font-black text-[#352a42]">
                  {field.label}
                </span>
                <input
                  defaultValue={field.value}
                  className="h-11 rounded-md border border-[#ddd4ea] bg-white px-3 text-sm font-semibold text-[#171421]"
                />
              </label>
            ))}
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#352a42]">简介</span>
              <textarea
                defaultValue="A short creator-style monologue for practicing natural pacing, contractions, and everyday transitions."
                className="min-h-28 rounded-md border border-[#ddd4ea] bg-white p-3 text-sm font-semibold leading-6 text-[#171421]"
              />
            </label>
            <button
              type="button"
              className="h-11 rounded-md bg-[#7c3aed] px-4 text-sm font-bold text-white hover:bg-[#6d28d9]"
            >
              保存素材
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          {[
            ["videos", "视频元数据、封面、难度、主题"],
            ["subtitle_lines", "逐句时间轴和双语字幕"],
            ["word_cards", "重点词汇、表达和例句"],
            ["learning_progress", "最近播放位置和当前句"],
            ["favorites", "用户收藏句子"],
            ["recordings", "用户跟读音频元数据"],
          ].map(([table, note]) => (
            <div
              key={table}
              className="rounded-lg border border-[#e5deef] bg-white p-4 shadow-sm"
            >
              <p className="font-mono text-sm font-black text-[#7c3aed]">
                {table}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#71687d]">{note}</p>
            </div>
          ))}
        </aside>
      </main>
    </AppShell>
  );
}
