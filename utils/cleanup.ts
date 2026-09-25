import { test as base, expect, Page } from '@playwright/test';
import { Navbar } from '../pages/navbar.page';
import { ClientListPage } from '../pages/client-list.page';
import { ConfirmDialog } from '../pages/confirm-dialog.page';

/**
 * A defense-in-depth safety net for specs that create a client: any name
 * pushed onto `createdClients` during the test gets deleted afterwards
 * (via the same UI flow a user would use), if it still exists.
 *
 * Not strictly required today — Playwright already gives every test its
 * own fresh, isolated browser storage (see SOLUTION.md), so nothing a test
 * creates can leak into another test or run. This exists so the suite stays
 * self-cleaning even if that isolation setup ever changes later (e.g. a
 * shared `storageState` gets introduced), rather than relying solely on
 * that architectural guarantee holding forever.
 */
export const test = base.extend<{ createdClients: string[] }>({
  createdClients: async ({ page }, use) => {
    const names: string[] = [];
    await use(names);

    // Attempt every deletion independently — one failed cleanup shouldn't
    // stop the rest from being attempted, and the error should say exactly
    // which client(s) were left behind.
    const failures: { name: string; error: unknown }[] = [];
    for (const name of names) {
      try {
        await deleteClientByName(page, name);
      } catch (error) {
        failures.push({ name, error });
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `Cleanup failed for ${failures.length}/${names.length} client(s): ` +
          failures.map((f) => f.name).join(', '),
      );
    }
  },
});

export { expect } from '@playwright/test';

async function deleteClientByName(page: Page, name: string): Promise<void> {
  try {
    const navbar = new Navbar(page);
    const clientList = new ClientListPage(page);
    const confirmDialog = new ConfirmDialog(page);

    await navbar.goToClients();
    await clientList.search(name);

    const row = clientList.row(name);
    if ((await row.count()) === 0) {
      return; // already gone (e.g. the test itself deleted it) — nothing to do
    }

    await clientList.openRowActions(name);
    await clientList.clickDeleteInRowMenu();
    await confirmDialog.confirm();

    // Confirm the delete actually took — if it silently failed, better this
    // cleanup step fails loudly than leave stale data behind unnoticed.
    await expect(row).toHaveCount(0);
  } catch (error) {
    throw new Error(`Failed to delete client "${name}" during cleanup`, { cause: error });
  }
}
