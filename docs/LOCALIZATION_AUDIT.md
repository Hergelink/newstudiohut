# Turkish and English audit — 2026-11-17

Reviewed the complete application message catalogs and translation consumers:
public discovery, studio details, authentication, business dashboards, teams,
leads, analytics, administration and notification templates.

- Noto Sans Latin/Latin Extended variable fonts are self-hosted with the OFL
  license. Turkish İ/ı/Ğ/Ş glyphs no longer depend on an installed system font.
- Browser inspection reproduced stale `html.lang` after client-side locale
  navigation. `DocumentLanguage` keeps the document language synchronized so
  CSS uppercase uses Turkish casing only for Turkish content.
- Language switching preserves filters, query strings, auth destinations and
  fragments. Authentication redirects normalize prefixes and retain the locale.
- Catalog grammar, brand spelling, plurals and an unresolved review-note
  placeholder were corrected. Static translation references, ICU parameters,
  Unicode normalization and formatting are covered by regression tests.
- Dynamic feature labels come from database category metadata across forms,
  filters, public detail and admin review. Stored option tokens are unchanged.
- Timestamp displays use Europe/Istanbul; date-only appointments retain their
  calendar date. Numeric display follows the selected language.
- Lead emails have separate TR/EN templates. The current notification queue has
  no recipient locale, so its fallback is one bilingual email. Review/approval
  emails continue using their recorded recipient preference.
- The photo viewer has translated controls, keyboard navigation, touch swipes,
  modal focus management and close/Escape/outside dismissal.

Validation: TypeScript, ESLint, 278 tests across 61 suites, production build and
migration integrity checks passed. No database migrations or catalog records
were changed for this work. Build-time dynamic sitemap retrieval was unavailable
in the local restricted-network environment; that is not live integration proof.

User-entered listing descriptions, photo captions and custom catalog metadata
remain authored content. They are not automatically translated by the UI.
