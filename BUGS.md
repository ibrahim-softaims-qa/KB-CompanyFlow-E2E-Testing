# Bugs found

All of these were found by reading the app's own source (routes, guards, templates,
component logic) and, where noted, confirmed with an automated repro in `e2e/`. None
of them were fixed — per the assignment's ground rules, this file only reports them.

---

Title:       Accountant can fully manage Users by navigating to /users directly
Severity:    High
Area:        Users screen / access control
Steps:
  1. Log in as the seeded Accountant (accountant@qa.test / acct123).
  2. Note the "Users" link is correctly hidden from the top nav.
  3. Manually navigate to /users (type it in the address bar, or click a
     bookmarked link).
Expected:    The route should be admin-only (same as the intent behind hiding the
             nav link and the README's "cannot manage users" rule), and the
             Accountant should be redirected away, the same way /clients/new
             already redirects them.
Actual:      The Users screen loads normally. The Accountant can see every user's
             email and role, create new users (including new Admins), and edit
             any existing user's role/active flag.
Notes:       Root cause: the `users` route in `app.routes.ts` has no `canActivate:
             [adminGuard]`, and `UserList` (user-list.ts) performs no role check
             of its own — the restriction only exists in `shell.html` as a hidden
             nav link. This is a real privilege-escalation path: an Accountant can
             promote their own account to Admin. Compare with `/clients/new`,
             which *does* have `canActivate: [adminGuard]` and correctly bounces
             non-admins to the dashboard.

---

Title:       Accountant can edit any client via a direct URL (/clients/:id/edit)
Severity:    Medium
Area:        Clients screen / access control
Steps:
  1. Log in as the seeded Accountant.
  2. Open any client's detail page and note the "Edit" button is correctly
     hidden (client-view.html only shows it `@if (isAdmin())`).
  3. Manually navigate to /clients/<that client's id>/edit.
Expected:    Same as /clients/new — the route should redirect the Accountant to
             the dashboard, since the README states Accountants "cannot
             create/edit/delete clients."
Actual:      The edit form loads and the Accountant can change and save any
             client's details (status, hourly rate, address, etc.).
Notes:       Root cause: in `app.routes.ts`, the `clients/new` route carries
             `canActivate: [adminGuard]` but the `clients/:id/edit` route does
             not. Same class of bug as the Users one above, just a narrower blast
             radius. Covered by the "cannot reach the new client screen" test in
             `e2e/permissions.spec.ts`, but that only proves the *create* path is
             guarded — the *edit* path demonstrated here is not.

---

Title:       Accountant can delete tasks from the Tasks screen but not from a
             client's own page — inconsistent enforcement
Severity:    Medium
Area:        Tasks
Steps:
  1. Log in as the seeded Accountant.
  2. Open any client's detail page (/clients/:id) and look at its task list —
     the delete icon is hidden for every task.
  3. Go to the global Tasks screen (/tasks) instead.
Expected:    Whatever the intended rule for task deletion is, it should be the
             same in both places — the same underlying `TaskRepository.remove()`
             call is one click away in each screen.
Actual:      On /tasks, every task row has a working delete button for the
             Accountant, with no role check at all. On /clients/:id, the
             identical action is hidden behind `@if (isAdmin())`.
Notes:       `task-list.html`'s delete button has no `isAdmin()` guard;
             `client-view.html`'s does. Whichever behavior is "correct," the two
             screens currently disagree with each other.

---

Title:       Org-number lookup applies whichever response arrives last, not
             whichever was requested last (race condition)
Severity:    Medium
Area:        Client form — organization-number lookup
Steps:
  1. Log in as Admin, go to Clients → New client.
  2. Enter an org number for a lookup that will be slow to respond, click the
     lookup button.
  3. Before it resolves, change the org number to a different one that will
     respond quickly, and click lookup again.
  4. Wait for both requests to finish.
Expected:    The form should reflect the *second* (most recently requested)
             lookup, since that's the last thing the user asked for. Ideally the
             first, now-stale request should be cancelled outright.
Actual:      The fast second response is applied first, and then the slow first
             response arrives afterwards and silently overwrites it — the form
             ends up showing the *first* company's data, attached to whichever
             org number happens to still be in the input.
Notes:       Root cause: `client-form.ts` pipes the lookup trigger through RxJS
             `mergeMap`, which runs every lookup concurrently and applies each
             response as it arrives, in completion order rather than request
             order. `switchMap` (which cancels the previous in-flight lookup)
             would fix this class of bug. Reliably reproduced with mocked,
             artificially-delayed responses in `e2e/race-condition.spec.ts`. Real
             impact: a user correcting a mistyped org number can silently save a
             client with a *different* company's registered name and address.

---

Title:       Time entries accept an end time at or before the start time
             (negative/zero duration)
Severity:    Medium
Area:        Time entries
Steps:
  1. Log in as either role, go to Time entries.
  2. Fill in the add-entry form with, e.g., Start = 14:00 and End = 09:00.
  3. Submit.
Expected:    The form should reject this — the translations file even ships a
             `time.durationInvalid` string, "End time must be after start time,"
             for exactly this case.
Actual:      The entry saves with a negative `durationMinutes`. It then renders a
             nonsensical duration (e.g. "-6t -0m") in the day list, and silently
             pulls down the "Hours this week" / "Billable this week" dashboard
             totals, since those are simple sums over all entries.
Notes:       `time-entries.ts`'s `add()` computes `durationMinutes` and checks
             `form.invalid`, but no validator actually compares start vs. end
             time, so the form is never marked invalid for this case. The
             `time.durationInvalid` string in both `en.json` and `nb.json` is
             never referenced anywhere in the app — dead copy for a check that
             was apparently intended but never wired up.

---

Title:       Dashboard totals go stale after data changes elsewhere in the app
Severity:    Low
Area:        Dashboard
Steps:
  1. Log in, note the "Hours this week" / "Billable this week" figures on the
     Dashboard.
  2. Go to Time entries and add a new billable entry for the current week.
  3. Navigate back to the Dashboard.
Expected:    The totals should include the entry just added.
Actual:      The Dashboard shows the same figures as before — the new entry
             isn't reflected until a full page reload (or "Reset data").
Notes:       `DashboardStatsCache` (dashboard-stats-cache.ts) is a root-scoped
             signal that's populated once and never invalidated. Nothing that
             writes a client or time entry elsewhere in the app knows to clear
             it. The client list, task list, and user list have the same
             stale-while-revalidate caching pattern, but those re-fetch in the
             background on every visit (`staleWhileRevalidate`); the dashboard's
             cache has no such refresh path at all.

---

Title:       Client list sorting ignores the active language, so Æ/Ø/Å-named
             clients don't sort per Norwegian rules
Severity:    Low
Area:        Clients screen — sorting
Steps:
  1. Log in as Admin (default language is Norwegian) or switch the app language
     to Norsk.
  2. Go to Clients, sort by Name ascending.
  3. Look at where the clients named "ÆRLIG FILM," "Æ HOLDING AS," "ØDE Ø AS,"
     "Ø ØDEGÅRD INVEST AS," and "Å AVLØSERRING" land in the list.
Expected:    Under Norwegian collation, Æ/Ø/Å sort *after* Z (they're their own
             letters at the end of the Norwegian alphabet) — the seed data's own
             code comment says as much.
Actual:      They sort at/near the top of the list instead, because the
             comparison is hardcoded to English collation.
Notes:       `client-list.ts`'s `sorted` computed value calls
             `a[col].localeCompare(b[col], 'en')` unconditionally — the `'en'`
             locale argument is hardcoded rather than using the app's active
             locale (`I18nService.current`).

---

Title:       Client list pagination can strand you on an empty page after
             deleting the last row(s) of the last page
Severity:    Low
Area:        Clients screen — pagination
Steps:
  1. Log in as Admin, go to Clients.
  2. Filter (via search or status) down to a small result set that fits on the
     last page of results, and navigate to that last page.
  3. Delete every client on that page.
Expected:    After the last item on a page is deleted, the view should fall back
             to a valid page (e.g. the new last page) instead of showing an
             empty page while other results still exist.
Actual:      The table shows "No clients match your search" / an empty page, even
             though earlier pages still have matching clients — the paginator is
             left pointing at a page index that no longer exists.
Notes:       `client-list.ts`'s `remove()` updates the underlying client list but
             never resets or clamps `state.pageIndex`. `paged()` just slices
             `[pageIndex * PAGE_SIZE, ...]`, which returns an empty array once
             the total shrinks below that offset.

---

Title:       Tasks are flagged "overdue" on their due date itself, a day early
Severity:    Low
Area:        Tasks — due date styling
Steps:
  1. Create or find a task due today, with status not "Done".
  2. View it on the Tasks screen or the client's detail page.
Expected:    A task due today still has the rest of today to be completed, so it
             shouldn't be styled/flagged as overdue until the day has passed.
Actual:      It's shown as overdue (red/overdue styling) as soon as its due date
             is today.
Notes:       Both `task-list.ts` and `client-view.ts` define `isOverdue()` as
             `task.status !== 'done' && task.dueDate <= isoDate(new Date())` — the
             `<=` should be `<` for "due today" to not count as overdue yet. The
             same off-by-one is duplicated in both places.
