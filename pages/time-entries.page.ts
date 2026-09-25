import { Locator, Page } from '@playwright/test';

export class TimeEntriesPage {
  readonly dayList: Locator;
  readonly entryRows: Locator;
  readonly deleteButtons: Locator;
  readonly clientSelect: Locator;
  readonly addButton: Locator;
  readonly holidayWarning: Locator;

  constructor(private readonly page: Page) {
    // The add-entry form (including the client select) renders immediately,
    // before the week's entries finish loading — clicking the select before
    // that load settles can silently fail to open its panel (confirmed:
    // clicking it too early leaves aria-expanded stuck at "false"). Waiting
    // for `.day-list` (only rendered once loading() is false) avoids that.
    this.dayList = page.locator('.day-list');
    this.entryRows = page.locator('.entry-row');
    this.deleteButtons = page.locator('[data-testid^="delete-time-entry-"]');
    this.clientSelect = page.getByTestId('time-client-select');
    this.addButton = page.getByTestId('time-add-button');
    this.holidayWarning = page.locator('.holiday-warning');
  }

  // Logs an entry for the given client, leaving date/start/end/billable at
  // their form defaults (today, 09:00–10:00, billable).
  async logEntry(clientName: string): Promise<void> {
    await this.dayList.waitFor();
    await this.clientSelect.click();
    await this.page.getByRole('option', { name: clientName }).click();
    await this.addButton.click();
  }

  dayCard(dateIso: string): Locator {
    return this.page.getByTestId(`time-day-${dateIso}`);
  }
}
