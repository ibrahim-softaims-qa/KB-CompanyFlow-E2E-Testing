import { test, expect } from '../utils/cleanup';
import { loginAs } from '../utils/auth';
import { mockBrregLookup } from '../utils/mocks';
import { NEW_CLIENT_LOOKUP, UNKNOWN_ORG_NUMBER, MANUAL_ENTRY_CLIENT_NAME } from '../fixtures/test-data/clients';
import { Navbar } from '../pages/navbar.page';
import { ClientListPage } from '../pages/client-list.page';
import { ClientFormPage } from '../pages/client-form.page';

// Required test 2: create a client via the org-number lookup, stubbed so
// the test never depends on the real external service being reachable.

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'admin'); // both tests below need an admin session
});

test('admin creates a client via the org-number lookup', async ({ page, createdClients }) => {
  await mockBrregLookup(page, [NEW_CLIENT_LOOKUP]);

  const navbar = new Navbar(page);
  const clientList = new ClientListPage(page);
  const clientForm = new ClientFormPage(page);

  await navbar.goToClients();
  await clientList.openNewClientForm();

  await clientForm.lookupOrgNumber(NEW_CLIENT_LOOKUP.orgNumber);

  await expect(clientForm.nameInput).toHaveValue(NEW_CLIENT_LOOKUP.name);
  await expect(clientForm.lookupMessage).toHaveCount(0);

  await clientForm.save();
  createdClients.push(NEW_CLIENT_LOOKUP.name); // clean up once this test finishes

  await expect(page).toHaveURL(/\/clients$/);

  // Confirm the new client shows up in the list. Search first since the
  // list is paginated (10 per page) and sorted alphabetically, so the new
  // row isn't guaranteed to be on the first page.
  await clientList.search(NEW_CLIENT_LOOKUP.name);
  await expect(clientList.clientLink(NEW_CLIENT_LOOKUP.name)).toBeVisible();
});

test('falls back to manual entry when the lookup fails', async ({ page, createdClients }) => {
  // No fixture registered for this org number -> mockExternalApis' default
  // 404 applies, simulating the service being unreachable or the company
  // not existing.

  const navbar = new Navbar(page);
  const clientList = new ClientListPage(page);
  const clientForm = new ClientFormPage(page);

  await navbar.goToClients();
  await clientList.openNewClientForm();

  await clientForm.lookupOrgNumber(UNKNOWN_ORG_NUMBER);

  await expect(clientForm.lookupMessage).toBeVisible();

  await clientForm.fillName(MANUAL_ENTRY_CLIENT_NAME);
  await clientForm.save();
  createdClients.push(MANUAL_ENTRY_CLIENT_NAME); // clean up once this test finishes

  await expect(page).toHaveURL(/\/clients$/);
});
