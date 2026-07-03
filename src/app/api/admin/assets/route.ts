import { createLearningAssetFromForm } from "@/lib/local-videos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const asset = await createLearningAssetFromForm(await request.formData());
    return Response.json({ asset, ok: true });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "导入失败。",
        ok: false,
      },
      { status: 400 },
    );
  }
}
