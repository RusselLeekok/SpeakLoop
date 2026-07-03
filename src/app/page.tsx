import Link from "next/link";
import {
  BookOpen,
  CirclePlay,
  Gift,
  Globe2,
  MonitorSmartphone,
  Palette,
  PencilLine,
  RefreshCcw,
  Search,
  Target,
  Tv,
} from "lucide-react";

const stats = [
  { icon: Tv, value: "215+", label: "期学习素材" },
  { icon: BookOpen, value: "10+", label: "学习主题" },
  { icon: Target, value: "12+", label: "学习功能" },
  { icon: MonitorSmartphone, value: "3", label: "全设备访问" },
];

const topics = [
  "日常生活",
  "美食探店",
  "旅行随拍",
  "职场成长",
  "学习心得",
  "家庭关系",
  "美妆穿搭",
  "健身健康",
  "科技数码",
  "兴趣手作",
];

const steps = [
  {
    icon: CirclePlay,
    no: "01",
    title: "不看字幕泛听",
    text: "先尝试理解大意，听不懂没事，正好说明要涨知识啦~",
  },
  {
    icon: BookOpen,
    no: "02",
    title: "中英字幕理解",
    text: "打开「中英字幕」按钮对照理解，词汇量够的可以只看英文。",
  },
  {
    icon: Search,
    no: "03",
    title: "内容精读",
    text: "点击「单词卡」学习重点单词、短语、表达，给卡片标注学习状态。",
  },
  {
    icon: PencilLine,
    no: "04",
    title: "跟读模仿",
    text: "进入跟读，先听原音，再录音、再比对，发音和语调会越来越自然。",
  },
  {
    icon: RefreshCcw,
    no: "05",
    title: "单词复习",
    text: "回想使用场景，想象自己是博主，让表达脱口而出。",
  },
];

const faqs = [
  ["是按月订阅还是一次买断？", "一次购买，永久使用。无续费、无隐藏消费，已上线和后续更新的素材都可以学。"],
  ["内容多久更新一次？", "每周新增 5 期左右，持续扩充真实 Vlog 练习素材。"],
  ["可以在哪些设备上使用？", "手机、平板、电脑都可以访问，练习进度可按账号同步。"],
  ["没有激活码可以用吗？", "可以。当前本地学习版已关闭激活码校验，直接进入视频库即可使用。"],
];

