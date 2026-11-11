# UnlockUser

## 2026-11-11 14:03
Editor: font-family dropdown + scrollable dropdowns.
- The "Typsnitt" toolbar button is now a dropdown (Standard, Calibri, Arial, Segoe UI, Verdana, Tahoma, Georgia, Times New Roman, Courier New). It sets the font on the selected text, or on the whole text when nothing is selected. `execCommand("fontName")` creates `<font face>`; the face is moved to `style="font-family: … !important"` (needed because index.css sets `font-family !important` on div/p/span/h1–h6/li), inner elements get `font-family: inherit !important`. "Standard" = reset.
- The "Standardtypsnitt" reset button is kept as a separate button (user request).
- All editor dropdowns: max-height 200px with vertical scroll; `flex-wrap: nowrap`, otherwise a column flex with max-height wraps into new columns instead of scrolling.

- unlockuser.client/src/components/forms/Editor.jsx:8 — modified: imported `FontDownloadOff` icon
- unlockuser.client/src/components/forms/Editor.jsx:48-51 — added: `standardFont`, `fonts`
- unlockuser.client/src/components/forms/Editor.jsx:73 — modified: `fontFamily` button is a dropdown (`models: fonts`)
- unlockuser.client/src/components/forms/Editor.jsx:74 — added: `resetFontFamily` button
- unlockuser.client/src/components/forms/Editor.jsx:283-327 — added: `applyFontFamily`
- unlockuser.client/src/components/forms/Editor.jsx:619-626 — modified: `fonts` / `resetFontFamily` cases in `handleChange` (replaced the 13:59 `fontFamily` case)
- unlockuser.client/src/components/forms/Editor.jsx:803 — modified: `editor-dropdown-fonts` class for the font dropdown
- unlockuser.client/src/components/forms/Editor.jsx:812-818 — added: font names shown in their own font
- unlockuser.client/src/assets/css/editor.css:131-135 — added: dropdown `max-height: 200px`, `overflow-y: auto`
- unlockuser.client/src/assets/css/editor.css:141 — modified: dropdown `flex-wrap: nowrap`
- unlockuser.client/src/assets/css/editor.css:144-148 — added: dropdown items `flex-shrink: 0`
- unlockuser.client/src/assets/css/editor.css:156-169 — added: `.editor-dropdown-fonts` styles

## 2026-11-11 13:59
Editor: added a "Standardtypsnitt" toolbar button that removes the inline `font-family` (and `<font face>`) so the standard font is used — for the selected text (and its parent elements), or for the whole text when nothing is selected. Undoable.

- unlockuser.client/src/components/forms/Editor.jsx:8 — modified: imported `FontDownload` icon
- unlockuser.client/src/components/forms/Editor.jsx:69 — added: `fontFamily` toolbar button
- unlockuser.client/src/components/forms/Editor.jsx:275-311 — added: `resetFontFamily`
- unlockuser.client/src/components/forms/Editor.jsx:567-569 — added: `fontFamily` case in `handleChange`

## 2026-11-11 13:57
Fixed: a heading (h1–h6) made from pasted text stayed 14px. `applyHeading` copied the block's inline `style` (e.g. `font-size:14px;font-weight:400` from Teams/Outlook), which overrode the heading size. Font styles are now removed from the heading and its child elements; other styles (e.g. `text-align`) are kept.

- unlockuser.client/src/components/forms/Editor.jsx:146-157 — added: `headingStyleProps`, `clearFontStyles`
- unlockuser.client/src/components/forms/Editor.jsx:338 — added: `clearFontStyles(heading)` call in `applyHeading`

## 2026-11-11 13:50
Editor: added Undo/Redo ("back action") and fixed the h1–h6 headings.
- Undo/Redo: the editor keeps its own history of html snapshots (max 100), because programmatic DOM changes (font size, alignment, images, "clear") break the browser's built-in undo. Typing in a row (<800 ms) is merged into one step. Toolbar buttons + Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z.
- Headings: `execCommand("formatBlock")` did not work, replaced with `applyHeading`, which changes the block around the cursor (or wraps the selection / the current line) into h1–h6; choosing the same heading again turns it back into `<p>`.
- Toolbar buttons now call `preventDefault()` on mousedown, so the editor keeps the focus and the selection when a toolbar/dropdown button is clicked.

