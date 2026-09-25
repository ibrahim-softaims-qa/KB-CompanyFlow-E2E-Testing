import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth';
import { mockBrregLookup } from '../utils/mocks';
import { RACE_CONDITION_LOOKUPS } from '../fixtures/test-data/clients';
import { Navbar } from '../pages/navbar.page';
import { ClientListPage } from '../pages/client-list.page';
import { ClientFormPage } from '../pages/client-form.page';

// Bonus: reproduces the race condition in the organization-number lookup
// (see BUGS.md, "Org-number lookup can apply a stale response"). The
// lookup stream is wired with RxJS `mergeMap`, which runs concurrent
// lookups in parallel and applies *whichever response arrives last* to the
// form — not the response for whichever number the user looked up last.
//
// This test fires a lookup for company A (slow response), then before it
// resolves, fires a second lookup for company B (fast response). If the
// app applied the latest *request* (the correct behavior), the form would
// end up showing B. Instead it ends up showing A, because A's slow
// response lands after B's fast one and overwrites it.

test('a slower, earlier lookup silently overwrites a faster, later one', async ({ page }) => {
  const { slow, fast } = RACE_CONDITION_LOOKUPS;

  await loginAs(page, 'admin');
  await mockBrregLookup(page, [slow, fast]);

  const navbar = new Navbar(page);
  const clientList = new ClientListPage(page);
  const clientForm = new ClientFormPage(page);

  await navbar.goToClients();
  await clientList.openNewClientForm();

  // Fire the slow lookup first...
  await clientForm.lookupOrgNumber(slow.orgNumber);

  // ...then, without waiting for it, fire the fast lookup for a different
  // company. A user would do this by correcting a mistyped number and
  // re-checking it.
  await clientForm.lookupOrgNumber(fast.orgNumber);

  // Expected (correct) behavior would be the fast company's name, since that
  // was the last lookup the user actually asked for. The current app shows
  // the slow, earlier one instead — this assertion documents that known bug.
  // No fixed wait needed: toHaveValue() polls until the slow response lands
  // (~600ms) or the assertion times out, so this settles as soon as the
  // state actually does rather than waiting out a hardcoded duration.
  await expect(clientForm.nameInput).toHaveValue(slow.name);
});