const activationSteps = [
  {
    no: "1",
    title: "直接进入本地学习版",
    text: "无需激活码，登录或注册后都会进入 D:\\videoes 视频库。",
    icon: Gift,
  },
  {
    no: "2",
    title: "选择一个视频卡片",
    text: "系统会自动读取本地视频，并按卡片形式展示。",
    icon: Palette,
  },
  {
    no: "3",
    title: "立即开始学习",
    text: "点击卡片进入播放页，直接开始看视频练习。",
    icon: Globe2,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fbf7ff] text-[#202033]">
      <header className="sticky top-0 z-30 border-b border-[#efe6f4] bg-[#fffaff]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-[100px] max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="brand-mark grid size-[54px] place-items-center rounded-full text-[10px] font-black italic text-[#8b536b] shadow-sm">
              SV
            </span>
            <span className="hidden text-xs italic leading-4 text-[#8b536b] sm:block">
              ShadowVlog
              <br />
              learn with vlogs
            </span>
          </Link>
          <nav className="flex items-center gap-7 text-base font-black">
            <Link href="/login" className="text-[#202033] hover:text-[#8a2be2]">
              登录
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-[#8a2be2] to-[#ec3d9a] px-8 py-4 text-white shadow-[0_14px_30px_rgba(190,52,190,.32)] hover:scale-[1.02]"
            >
              进入学习
            </Link>
          </nav>
        </div>
      </header>

      <section className="shadow-gradient border-b border-[#f3eaf7]">
        <div className="mx-auto flex min-h-[620px] max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
          <p className="mb-9 text-sm font-black tracking-[0.42em] text-[#8b5cf6]">
            - SPEAK · EVERY DAY -
          </p>
          <h1 className="flex flex-col items-center justify-center gap-4 text-[64px] font-black leading-none tracking-normal md:flex-row md:text-[76px] lg:text-[88px]">
            <span className="bg-gradient-to-r from-[#8a2be2] via-[#d936ad] to-[#ff5d5d] bg-clip-text text-transparent">
              365 天
            </span>
            <span className="hidden h-[74px] w-px bg-[#c7b8ee] md:block" />
            <span className="text-[#1f2139]">跟着 Vlog 学英语</span>
          </h1>
          <p className="mt-8 text-lg font-semibold text-[#7c7485]">
            影子跟读法 · 真实母语素材 · 一次买断永久学
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {[
              ["🎬", "影子跟读"],
              ["🌍", "真实素材"],
              ["💬", "无痛开口"],
            ].map(([emoji, label]) => (
              <span
                key={label}
                className="rounded-full bg-white/72 px-5 py-2 text-sm font-black text-[#8a2be2] shadow-sm"
              >
                {emoji} {label}
              </span>
            ))}
          </div>
          <div className="mt-16 grid w-full max-w-[760px] grid-cols-2 gap-5 md:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-[18px] border border-[#ece4f4] bg-white/88 px-6 py-8 shadow-sm"
                >
                  <Icon className="mx-auto text-[#8a2be2]" size={25} />
                  <div className="mt-4 text-3xl font-black text-[#8a2be2]">
                    {item.value}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[#766f7f]">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <h2 className="text-4xl font-black">免费试看</h2>
        <p className="mt-5 text-base font-semibold text-[#746d7d]">
          完整功能试看 · 中英字幕 / 单句点读 / 录音跟读 / 闪卡练习一应俱全
        </p>
        <Link
          href="/demo"
          className="mx-auto mt-12 block max-w-[720px] overflow-hidden rounded-[18px] border border-[#e8dff0] bg-white text-left shadow-sm"
        >
          <div
            className="relative aspect-video bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1400&q=80)",
            }}
          >
            <div className="absolute inset-0 bg-black/18" />
            <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#8a2be2] shadow-xl">
              <CirclePlay size={38} fill="currentColor" strokeWidth={1.4} />
            </span>
            <p className="absolute inset-x-0 bottom-6 text-center text-lg font-black text-white drop-shadow">
              新手做视频：先完成，再完美
            </p>
          </div>
          <div className="py-6 text-center text-base font-black text-[#8a2be2]">
            试看 · 完整功能 →
          </div>
        </Link>
      </section>

      <section className="px-6 py-20 text-center">
        <h2 className="text-4xl font-black">手机｜电脑</h2>
        <p className="mt-4 text-xs font-black tracking-[0.28em] text-[#8b5cf6]">
          ALL DEVICES · SEAMLESSLY SYNCED
        </p>
        <p className="mt-4 text-base font-semibold text-[#746d7d]">
          全设备稳定访问
        </p>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-[0.72fr_1fr]">
          <div className="phone-frame mx-auto h-[420px] w-[220px] bg-gradient-to-b from-[#1f2139] to-[#563070] p-3">
            <div className="h-full rounded-[22px] bg-[#fffaff] p-4">
              <div className="h-36 rounded-2xl bg-gradient-to-br from-[#dec7ff] to-[#ffd5e8]" />
              <div className="mt-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-[#f4eff8]" />
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-[24px] border border-[#e8dff0] bg-white p-6 shadow-sm">
            <div className="aspect-video rounded-[18px] bg-gradient-to-br from-[#f3e8ff] via-white to-[#ffe4ef] p-5 text-left">
              <div className="h-5 w-32 rounded-full bg-[#eadcf6]" />
              <div className="mt-10 h-12 w-4/5 rounded-2xl bg-[#202033]" />
              <div className="mt-5 h-4 w-2/3 rounded-full bg-[#d8c7e9]" />
              <div className="mt-12 grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-white shadow-sm" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <h2 className="text-4xl font-black">油管 Vlog 素材库</h2>
        <p className="mt-5 text-base font-semibold text-[#746d7d]">
          已更新 215+ 期 · 每周新增 5 期
        </p>
        <div className="mx-auto mt-14 flex max-w-md items-center justify-center gap-6">
          <div className="text-4xl font-black text-[#8a2be2]">10+</div>
          <div className="text-left">
            <div className="text-base font-black">学习主题</div>
            <div className="text-sm text-[#746d7d]">
              curated for everyday conversation
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-4">
          {topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-[#ece4f4] bg-white px-6 py-3 text-sm font-black shadow-sm"
            >
              {topic}
            </span>
          ))}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-black">5 步跟读法</h2>
          <p className="mt-5 text-base font-semibold text-[#746d7d]">
            一套被验证有效的练习节奏，从泛听到脱口而出
          </p>
          <div className="mt-12 grid gap-4 text-left">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.no}
                  className="grid gap-5 rounded-[18px] border border-[#ece4f4] bg-white p-6 shadow-sm sm:grid-cols-[64px_72px_1fr]"
                >
                  <span className="grid size-14 place-items-center rounded-2xl bg-[#f4efff] text-[#8a2be2]">
                    <Icon size={25} />
                  </span>
                  <div className="text-3xl font-black text-[#8a2be2]">
                    {step.no}
                  </div>
                  <div>
                    <h3 className="text-lg font-black">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#746d7d]">
                      {step.text}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-4xl font-black">FAQ</h2>
            <p className="mt-4 text-base font-semibold text-[#746d7d]">
              关于购买与学习
            </p>
          </div>
          <div className="mt-10 divide-y divide-[#eee5f4] rounded-[18px] border border-[#ece4f4] bg-white shadow-sm">
            {faqs.map(([question, answer], index) => (
              <details key={question} className="group p-6" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black">
                  {question}
                  <span className="text-2xl text-[#8a2be2] group-open:hidden">
                    +
                  </span>
                  <span className="hidden text-2xl text-[#8a2be2] group-open:block">
                    -
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-[#746d7d]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <h2 className="text-4xl font-black">三步开始本地学习</h2>
        <p className="mt-5 text-base font-semibold text-[#746d7d]">
          无需激活码，直接使用本地视频库
        </p>
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
          {activationSteps.map(({ no, title, text, icon: Icon }) => (
            <article
              key={no}
              className="rounded-[18px] border border-[#ece4f4] bg-white p-6 text-left shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black text-[#8a2be2]">{no}</span>
                <Icon className="text-[#ec3d9a]" size={28} />
              </div>
              <h3 className="mt-6 text-lg font-black">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#746d7d]">
                {text}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-r from-[#8a2be2] to-[#ec3d9a] px-8 py-4 text-base font-black text-white shadow-[0_14px_30px_rgba(190,52,190,.28)]"
          >
            免激活码 · 直接注册
          </Link>
          <Link
            href="/demo"
            className="rounded-full border border-[#e1d6ea] bg-white px-8 py-4 text-base font-black text-[#8a2be2]"
          >
            先去免费试看
          </Link>
        </div>
        <div className="mx-auto mt-12 grid size-40 place-items-center rounded-[18px] border border-[#ece4f4] bg-white text-sm font-black text-[#8a2be2] shadow-sm">
          本地学习版
          <span className="text-xs text-[#746d7d]">D:\videoes</span>
        </div>
      </section>

      <footer className="border-t border-[#efe6f4] py-8 text-center text-sm font-semibold text-[#8b8198]">
        © 2026 ShadowVlog · 跟着 Vlog 学英语
      </footer>
    </main>
  );
}
