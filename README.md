# captchakri.github.io

Personal portfolio and blog for [Chakri](https://captchakri.github.io/), hosted with GitHub Pages.

## Project structure

- `index.html` — portfolio homepage and page-specific interactions.
- `assets/css/theme.css` — shared visual system, responsive navigation, blog, and article styles.
- `assets/js/theme.js` — shared intro, navigation, accessibility, reveal, cursor, and background behavior.
- `blog/index.html` — data-driven blog listing and tag filters.
- `blog/posts.json` — publication metadata used to sort posts and build their URLs.
- `blog/YYYY/MM/DD/<slug>.html` — published posts grouped by publication date.
- `blog/posts/template.html` — starting point for new posts.
- `scripts/validate_blog.py` — checks dates, post paths, canonical URLs, and sitemap entries.
- `scripts/preview.sh` — validates and serves the site locally.

## Preview before creating a pull request

Run the preview script from the repository root:

```bash
./scripts/preview.sh
```

Then open:

- Portfolio: <http://localhost:8000/>
- Blog: <http://localhost:8000/blog/>

Use `./scripts/preview.sh 9000` to choose another port. The script validates the date-based blog URLs before starting the server. Press `Ctrl+C` when you are finished reviewing the site.

For a final pre-PR check, review the diff too:

```bash
git diff --check
git diff
```

## Date-based blog URLs

Each `date` in `blog/posts.json` must use `YYYY-MM-DD`. The blog index and homepage automatically turn that date and the slug into this URL:

```text
/blog/YYYY/MM/DD/<slug>.html
```

For example, this metadata:

```json
{
  "slug": "my-camping-trip",
  "date": "2026-06-15"
}
```

maps to:

```text
/blog/2026/06/15/my-camping-trip.html
```

## Add a blog post

1. Choose the publication date and slug.
2. Create the matching folders and copy the template, for example:

   ```bash
   mkdir -p blog/2026/06/15
   cp blog/posts/template.html blog/2026/06/15/my-camping-trip.html
   ```

3. Update the title, description, canonical URL, Open Graph URL, heading, `<time datetime>`, tags, and article content.
4. Add the post metadata to `blog/posts.json` using the same ISO date and slug.
5. Add the canonical public URL to `sitemap.xml` with the publication date as `<lastmod>`.
6. Run `./scripts/preview.sh` and verify the generated URL printed by the validator.

## Accessibility and performance notes

- All pages include a skip link and a labeled primary navigation landmark.
- The navigation collapses into a keyboard-operable menu on narrow screens.
- Decorative animation layers are hidden from assistive technology.
- Motion-heavy effects are minimized when `prefers-reduced-motion` is enabled.
