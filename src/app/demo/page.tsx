import { ShadowDemoPlayer } from "@/components/player/shadow-demo-player";
import { demoVideos } from "@/lib/demo-data";

export default function DemoPage() {
  return <ShadowDemoPlayer video={demoVideos[0]} />;
}
