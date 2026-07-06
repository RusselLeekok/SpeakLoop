"""解析 .vtt / .srt 字幕文件，统一为毫秒时间轴，并做校验与 warning 收集。"""

import re
from dataclasses import dataclass, field


class SubtitleParseError(Exception):
    """字幕解析失败，message 面向管理员展示。"""


@dataclass
class Cue:
    start_ms: int
    end_ms: int
    text: str


@dataclass
class ParseResult:
    cues: list[Cue]
    warnings: list[str] = field(default_factory=list)


# 00:00:01.000 / 00:01.000 / 00:00:01,000
_TIME_RE = re.compile(r"^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})$")
_ARROW_RE = re.compile(r"-->")
_TAG_RE = re.compile(r"<[^>]+>")


def _parse_timestamp(raw: str, context: str) -> int:
    raw = raw.strip()
    m = _TIME_RE.match(raw)
    if not m:
        raise SubtitleParseError(f"{context}：时间格式错误 “{raw}”")
    hours = int(m.group(1)) if m.group(1) is not None else 0
    minutes = int(m.group(2))
    seconds = int(m.group(3))
    millis = int(m.group(4).ljust(3, "0"))
    if minutes >= 60 or seconds >= 60:
        raise SubtitleParseError(f"{context}：时间数值超出范围 “{raw}”")
    return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis


def _parse_time_line(line: str, context: str) -> tuple[int, int]:
    parts = _ARROW_RE.split(line)
    if len(parts) != 2:
        raise SubtitleParseError(f"{context}：缺少 “-->” 时间分隔符")
    start_raw = parts[0].strip()
    # VTT 时间行后可能带 cue 设置，如 "00:00:05.000 line:0 position:50%"
    end_raw = parts[1].strip().split(" ")[0].split("\t")[0]
    start_ms = _parse_timestamp(start_raw, context)
    end_ms = _parse_timestamp(end_raw, context)
    return start_ms, end_ms


def _clean_text(lines: list[str]) -> str:
    text = "\n".join(lines).strip()
    text = _TAG_RE.sub("", text)
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&nbsp;", " ")
    return text.strip()


def _split_blocks(content: str) -> list[list[str]]:
    blocks: list[list[str]] = []
    current: list[str] = []
    for line in content.split("\n"):
        if line.strip() == "":
            if current:
                blocks.append(current)
                current = []
        else:
            current.append(line.rstrip("\r"))
    if current:
        blocks.append(current)
    return blocks


def parse_srt(content: str) -> list[Cue]:
    cues: list[Cue] = []
    blocks = _split_blocks(content)
    if not blocks:
        raise SubtitleParseError("SRT 文件为空")
    cue_no = 0
    for block in blocks:
        cue_no += 1
        lines = block
        # 第一行可能是序号
        if lines and re.fullmatch(r"\d+", lines[0].strip()):
            lines = lines[1:]
        if not lines:
            continue
        context = f"第 {cue_no} 条字幕"
        if "-->" not in lines[0]:
            raise SubtitleParseError(f"{context}：找不到时间行")
        start_ms, end_ms = _parse_time_line(lines[0], context)
        text = _clean_text(lines[1:])
        cues.append(Cue(start_ms=start_ms, end_ms=end_ms, text=text))
    return cues


def parse_vtt(content: str) -> list[Cue]:
    lines = [line.rstrip("\r") for line in content.split("\n")]
    if not lines or not lines[0].strip().lstrip("﻿").startswith("WEBVTT"):
        raise SubtitleParseError("VTT 文件缺少 WEBVTT 文件头")

    cues: list[Cue] = []
    blocks = _split_blocks("\n".join(lines[1:]))
    cue_no = 0
    for block in blocks:
        first = block[0].strip()
        # 跳过 NOTE / STYLE / REGION 块
        if first.startswith(("NOTE", "STYLE", "REGION")):
            continue
        lines_in_block = block
        # cue 可以带 identifier 行（不含 -->）
        if "-->" not in lines_in_block[0]:
            lines_in_block = lines_in_block[1:]
        if not lines_in_block or "-->" not in lines_in_block[0]:
            continue
        cue_no += 1
        context = f"第 {cue_no} 条字幕"
        start_ms, end_ms = _parse_time_line(lines_in_block[0], context)
        text = _clean_text(lines_in_block[1:])
        cues.append(Cue(start_ms=start_ms, end_ms=end_ms, text=text))
    return cues


