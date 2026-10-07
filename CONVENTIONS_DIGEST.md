# CONVENTIONS DIGEST (read before every feature)

Sources: HANDOFF.md (Decisions/Deviations win), docs/07-frontend-specification/0-frontend-conventions.md, 10-ui-foundation-spec.md.

## Order and scope
- Per feature, in this order: hooks + hook tests -> components -> pages -> page/component tests.
- Create ONLY the files 05b lists for the feature. Never edit other files. Never edit shared files (types/index.ts, constants/index.ts, routes/index.tsx, tsconfig*, package.json) or the partner's files; report the needed change instead.
- Do not extend `src/hooks/index.ts`. One hook file per feature, imported by path (`@/hooks/useX`).
- Paths: `@/` alias. Layouts in `src/components/layouts/`, auth pages in `src/pages/auth/`.

## Data and API
- `api` from `@/lib/axios` already unwraps the envelope. Hooks return `api.get<T>(...).then((r) => r.data)`. NEVER `.data.data`.
- Query keys only via `QUERY_KEYS`, paths only via `ROUTES` (no string literals, no template-string paths for pages). Types come from `@/types` (copied from 06-api JSON, never re-derived).
- Mutations typed `useMutation<Resp, AxiosError, Vars>`. Invalidate related `QUERY_KEYS` in `onSuccess`.
- Auth: `setAuth(accessToken, refreshToken, user)`; store action is `logout` (not `clearAuth`). Guards redirect when `token` clears; hooks do not navigate on logout.
- Roles are the `Role` union from `@/types`: STUDENT | PARENT | TUTOR | ADMIN.

## UI
- Use only Button variants primary/secondary/destructive/ghost and sizes sm/md/lg.
- Common components are DEFAULT exports (`StatusBadge`, `EmptyState`, `CountdownTimer`).
- Any new custom @theme token used in text-/rounded-/shadow- classes must be added to `extendTailwindMerge` in `src/lib/utils.ts` (report it, do not edit).
- Never git-exclude files that use Tailwind classes.

## Tests
- Vitest + Testing Library. Style: copy `tests/hooks/useAuth.test.ts` (golden example): `vi.mock('@/lib/axios', ...)`, QueryClient wrapper with `retry: false`, `vi.mocked(api.post)`.
- Every row of the feature's 9-N spec case table has a test; test titles reuse the spec wording so rows are greppable.
- One-shot run: `npx vitest run` (never `npm run test`, it watches).

## Golden examples
- `src/hooks/useAuth.ts`, `tests/hooks/useAuth.test.ts`, `tests/lib/axios.test.ts`, `tests/store/auth.store.test.ts`.

## Gemini hygiene
- Create new files; do not "edit" existing ones. Do not `git add`/commit. Do not run `npm audit fix`. Report `git status --short`; the user verifies it.
