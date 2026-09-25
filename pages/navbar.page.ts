import { Locator, Page } from '@playwright/test';

// The top toolbar present on every authenticated screen (src/app/layout/shell.html).
export class Navbar {
  readonly dashboardLink: Locator;
  readonly clientsLink: Locator;
  readonly tasksLink: Locator;
  readonly timeLink: Locator;
  readonly usersLink: Locator;

  readonly languageMenuButton: Locator;
  readonly englishOption: Locator;
  readonly norwegianOption: Locator;

  readonly userMenuButton: Locator;
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.dashboardLink = page.getByTestId('nav-dashboard');
    this.clientsLink = page.getByTestId('nav-clients');
    this.tasksLink = page.getByTestId('nav-tasks');
    this.timeLink = page.getByTestId('nav-time');
    this.usersLink = page.getByTestId('nav-users');

    this.languageMenuButton = page.getByTestId('language-menu-button');
    this.englishOption = page.getByTestId('language-option-en');
    this.norwegianOption = page.getByTestId('language-option-nb');

    this.userMenuButton = page.getByTestId('user-menu-button');
    this.logoutButton = page.getByTestId('logout-button');
  }

  async goToDashboard(): Promise<void> {
    await this.dashboardLink.click();
  }

  async goToClients(): Promise<void> {
    await this.clientsLink.click();
  }

  async goToTasks(): Promise<void> {
    await this.tasksLink.click();
  }

  async goToTime(): Promise<void> {
    await this.timeLink.click();
  }

  async goToUsers(): Promise<void> {
    await this.usersLink.click();
  }

  // Pins the UI to English regardless of the current user's preferred
  // language — see utils/auth.ts for why this matters.
  async pinEnglish(): Promise<void> {
    await this.languageMenuButton.click();
    await this.englishOption.click();
  }

  async logout(): Promise<void> {
    await this.userMenuButton.click();
    await this.logoutButton.click();
  }
}