def decode_subtitle_bytes(data: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-16", "gb18030"):
        try:
            return data.decode(encoding)
        except (UnicodeDecodeError, UnicodeError):
            continue
    raise SubtitleParseError("无法识别字幕文件编码，请使用 UTF-8 编码保存")


def parse_subtitle(data: bytes, filename: str) -> ParseResult:
    """解析字幕文件字节内容。抛出 SubtitleParseError 表示解析失败。"""
    content = decode_subtitle_bytes(data)
    name = (filename or "").lower()
    if name.endswith(".vtt"):
        cues = parse_vtt(content)
    elif name.endswith(".srt"):
        cues = parse_srt(content)
    else:
        raise SubtitleParseError("字幕文件只支持 .vtt 或 .srt 格式")

    warnings: list[str] = []

    # 过滤空字幕
    non_empty = [c for c in cues if c.text]
    dropped = len(cues) - len(non_empty)
    if dropped > 0:
        warnings.append(f"已过滤 {dropped} 条空字幕")
    cues = non_empty
    if not cues:
        raise SubtitleParseError("字幕文件中没有有效字幕内容")

    # 时间校验
    for i, cue in enumerate(cues, start=1):
        if cue.start_ms < 0 or cue.end_ms < 0:
            raise SubtitleParseError(f"第 {i} 条字幕时间为负数")
        if cue.start_ms >= cue.end_ms:
            raise SubtitleParseError(
                f"第 {i} 条字幕开始时间不早于结束时间（{cue.start_ms}ms >= {cue.end_ms}ms）"
            )

    # 按开始时间升序
    sorted_cues = sorted(cues, key=lambda c: (c.start_ms, c.end_ms))
    if sorted_cues != cues:
        warnings.append("字幕时间顺序有乱序，已按开始时间自动重新排序")
    cues = sorted_cues

    # 严重重叠检测（重叠超过 500ms 视为严重）
    overlap_count = 0
    for prev, cur in zip(cues, cues[1:]):
        if prev.end_ms - cur.start_ms > 500:
            overlap_count += 1
    if overlap_count > 0:
        warnings.append(f"检测到 {overlap_count} 处字幕时间严重重叠（超过 500ms），可能影响逐句循环")

    return ParseResult(cues=cues, warnings=warnings)


def merge_zh_into_en(en_cues: list[Cue], zh_cues: list[Cue]) -> tuple[list[str | None], list[str]]:
    """以英文字幕为主时间轴，按时间重叠度为每条英文字幕匹配中文文本。

    返回 (zh_texts 与 en_cues 一一对应, warnings)。
    """
    warnings: list[str] = []
    zh_texts: list[str | None] = [None] * len(en_cues)

    j = 0
    matched = 0
    for i, en in enumerate(en_cues):
        best_overlap = 0
        best_text: str | None = None
        # 中英文字幕都按时间升序，用滑动指针避免全量扫描
        while j > 0 and zh_cues[j - 1].end_ms > en.start_ms:
            j -= 1
        k = j
        while k < len(zh_cues) and zh_cues[k].start_ms < en.end_ms:
            overlap = min(en.end_ms, zh_cues[k].end_ms) - max(en.start_ms, zh_cues[k].start_ms)
            if overlap > best_overlap:
                best_overlap = overlap
                best_text = zh_cues[k].text
            k += 1
        if k > j:
            j = max(j, k - 1)
        if best_text:
            zh_texts[i] = best_text
            matched += 1

    if zh_cues and matched < len(en_cues):
        missing = len(en_cues) - matched
        if len(zh_cues) < len(en_cues):
            warnings.append(f"中文字幕数量少于英文字幕，有 {missing} 条字幕没有中文翻译")
        else:
            warnings.append(f"中文字幕未能按时间对齐全部英文字幕，有 {missing} 条字幕没有中文翻译")

    return zh_texts, warnings
