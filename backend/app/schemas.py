from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

VIDEO_STATUSES = {"draft", "processing", "ready", "published", "unpublished", "failed"}


# ---------- auth ----------

class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=255)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- subtitles ----------

class SubtitleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    video_id: int
    start_ms: int
    end_ms: int
    en_text: str | None
    zh_text: str | None
    sort_order: int


class WarningOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    warning_type: str | None
    message: str
    created_at: datetime


# ---------- videos ----------

class VideoPublicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    category: str | None
    cover_url: str | None
    duration: float | None
    subtitle_count: int
    published_at: datetime | None


class VideoDetailOut(VideoPublicOut):
    file_url: str


class VideoAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    category: str | None
    original_filename: str | None
    file_url: str
    cover_url: str | None
    duration: float | None
    file_size: int | None
    mime_type: str | None
    status: str
    subtitle_count: int
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None


class VideoAdminListOut(BaseModel):
    items: list[VideoAdminOut]
    total: int
    page: int
    page_size: int


class VideoUpdateIn(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    category: str | None = Field(default=None, max_length=100)
    status: str | None = None


class UploadResultOut(BaseModel):
    video_id: int
    title: str
    status: str
    file_url: str
    cover_url: str | None
    subtitle_count: int
    warnings: list[str]
    message: str | None = None


class ReuploadResultOut(BaseModel):
    video_id: int
    status: str
    subtitle_count: int
    warnings: list[str]
    message: str | None = None


class AdminSubtitlesOut(BaseModel):
    video_id: int
    subtitle_count: int
    subtitles: list[SubtitleOut]
    warnings: list[WarningOut]


class AdminStatsOut(BaseModel):
    total: int
    published: int
    draft: int
    ready: int
    unpublished: int
    failed: int
    recent: list[VideoAdminOut]


# ---------- progress ----------

class ProgressIn(BaseModel):
    last_time_ms: int = Field(ge=0)
    last_subtitle_id: int | None = None


class ProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    video_id: int
    last_time_ms: int
    last_subtitle_id: int | None
    updated_at: datetime
