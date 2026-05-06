from __future__ import annotations

import html
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
GUIDES_DIR = ROOT / "content" / "guides"

NOTION_API = "https://www.notion.so/api/v3/loadPageChunk"


def request_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"user-agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read()
    return data.decode("utf-8", errors="replace")


def request_json(url: str, payload: dict[str, Any]) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"content-type": "application/json", "user-agent": "Mozilla/5.0"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def notion_page(page_id: str) -> dict[str, Any]:
    return request_json(
        NOTION_API,
        {
            "pageId": page_id,
            "limit": 1000,
            "cursor": {"stack": []},
            "chunkNumber": 0,
            "verticalColumns": False,
        },
    )


def markdown_link(label: str, url: str) -> str:
    safe_label = label.replace("[", "\\[").replace("]", "\\]")
    safe_url = url.replace(")", "%29")
    return f"[{safe_label}]({safe_url})"


def rich_text(value: Any) -> str:
    if not value:
        return ""
    parts: list[str] = []
    for item in value:
        if isinstance(item, list) and item:
            text = str(item[0])
            annotations = item[1] if len(item) > 1 and isinstance(item[1], list) else []
            href = ""
            link_title = ""
            is_bold = False
            is_italic = False
            for annotation in annotations:
                if not isinstance(annotation, list) or not annotation:
                    continue
                kind = annotation[0]
                if kind == "a" and len(annotation) > 1:
                    href = str(annotation[1])
                elif kind == "lm" and len(annotation) > 1 and isinstance(annotation[1], dict):
                    href = str(annotation[1].get("href") or "")
                    link_title = str(annotation[1].get("title") or annotation[1].get("link_provider") or "")
                elif kind == "b":
                    is_bold = True
                elif kind == "i":
                    is_italic = True

            if href and text.strip() == "‣":
                text = link_title or href
            rendered = markdown_link(text, href) if href else text
            if is_bold and not href:
                rendered = f"**{rendered}**"
            if is_italic and not href:
                rendered = f"*{rendered}*"
            parts.append(rendered)
    return "".join(parts)


def block_value(record_map: dict[str, Any], block_id: str) -> dict[str, Any]:
    raw = record_map.get("block", {}).get(block_id, {})
    return raw.get("value", {}).get("value") or raw.get("value") or {}


def markdown_prefix(block_type: str) -> str:
    return {
        "header": "## ",
        "sub_header": "### ",
        "sub_sub_header": "#### ",
        "bulleted_list": "- ",
        "numbered_list": "1. ",
        "to_do": "- [ ] ",
        "quote": "> ",
        "callout": "> ",
        "page": "## ",
    }.get(block_type, "")


def collect_notion(record_map: dict[str, Any], block_id: str, seen: set[str] | None = None) -> list[str]:
    if seen is None:
        seen = set()
    if block_id in seen:
        return []
    seen.add(block_id)

    block = block_value(record_map, block_id)
    block_type = str(block.get("type", ""))
    props = block.get("properties") or {}
    text = rich_text(props.get("title")).strip()
    lines: list[str] = []

    if text:
        lines.append(f"{markdown_prefix(block_type)}{text}".rstrip())

    for child_id in block.get("content") or []:
        lines.extend(collect_notion(record_map, child_id, seen))
    return lines


def notion_markdown(page_id: str) -> str:
    data = notion_page(page_id)
    record_map = data["recordMap"]
    root = block_value(record_map, page_id)

    if root.get("type") == "collection_view_page":
        lines = collect_notion(record_map, page_id)
        view_values = [item.get("value", {}).get("value") or item.get("value") or {} for item in record_map.get("collection_view", {}).values()]
        page_ids: list[str] = []
        for view in view_values:
            for item in view.get("page_sort") or []:
                if item not in page_ids:
                    page_ids.append(item)
        for child_page_id in page_ids:
            child = notion_page(child_page_id)
            child_lines = collect_notion(child["recordMap"], child_page_id)
            if child_lines:
                lines.append("")
                lines.extend(child_lines)
        return clean_markdown("\n".join(lines))

    return clean_markdown("\n".join(collect_notion(record_map, page_id)))


