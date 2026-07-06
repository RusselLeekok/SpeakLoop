# SpeakLoop · 英语听力与口语跟读播放器

管理员在后台上传视频和 `.vtt` / `.srt` 字幕，后端真实解析字幕并统一转换为毫秒时间轴；
普通用户在前台选视频进入学习播放器，字幕严格跟随 `video.currentTime` 高亮，支持点句跳转、
单句循环、上一句/下一句、倍速、字幕模式切换和学习进度记忆。

## 技术栈

- **前端** `frontend/`：Next.js 14 App Router · React 18 · TypeScript · Tailwind CSS · shadcn 风格组件 · Zustand · TanStack Query · HTML5 video
- **后端** `backend/`：FastAPI · SQLAlchemy 2.0 · Alembic · Pydantic v2 · JWT + RBAC · 文件保存在本地 `backend/uploads/`
- **数据库**：MySQL 8（utf8mb4 / utf8mb4_unicode_ci）

## 快速启动

### 1. 准备数据库

在本机 MySQL 8 里创建数据库：

```sql
CREATE DATABASE speakloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 启动后端（端口 8000）

```bash
cd backend
python -m venv .venv               # 已创建则跳过
.venv\Scripts\pip install -r requirements.txt
```

编辑 `backend/.env`（已从 `.env.example` 生成），**把 `DATABASE_URL` 中的密码改成你自己的 MySQL 密码**：

```
DATABASE_URL=mysql+pymysql://root:你的密码@127.0.0.1:3306/speakloop?charset=utf8mb4
```

然后启动：

```bash
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

首次启动会自动建表并创建两个账号（可在 `.env` 修改或关闭）：

| 账号 | 密码 | 角色 |
|---|---|---|
| `admin` | `admin123456` | 管理员，可进后台 |
| `user` | `user123456` | 普通用户，用于云端进度同步 |

> 建表方式：默认 `AUTO_CREATE_TABLES=true` 启动时自动建表；也可以改用 Alembic：
> `.venv\Scripts\python -m alembic upgrade head`

### 3. 启动前端（端口 3000）

```bash
cd frontend
npm install                        # 已安装则跳过
npm run dev
```

如后端不在 `http://localhost:8000`，复制 `.env.local.example` 为 `.env.local` 修改。

### 4. 走一遍完整流程

1. 打开 `http://localhost:3000/admin/login`，用 `admin / admin123456` 登录后台。
2. 「视频管理 → 新增视频」：填标题，选一个 `.mp4` / `.webm` 视频，
   英文字幕选 `samples/sample_en.vtt`（时间轴需匹配你自己的视频，示例文件仅供体验流程），
   中文字幕可选 `samples/sample_zh.srt`，勾选「立即发布」后保存。
3. 上传后会显示解析出的字幕数量和 warning；进「字幕预览」页可以边播边点句核对时间轴。
4. 打开 `http://localhost:3000` 前台首页，进入视频 →「开始学习」。
5. 学习页：空格播放/暂停，←/→ 上一句/下一句，R 单句循环；点右侧任意字幕跳转；
   刷新页面会自动恢复上次学习进度（登录用户存服务端，游客存浏览器本地）。

## 目录结构

```
backend/
  app/
    main.py               # FastAPI 入口、CORS、/uploads 静态挂载、启动建表+种子账号
    config.py             # .env 配置
    database.py           # SQLAlchemy engine / session
    models.py             # users / videos / subtitles / subtitle_sources / subtitle_warnings / learning_progress
    schemas.py            # Pydantic 模型
    security.py           # bcrypt + JWT
    deps.py               # get_current_user / require_admin（RBAC）
    subtitle_parser.py    # .vtt/.srt 解析、毫秒转换、校验、中英按时间轴合并
    storage.py            # uploads/ 文件保存与清理
    routers/
      auth.py             # POST /api/auth/login, GET /api/auth/me
      admin.py            # /api/admin/*（仅 admin）：上传/列表/编辑/删除/重传字幕/字幕查看/统计
      public.py           # /api/videos*（仅已发布）、学习进度
  alembic/                # 迁移脚手架（0001_init）
  uploads/                # 视频 / 字幕 / 封面 / 录音（第二阶段）
frontend/
  src/app/
    page.tsx                       # 前台首页：搜索、分类筛选、视频卡片
    login/                         # 用户登录（进度云端同步）
    videos/[videoId]/              # 视频详情页
    learn/[videoId]/               # 学习播放器（核心页面）
    admin/                         # 后台：登录 / 概览 / 视频管理 / 新增 / 编辑 / 字幕预览
  src/lib/                         # api 客户端(XHR 上传进度)、zustand auth、本地进度、类型
  src/components/                  # shadcn 风格 UI 组件
samples/                           # 示例字幕文件（仅用于体验上传流程）
```

## 核心设计

- **时间源**：学习页用 `requestAnimationFrame` 循环读取 `video.currentTime`（唯一时间源），
  二分查找命中当前字幕，只在字幕切换时更新 React state；卸载时取消 rAF。
  字幕不用任何定时器自行推进。
- **字幕解析**：后端解析 `.vtt`/`.srt` → `start_ms`/`end_ms`；校验时间为负、start≥end、乱序（自动重排）、
  空字幕（过滤）、严重重叠（warning）、字幕超出视频时长（warning）；编码支持 UTF-8 / UTF-16 / GB18030。
- **中英合并**：英文字幕是主时间轴，中文字幕按时间重叠度对齐为 `zh_text`，未覆盖的句子产生 warning。
- **权限**：JWT + `role` 字段；`/api/admin/*` 全部经过 `require_admin`；
  前台接口只返回 `status = published` 的视频，其余状态一律 404。
- **失败清理**：视频文件非法 → 400 并删除已写入文件；字幕解析失败 → 视频记录标记 `failed`
  （方便管理员重传字幕），不保留半成品字幕数据；重传解析失败时旧字幕保持不变。

## 第二阶段预留

- `uploads/recordings/` 目录与 MediaRecorder 跟读录音
- 用户注册、收藏句子、单词卡、AI 翻译/讲解/口语评分
- `learning_progress` 已按 `(user_id, video_id)` 唯一约束设计，可直接扩展学习统计
