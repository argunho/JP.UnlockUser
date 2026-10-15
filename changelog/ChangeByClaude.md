# UnlockUser

## 2026-10-15 11:55
Fixed the broken scroll-lock line in the header menu: `getElementById("#root")` returned null (id has no `#`) and `toggleClass` is a jQuery method, not DOM — it threw on every menu close. Replaced it with an effect that syncs the `hide-overflow` class on `#root` with the `open` state, so it also works when the menu is opened via the nav button, closed by an outside click or by navigation.

- unlockuser.client/src/components/blocks/Header.jsx:72-77 — added: `useEffect` on `[open]` that toggles `hide-overflow` on `#root` via `classList.toggle`
- unlockuser.client/src/components/blocks/Header.jsx:84 (old line 77) — deleted: `document.getElementById("#root").toggleClass("hide-overflow")`

## 2026-10-13 14:57
Completed the unfinished checkbox toggle handler in the password form (missing else-branch of the ternary caused a syntax error) and wired it to the service checkboxes.

- unlockuser.client/src/components/forms/Form.jsx:219-229 — modified: finished `onCheckboxChange` (adds the value when it is not selected), renamed from `onCheckBoxChange` to match the call site
- unlockuser.client/src/components/forms/Form.jsx:364 — modified: Checkbox `onChange` now passes the service name instead of the event
