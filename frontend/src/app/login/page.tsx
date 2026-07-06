"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Radio } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { LoginResponse } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/api/auth/login", { username, password });
      setAuth(res.access_token, res.user);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请检查账号和密码。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-auth-glow px-4 py-10">
      <Card className="w-full max-w-md animate-fade-up">
        <CardHeader className="border-b border-foreground/10 text-left">
          <span className="wave-field liquid-accent mb-3 flex h-12 w-12 items-center justify-center">
            <Radio className="relative z-10 h-6 w-6" />
          </span>
          <div className="swiss-label text-brand">Account</div>
          <CardTitle>登录 SpeakLoop</CardTitle>
          <CardDescription>同步学习进度，继续从上一句开始。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </div>
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-red-50 px-3 py-2 text-sm font-semibold text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" variant="brand" className="w-full rounded-xl" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
            <p className="text-center text-xs font-semibold leading-relaxed text-muted-foreground">
              不登录也可以学习，进度会保存在本机浏览器。{" "}
              <Link href="/" className="text-brand underline underline-offset-4">
                返回首页
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
