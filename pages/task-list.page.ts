import { Locator, Page } from '@playwright/test';

export class TaskListPage {
  readonly table: Locator;

  constructor(private readonly page: Page) {
    this.table = page.locator('table.tasks-table');
  }

  // Wait for the table itself before asserting on a specific row — the
  // table's own load (tasks + clients + users, all fetched together) can
  // take a moment, and asserting on a not-yet-rendered row directly can
  // outrun that load under the wrong timing.
  async waitForLoad(): Promise<void> {
    await this.table.waitFor();
  }

  // A task's table row, scoped by its title. Angular Material renders a
  // real <tr>/<td>, so Playwright's row accessible-name computation
  // (concatenated cell text) reliably matches on the title alone.
  row(title: string): Locator {
    return this.page.getByRole('row', { name: title });
  }

  async completeTask(title: string): Promise<void> {
    await this.row(title).getByRole('button', { name: 'Complete' }).click();
  }
}
