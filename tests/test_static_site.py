import json
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]


class StaticPageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.skip_targets: list[str] = []
        self.canonicals: list[str] = []
        self.assets: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value for key, value in attrs}
        element_id = data.get("id")
        if element_id:
            self.ids.add(element_id)

        if tag == "a" and data.get("class") == "skip-link":
            target = data.get("href")
            if target:
                self.skip_targets.append(target)

        if tag == "script" and data.get("src"):
            self.assets.append(data["src"])

        if tag == "link":
            rel = (data.get("rel") or "").split()
            href = data.get("href")
            if "canonical" in rel and href:
                self.canonicals.append(href)
            if href and ({"stylesheet", "icon"} & set(rel)):
                self.assets.append(href)


def published_html_files() -> list[Path]:
    posts = json.loads((ROOT / "blog/posts.json").read_text(encoding="utf-8"))
    files = [
        ROOT / "index.html",
        ROOT / "blog/index.html",
        ROOT / "blog/coming-soon/index.html",
        ROOT / "eggs/index.html",
    ]
    for post in posts:
        if post.get("status") == "coming-soon":
            continue
        year, month, day = post["date"].split("-")
        files.append(ROOT / "blog" / year / month / day / post["slug"] / "index.html")
    return files


def local_asset_path(page: Path, asset: str) -> Path | None:
    parsed = urlsplit(asset)
    if parsed.scheme or parsed.netloc:
        return None
    clean_path = parsed.path
    if clean_path.startswith("/"):
        return ROOT / clean_path.lstrip("/")
    return page.parent / clean_path


class StaticSiteTests(unittest.TestCase):
    def test_published_pages_have_basic_document_contract(self) -> None:
        for page in published_html_files():
            with self.subTest(page=page.relative_to(ROOT)):
                text = page.read_text(encoding="utf-8")
                parser = StaticPageParser()
                parser.feed(text)

                self.assertIn("<title>", text)
                self.assertIn('name="viewport"', text)
                self.assertEqual(len(parser.canonicals), 1)
                self.assertTrue(parser.canonicals[0].startswith("https://captchakri.github.io/"))
                self.assertTrue(parser.skip_targets)
                for target in parser.skip_targets:
                    self.assertTrue(target.startswith("#"))
                    self.assertIn(target[1:], parser.ids)

    def test_local_stylesheets_scripts_and_icons_exist(self) -> None:
        for page in published_html_files():
            parser = StaticPageParser()
            parser.feed(page.read_text(encoding="utf-8"))
            for asset in parser.assets:
                asset_path = local_asset_path(page, asset)
                if asset_path is None:
                    continue
                with self.subTest(page=page.relative_to(ROOT), asset=asset):
                    self.assertTrue(asset_path.is_file(), f"Missing asset: {asset_path}")


if __name__ == "__main__":
    unittest.main()
