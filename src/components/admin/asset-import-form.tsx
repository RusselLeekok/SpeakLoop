"use client";

import Link from "next/link";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { useState } from "react";

export function AssetImportForm() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [assetId, setAssetId] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setAssetId("");

    try {
      const response = await fetch("/api/admin/assets", {
        body: new FormData(event.currentTarget),
        method: "POST",
      });
      const data = (await response.json()) as {
        asset?: { id: string; title: string };
        error?: string;
        ok: boolean;
      };

      if (!response.ok || !data.ok || !data.asset) {
        throw new Error(data.error || "导入失败。");
      }

      setAssetId(data.asset.id);
      setMessage(`已导入：${data.asset.title}`);
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <label className="grid gap-2">
        <span className="text-sm font-black text-[#352a42]">视频标题</span>
        <input
          name="title"
          placeholder="例如：新手做视频：先完成，再完美"
          className="h-11 rounded-xl border border-[#ddd4ea] bg-white px-3 text-sm font-semibold text-[#171421]"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-[#352a42]">难度</span>
        <select
          name="difficulty"
          defaultValue="中级"
          className="h-11 rounded-xl border border-[#ddd4ea] bg-white px-3 text-sm font-semibold text-[#171421]"
        >
          <option>初级</option>
          <option>中级</option>
          <option>高级</option>
        </select>
      </label>

      <label className="grid gap-2 rounded-2xl border border-dashed border-[#cfc4dd] bg-[#fbfaff] p-5">
        <span className="text-sm font-black text-[#352a42]">视频文件</span>
        <input name="video" type="file" accept="video/*" required />
        <span className="text-xs font-semibold text-[#71687d]">
          支持 .mp4 / .webm / .mov / .m4v，会保存到 D:\videoes\media。
        </span>
      </label>

      <label className="grid gap-2 rounded-2xl border border-dashed border-[#cfc4dd] bg-[#fbfaff] p-5">
        <span className="text-sm font-black text-[#352a42]">字幕文件</span>
        <input name="subtitle" type="file" accept=".srt,.json" />
        <span className="text-xs font-semibold text-[#71687d]">
          支持标准 .srt，或包含 lines 数组的字幕 JSON。JSON 优先用于动态字幕。
        </span>
      </label>

      <label className="grid gap-2 rounded-2xl border border-dashed border-[#cfc4dd] bg-[#fbfaff] p-5">
        <span className="text-sm font-black text-[#352a42]">精读卡片 JSON</span>
        <input name="cards" type="file" accept=".json" />
        <span className="text-xs font-semibold text-[#71687d]">
          可选。包含 cards 数组，用于右侧单词、短语和地道表达卡片。
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a129f0] to-[#ed3d9a] px-4 text-sm font-black text-white disabled:opacity-60"
      >
        {submitting ? <Loader2 className="animate-spin" size={17} /> : <UploadCloud size={17} />}
        保存素材
      </button>

      {message && (
        <div className="rounded-2xl border border-[#eadff2] bg-white px-4 py-3 text-sm font-bold text-[#665b73]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-[#a129f0]" size={18} />
            {message}
          </div>
          {assetId && (
            <div className="mt-3 flex gap-3">
              <Link href="/library" className="text-[#a129f0]">
                去视频库
              </Link>
              <Link href={`/watch/${assetId}`} className="text-[#a129f0]">
                打开学习页
              </Link>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
