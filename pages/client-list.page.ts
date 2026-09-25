import { Locator, Page } from '@playwright/test';

export class ClientListPage {
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly newClientButton: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.getByTestId('client-search-input');
    this.statusFilter = page.getByTestId('client-status-filter');
    this.newClientButton = page.getByTestId('new-client-button');
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
  }

  async openNewClientForm(): Promise<void> {
    await this.newClientButton.click();
  }

  // The row for a given client name. Search first if the list is paginated
  // and the row you want isn't guaranteed to be on the current page.
  row(name: string): Locator {
    return this.page.locator('[data-testid^="client-row-"]').filter({ hasText: name });
  }

  clientLink(name: string): Locator {
    return this.page.getByRole('link', { name });
  }

  async openRowActions(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: 'Client actions' }).click();
  }

  async clickDeleteInRowMenu(): Promise<void> {
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
  }
}
