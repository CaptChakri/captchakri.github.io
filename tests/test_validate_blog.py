import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate_blog import ValidationError, permalink, validate_blog


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def sitemap(*urls: str) -> str:
    entries = "\n".join(f"  <url><loc>{url}</loc></url>" for url in urls)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{entries}\n</urlset>\n'


class ValidateBlogTests(unittest.TestCase):
    def test_permalink_builds_date_based_path_and_canonical_url(self) -> None:
        relative, canonical = permalink({"slug": "my-camping-trip", "date": "2026-06-15"})

        self.assertEqual(relative, Path("blog/2026/06/15/my-camping-trip/index.html"))
        self.assertEqual(canonical, "https://captchakri.github.io/blog/2026/06/15/my-camping-trip/")

    def test_permalink_rejects_invalid_slug(self) -> None:
        with self.assertRaisesRegex(ValidationError, "invalid slug"):
            permalink({"slug": "My Post", "date": "2026-06-15"})

    def test_validate_blog_counts_published_and_coming_soon_posts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            posts = [
                {"slug": "published-post", "date": "2026-06-15"},
                {
                    "slug": "future-post",
                    "date": "2026-06-16",
                    "status": "coming-soon",
                    "comingSoonUrl": "/blog/coming-soon/",
                },
            ]
            canonical = "https://captchakri.github.io/blog/2026/06/15/published-post/"

            write_text(root / "blog/posts.json", json.dumps(posts))
            write_text(root / "sitemap.xml", sitemap(canonical))
            write_text(root / "blog/coming-soon/index.html", "<main>Coming soon</main>")
            write_text(
                root / "blog/2026/06/15/published-post/index.html",
                f'<link rel="canonical" href="{canonical}"><time datetime="2026-06-15"></time>',
            )

            result = validate_blog(root, verbose=False)

            self.assertEqual(result.published_count, 1)
            self.assertEqual(result.coming_soon_count, 1)

    def test_validate_blog_rejects_duplicate_post_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            posts = [
                {"slug": "same-post", "date": "2026-06-15"},
                {"slug": "same-post", "date": "2026-06-15"},
            ]
            canonical = "https://captchakri.github.io/blog/2026/06/15/same-post/"

            write_text(root / "blog/posts.json", json.dumps(posts))
            write_text(root / "sitemap.xml", sitemap(canonical))
            write_text(
                root / "blog/2026/06/15/same-post/index.html",
                f'<link rel="canonical" href="{canonical}"><time datetime="2026-06-15"></time>',
            )

            with self.assertRaisesRegex(ValidationError, "duplicate post path"):
                validate_blog(root, verbose=False)

    def test_validate_blog_requires_published_posts_in_sitemap(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            posts = [{"slug": "missing-sitemap", "date": "2026-06-15"}]
            canonical = "https://captchakri.github.io/blog/2026/06/15/missing-sitemap/"

            write_text(root / "blog/posts.json", json.dumps(posts))
            write_text(root / "sitemap.xml", sitemap())
            write_text(
                root / "blog/2026/06/15/missing-sitemap/index.html",
                f'<link rel="canonical" href="{canonical}"><time datetime="2026-06-15"></time>',
            )

            with self.assertRaisesRegex(ValidationError, "sitemap.xml is missing"):
                validate_blog(root, verbose=False)


if __name__ == "__main__":
    unittest.main()
