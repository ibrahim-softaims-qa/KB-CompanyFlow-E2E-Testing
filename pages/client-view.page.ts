import { Locator, Page } from '@playwright/test';

export class ClientViewPage {
  readonly newTaskButton: Locator;
  readonly taskTitleInput: Locator;
  readonly taskSaveButton: Locator;

  constructor(private readonly page: Page) {
    this.newTaskButton = page.getByTestId('new-task-button');
    this.taskTitleInput = page.getByTestId('task-title-input');
    this.taskSaveButton = page.getByTestId('task-save-button');
  }

  async createTask(title: string): Promise<void> {
    await this.newTaskButton.click();
    await this.taskTitleInput.fill(title);
    await this.taskSaveButton.click();
  }

  // A task card, scoped by its title — client-view.html renders one
  // `.task-card` per task with no id-based testid, so text filtering is
  // the stable way to target a specific one.
  taskCard(title: string): Locator {
    return this.page.locator('.task-card').filter({ hasText: title });
  }

  async completeTask(title: string): Promise<void> {
    await this.taskCard(title).getByRole('button', { name: 'Complete' }).click();
  }
}
