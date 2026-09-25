import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth';
import { mockExternalApis } from '../utils/mocks';
import { SEEDED_USERS } from '../fixtures/test-data/users';
import { LoginPage } from '../pages/login.page';
import { Navbar } from '../pages/navbar.page';

// Required test 1: authentication — log in as both roles, and log out.

test.describe('authentication', { tag: '@smoke' }, () => {
  test('admin can log in and log out', async ({ page }) => {
    await loginAs(page, 'admin');
    const navbar = new Navbar(page);

    // A logged-in Admin sees the Users nav item; that alone is enough to
    // confirm the right role landed, without depending on translated text.
    await expect(navbar.usersLink).toBeVisible();

    await navbar.logout();

    await expect(page).toHaveURL(/\/login$/);
  });

  test('accountant can log in and log out', async ({ page }) => {
    await loginAs(page, 'accountant');
    const navbar = new Navbar(page);

    // Accountants don't manage users, so the nav item should be absent.
    await expect(navbar.usersLink).toHaveCount(0);

    await navbar.logout();

    await expect(page).toHaveURL(/\/login$/);
  });

  test('rejects an invalid password', async ({ page }) => {
    await mockExternalApis(page);
    const login = new LoginPage(page);

    await login.goto();
    await login.login(SEEDED_USERS.admin.email, 'not-the-real-password');

    await expect(login.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
