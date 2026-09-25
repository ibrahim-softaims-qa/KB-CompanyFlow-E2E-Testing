import { Page } from '@playwright/test';

/**
 * Stubs the app's three external integrations (Brønnøysundregistrene,
 * Norges Bank, Nager.Date) with harmless defaults so specs never depend on
 * those services being reachable. Call this before navigating to any page
 * that might trigger one of these calls — dashboard, time entries, or the
 * client form all do.
 *
 * `mockBrregLookup` below can be called afterwards to override the
 * organization-lookup response for a specific org number.
 */
export async function mockExternalApis(page: Page): Promise<void> {
  // Brønnøysundregistrene — company lookup on the client form. Defaults to
  // "not found" so any un-stubbed org number falls back to manual entry
  // instead of hitting the real, unpredictable dataset.
  await page.route('https://data.brreg.no/**', (route) => route.fulfill({ status: 404, body: '' }));

  // Norges Bank — EUR/NOK rate on the dashboard. The app only reads the
  // first series/observation it finds, so the exact keys don't matter.
  await page.route('https://data.norges-bank.no/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          dataSets: [{ series: { '0:0:0:0': { observations: { 0: [11.5] } } } }],
          structure: { dimensions: { observation: [{ id: 'TIME_PERIOD', values: [{ id: '2026-01-01' }] }] } },
        },
      }),
    }),
  );

  // Nager.Date — Norwegian public holidays on the time-entry week view.
  // Empty list = no holiday markers, which is fine for specs that don't
  // care about holidays.
  await page.route('https://date.nager.at/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
}

export interface BrregFixture {
  orgNumber: string;
  name: string;
  line1?: string;
  postnummer?: string;
  poststed?: string;
  /** Artificial response delay in ms — used to control lookup ordering in tests. */
  delayMs?: number;
}

/**
 * Overrides the Brønnøysundregistrene lookup for one or more specific
 * organization numbers, optionally with a delay. Register the fixtures you
 * need *after* calling mockExternalApis (Playwright uses the
 * last-registered matching route), then trigger the lookup in the UI.
 */
export async function mockBrregLookup(page: Page, fixtures: BrregFixture[]): Promise<void> {
  await page.route('https://data.brreg.no/enhetsregisteret/api/enheter/*', async (route) => {
    const url = new URL(route.request().url());
    const orgNumber = url.pathname.split('/').pop();
    const fixture = fixtures.find((f) => f.orgNumber === orgNumber);

    if (!fixture) {
      await route.fulfill({ status: 404, body: '' });
      return;
    }
    if (fixture.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, fixture.delayMs));
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        navn: fixture.name,
        forretningsadresse: {
          adresse: fixture.line1 ? [fixture.line1] : [],
          postnummer: fixture.postnummer ?? '',
          poststed: fixture.poststed ?? '',
          land: 'Norge',
        },
      }),
    });
  });
}

export interface HolidayFixture {
  /** YYYY-MM-DD */
  date: string;
  localName: string;
}

/**
 * Overrides the Nager.Date holiday list (for any year) with specific
 * dates, so a test can force "today" to be a public holiday without
 * waiting for a real one to occur.
 */
export async function mockHolidays(page: Page, holidays: HolidayFixture[]): Promise<void> {
  await page.route('https://date.nager.at/api/v3/PublicHolidays/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(holidays.map((h) => ({ date: h.date, localName: h.localName, name: h.localName }))),
    }),
  );
}
