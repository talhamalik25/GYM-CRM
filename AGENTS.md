# AGENTS.md: Rules for AI coding agents working on Fitivo

Read this file, then PRD.md, ARCHITECTURE.md, DESIGN_SYSTEM.md and SECURITY.md before changing anything. If they conflict with the code, tell the owner (Talha) in your summary; do not silently pick one.

## Project in one paragraph
Fitivo is a gym management SaaS for Pakistani gyms (fees, retention, WhatsApp reminders, owner daily summary), built with Next.js App Router in JavaScript, MongoDB/Mongoose, and Tailwind for all new styling. It is a product of AKTech Digital Solutions. Talha is a student developer who must be able to understand and maintain the code.

## How to work
1. Do one task at a time. Understand the existing code first and reuse what exists; do not rebuild from scratch.
2. Before editing, list the files you will touch. Keep changes small and focused.
3. Follow existing naming, folder and API conventions.
4. After each task: run `npm run build` (and lint if configured). Fix errors before moving on.
5. Commit after each completed task with a clear message. Work on a branch, not directly on main, when git is available.
6. Test the real flow you changed (not just that it compiles). Say exactly what you tested and what you could not test.
7. Write code Talha can read: clear names, short functions, comments only where the reason is not obvious. Prefer simple over clever.
8. Final summary per task: what changed, files touched, how it was verified, known gaps. Short.

## NEVER do these
- Never use TypeScript. JavaScript only.
- Never add new libraries, frameworks, UI kits or services without asking (no shadcn, MUI, DaisyUI, Redux, Prisma, etc.). A tiny helper like `clsx` is allowed only if not installed and truly needed.
- Never create new custom CSS files or add hand-written CSS. Use Tailwind utility classes only. Do not use inline `style` except for truly dynamic values.
- Never resume or continue the Tailwind migration of old CSS. It is paused until the product is complete. Do not refactor styling unless asked.
- Never change design, layout, copy or colors that were not part of the task. Match provided references; never swap in your own layout.
- Never change authentication, database models or existing API routes unless the task explicitly says so.
- Never trust the client for `gymId`, role, prices, totals or dues. Always derive from the server session and database.
- Never query tenant data without a `gymId` filter.
- Never hard-delete payments or financial records. Void them and write an audit log entry.
- Never hard-code secrets, bank details, prices or API keys. Use env vars and `config/` files.
- Never invent data: no fake testimonials, user counts, revenue numbers, case studies, awards or customer logos. Use clearly labeled placeholders.
- Never use real member data in demos or seed files.
- Never claim something works without evidence. If you did not run or test it, say so.
- Never leave debug routes, `console.log` of sensitive data, TODO hacks or commented-out code dumps behind.
- Never delete files, branches or data, force-push, or run destructive commands without explicit approval.
- Never add features outside the MVP list in PRD.md. If you think something is missing, suggest it in your summary; do not build it.
- Never reformat or rewrite unrelated files.

## Always do these
- Validate all input on the server and check the role on every protected route.
- Handle loading, empty and error states in every UI.
- Keep UI responsive (375px, 768px, 1280px) and accessible.
- Reuse components from `components/ui`; create a new reusable component instead of copy-pasting class strings.
- Keep the existing exact values when matching an existing design.
- Update `.env.example` (names only) when adding env vars.
- Update the relevant doc (PRD/ARCHITECTURE/DESIGN_SYSTEM/SECURITY) if your change makes it outdated, and mention it.

## Unclear requirements
- Normal mode: ask one short question if the answer changes the result a lot; otherwise choose the safest simplest option and note it.
- **Autonomous mode** (when Talha says he is away): do not ask questions or wait for approval. Pick the safest minimal option, record the assumption in NOTES.md, keep going. If blocked after 2 attempts, skip the item, list it under "Unresolved" and continue. Autonomous mode never permits the NEVER rules above.

## Prompt contract
Tasks should arrive with: objective, existing context, requirements, constraints, acceptance criteria, and what must not change. If a task lacks acceptance criteria, state the ones you are assuming.

## Definition of done
- Build passes; the changed flow was exercised; no console errors in the changed pages
- No cross-tenant leakage; roles enforced
- Responsive and accessible
- Only Tailwind used for styling
- Changes committed; summary written
