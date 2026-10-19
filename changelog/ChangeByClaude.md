# UnlockUser

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
