#!/usr/bin/env python3
"""Validate date-based blog permalinks and publication metadata."""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
POSTS_FILE = ROOT / "blog" / "posts.json"
SITEMAP_FILE = ROOT / "sitemap.xml"
SITE_URL = "https://captchakri.github.io"
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class ValidationError(ValueError):
    """Raised when blog metadata or generated files are inconsistent."""


@dataclass(frozen=True)
class ValidationResult:
    published_count: int
    coming_soon_count: int


def fail(message: str) -> None:
    raise ValidationError(message)


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


def sitemap_urls(sitemap_file: Path) -> set[str | None]:
    sitemap_root = ElementTree.parse(sitemap_file).getroot()
    return {
        element.text
        for element in sitemap_root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    }


def validate_posts(posts: object, root: Path, urls: set[str | None], verbose: bool = True) -> ValidationResult:
    if not isinstance(posts, list):
        fail("blog/posts.json must contain a list")

    seen: set[Path] = set()
    published_count = 0
    coming_soon_count = 0
    for post in posts:
        if not isinstance(post, dict):
            fail("every posts.json entry must be an object")
        relative, canonical = permalink(post)
        if relative in seen:
            fail(f"duplicate post path: {relative}")
        seen.add(relative)

        if post.get("status") == "coming-soon":
            coming_soon_url = post.get("comingSoonUrl")
            if not isinstance(coming_soon_url, str) or not coming_soon_url.startswith("/blog/"):
                fail(f"coming-soon post {post.get('slug')!r} must set comingSoonUrl under /blog/")
            gate = root / coming_soon_url.lstrip("/")
            if not gate.is_file():
                fail(f"coming-soon post {post.get('slug')!r} points to missing gate: {coming_soon_url}")
            coming_soon_count += 1
            if verbose:
                print(f"SOON: {post['date']} -> {coming_soon_url}")
            continue

        post_file = root / relative
        if not post_file.is_file():
            fail(f"missing post file for {post.get('slug')!r}: {relative}")

        html = post_file.read_text(encoding="utf-8")
        if f'href="{canonical}"' not in html:
            fail(f"{relative} does not contain its canonical URL: {canonical}")
        if f'datetime="{post["date"]}"' not in html:
            fail(f"{relative} does not contain datetime={post['date']!r}")
        if canonical not in urls:
            fail(f"sitemap.xml is missing {canonical}")

        published_count += 1
        if verbose:
            print(f"OK: {post['date']} -> /{relative.as_posix()}")

    return ValidationResult(published_count, coming_soon_count)


def validate_blog(root: Path = ROOT, verbose: bool = True) -> ValidationResult:
    posts = json.loads((root / "blog" / "posts.json").read_text(encoding="utf-8"))
    result = validate_posts(posts, root, sitemap_urls(root / "sitemap.xml"), verbose)
    if verbose:
        print(f"Validated {result.published_count} published post(s), {result.coming_soon_count} coming soon.")
    return result


def main() -> None:
    try:
        validate_blog()
    except ValidationError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
