import Link from "next/link";

export function ShadowAuthShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <main className="shadow-gradient grid min-h-screen place-items-start px-6 py-16 text-[#202033]">
      <div className="mx-auto w-full max-w-[420px]">
        <Link href="/" className="mb-24 flex flex-col items-center text-center">
          <span className="brand-mark grid size-32 place-items-center rounded-full text-2xl font-black italic text-[#8b536b] shadow-sm">
            SV
          </span>
          <span className="mt-5 text-5xl font-black italic leading-none">
            Shadow<span className="text-[#df6c95]">Vlog</span>
          </span>
          <span className="mt-3 text-xs font-semibold tracking-[0.4em] text-[#8b8198]">
            跟读 · 练口语 · 说出自信
          </span>
        </Link>
        <section className="rounded-[24px] bg-white/94 p-8 shadow-[0_28px_70px_rgba(110,70,138,.13)]">
          <h1 className="text-center text-2xl font-black tracking-[0.34em]">
            {title}
          </h1>
          {children}
        </section>
      </div>
    </main>
  );
}