- unlockuser.client/src/components/forms/Editor.jsx:8 — modified: imported `Undo`, `Redo` icons
- unlockuser.client/src/components/forms/Editor.jsx:59-62 — added: undo/redo toolbar buttons
- unlockuser.client/src/components/forms/Editor.jsx:131-144 — added: history constants, `lineBreakTags`, `headingBlockSelector`, `isLineBreak`
- unlockuser.client/src/components/forms/Editor.jsx:172-175 — added: `refHistory`
- unlockuser.client/src/components/forms/Editor.jsx:183 — modified: history reset when `defaultValue` loads
- unlockuser.client/src/components/forms/Editor.jsx:188-191 — modified: `syncValue(merge)` records a history step
- unlockuser.client/src/components/forms/Editor.jsx:194-328 — added: `recordHistory`, `restoreHistory`, `placeCaret`, `onKeyDown`, `applyHeading`
- unlockuser.client/src/components/forms/Editor.jsx:365 — modified: history reset in `saveItem`
- unlockuser.client/src/components/forms/Editor.jsx:368-369 — modified: `onChange` merges typing steps
- unlockuser.client/src/components/forms/Editor.jsx:506 — modified: headings use `applyHeading` instead of `execCommand("formatBlock")`
- unlockuser.client/src/components/forms/Editor.jsx:508-515 — added: `undo` / `redo` cases
- unlockuser.client/src/components/forms/Editor.jsx:522 — modified: "remove" uses `syncValue()` (undoable)
- unlockuser.client/src/components/forms/Editor.jsx:685 — added: `onMouseDown` preventDefault on toolbar buttons
- unlockuser.client/src/components/forms/Editor.jsx:744 — added: `onKeyDown` on the editor

## 2026-11-11
Fixed: the success modal never opened after editing a manual/article. The modal was rendered only when `success && !item`, but on the edit route (`edit/:id`) `item` always comes from the loader, so the condition was always false. The modal now depends on `success` only.

- unlockuser.client/src/pages/auth/FormManual.jsx:124 — modified: removed `!item` from the `ModalSuccess` condition

## 2026-11-09 21:19
Fixed: the "Kontrollera inloggning" tooltip was still shown after the check had run. MUI `Tooltip` has no `disabled` prop, so `disabled={isChecked}` did not hide it. The title is now an empty string when `isChecked` is true, which makes MUI not render the tooltip.

- unlockuser.client/src/components/forms/Form.jsx:312 — modified: `title` is empty when `isChecked`
- unlockuser.client/src/components/forms/Form.jsx:318 — deleted: `disabled={isChecked}` on `Tooltip`

## 2026-11-09 13:33
Fixed: the "Testa inloggning" Send button did not send the typed password. `checkLogin` read `e.target.value`, but on click `e.target` is the button or its icon, so the password was an empty string (no request) or the event object itself. The password is now read from the input through a ref, for both click and Enter. Also removed a `console.log` that printed the plain-text password.

- unlockuser.client/src/pages/auth/Overview.jsx:1 — modified: added `useRef` import
- unlockuser.client/src/pages/auth/Overview.jsx:80 — added: `passwordRef`
- unlockuser.client/src/pages/auth/Overview.jsx:89-94 — modified: `checkLogin` reads the password from `passwordRef`; deleted password `console.log`
- unlockuser.client/src/pages/auth/Overview.jsx:333 — added: `inputRef={passwordRef}` on the password field
- unlockuser.client/src/pages/auth/Overview.jsx:346 — modified: Enter handler calls `checkLogin()`

## 2026-10-28 (3)
Fixed: a manually typed password was rejected with "Lösenords längd måste bli minst …". `inputProps.form: { autoComplete: 'off' }` rendered `form="[object Object]"` on the `<input>`, detaching the inputs from the form, so they were missing from `FormData`. Generated passwords still worked only through the `?? password` state fallback. Replaced with `autoComplete: "new-password"`. Also removed a debug `console.log`.

- unlockuser.client/src/components/forms/Form.jsx:192 — deleted: `console.log(_password?.length)`
- unlockuser.client/src/components/forms/Form.jsx:325-330 — modified: `inputProps` without `form` attribute, `autoComplete: "new-password"`

