import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth';
import { mockHolidays } from '../utils/mocks';
import { todayIso } from '../utils/dates';
import { SEEDED_CLIENT_NAME } from '../fixtures/test-data/clients';
import { Navbar } from '../pages/navbar.page';
import { TimeEntriesPage } from '../pages/time-entries.page';

// Bonus: log a time entry, and explore how the app surfaces public
// holidays on the week view.

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'accountant');
});

test('logs a time entry for a client', async ({ page }) => {
  const navbar = new Navbar(page);
  const timeEntries = new TimeEntriesPage(page);

  await navbar.goToTime();
  await timeEntries.dayList.waitFor(); // let the week's entries settle before counting
  const before = await timeEntries.entryRows.count();

  await timeEntries.logEntry(SEEDED_CLIENT_NAME);

  await expect(timeEntries.entryRows).toHaveCount(before + 1);
  await expect(timeEntries.entryRows.filter({ hasText: SEEDED_CLIENT_NAME }).last()).toBeVisible();
});

test('flags a public holiday on the entry form and the week view', async ({ page }) => {
  const today = todayIso();
  const holidayName = 'QA Test Holiday';

  // mockExternalApis (inside loginAs) already stubbed Nager.Date with an
  // empty holiday list; this overrides it so "today" is deterministically
  // a holiday, instead of depending on the calendar the suite happens to
  // run on.
  await mockHolidays(page, [{ date: today, localName: holidayName }]);

  const navbar = new Navbar(page);
  const timeEntries = new TimeEntriesPage(page);

  await navbar.goToTime();

  // The add-entry form defaults its date to today, so the warning is
  // already visible without touching the form.
  await expect(timeEntries.holidayWarning).toContainText(holidayName);

  await expect(timeEntries.dayCard(today)).toContainText(holidayName);
});
