# SpeakLoop

SpeakLoop 是一个面向英语精听、自主跟读和字幕学习的全栈视频学习平台。它把“素材管理、字幕处理、逐句播放、重点词句精读”放在同一个工作流里，适合用来搭建个人英语精听库、课程素材库，或给团队维护一套可持续更新的英语视频学习系统。

## 它用来做什么

很多英语视频平台只负责播放，真正学习时还要在播放器、字幕文件、笔记、词典之间来回切。SpeakLoop 的目标是把这些动作收在一个产品里：

- 管理员上传视频、导入在线视频，或对已有视频生成 / 重传字幕。
- 系统把字幕整理成可逐句定位的时间轴，供前台播放器精听使用。
- 学习者可以按句跳转、循环、调速、隐藏字幕、打开跟随字幕。
- 重点词和短语可以在字幕中轻量标注，并在精读卡片里集中复习。
- 后台可以对字幕轨做新增、删除、合并、拆分、锁定跟随和校对。

## 产品展示

### 前台学习工作台

前台用于浏览素材、筛选分类、进入精听学习。左侧保留学习统计和快捷入口，中间展示已发布视频库。

![Frontend workspace](docs/assets/speakloop-library-showcase.png)

### 精听播放器与精读卡片

播放页把视频、动态字幕和精读卡片并排放在一个学习界面里，适合边听边定位重点词句。

![Learning player with intensive cards](docs/assets/speakloop-player-showcase.png)

### 后台视频管理

后台用于上传、发布、下架、搜索和管理视频。每条素材都能看到处理状态、字幕数量、发布时间和后续编辑入口。

![Admin video management](docs/assets/speakloop-admin-showcase.png)

### 字幕轨道编辑

字幕编辑页支持边看视频边校对字幕，并提供字幕新增、合并、拆分、删除、锁定跟随等操作。

![Subtitle editor](docs/assets/speakloop-subtitle-editor-showcase.png)

## 核心亮点

- **逐句精听播放器**：字幕跟随 `video.currentTime` 高亮，支持点击字幕跳转、单句循环、上一句 / 下一句、5 秒快退快进、倍速播放。
- **精读学习模式**：字幕中的重点词和短语以轻下划线标注，可打开词卡、发音、标记认识 / 不认识，并按当前学习上下文排序。
- **字幕轨道编辑器**：后台支持字幕行新增、删除、合并、拆分、时间轴锁定、当前播放句回到固定锚点，便于快速校对。
- **视频素材后台**：支持上传本地视频、导入 URL、封面、分类、标签、状态流转、发布 / 下架。
- **自动字幕能力**：后端集成 `faster-whisper`，可对视频音轨生成字幕，并通过 Celery worker 异步处理任务。
- **双语字幕结构**：英文字幕作为主时间轴，中文翻译可作为可选字段展示，适合精听、盲听、填空和跟读。
- **学习进度记忆**：登录用户可保存服务端进度，未登录时也可保留浏览器本地进度。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 前端 | Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Zustand, TanStack Query |
| 后端 | FastAPI, SQLAlchemy 2, Pydantic v2, JWT, RBAC |
| 异步任务 | Celery, Redis |
| 数据库 | MySQL 8 |
| 媒体处理 | yt-dlp, faster-whisper, FFmpeg |
| 部署 | Docker Compose |

## 快速部署

### 1. 克隆项目

```bash
git clone git@github.com:RusselLeekok/speakLoop.git
cd speakLoop
```

### 2. 准备环境变量

```bash
cp .env.example .env
```

本地体验可以直接使用默认值。正式部署前请至少修改：

```env
JWT_SECRET=replace-with-a-long-random-secret
MYSQL_PASSWORD=replace-with-a-strong-password
MYSQL_ROOT_PASSWORD=replace-with-a-strong-root-password
ADMIN_PASSWORD=replace-with-a-strong-admin-password
```

### 3. 一键启动

```bash
docker compose up -d --build
```

启动后访问：

- 前台：<http://localhost:3000>
- 备用前台端口：<http://localhost:13000>
- 后端 API：<http://localhost:18000/api/health>
- 后台登录：<http://localhost:3000/admin/login>

默认账号：

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `admin` | `admin123456` | 管理员 |
| `user` | `user123456` | 普通学习用户 |

> 正式环境务必修改默认账号密码。

## 推荐启动顺序

如果你的机器上 Docker / MySQL 启动较慢，后端可能会比数据库更早启动。可以使用更稳的分步启动方式：

```bash
docker compose up -d mysql redis
docker compose ps
docker compose up -d backend worker frontend
```

确认服务：

```bash
docker compose ps
docker compose logs -f backend
```

## 常用命令

```bash
# 启动全部服务
docker compose up -d

# 重建并启动
docker compose up -d --build

# 重启前端
docker compose restart frontend

# 重启后端和任务 worker
docker compose restart backend worker

# 查看日志
docker compose logs -f backend
docker compose logs -f worker

# 停止服务，但保留数据库和上传文件卷
docker compose down
```

## 本地开发

前端：

```bash
cd frontend
npm install
npm run dev
```

后端：

```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

如果不用 Docker，需要自行准备 MySQL 8 和 Redis，并在 `.env` 中配置：

```env
DATABASE_URL=mysql+pymysql://user:password@127.0.0.1:3306/speakloop?charset=utf8mb4
REDIS_URL=redis://127.0.0.1:6379/0
```

## 目录结构

```text
backend/
  app/
    main.py              # FastAPI 入口、CORS、uploads 静态资源、启动初始化
    config.py            # 环境变量配置
    database.py          # SQLAlchemy engine / session
    models.py            # 用户、视频、字幕、任务、学习进度等模型
    routers/
      auth.py            # 登录与当前用户
      admin.py           # 后台视频、字幕、任务、标签管理
      public.py          # 前台视频、字幕、学习进度接口
    tasks.py             # Celery 异步任务
    media_tools.py       # 下载、封面、媒体分析工具
    subtitle_ops.py      # 字幕清理与替换逻辑
frontend/
  src/app/
    page.tsx             # 前台工作台
    learn/[videoId]/     # 精听播放器
    admin/               # 后台管理页面
  src/components/        # UI 组件和业务组件
  src/lib/               # API client、auth store、本地进度等
docs/assets/             # README 产品展示图
docker-compose.yml       # 本地和单机部署编排
```

## 生产部署提示

- 使用强随机 `JWT_SECRET`，并修改默认账号密码。
- 将 `CORS_ORIGINS` 改成你的真实域名。
- 为前端和后端配置 HTTPS 反向代理。
- 持久化 `speakloop_app_mysql_data` 和 `speakloop_app_uploads_data` 两个 Docker volume。
- 如果要长时间跑 Whisper，建议给 worker 单独分配更充足的 CPU / 内存，或切换到 GPU 环境。
- 大视频上传前确认 `MAX_VIDEO_SIZE_MB`、反向代理 body size、磁盘空间都足够。

