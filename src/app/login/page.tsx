import Link from "next/link";
import { ShadowAuthShell } from "@/components/layout/shadow-auth-shell";

export default function LoginPage() {
  return (
    <ShadowAuthShell title="登 录">
      <p className="mt-6 text-center text-sm font-black text-[#a129f0]">
        本地学习版，点击即可进入
      </p>
      <form className="mt-7 grid gap-5">
        <label className="grid gap-2 text-sm font-bold text-[#81758e]">
          手机号
          <input
            placeholder="可留空"
            className="h-12 rounded-xl border border-[#eee6f4] bg-[#fbf8ff] px-4 text-center text-base font-bold text-[#202033] placeholder:text-[#c7b8db]"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-[#81758e]">
          密码
          <input
            type="password"
            placeholder="可留空"
            className="h-12 rounded-xl border border-[#eee6f4] bg-[#fbf8ff] px-4 text-center text-base font-bold text-[#202033] placeholder:text-[#c7b8db]"
          />
        </label>
        <Link
          href="/library"
          className="mt-1 grid h-12 place-items-center rounded-xl bg-gradient-to-r from-[#a129f0] to-[#ed3d9a] text-base font-black text-white shadow-[0_12px_26px_rgba(190,52,190,.26)]"
        >
          进入视频库
        </Link>
      </form>
      <p className="mt-6 text-center text-sm font-semibold text-[#8b8198]">
        不需要激活码，也可以
        <Link href="/register" className="text-[#a129f0]">
          直接注册
        </Link>
      </p>
    </ShadowAuthShell>
  );
}
