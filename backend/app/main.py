from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from .config import get_settings
from .database import Base, SessionLocal, engine
from .models import User
from .routers import admin, auth, public
from .security import hash_password
from .storage import ensure_upload_dirs

settings = get_settings()


def seed_default_users() -> None:
    """首次启动时创建默认管理员和演示用户（可通过 .env 关闭）。"""
    with SessionLocal() as db:
        if db.scalar(select(User).limit(1)) is not None:
            return
        db.add(User(
            username=settings.admin_username,
            password_hash=hash_password(settings.admin_password),
            role="admin",
        ))
        db.add(User(
            username=settings.demo_username,
            password_hash=hash_password(settings.demo_password),
            role="user",
        ))
        db.commit()
        print(f"[seed] 已创建默认管理员：{settings.admin_username} / {settings.admin_password}")
        print(f"[seed] 已创建演示用户：{settings.demo_username} / {settings.demo_password}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_upload_dirs()
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    if settings.seed_default_users:
        seed_default_users()
    yield


app = FastAPI(title="SpeakLoop API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ensure_upload_dirs()
app.mount("/uploads", StaticFiles(directory=str(settings.upload_root)), name="uploads")

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(public.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
