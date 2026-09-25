import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth';
import { Navbar } from '../pages/navbar.page';
import { ClientFormPage } from '../pages/client-form.page';
import { TimeEntriesPage } from '../pages/time-entries.page';

// Required test 3: a permission boundary — proves two things the
// Accountant can't do, one at the routing layer and one at the UI layer.

test.describe('accountant permission boundary', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'accountant'); // both tests below need an accountant session
  });

  test('cannot reach the "new client" screen directly', async ({ page }) => {
    // Bypass the UI (which simply hides the "New client" button) and go
    // straight to the guarded route. The route guard should bounce us back
    // to the dashboard rather than rendering the form.
    await page.goto('/clients/new');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(new ClientFormPage(page).nameInput).toHaveCount(0);
  });

  test('has no delete control on time entries', async ({ page }) => {
    const navbar = new Navbar(page);
    const timeEntries = new TimeEntriesPage(page);

    await navbar.goToTime();

    await expect(timeEntries.entryRows.first()).toBeVisible();
    await expect(timeEntries.deleteButtons).toHaveCount(0);
  });
});
