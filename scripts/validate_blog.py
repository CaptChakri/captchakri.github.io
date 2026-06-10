#!/usr/bin/env python3
"""Validate date-based blog permalinks and publication metadata."""

from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
POSTS_FILE = ROOT / "blog" / "posts.json"
SITEMAP_FILE = ROOT / "sitemap.xml"
SITE_URL = "https://captchakri.github.io"
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def permalink(post: dict[str, object]) -> tuple[Path, str]:
    slug = post.get("slug")
    published = post.get("date")
    if not isinstance(slug, str) or not SLUG_PATTERN.fullmatch(slug):
        fail(f"invalid slug {slug!r}; use lowercase words separated by hyphens")
    if not isinstance(published, str):
        fail(f"post {slug!r} is missing an ISO date")
    try:
        parsed = date.fromisoformat(published)
    except ValueError:
        fail(f"post {slug!r} has invalid date {published!r}; expected YYYY-MM-DD")

    relative = Path("blog") / f"{parsed.year:04d}" / f"{parsed.month:02d}" / f"{parsed.day:02d}" / f"{slug}.html"
    return relative, f"{SITE_URL}/{relative.as_posix()}"


def main() -> None:
    posts = json.loads(POSTS_FILE.read_text(encoding="utf-8"))
    if not isinstance(posts, list):
        fail("blog/posts.json must contain a list")

    sitemap_root = ElementTree.parse(SITEMAP_FILE).getroot()
    sitemap_urls = {
        element.text
        for element in sitemap_root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    }

    seen: set[Path] = set()
    for post in posts:
        if not isinstance(post, dict):
            fail("every posts.json entry must be an object")
        relative, canonical = permalink(post)
        if relative in seen:
            fail(f"duplicate post path: {relative}")
        seen.add(relative)

        post_file = ROOT / relative
        if not post_file.is_file():
            fail(f"missing post file for {post.get('slug')!r}: {relative}")

        html = post_file.read_text(encoding="utf-8")
        if f'href="{canonical}"' not in html:
            fail(f"{relative} does not contain its canonical URL: {canonical}")
        if f'datetime="{post["date"]}"' not in html:
            fail(f"{relative} does not contain datetime={post['date']!r}")
        if canonical not in sitemap_urls:
            fail(f"sitemap.xml is missing {canonical}")

        print(f"OK: {post['date']} -> /{relative.as_posix()}")

    print(f"Validated {len(posts)} published post(s).")


if __name__ == "__main__":
    main()
