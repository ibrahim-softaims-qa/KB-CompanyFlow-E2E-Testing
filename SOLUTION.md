# Solution notes

## What's here

`e2e/*.spec.ts` — the specs (auth, clients, permissions, race-condition,
tasks, time-entries, plus the original smoke test). `pages/` — one class per
screen, locators and actions only. `utils/` — `loginAs()`, network mocks,
a delete-on-teardown fixture. `fixtures/test-data/` — plain values (fake
org numbers, task titles); login credentials specifically come from `.env`
(copy `.env.example`), not hardcoded, even though these particular ones
aren't secrets. `BUGS.md` — 9 bugs found while reading the app.

## Locator strategy

`data-testid` for anything whose accessible name is **translated copy**;
roles/labels where a stable one already exists (`getByLabel('Email')`,
`getByRole('link', { name: <client name> })` — the client's own name isn't
translated).

That split matters here specifically: the seeded Admin's default language is
Norwegian and the Accountant's is English, and every label/`aria-label` in
this app goes through `| translate`. An English-text locator would pass for
one role and silently break for the other. `loginAs()` sidesteps this by
pinning the UI to English right after login, via the language menu (whose
two options are literal `"English"`/`"Norsk"` strings, not translated) — so
every other spec can safely use plain English locators regardless of who's
logged in.

Locators live in `pages/` (one class per screen), never inline in specs.
Page objects expose locators and actions only — no `expect(...)` calls —
so specs stay the single place that owns assertions.

## Flake / determinism strategy

- **No real network calls.** `mockExternalApis()` stubs all three external
  APIs, wired in automatically via `loginAs()`. `mockBrregLookup()` /
  `mockHolidays()` layer specific, scripted responses — including
  artificial delays — on top for tests that need a particular result or
  timing; that's how `race-condition.spec.ts` gets deterministic timing
  instead of hoping a real race lands the same way twice.
- **Wait for real state, not time.** Every assertion polls actual UI state
  rather than a fixed delay. The one gotcha found the hard way: a couple of
  flows (opening a `mat-select`, asserting on a specific table row) can
  silently fail if triggered before the surrounding page has finished its
  own load — fixed by waiting for a container element first, not by adding
  sleeps.
- **Fresh, isolated state per test.** Playwright gives each test its own
  browser context, so every run starts from a freshly seeded IndexedDB — no
  cross-test pollution, no dependence on run order. `utils/cleanup.ts`
  deletes any client a test creates anyway, as a safety net in case that
  isolation ever changes.
- **The permission-boundary test uses the strongest available proof** — a
  direct `page.goto('/clients/new')` against the real route guard, not just
  a hidden-button check — paired with a second, independent UI-level check
  (no delete control on time entries).
- **Fake, non-colliding test data.** Org numbers are freshly generated
  (pass the app's own mod-11 validator) and never overlap with the 27
  seeded clients or with each other.

## Verified

`npm run e2e` passes clean against both the dev server and the production
build+serve path, and repeatedly — including 4–5x reruns of the
timing-sensitive race-condition and `mat-select`-heavy specs. Needed Node
≥22.22.3 per `.nvmrc`; used a local Node binary for this rather than
touching the machine's default install.
