# Studio onboarding catalog

Photography and Music are operational categories, not example listings. Their
localized field definitions and assignments live in `categories`,
`feature_definitions`, and `category_features`. No React branch hardcodes either
category or its equipment fields.

`supabase/catalog/studio_catalog.sql` configures the production catalog using
existing tables. It preserves existing keys and assignments and creates no
accounts, businesses, listings, or leads. This is intentionally separate from
`supabase/seed.sql`, which remains local/demo-only.

## Form contents

- Basic information: name, StudioHut listing link name, description.
- Location: address, district, city, optional coordinate pair.
- Size and price: metric area, capacity, starting price in TRY.
- Contact: studio website, email, phone and opening hours.
- Photography: shoot types, lighting, ceiling height, cyclorama, dressing room,
  equipment, backdrops, access information and house rules.
- Music: services, soundproofing, room count, vocal booth, equipment/instruments,
  engineer availability, recording software, access information and house rules.

The `validation` metadata supports `section: contact`, `format: url|email|tel`,
`placeholder`, and localized `optionsEn`/`optionsTr` in addition to existing
numeric ranges and text length limits. Server-side website validation accepts
multi-part TLDs such as `.com.tr`, adds HTTPS to bare domains, rejects non-HTTP(S)
schemes and embedded credentials, and reports errors beside the relevant field.
Contact values use the existing typed `listing_feature_values` storage and are
reloaded by the edit page; clearing an optional field removes its saved value.

## Live verification on 2026-11-11

The live project `qglbhsbciafdpixlpewp` initially had zero categories, feature
definitions and studios. The catalog transaction completed successfully.
`verify_studio_onboarding.sql` was run in a transaction as `authenticated` with
an existing business owner's identity. Both category drafts, their website and
category-specific values were created, updated and read back successfully under
RLS. The transaction was rolled back, leaving no test studios.

Drafts and rejected listings can be edited through the existing dashboard edit
route. Published/pending listings use the existing withdraw-to-draft workflow.
The related RPCs, review submission, media management, Team and Analytics were
subsequently applied and verified on 2026-11-12. See `DATABASE_RELEASE_2026-11-12.md`.

## Studio photos

After saving a draft, hosts can select multiple JPEG, PNG, WebP or AVIF photos,
up to 10 MiB each and 15 photos per studio. Files go directly to private Supabase
Storage through ownership-checked signed upload URLs, avoiding Vercel's request
body limit. Finalization rechecks membership, editable state, file size/type and
file signature before attaching metadata. Failed attachments clean up the object.
The database serializes insertions per listing and rejects a sixteenth image.

Hosts can drag photos to reorder them, use move buttons on mobile or by keyboard,
choose a cover, and delete photos. Ordering and cover changes use atomic RPCs.
Pending/published studios must first be withdrawn to draft before editing photos.
