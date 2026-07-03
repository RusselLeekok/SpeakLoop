import Link from "next/link";
import { BookOpen, Home, Settings, UserRound } from "lucide-react";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/library", label: "视频库", icon: BookOpen },
  { href: "/admin", label: "后台", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbf7ff] text-[#202033]">
      <header className="sticky top-0 z-30 border-b border-[#efe6f4] bg-[#fffaff]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="brand-mark grid size-10 place-items-center rounded-full text-xs font-black italic text-[#8b536b] shadow-sm">
              SV
            </span>
            <span>
              <span className="block text-base font-black italic leading-5">
                Shadow<span className="text-[#df6c95]">Vlog</span>
              </span>
              <span className="block text-xs text-[#8b8198]">
                跟着 Vlog 学英语
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-[#ece4f4] bg-white/75 p-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex h-9 items-center gap-2 rounded-full px-4 text-sm font-black text-[#665b73] hover:bg-[#f7efff] hover:text-[#9a25e6]"
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/login"
            className="flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-[#a129f0] to-[#ed3d9a] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(190,52,190,.22)]"
          >
            <UserRound size={16} />
            账号
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
