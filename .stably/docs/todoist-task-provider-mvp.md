# Todoist task provider (MVP)

Add Todoist as a first-class **task provider** in Orca, cloned from **Linear**, not from Jira and not from GitHub/GitLab review hosts.

This is a fork of `stablyai/orca` at `https://github.com/yordiverbeeck/orca-todoist`.
Push feature branches to `origin` (`yordiverbeeck/orca-todoist`). Do **not** push to `upstream` (`stablyai/orca`).

## Goal (v1)

A user can:

1. Paste a Todoist API token in **Settings → Integrations → Task providers**.
2. See **Todoist** in the Tasks source picker (same place as Linear / Jira).
3. List and search incomplete tasks (filter by project).
4. Open a task: title, description, project, due date, labels, comments, complete/reopen.
5. Create an Orca worktree from a task (name prefilled, task linked).
6. Paste a Todoist task URL into the create-workspace name field and link it.
7. See the linked task on the worktree card with **View on Todoist**.

Out of scope for v1: OAuth app, boards/filters UI, subtasks as a tree, reminders, CLI (`orca todoist`), agent skill, mobile Smart source, remote-runtime capability flags, webhooks.

## Clone Linear, not Jira

Linear is the template: personal API token, encrypted credential store, list/search/detail/mutate, worktree link, settings card.

Jira is the anti-template: Cloud vs Server, ADF, custom fields, transitions. Do not copy that complexity.

Todoist API is simpler than Linear:

- Base: `https://api.todoist.com/api/v1`
- Auth: `Authorization: Bearer <token>` (Settings → Integrations → Developer in Todoist)
- Official TS SDK: `@doist/todoist-api-typescript` (optional; raw `fetch` is fine and matches Jira’s style)
- Resources: tasks, projects, sections, comments, labels
- Complete/reopen instead of workflow transitions
- Markdown descriptions
- Task URLs: `https://app.todoist.com/app/task/<id>` (also accept `todoist.com/showTask?id=`)

## Hard-coded provider union (this is the real work)

There is **no** plugin hook for task sources. Providers are a closed union.

Start here:

```ts
// src/shared/task-providers.ts
export type TaskProvider = 'github' | 'gitlab' | 'linear' | 'jira'
```

Add `'todoist'`. Then update every exhaustive switch / `Record<TaskProvider, …>` until typecheck is clean. That file is the registry; Linear/Jira show how far the type fans out.

Also extend:

- `src/shared/task-provider-identity.ts` — `TodoistTaskProviderIdentity` (`provider: 'todoist'`, optional `projectId`, `projectName`)
- `src/shared/task-source-context.ts` re-exports
- `filterAvailableTaskProviders` / `isTaskProviderAvailable` — treat Todoist like Jira: keep it visible even when disconnected so Settings/Tasks can connect it
- Settings: `visibleTaskProviders` / `defaultTaskSource`
- RPC/zod catalogs if they enumerate providers

## Suggested file map (mirror Linear)

### Main process

Create `src/main/todoist/` modeled on `src/main/linear/`:

| Linear | Todoist |
|---|---|
| `linear-token-store.ts` | encrypted token store via existing `integration-credential-file` helpers |
| `client.ts` | `connect` / `disconnect` / `getStatus` / `testConnection` / `getClient` |
| `linear-issue-listing.ts` | list/search tasks (`GET /tasks`, `GET /tasks/filter`, projects) |
| `linear-issue-lookups.ts` | `GET /tasks/:id` |
| `linear-issue-comments.ts` | comments |
| `linear-issue-mutations.ts` | update content, complete (`POST /tasks/:id/close`), reopen |

Reuse Linear’s credential patterns (encrypt at rest, decrypt only on user action / test, 401 clears token).

### IPC / preload / store

Copy the Linear IPC surface at a smaller scale:

- `todoist:get-status`
- `todoist:connect` (token)
- `todoist:disconnect`
- `todoist:test-connection`
- `todoist:list-tasks`
- `todoist:search-tasks`
- `todoist:get-task`
- `todoist:add-comment`
- `todoist:complete-task` / `todoist:reopen-task`

Wire renderer store the same way Linear is wired (`linearStatus`, `checkLinearConnection`, …).

### Settings UI

- `src/renderer/src/components/settings/task-tracker-integration-cards.tsx` currently exports Linear + Jira.
- Add `TodoistIntegrationCard` next to them in `IntegrationsPane.tsx` under **Task providers**.
- Token dialog like `LinearApiKeyDialog`.

### Tasks drawer + create workspace

Find Linear’s Tasks source picker, issue list, detail drawer, and create-workspace smart field. Add a Todoist mode:

- Source chip: Todoist
- List: incomplete tasks, project filter, search
- Detail: complete/reopen, comments
- Create workspace: paste URL or search, prefill name, persist link on the worktree

URL parse: `app.todoist.com/app/task/<id>` and `todoist.com/showTask?id=<id>`.

### Worktree card

Linear has a `linear-issue` worktree card property. Add `todoist-task` (id + content + url + **View on Todoist**). Linking one task provider should replace the previous provider link (GitHub/Linear already share one issue field).

CLI can wait: Linear has `--linear-issue`; Todoist CLI flag is post-MVP unless it falls out of the same worktree-set plumbing.

## Implementation order

Do this in order. Stop after each slice is typecheck-clean and has unit tests for the new module.

1. **Types** — `'todoist'` in `TaskProvider` + identity type. Fix exhaustive switches (availability can stub “always visible”).
2. **Main client + credential store + IPC** — connect/status/test with a mocked `fetch`.
3. **Settings card** — paste token, test, disconnect.
4. **List/search/detail API** + Tasks drawer source.
5. **Mutations** — complete/reopen, optional comment.
6. **Worktree link** — create-from-task, paste URL, card property.
7. **Tests** — follow `src/main/linear/*.test.ts` and `src/main/jira/client.test.ts` style. Do not add e2e unless existing tasks-page specs are cheap to extend.

## Coding rules for this repo

- Match surrounding files: small modules, `Why:` comments only for non-obvious constraints.
- Do not drive-by refactors.
- Localization: other UI strings go through `translate(...)`. Follow that.
- Line-count / `ts-nocheck` ratchets exist (`pnpm run check:max-lines-ratchet`). Keep new files modest; split rather than grow Linear-sized god files.
- Prefer `fetch` + small mappers over pulling a large SDK if the SDK bloats the Electron main bundle. If you add a dependency, justify it.

## Disk / setup

This machine is tight on disk (~15 GB free). The checkout is a **shallow** clone.

- Do **not** run a full `pnpm install` unless you need to run tests or `pnpm dev`.
- If you install, use the repo’s documented install (`pnpm install` / `pnpm install:release`) and avoid extra native rebuilds.
- Targeted vitest on new files is enough for v1.

## Definition of done (v1)

- [ ] `'todoist'` is a `TaskProvider`
- [ ] Settings card can save/test/disconnect a personal token
- [ ] Tasks drawer lists Todoist tasks when connected
- [ ] Detail can complete/reopen
- [ ] Worktree can be created from a task and shows the link
- [ ] Pasting a Todoist task URL links the worktree
- [ ] Unit tests cover client mapping, URL parse, and connect/status
- [ ] Branch pushed to `origin` (`yordiverbeeck/orca-todoist`), not `upstream`

Start by mapping every `TaskProvider` switch (rg `'linear' | 'jira'` / `case 'linear'`) so the type union change does not leave a hole. Then implement the main-process client.
