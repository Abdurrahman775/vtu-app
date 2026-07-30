# Dark Mode

Both the admin dashboard (web) and mobile app support dark mode,
defaulting to the OS/browser preference with a manual toggle that
overrides it.

## Admin dashboard (web)

Tailwind v4 defaults to a `prefers-color-scheme` media-query variant,
which can't be manually overridden by a toggle — switched to a
class-based variant instead:

```css
/* web/src/app/globals.css */
@custom-variant dark (&:where(.dark, .dark *));
```

- `web/src/app/layout.tsx` has an inline `<script>` in `<head>` that
  runs **before** React hydrates: reads `localStorage.getItem('theme')`,
  falls back to `window.matchMedia('(prefers-color-scheme: dark)')` if
  nothing's stored, and adds `.dark` to `<html>` if needed. Must be
  inline and pre-hydration — waiting for React would cause a flash of
  the wrong theme.
- `web/src/app/admin/ThemeToggle.tsx` flips the `.dark` class and
  writes the explicit choice to `localStorage`, overriding system
  preference from then on.
- Every dashboard component needs its **own explicit** `dark:` classes —
  see the note in `globals.css` and in root `CLAUDE.md` about why this
  broke twice before as implicit color inheritance. There is no shortcut
  here; a missing `dark:text-*` on some future new component will be
  invisible in dark mode exactly like the old bug, just scoped to `.dark`
  instead of the OS preference.

## Mobile (Flutter)

See `mobile/lib/src/core/theme/app_theme.dart` — `AppTheme.light()` and
`AppTheme.dark()`, wired into `MaterialApp.router`'s `theme`/`darkTheme`
with `themeMode` driven by a Riverpod provider
(`mobile/lib/src/core/theme/theme_mode_provider.dart`) that persists the
user's choice (System/Light/Dark) via `shared_preferences`. Toggle lives
in the Profile screen's new "Appearance" section.

## Status

- [x] Real class-based toggle on web, verified in the compiled CSS
      output (`.dark:where(.dark,.dark *)` selectors present, not a
      `@media` query) and confirmed live against the running dev server
- [x] Mobile theme mode provider + toggle
- [ ] Not every hardcoded color in every mobile widget has been audited
      for dark-mode contrast (e.g. `Colors.grey.shade600` reads fine in
      both themes, but a full pass hasn't been done screen-by-screen)
