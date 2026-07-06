"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Compass, LogIn, LogOut, Radio, Settings, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";

export function SiteHeader() {
  const { user, logout, hydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const showUser = mounted && hydrated;

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-5">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="wave-field liquid-accent flex h-10 w-10 items-center justify-center transition-transform group-hover:-translate-y-0.5">
              <Radio className="relative z-10 h-4 w-4" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">SpeakLoop</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
            <HeaderLink href="/#main-content">
              <Compass className="h-3.5 w-3.5" />
              发现素材
            </HeaderLink>
          </nav>
        </div>

        <nav className="flex shrink-0 items-center gap-1.5" aria-label="账户">
          {showUser && user ? (
            <>
              <span className="hidden items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-semibold text-muted-foreground shadow-sm sm:flex">
                <UserIcon className="h-3.5 w-3.5" />
                {user.username}
              </span>
              {user.role === "admin" && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin">
                    <Settings className="h-4 w-4" />
                    后台
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                退出
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                登录
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground hover:bg-white/78 hover:text-foreground hover:shadow-sm"
    >
      {children}
    </Link>
  );
}
