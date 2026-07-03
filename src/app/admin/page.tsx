import { Database, FileJson, FolderOpen, Video } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AssetImportForm } from "@/components/admin/asset-import-form";
import { getLocalVideos } from "@/lib/local-videos";

export default async function AdminPage() {
  const videos = await getLocalVideos();
  const configured = videos.filter((video) => video.hasSubtitle).length;

  return (
    <AppShell>
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-[24px] border border-[#e5deef] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-[#a129f0]">ADMIN</p>
              <h1 className="mt-1 text-3xl font-black">导入学习素材</h1>
              <p className="mt-3 text-sm font-semibold text-[#71687d]">
                上传视频、字幕和精读卡片，保存后会写入 D:\videoes\manifest.json。
              </p>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl bg-[#f4f0ff] text-[#a129f0]">
              <Database size={22} />
            </span>
          </div>

          <AssetImportForm />
        </section>

        <aside className="space-y-4">
          <section className="rounded-[24px] border border-[#e5deef] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-black">
              <FolderOpen className="text-[#a129f0]" size={20} />
              本地素材状态
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#fbf7ff] p-4">
                <div className="text-3xl font-black text-[#a129f0]">
                  {videos.length}
                </div>
                <div className="mt-1 text-xs font-black text-[#81758e]">
                  视频总数
                </div>
              </div>
              <div className="rounded-2xl bg-[#fbf7ff] p-4">
                <div className="text-3xl font-black text-[#a129f0]">
                  {configured}
                </div>
                <div className="mt-1 text-xs font-black text-[#81758e]">
                  已配字幕
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#e5deef] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Video className="text-[#a129f0]" size={20} />
              字幕 SRT 示例
            </h2>
            <pre className="mt-4 overflow-auto rounded-2xl bg-[#171421] p-4 text-xs leading-6 text-white">{`1
00:00:08,000 --> 00:00:12,000
I looked down, and it's gone.
我低头一看，它已经不见了。`}</pre>
          </section>

          <section className="rounded-[24px] border border-[#e5deef] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <FileJson className="text-[#a129f0]" size={20} />
              精读卡片 JSON
            </h2>
            <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-[#171421] p-4 text-xs leading-6 text-white">{`{
  "cards": [
    {
      "id": "jewelry",
      "type": "word",
      "term": "jewelry",
      "phonetic": "/ˈdʒuːəlri/",
      "meaning": "n. 珠宝；首饰",
      "note": "jewellery, accessories",
      "example": "It's my own jewelry brand.",
      "translation": "这是我自己的珠宝品牌。"
    }
  ]
}`}</pre>
          </section>
        </aside>
      </main>
    </AppShell>
  );
}
