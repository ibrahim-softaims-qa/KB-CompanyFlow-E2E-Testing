// Fake organization-number fixtures for the client-creation and
// race-condition specs.
//
// Each number is freshly generated to pass the app's own mod-11 validator
// (see core/util/org-number.ts) but is deliberately NOT one of the 27
// organization numbers in the seed data (core/data/seed.ts), so these tests
// never collide with, or depend on, real seeded clients.
import type { BrregFixture } from '../../utils/mocks';

// Happy-path lookup used by "admin creates a client via the org-number lookup".
export const NEW_CLIENT_LOOKUP: BrregFixture = {
  orgNumber: '900000006',
  name: 'Alpha Test AS',
  line1: 'Testveien 1',
  postnummer: '0001',
  poststed: 'Oslo',
};

// Valid format, but deliberately left unregistered in mockBrregLookup, so
// the lookup 404s — used by "falls back to manual entry when the lookup fails".
export const UNKNOWN_ORG_NUMBER = '900000022';

// Name typed in by hand once the lookup above has failed.
export const MANUAL_ENTRY_CLIENT_NAME = 'Manually Entered AS';

// The two lookups used by race-condition.spec.ts to reproduce the
// mergeMap bug documented in BUGS.md: the "slow" one is requested first but
// resolves last, and ends up overwriting the "fast" one that was actually
// the user's most recent request.
export const RACE_CONDITION_LOOKUPS = {
  slow: { orgNumber: '900000030', name: 'Slow Company AS', delayMs: 600 },
  fast: { orgNumber: '900000049', name: 'Fast Company AS', delayMs: 50 },
} as const;

// A real seeded client (see core/data/seed.ts, id "c6") used by the tasks
// and time-entry specs, which need an existing client to attach to rather
// than a freshly created fake one. Picked for its plain-ASCII name, to stay
// clear of the Æ/Ø/Å-collation edge cases some other seeded clients carry.
export const SEEDED_CLIENT_NAME = 'BYGGA AS';
