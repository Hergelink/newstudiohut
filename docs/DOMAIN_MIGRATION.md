# Production domain — 2026-11-17

Canonical origin: **https://www.studiohut.co**

## Configuration

- Vercel project: `newstudiohut`, team `hergelinks-projects`.
- Production `NEXT_PUBLIC_SITE_URL`: `https://www.studiohut.co`. Redeploy after
  changing this value; it supplies metadataBase, sitemap/robots, JSON-LD,
  OAuth/signup/recovery links, team invitations and review/approval emails.
- `www.studiohut.co` serves Production. `studiohut.co` redirects to it with 308.
- DNS is hosted by Vercel; GoDaddy is the registrar. Do not switch nameservers
  or replace email DNS records to connect this site.
- Supabase project: `qglbhsbciafdpixlpewp`; Auth Site URL is the canonical origin.
  Exact additional redirect URLs:
  - `https://www.studiohut.co/auth/callback`
  - `https://www.studiohut.co/reset-password`
  - `https://www.studiohut.co/en/reset-password`
- Keep existing localhost and legacy Vercel Auth allowlist entries during the
  transition so already-sent links remain usable. New links use the new origin.
- Local `.env.local` and Supabase CLI config stay on localhost. Browser Supabase
  keys, project URL, Storage paths, RLS and OAuth provider credentials are not
  tied to the application's hostname and were not rotated.

## External services

Google OAuth still returns through the same Supabase project callback:
`https://qglbhsbciafdpixlpewp.supabase.co/auth/v1/callback`. Do not replace this
provider callback with the application callback. Test the complete consent and
return flow from the new domain before declaring sign-in verified.

If a Google Maps key is configured, its HTTP referrer restrictions must allow
`https://www.studiohut.co/*`; this application does not currently require a
configured key to render its explicit map fallback. Resend sender-domain
verification is separate from the website hostname. Do not change a working
sender to an unverified `@studiohut.co` address.

## Verification

Regression tests cover new-domain OAuth/signup/recovery targets, both email
notification links, homepage canonical paths and language alternates, sitemap
and robots origin handling. They use mocked external services and do not send
emails, change passwords or prove a full Google/email sign-in round trip.

After deployment, verify HTTPS, apex redirect with query preservation,
homepage/listing canonical and hreflang, listing JSON-LD, sitemap, robots,
public pages and OAuth handoff. Browser sessions belong to each hostname;
users may need to sign in again on the new domain.
