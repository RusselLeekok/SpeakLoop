import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { getLocalVideoById } from "@/lib/local-videos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const video = await getLocalVideoById(id);

  if (!video) {
    return new Response("Video not found", { status: 404 });
  }

  const fileStats = await stat(video.absolutePath);
  const fileSize = fileStats.size;
  const contentType = MIME_TYPES[video.extension] ?? "application/octet-stream";
  const range = request.headers.get("range");

  if (!range) {
    const stream = createReadStream(video.absolutePath);
    return new Response(stream as unknown as BodyInit, {
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": String(fileSize),
        "Content-Type": contentType,
      },
    });
  }

  const [startText, endText] = range.replace(/bytes=/, "").split("-");
  const start = Number.parseInt(startText, 10);
  const end = endText ? Number.parseInt(endText, 10) : fileSize - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start >= fileSize) {
    return new Response(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${fileSize}`,
      },
    });
  }

  const chunkSize = end - start + 1;
  const stream = createReadStream(video.absolutePath, { end, start });

  return new Response(stream as unknown as BodyInit, {
    status: 206,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(chunkSize),
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Content-Type": contentType,
    },
  });
}
