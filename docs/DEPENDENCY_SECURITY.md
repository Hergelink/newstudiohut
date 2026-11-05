# Dependency Security Record

Last reviewed: 2026-11-02.

## Production result

`npm audit --omit=dev` reports zero production vulnerabilities. Next.js 15.5.28 originally installed a vulnerable nested PostCSS 8.4.31; the root `overrides` rule now resolves all PostCSS consumers to 8.5.32. Typecheck, lint, 160 tests, and the production build pass with that override.

## Development tooling

Vitest was upgraded from 3.2.7 to 5.0.5 and Node types to the Node 22 line, removing the critical Tinypool and vulnerable mocker findings. ESLint was upgraded from the legacy 8.x line to 9.39.5 and migrated to flat config. The next framework upgrade must move the lint stack to its then-supported major.

The remaining full-audit findings are 14 moderate development-only records in the Next.js 15 ESLint/plugin chain, primarily caused by the broad Minimatch advisory range. npm proposes invalid/downgrade-style fixes for this graph. They do not enter the production bundle, and no critical or high development finding remains. Re-evaluate them during the planned Next.js 16 migration instead of forcing incompatible package versions.

## Release policy

- Production audit must remain at zero.
- Critical/high development findings block release until removed or explicitly reviewed.
- Overrides must have a linked reason, complete quality run, and removal checkpoint.
- Never use `npm audit fix --force` without reviewing every framework and lockfile change.
