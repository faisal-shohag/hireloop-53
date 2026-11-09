# Repository Guidelines

## Project Structure & Module Organization

HireLoop has two independent Git repositories: `client/` and `server/`; the workspace root has no package scripts.

- `client/app/`: Next.js 16 App Router pages, layouts, and the Better Auth API route; dashboards support seekers, recruiters, and admins.
- `client/components/`: reusable UI, shared form controls, and dashboard components. Route-specific components live in `_components/` directories.
- `client/lib/`: API wrappers, authentication, shared types, and formatters; `client/hooks/` contains React hooks.
- `client/public/` and `client/app/images/`: image assets.
- `server/index.js`: Express 5 endpoints for users, jobs, and applications backed by MongoDB.
- `docs/`: module recording notes. No automated tests are currently present.

## Build, Test, and Development Commands

Run `npm ci` separately inside `client/` and `server/` to install locked dependencies.

From `client/`:

- `npm run dev`: start the Next.js development server, normally on port 3000.
- `npm run build`: create a production build; `npm start` serves it.
- `npm run lint`: run ESLint with Next.js and TypeScript rules.
- `npm run typecheck`: check TypeScript without emitting files.
- `npm run format`: format TypeScript files with Prettier.

From `server/`, run `node --watch index.js` for development or `node index.js` to start normally; the default port is 5000.

## Coding Style & Naming Conventions

Client Prettier settings specify two-space indentation, double quotes, no semicolons, LF endings, and an 80-column width; the Tailwind plugin sorts classes. TypeScript uses strict mode and `@/` imports. Use PascalCase for components/types and camelCase for functions/variables. Follow nearby filenames, such as `job-search-bar.tsx` or `JobCard.tsx`. Server code generally uses four-space indentation, single quotes, and semicolons.

## Testing Guidelines

No testing framework or coverage threshold is configured; server `npm test` is a failing placeholder. Run client lint, typecheck, and build before submitting. Manually verify affected authentication, job filtering, recruiter job management, or application flows with both services running. When adding tests, use `*.test.ts`, `*.test.tsx`, or `*.test.js` and document the runner.

## Commit & Pull Request Guidelines

History uses short, lowercase action summaries, such as `load my applications` and `added application post api`. Keep commits focused within the appropriate Git repository. PRs should explain behavior changes, link relevant issues, list validation, and include screenshots for UI changes.

## Security & Agent Guidance

Keep credentials in untracked `.env` files. Configure client `BETTER_AUTH_DB_URI`, `BETTER_AUTH_URL`, Google OAuth credentials, and optional `NEXT_PUBLIC_API_BASE_URL`; configure server `MONGO_DB_URI` and optional `PORT`. Only public values belong in `NEXT_PUBLIC_*` variables.

Follow `client/AGENTS.md` and read relevant bundled Next.js documentation before changing client code.
