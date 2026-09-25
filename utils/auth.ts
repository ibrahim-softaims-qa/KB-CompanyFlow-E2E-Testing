import { Page, expect } from '@playwright/test';
import { mockExternalApis } from './mocks';
import { SEEDED_USERS, SeededRole } from '../fixtures/test-data/users';
import { LoginPage } from '../pages/login.page';
import { Navbar } from '../pages/navbar.page';

/**
 * Logs in as one of the two seeded users and waits for the dashboard to
 * load. Also pins the UI language to English.
 *
 * Why pin the language: the seeded Admin's preferred language is Norwegian
 * and the seeded Accountant's is English (see README "Seeded logins"), so
 * without this every test that logs in as Admin would render Norwegian
 * copy. Pinning it here means every other spec can use plain English
 * role/label locators without caring who is logged in.
 */
export async function loginAs(page: Page, role: SeededRole): Promise<void> {
  const { email, password } = SEEDED_USERS[role];

  await mockExternalApis(page);

  const login = new LoginPage(page);
  await login.goto();

  try {
    await login.login(email, password);
    await expect(page).toHaveURL(/\/dashboard$/);
  } catch (error) {
    // Without this, a login failure just surfaces as a generic "expected
    // /dashboard, got /login" timeout, with no hint of why — e.g. a wrong
    // .env value. Naming the role/email here points straight at the cause.
    throw new Error(`Login failed for role "${role}" (${email}) — check that .env matches a real seeded account.`, {
      cause: error,
    });
  }

  await new Navbar(page).pinEnglish();
}
