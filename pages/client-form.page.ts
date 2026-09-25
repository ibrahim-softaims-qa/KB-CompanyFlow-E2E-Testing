import { Locator, Page } from '@playwright/test';

export class ClientFormPage {
  readonly orgNumberInput: Locator;
  readonly lookupButton: Locator;
  readonly lookupMessage: Locator;
  readonly nameInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.orgNumberInput = page.getByTestId('org-number-input');
    this.lookupButton = page.getByTestId('org-lookup-button');
    this.lookupMessage = page.getByTestId('org-lookup-message');
    this.nameInput = page.getByTestId('client-name-input');
    this.saveButton = page.getByTestId('client-save-button');
    this.cancelButton = page.getByTestId('client-cancel-button');
  }

  async lookupOrgNumber(orgNumber: string): Promise<void> {
    await this.orgNumberInput.fill(orgNumber);
    await this.lookupButton.click();
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }
}
