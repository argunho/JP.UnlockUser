# UnlockUser

## 2026-10-13 14:57
Completed the unfinished checkbox toggle handler in the password form (missing else-branch of the ternary caused a syntax error) and wired it to the service checkboxes.

- unlockuser.client/src/components/forms/Form.jsx:219-229 — modified: finished `onCheckboxChange` (adds the value when it is not selected), renamed from `onCheckBoxChange` to match the call site
- unlockuser.client/src/components/forms/Form.jsx:364 — modified: Checkbox `onChange` now passes the service name instead of the event
