import { statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

export type LocalVideo = {
  id: string;
  title: string;
  fileName: string;
  absolutePath: string;
  extension: string;
  size: number;
  updatedAt: string;
  streamUrl: string;
};

const VIDEO_ROOT = "D:\\videoes";
const SUPPORTED_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v"]);

function toTitle(fileName: string) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/^SnapTik\.Net[_-]?/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function toId(relativePath: string) {
  return Buffer.from(relativePath, "utf8").toString("base64url");
}

async function walkVideos(dir: string, baseDir = dir): Promise<LocalVideo[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const videos = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walkVideos(absolutePath, baseDir);
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (!entry.isFile() || !SUPPORTED_EXTENSIONS.has(extension)) {
        return [];
      }

      const relativePath = path.relative(baseDir, absolutePath);
      const stats = statSync(absolutePath);
      const id = toId(relativePath);

      return [
        {
          id,
          title: toTitle(entry.name),
          fileName: entry.name,
          absolutePath,
          extension,
          size: stats.size,
          updatedAt: stats.mtime.toISOString(),
          streamUrl: `/api/local-videos/${id}`,
        },
      ];
    }),
  );

  return videos.flat().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getLocalVideos() {
  try {
    return await walkVideos(VIDEO_ROOT);
  } catch {
    return [];
  }
}

export async function getLocalVideoById(id: string) {
  const videos = await getLocalVideos();
  return videos.find((video) => video.id === id) ?? null;
}

export function formatFileSize(size: number) {
  const mb = size / 1024 / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}
