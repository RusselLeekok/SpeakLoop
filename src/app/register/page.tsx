import Link from "next/link";
import { ShadowAuthShell } from "@/components/layout/shadow-auth-shell";

export default function RegisterPage() {
  return (
    <ShadowAuthShell title="注 册">
      <p className="mt-6 text-center text-sm font-black text-[#a129f0]">
        本地学习版无需激活码
      </p>
      <form className="mt-7 grid gap-5">
        <label className="grid gap-2 text-sm font-bold text-[#81758e]">
          昵称
          <input
            placeholder="请输入昵称"
            className="h-12 rounded-xl border border-[#eee6f4] bg-[#fbf8ff] px-4 text-center text-base font-bold text-[#202033] placeholder:text-[#c7b8db]"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-[#81758e]">
          手机号
          <input
            placeholder="请输入手机号"
            className="h-12 rounded-xl border border-[#eee6f4] bg-[#fbf8ff] px-4 text-center text-base font-bold text-[#202033] placeholder:text-[#c7b8db]"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-[#81758e]">
          密码
          <input
            type="password"
            placeholder="请输入密码"
            className="h-12 rounded-xl border border-[#eee6f4] bg-[#fbf8ff] px-4 text-center text-base font-bold text-[#202033] placeholder:text-[#c7b8db]"
          />
        </label>
        <Link
          href="/library"
          className="h-12 rounded-xl bg-gradient-to-r from-[#bc62ec] to-[#ef70ad] text-center text-base font-black leading-[3rem] text-white shadow-[0_12px_26px_rgba(190,52,190,.2)]"
        >
          直接进入视频库
        </Link>
      </form>
      <div className="mt-6 rounded-xl border border-dashed border-[#eadff2] px-4 py-3 text-center text-sm font-semibold text-[#8b8198]">
        现在先跳过账号系统，专注播放 D:\videoes 里的视频。
      </div>
      <p className="mt-6 text-center text-sm font-semibold text-[#8b8198]">
        已有账户？
        <Link href="/login" className="text-[#a129f0]">
          返回登录
        </Link>
      </p>
    </ShadowAuthShell>
  );
}