## 2026-10-28 (2)
Fixed: password fields were never emptied on Reset. `RESET_FORM_TOTAL` did not clear `password` (used as the inputs' `defaultValue`) nor `isChanged`, so the remounted inputs got the old generated password back. Also `isCleaned` used `getMilliseconds()` (0–999), which can repeat and then the `key` does not change; replaced with `Date.now()`.

- unlockuser.client/src/components/forms/Form.jsx:58 — modified: reset clears `password`, `isChanged`; `isCleaned: Date.now()`

## 2026-10-28
Fixed: a manually typed password could not be submitted in Form. The submit button was disabled by `!isChanged`, and `isChanged` was only set by the "PASSWORD" action (password generator). Typing only set `dirty`, so the button stayed disabled. The button is now enabled when the password was either generated or typed.

- unlockuser.client/src/components/forms/Form.jsx:357 — modified: `FormButtons` `disabled={!isChanged && !dirty}`

## 2026-10-26 15:47
Fixed ESLint error `react-hooks/set-state-in-effect` in EmployeeView: `onChange("search")` (which calls `setDropDownItems`) ran synchronously inside `useEffect`. Replaced with the "adjust state during render" pattern (compare `search` with stored `prevSearch`), same as the existing `sourceChanged` block.

- unlockuser.client/src/pages/auth/EmployeeView.jsx:27 — deleted: unused `useEffect` import
- unlockuser.client/src/pages/auth/EmployeeView.jsx:253-260 — modified: `useEffect` replaced by `prevSearch` state check during render

## 2026-10-23 20:40
Adapted EmployeeView to `permissions.employees` being a plain `string[]` of usernames (was `{ username, moderators }[]`). Employees are now saved via the moderators catalog (server `PutModeratorsPermissions` reads `model.Employees` only under the "moderators" name), and the Topdesk case sends `employees` to match `CaseCatalogModel.Employees`.

- unlockuser.client/src/pages/auth/EmployeeView.jsx:35-41 — deleted: `normalizedEmployees` helper (object comparison no longer needed)
- unlockuser.client/src/pages/auth/EmployeeView.jsx:104-114 — modified: `onChange` adds username strings to `approved.employees` / `caseEmployees`
- unlockuser.client/src/pages/auth/EmployeeView.jsx:128-139 — modified: `onDelete` removes username strings, single code path
- unlockuser.client/src/pages/auth/EmployeeView.jsx:163-172 — modified: submit sends `employees` inside the "moderators" update
- unlockuser.client/src/pages/auth/EmployeeView.jsx:210 — modified: `employeesChanged` compares sorted string arrays
- unlockuser.client/src/pages/auth/EmployeeView.jsx:215-219 — modified: `employeesToView` null-safe `includes`
- unlockuser.client/src/pages/auth/EmployeeView.jsx:312 — modified: `checked` uses `includes` and `svl`
- unlockuser.client/src/pages/auth/EmployeeView.jsx:323 — modified: `onDelete` call without `"username"` key
- unlockuser.client/src/pages/auth/EmployeeView.jsx:467 — modified: case modal prop `employees`

## 2026-10-23 12:35
Fixed `setSearch` updaters in UsersLayout: arrow functions with `{ ... }` body returned `undefined` (the braces were a block with a label, not an object), so `search` became `undefined`. Now they return a merged object. Also completed the half-typed `color={sear}` on the workplace icon.

- unlockuser.client/src/layouts/UsersLayout.jsx:93 — modified: `handleSearch` merges `value` into previous state
- unlockuser.client/src/layouts/UsersLayout.jsx:140-143 — modified: workplace button toggles `work` in previous state; icon color reflects `search.work`

## 2026-10-19 17:07
Fixed the logout loaders: `signout` was `async`, so `signout(...)` returned a Promise instead of a loader function, and the plain `loader: signout` received the router args as `api` (`authentication/[object Object]`). The server-side `await Logout()` and the redirect to the develop-mode link were already done by the user.

- unlockuser.client/src/pages/auth/Logout.jsx:16 — modified: `signout` is a plain (non-async) loader factory
- unlockuser.client/src/routes/AppRoutes.jsx:270 — modified: `loader: signout()`

## 2026-10-19 17:00
Added a "Logga ut (develop mode)" link to the hidden menu, visible only to DevelopTeam (filtered by the `Roles` claim; ITGroup sees every `access` link, so a separate `developer` flag was needed).

- unlockuser.client/src/models/Links.jsx:6 — modified: imported `DeveloperMode` icon
- unlockuser.client/src/models/Links.jsx:24 — added: develop-mode logout link (`/session/logout/dm`)
- unlockuser.client/src/components/menu/HiddenMenu.jsx:15 — added: `DecodedClaims` import
- unlockuser.client/src/components/menu/HiddenMenu.jsx:30 — added: `developer` flag from the `Roles` claim
- unlockuser.client/src/components/menu/HiddenMenu.jsx:59 — modified: links with `developer: true` are hidden from non-developers

## 2026-10-19 14:51
Develop-mode login fixes. Closed a hole where the public `POST /api/authentication` honored `ModeratorUsername`, letting any user with valid AD credentials sign in as any moderator; the swap now only happens via `LoginDevelopMode` (valid one-time `auth_key`) and only for members of "Azure-Utvecklare Test". Develop-mode tokens get the `Impersonating` role/claim (blocks password changes) and are logged. Fixed `LoginDevelopMode` checking `login_key` instead of `auth_key`. On the client, the Autocomplete submitted the moderator's display name; the username (`secondary`) is now submitted via a hidden input.

- UnlockUser.Server/Controllers/AuthenticationController.cs:38-45 — modified: `Login` delegates to new private `LoginCore(model, developMode)`
- UnlockUser.Server/Controllers/AuthenticationController.cs:60-75 — modified: moderator swap only in develop mode + developer group check; `model.Username` is no longer overwritten
- UnlockUser.Server/Controllers/AuthenticationController.cs:121 — modified: dashboard cache stored for the impersonated user
- UnlockUser.Server/Controllers/AuthenticationController.cs:132-140 — added: `Impersonating` role/claim and log entry
- UnlockUser.Server/Controllers/AuthenticationController.cs:172-181 — modified: `LoginDevelopMode` uses `auth_key`, calls `LoginCore(model, true)`, removes the key after a successful login
- unlockuser.client/src/pages/open/Login.jsx:27 — added: `moderator` state
- unlockuser.client/src/pages/open/Login.jsx:120-139 — modified: controlled Autocomplete + hidden `moderator` input with `secondary`

## 2026-10-19 14:01
Added an MUI Autocomplete for moderators on the login page (develop mode): the list shows `primary`, selecting an option puts its `secondary` into `username`. Also fixed the develop-mode URL template (`{id}` → `${id}`) and the route parameter syntax (`{id}` → `:id`), which prevented the mode from working.

- unlockuser.client/src/pages/open/Login.jsx:5 — modified: imported `Autocomplete`
- unlockuser.client/src/pages/open/Login.jsx:71 — modified: template string uses `${id}` / `${username}`
- unlockuser.client/src/pages/open/Login.jsx:119-133 — added: moderator Autocomplete
- unlockuser.client/src/routes/OpenRoutes.jsx:33 — modified: route path `login/develop/mode/:id`

## 2026-10-16 11:20
Data files must stay in wwwroot: set `LocalFiles:DataPath` to `wwwroot` explicitly and made relative values resolve against the content root (absolute paths still work, since `Path.Combine` keeps an absolute second argument).

- UnlockUser.Server/appsettings.json:43 — modified: `DataPath` set to `"wwwroot"`
- UnlockUser.Server/IServices/LocalFileService.cs:21 — modified: `_dataRootPath` resolves the configured path via `Path.Combine(env.ContentRootPath, ...)`

## 2026-10-16 11:02
Made the folder for encrypted data files (catalogs/, services/) configurable via `LocalFiles:DataPath`, so on the server the data can live outside the deployed site folder and is not affected by deploys or lost folder permissions (fix for "Access to the path ...approved-employees.txt...tmp is denied"). An empty value keeps the old behavior (wwwroot).

- UnlockUser.Server/IServices/LocalFileService.cs:16-22 — added: `_dataRootPath` field read from `LocalFiles:DataPath`, falls back to wwwroot
- UnlockUser.Server/IServices/LocalFileService.cs:27 — modified: `GetEncryptedFile` reads from `_dataRootPath`
- UnlockUser.Server/IServices/LocalFileService.cs:222 — modified: `PathnameReadOnlyOwerwrite` builds the directory from `_dataRootPath`
- UnlockUser.Server/IServices/LocalFileService.cs:257 — modified: `SaveEncryptedData` fallback directory is `_dataRootPath`
- UnlockUser.Server/appsettings.json:41-45 — added: `LocalFiles:DataPath` setting (empty by default)

## 2026-10-15 11:55
Fixed the broken scroll-lock line in the header menu: `getElementById("#root")` returned null (id has no `#`) and `toggleClass` is a jQuery method, not DOM — it threw on every menu close. Replaced it with an effect that syncs the `hide-overflow` class on `#root` with the `open` state, so it also works when the menu is opened via the nav button, closed by an outside click or by navigation.

- unlockuser.client/src/components/blocks/Header.jsx:72-77 — added: `useEffect` on `[open]` that toggles `hide-overflow` on `#root` via `classList.toggle`
- unlockuser.client/src/components/blocks/Header.jsx:84 (old line 77) — deleted: `document.getElementById("#root").toggleClass("hide-overflow")`

## 2026-10-13 14:57
Completed the unfinished checkbox toggle handler in the password form (missing else-branch of the ternary caused a syntax error) and wired it to the service checkboxes.

- unlockuser.client/src/components/forms/Form.jsx:219-229 — modified: finished `onCheckboxChange` (adds the value when it is not selected), renamed from `onCheckBoxChange` to match the call site
- unlockuser.client/src/components/forms/Form.jsx:364 — modified: Checkbox `onChange` now passes the service name instead of the event
