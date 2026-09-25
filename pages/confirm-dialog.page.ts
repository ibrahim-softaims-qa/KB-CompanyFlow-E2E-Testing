import { Locator, Page } from '@playwright/test';

export class ConfirmDialog {
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.confirmButton = page.getByTestId('confirm-dialog-confirm');
    this.cancelButton = page.getByTestId('confirm-dialog-cancel');
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
