# Turkish / English localization audit — 2026-11-19

## Scope and findings

Reviewed application-owned public, authentication, dashboard, studio management, inquiry, analytics and administration copy in both message catalogs. Checked pricing/hour units, booking-duration plurals, metric units, Istanbul time-zone formatting, localized metadata, errors, accessibility labels and locale navigation. User-entered names, descriptions, equipment models and custom notes retain their original language and capitalization.

A read-only audit of the live Supabase catalog found complete Turkish/English names and option labels for all 27 feature definitions. No database or external Auth settings were changed in this audit.

## Fixes

- Localized the location picker/detail map's zoom controls and OpenStreetMap attribution, matching the discovery map language.
- Removed forced capitalization from listing feature values so addresses, emails, URLs and equipment names keep their original spelling.
- Added translated listing-slug examples, inquiry-source labels, consistent hourly-price wording and full-name validation copy.
- Moved language-switcher accessibility text into the catalogs; kept destination-language labels recognizable in both locales.
- Added language switching to login, signup and recovery cards, preserving query parameters and destinations.
- Added translated generic 404 pages and localized root metadata for routes outside the locale layout.
- Added separate Turkish and English option-label inputs to admin feature forms. Server validation rejects misaligned or blank labels. Saving a definition preserves existing translations and contact-field metadata, rather than discarding them.

## Verification

- Catalog keys match between languages; every message parses and formats as ICU with sample interpolation values and 0/1/2 counts.
- Static source checks resolve translation references in both catalogs and reject untranslated JSX prose and visible/accessibility attributes (except brands, units and hidden spam-trap copy).
- Regression tests cover translated map controls, admin label editing/preservation, hourly pricing, validation, dates and locale switching.
- Browser checks: Turkish and English generic 404 pages; signup validation in both languages; correct document language/metadata; destination-preserving auth switching; real database-driven category filters and map controls switching TR → EN while retaining category/map query parameters.

Browser-owned native widgets and external Google/Supabase screens use their providers' language settings. Studio-owner free text is not automatically translated.
