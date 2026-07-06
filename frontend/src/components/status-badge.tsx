import { Badge } from "@/components/ui/badge";
import type { VideoStatus } from "@/lib/types";

const STATUS_META: Record<
  VideoStatus,
  { label: string; variant: "gray" | "blue" | "purple" | "green" | "yellow" | "red" }
> = {
  draft: { label: "草稿", variant: "gray" },
  processing: { label: "处理中", variant: "blue" },
  ready: { label: "待发布", variant: "purple" },
  published: { label: "已发布", variant: "green" },
  unpublished: { label: "已下架", variant: "yellow" },
  failed: { label: "解析失败", variant: "red" },
};

export function StatusBadge({ status }: { status: VideoStatus }) {
  const meta = STATUS_META[status] ?? { label: status, variant: "gray" as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