class TextExtractor(HTMLParser):
    block_tags = {
        "article",
        "aside",
        "br",
        "div",
        "footer",
        "h1",
        "h2",
        "h3",
        "h4",
        "header",
        "li",
        "main",
        "p",
        "section",
        "td",
        "th",
        "tr",
    }

    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self.block_tags:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in self.block_tags:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.parts.append(data)

    def text(self) -> str:
        text = html.unescape("".join(self.parts))
        text = re.sub(r"[ \t\r\f\v]+", " ", text)
        text = re.sub(r"\n\s+", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()


def nbtc_markdown() -> str:
    raw = request_text("https://nstcprep.pk/nbtc/guide")
    raw = re.sub(r"<script[\s\S]*?</script>", " ", raw, flags=re.I)
    raw = re.sub(r"<style[\s\S]*?</style>", " ", raw, flags=re.I)
    parser = TextExtractor()
    parser.feed(raw)
    text = parser.text()
    start = text.find("A complete guide to crack National Biology Talent Contest.")
    end = text.find("\nTips:", start)
    if end == -1:
        end = text.find("\nEdit on GitHub", start)
    article = text[start:end].strip() if start != -1 and end != -1 else text
    return clean_markdown("# NBTC Preparation Guide\n\n" + article)


def google_doc_markdown() -> str:
    text = request_text("https://docs.google.com/document/d/1l4rUhUfHuZJftv_2JXVU_hEhO-ZFPPr_j1yWehLLcRk/export?format=txt")
    text = text.lstrip("\ufeff").strip()
    return clean_markdown("# NCTC and IChO Selection Guide\n\n" + text)


def clean_markdown(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def yaml_value(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def write_guide(slug: str, meta: dict[str, Any], body: str) -> None:
    frontmatter = ["---"]
    for key, value in meta.items():
        if isinstance(value, list):
            frontmatter.append(f"{key}: [{', '.join(yaml_value(str(item)) for item in value)}]")
        elif isinstance(value, bool):
            frontmatter.append(f"{key}: {str(value).lower()}")
        else:
            frontmatter.append(f"{key}: {yaml_value(str(value))}")
    frontmatter.append("---")
    GUIDES_DIR.mkdir(parents=True, exist_ok=True)
    (GUIDES_DIR / f"{slug}.mdx").write_text("\n".join(frontmatter) + "\n\n" + body + "\n", encoding="utf-8")


def main() -> None:
    guides = [
        (
            "guide-to-ipho-through-nstc",
            {
                "title": "Guide to IPhO through NSTC",
                "description": "A complete guide to IPhO through NSTC.",
                "category": "Physics",
                "level": "Advanced",
                "readTime": "45 min",
                "author": "Daniyal Shahzad, reviewed by Osman Siddique and Talha Ashraf",
                "updated": "2026-05-06",
                "sourceUrl": "https://husky-guan-e1d.notion.site/Guide-to-IPhO-through-NSTC-18754621175380dd8f99f12762588437",
                "tags": ["IPhO", "NSTC", "physics", "camp selection"],
                "featured": True,
            },
            lambda: notion_markdown("18754621-1753-80dd-8f99-f12762588437"),
        ),
        (
            "nmtc-guide",
            {
                "title": "NMTC Guide",
                "description": "NMTC and IMO preparation guidance for Pakistan's selection pathway.",
                "category": "Mathematics",
                "level": "Advanced",
                "readTime": "40 min",
                "author": "Ahmed Raza",
                "updated": "2026-05-06",
                "sourceUrl": "https://ahmedraza.notion.site/NMTC-Guide-e5f314eb047346bd9f5f78a185793564",
                "tags": ["NMTC", "IMO", "mathematics", "proofs"],
                "featured": True,
            },
            lambda: notion_markdown("e5f314eb-0473-46bd-9f5f-78a185793564"),
        ),
        (
            "nctc-icho-selection-guide",
            {
                "title": "NCTC and IChO Selection Guide",
                "description": "NCTC and IChO selection guidance for chemistry olympiad preparation.",
                "category": "Chemistry",
                "level": "Advanced",
                "readTime": "35 min",
                "author": "Abdul Rafay, reviewed by IChO 2024 and 2025 team members",
                "updated": "2026-05-06",
                "sourceUrl": "https://docs.google.com/document/d/1l4rUhUfHuZJftv_2JXVU_hEhO-ZFPPr_j1yWehLLcRk/edit",
                "tags": ["NCTC", "IChO", "chemistry", "NSTC"],
                "featured": True,
            },
            google_doc_markdown,
        ),
        (
            "poi-guide",
            {
                "title": "Pakistan Olympiad in Informatics Guide",
                "description": "Pakistan Olympiad in Informatics and IOI preparation guidance.",
                "category": "Informatics",
                "level": "Beginner",
                "readTime": "35 min",
                "author": "Pakistan Competitive Programming Community contributors",
                "updated": "2026-05-06",
                "sourceUrl": "https://poi-guide.notion.site/2455dbb3971780fb8547c6bdbc6a9664?v=2455dbb397178065a320000c4d646344",
                "tags": ["POI", "IOI", "competitive programming", "C++"],
                "featured": True,
            },
            lambda: notion_markdown("2455dbb3-9717-80fb-8547-c6bdbc6a9664"),
        ),
        (
            "nbtc-guide",
            {
                "title": "NBTC Preparation Guide",
                "description": "Imported biology preparation guide from NSTCPrep.",
                "category": "Biology",
                "level": "Intermediate",
                "readTime": "30 min",
                "author": "Ali Azlan",
                "updated": "2026-05-06",
                "sourceUrl": "https://nstcprep.pk/nbtc/guide",
                "tags": ["NBTC", "IBO", "biology", "NSTC"],
                "featured": True,
            },
            nbtc_markdown,
        ),
        (
            "ioaa-pakistan-guide",
            {
                "title": "IOAA Pakistan Guide",
                "description": "IOAA Pakistan selection and preparation guidance.",
                "category": "Astronomy",
                "level": "Advanced",
                "readTime": "40 min",
                "author": "Daniyal Shahzad",
                "updated": "2026-05-06",
                "sourceUrl": "https://husky-guan-e1d.notion.site/IOAA-Pakistan-Guide-21a54621175380bbb45ac694434467b3",
                "tags": ["IOAA", "astronomy", "astrophysics", "OctiLearn"],
                "featured": True,
            },
            lambda: notion_markdown("21a54621-1753-80bb-b45a-c694434467b3"),
        ),
    ]

    for slug, meta, body_factory in guides:
        write_guide(slug, meta, body_factory())


if __name__ == "__main__":
    main()
