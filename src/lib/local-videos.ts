import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type SubtitleLine = {
  id: string;
  startTime: number;
  endTime: number;
  english: string;
  chinese: string;
  cardIds: string[];
};

export type StudyCard = {
  id: string;
  type: "word" | "phrase" | "expression";
  term: string;
  phonetic?: string;
  meaning: string;
  note?: string;
  example?: string;
  translation?: string;
};

export type LocalVideo = {
  id: string;
  title: string;
  fileName: string;
  absolutePath: string;
  relativePath: string;
  extension: string;
  size: number;
  updatedAt: string;
  streamUrl: string;
  difficulty?: string;
  hasSubtitle: boolean;
  hasCards: boolean;
  subtitlePath?: string;
  cardsPath?: string;
};

export type LearningAsset = LocalVideo & {
  subtitleLines: SubtitleLine[];
  cards: StudyCard[];
};

type ManifestAsset = {
  id: string;
  title: string;
  videoPath: string;
  subtitlePath?: string;
  cardsPath?: string;
  difficulty?: string;
  createdAt: string;
  updatedAt: string;
};

type Manifest = {
  assets: ManifestAsset[];
};

export const VIDEO_ROOT = "D:\\videoes";
const MEDIA_DIR = path.join(VIDEO_ROOT, "media");
const SUBTITLE_DIR = path.join(VIDEO_ROOT, "subtitles");
const CARDS_DIR = path.join(VIDEO_ROOT, "cards");
const MANIFEST_PATH = path.join(VIDEO_ROOT, "manifest.json");
const SUPPORTED_VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const SUPPORTED_SUBTITLE_EXTENSIONS = new Set([".srt", ".json"]);

export async function ensureVideoStore() {
  await mkdir(VIDEO_ROOT, { recursive: true });
  await mkdir(MEDIA_DIR, { recursive: true });
  await mkdir(SUBTITLE_DIR, { recursive: true });
  await mkdir(CARDS_DIR, { recursive: true });
}

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

function fromRoot(relativePath: string) {
  return path.join(VIDEO_ROOT, relativePath);
}

function toRelative(absolutePath: string) {
  return path.relative(VIDEO_ROOT, absolutePath);
}

