# Test Strategy

This site is a static portfolio/blog, so the test pyramid should stay light and fast.

## Fast Checks

Run these before each commit:

```powershell
python -m unittest discover -s tests
python scripts/validate_blog.py
```

The `tests/` suite covers:

- Blog permalink and validation rules in `scripts/validate_blog.py`.
- Static page contracts for published pages: title, viewport, canonical URL, skip-link target, and local CSS/JS/icon assets.

The blog validator covers:

- `blog/posts.json` shape.
- Date-based permalink generation.
- Slug format.
- Duplicate post paths.
- Published post files, canonical URLs, post dates, and sitemap entries.
- Coming-soon gates.

## TDD Workflow

Use a small red-green-refactor loop:

1. Write or update a failing test that describes the behavior you want.
2. Run `python -m unittest discover -s tests` and confirm the failure is meaningful.
3. Make the smallest app or script change that turns the test green.
4. Run `python scripts/validate_blog.py`.
5. Refactor only after both commands pass.

For a new blog rule, start in `tests/test_validate_blog.py`.

For a new page-wide HTML contract, start in `tests/test_static_site.py`.

For visual or browser interaction work, add a manual Live Server review for now. If the UI grows more interactive, the next testing layer should be Playwright smoke tests for navigation, filtering, and responsive layout.
