import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth';
import { SEEDED_CLIENT_NAME } from '../fixtures/test-data/clients';
import { TASK_TITLE_CLIENT_VIEW, TASK_TITLE_GLOBAL_LIST } from '../fixtures/test-data/tasks';
import { Navbar } from '../pages/navbar.page';
import { ClientListPage } from '../pages/client-list.page';
import { ClientViewPage } from '../pages/client-view.page';
import { TaskListPage } from '../pages/task-list.page';

// Bonus: create a task for a client and mark it complete, from both the
// client's own view and the global Tasks screen. Tasks can only be
// *created* from a client's own view (the global Tasks screen has no "new
// task" affordance), so both tests create there and differ only in where
// they mark the task complete.

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'accountant'); // task create/complete isn't admin-only — see README's role table
});

test('creates a task and marks it complete on the client detail view', async ({ page }) => {
  const navbar = new Navbar(page);
  const clientList = new ClientListPage(page);
  const clientView = new ClientViewPage(page);

  await navbar.goToClients();
  await clientList.search(SEEDED_CLIENT_NAME);
  await clientList.clientLink(SEEDED_CLIENT_NAME).click();

  await clientView.createTask(TASK_TITLE_CLIENT_VIEW);
  await expect(clientView.taskCard(TASK_TITLE_CLIENT_VIEW)).toBeVisible();

  await clientView.completeTask(TASK_TITLE_CLIENT_VIEW);
  await expect(clientView.taskCard(TASK_TITLE_CLIENT_VIEW)).toContainText('Done');
});

test('creates a task on the client view, then marks it complete from the global Tasks screen', async ({
  page,
}) => {
  const navbar = new Navbar(page);
  const clientList = new ClientListPage(page);
  const clientView = new ClientViewPage(page);
  const taskList = new TaskListPage(page);

  await navbar.goToClients();
  await clientList.search(SEEDED_CLIENT_NAME);
  await clientList.clientLink(SEEDED_CLIENT_NAME).click();

  await clientView.createTask(TASK_TITLE_GLOBAL_LIST);
  // Wait for the save to actually finish (the card re-appearing confirms
  // the underlying create + reload completed) before navigating away —
  // otherwise the Tasks screen's own first fetch can race the still-in-
  // flight write and simply not see the new task yet.
  await expect(clientView.taskCard(TASK_TITLE_GLOBAL_LIST)).toBeVisible();

  await navbar.goToTasks();
  await taskList.waitForLoad();
  await expect(taskList.row(TASK_TITLE_GLOBAL_LIST)).toBeVisible();

  await taskList.completeTask(TASK_TITLE_GLOBAL_LIST);
  await expect(taskList.row(TASK_TITLE_GLOBAL_LIST)).toContainText('Done');
});