function sanitizeFileName(fileName: string) {
  const parsed = path.parse(fileName);
  const base = parsed.name
    .replace(/[^\w\u4e00-\u9fa5.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base || "asset"}${parsed.ext.toLowerCase()}`;
}

async function readManifest(): Promise<Manifest> {
  try {
    const raw = await readFile(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw) as Manifest;
    return { assets: Array.isArray(parsed.assets) ? parsed.assets : [] };
  } catch {
    return { assets: [] };
  }
}

async function writeManifest(manifest: Manifest) {
  await ensureVideoStore();
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
}

function manifestToVideo(asset: ManifestAsset): LocalVideo | null {
  const absolutePath = fromRoot(asset.videoPath);
  if (!existsSync(absolutePath)) return null;
  const stats = statSync(absolutePath);
  const extension = path.extname(absolutePath).toLowerCase();

  return {
    absolutePath,
    cardsPath: asset.cardsPath,
    difficulty: asset.difficulty,
    extension,
    fileName: path.basename(absolutePath),
    hasCards: Boolean(asset.cardsPath && existsSync(fromRoot(asset.cardsPath))),
    hasSubtitle: Boolean(
      asset.subtitlePath && existsSync(fromRoot(asset.subtitlePath)),
    ),
    id: asset.id,
    relativePath: asset.videoPath,
    size: stats.size,
    streamUrl: `/api/local-videos/${asset.id}`,
    subtitlePath: asset.subtitlePath,
    title: asset.title || toTitle(path.basename(absolutePath)),
    updatedAt: asset.updatedAt || stats.mtime.toISOString(),
  };
}

async function walkLegacyVideos(
  dir: string,
  baseDir = VIDEO_ROOT,
): Promise<LocalVideo[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const videos = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (["media", "subtitles", "cards"].includes(entry.name)) return [];
        return walkLegacyVideos(absolutePath, baseDir);
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (!entry.isFile() || !SUPPORTED_VIDEO_EXTENSIONS.has(extension)) {
        return [];
      }

      const relativePath = path.relative(baseDir, absolutePath);
      const stats = statSync(absolutePath);
      const id = toId(relativePath);

      return [
        {
          absolutePath,
          extension,
          fileName: entry.name,
          hasCards: false,
          hasSubtitle: false,
          id,
          relativePath,
          size: stats.size,
          streamUrl: `/api/local-videos/${id}`,
          title: toTitle(entry.name),
          updatedAt: stats.mtime.toISOString(),
        } satisfies LocalVideo,
      ];
    }),
  );

  return videos.flat();
}

export async function getLocalVideos() {
  await ensureVideoStore();
  const manifest = await readManifest();
  const manifestVideos = manifest.assets
    .map(manifestToVideo)
    .filter((video): video is LocalVideo => Boolean(video));
  const configuredPaths = new Set(
    manifestVideos.map((video) => path.normalize(video.absolutePath)),
  );
  const legacyVideos = (await walkLegacyVideos(VIDEO_ROOT)).filter(
    (video) => !configuredPaths.has(path.normalize(video.absolutePath)),
  );

  return [...manifestVideos, ...legacyVideos].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function getLocalVideoById(id: string) {
  const videos = await getLocalVideos();
  return videos.find((video) => video.id === id) ?? null;
}

function parseTimecode(value: string) {
  const [hours = "0", minutes = "0", rest = "0"] = value
    .trim()
    .replace(",", ".")
    .split(":");
  const seconds = Number(rest);
  return Number(hours) * 3600 + Number(minutes) * 60 + seconds;
}

export function parseSrt(raw: string): SubtitleLine[] {
  const parsedLines: SubtitleLine[] = [];
  raw
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .forEach((block, index) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
      if (timeLineIndex < 0) return;

      const [startText, endText] = lines[timeLineIndex]
        .split("-->")
        .map((part) => part.trim().split(/\s+/)[0]);
      const textLines = lines.slice(timeLineIndex + 1);
      const english = textLines[0] ?? "";
      const chinese = textLines.slice(1).join(" ");
      if (!english || !startText || !endText) return;

      parsedLines.push({
        cardIds: [],
        chinese,
        endTime: parseTimecode(endText),
        english,
        id: `line-${String(index + 1).padStart(3, "0")}`,
        startTime: parseTimecode(startText),
      });
    });
  return parsedLines;
}

function normalizeLine(line: Partial<SubtitleLine>, index: number): SubtitleLine {
  return {
    cardIds: line.cardIds ?? [],
    chinese: line.chinese ?? "",
    endTime: Number(line.endTime ?? 0),
    english: line.english ?? "",
    id: line.id ?? `line-${String(index + 1).padStart(3, "0")}`,
    startTime: Number(line.startTime ?? 0),
  };
}

export function parseTranscriptJson(raw: string): {
  title?: string;
  lines: SubtitleLine[];
} {
  const parsed = JSON.parse(raw) as {
    title?: string;
    lines?: Partial<SubtitleLine>[];
  };
  return {
    lines: (parsed.lines ?? [])
      .map(normalizeLine)
      .filter((line) => line.english && line.endTime > line.startTime),
    title: parsed.title,
  };
}

export function parseCardsJson(raw: string): StudyCard[] {
  const parsed = JSON.parse(raw) as { cards?: Partial<StudyCard>[] };
  return (parsed.cards ?? [])
    .map((card, index) => ({
      id: card.id ?? `card-${String(index + 1).padStart(3, "0")}`,
      type: card.type ?? "word",
      term: card.term ?? "",
      phonetic: card.phonetic,
      meaning: card.meaning ?? "",
      note: card.note,
      example: card.example,
      translation: card.translation,
    }))
    .filter((card) => card.term && card.meaning);
}

async function loadSubtitle(video: LocalVideo) {
  if (!video.subtitlePath) return [];
  const absolutePath = fromRoot(video.subtitlePath);
  if (!existsSync(absolutePath)) return [];
  const raw = await readFile(absolutePath, "utf8");
  const extension = path.extname(absolutePath).toLowerCase();
  if (extension === ".json") return parseTranscriptJson(raw).lines;
  return parseSrt(raw);
}

async function loadCards(video: LocalVideo) {
  if (!video.cardsPath) return [];
  const absolutePath = fromRoot(video.cardsPath);
  if (!existsSync(absolutePath)) return [];
  return parseCardsJson(await readFile(absolutePath, "utf8"));
}

export async function loadLearningAsset(id: string): Promise<LearningAsset | null> {
  const video = await getLocalVideoById(id);
  if (!video) return null;

  return {
    ...video,
    cards: await loadCards(video),
    subtitleLines: await loadSubtitle(video),
  };
}

async function saveUpload(file: File, dir: string, id: string) {
  const fileName = `${id}-${sanitizeFileName(file.name)}`;
  const absolutePath = path.join(dir, fileName);
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));
  return toRelative(absolutePath);
}

export async function createLearningAssetFromForm(formData: FormData) {
  await ensureVideoStore();

  const videoFile = formData.get("video");
  if (!(videoFile instanceof File) || videoFile.size === 0) {
    throw new Error("请上传视频文件。");
  }

  const videoExt = path.extname(videoFile.name).toLowerCase();
  if (!SUPPORTED_VIDEO_EXTENSIONS.has(videoExt)) {
    throw new Error("视频仅支持 mp4、webm、mov、m4v。");
  }

  const subtitleFile = formData.get("subtitle");
  const cardsFile = formData.get("cards");
  const id = randomUUID();
  const now = new Date().toISOString();
  const videoPath = await saveUpload(videoFile, MEDIA_DIR, id);
  let subtitlePath: string | undefined;
  let cardsPath: string | undefined;

  if (subtitleFile instanceof File && subtitleFile.size > 0) {
    const ext = path.extname(subtitleFile.name).toLowerCase();
    if (!SUPPORTED_SUBTITLE_EXTENSIONS.has(ext)) {
      throw new Error("字幕仅支持 .srt 或 .json。");
    }
    subtitlePath = await saveUpload(subtitleFile, SUBTITLE_DIR, id);
  }

  if (cardsFile instanceof File && cardsFile.size > 0) {
    const ext = path.extname(cardsFile.name).toLowerCase();
    if (ext !== ".json") {
      throw new Error("精读卡片仅支持 .json。");
    }
    cardsPath = await saveUpload(cardsFile, CARDS_DIR, id);
  }

  const manifest = await readManifest();
  const asset: ManifestAsset = {
    cardsPath,
    createdAt: now,
    difficulty: String(formData.get("difficulty") || "中级"),
    id,
    subtitlePath,
    title: String(formData.get("title") || toTitle(videoFile.name)),
    updatedAt: now,
    videoPath,
  };

  manifest.assets = [asset, ...manifest.assets.filter((item) => item.id !== id)];
  await writeManifest(manifest);
  return asset;
}

export function formatFileSize(size: number) {
  const mb = size / 1024 / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}
