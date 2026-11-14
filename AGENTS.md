<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Architecture (ASTRA CARE)

- Data access goes only through `src/services/api.ts` (`ApiClient` interfaces in `src/services/types.ts`); swap the mock there for a real backend. Why: one integration point for backend, sensors and the AI model.
- Every service method takes the session token and resolves the astronaut from it; never accept an astronaut ID from the UI. Why: mirrors required server-side access control and keeps profiles isolated.
- React Query keys always include `astronautId` (see `src/services/queries.ts`); sign-out cancels and clears the cache. Why: caches must never mix astronauts.
- Demo auth lives in `src/features/auth/` and is browser-only, so `/login`, `/` and the `_authenticated` layout are `ssr: false`. Why: sessionStorage is unavailable during SSR.
- Mock data is generated lazily and deterministically from seeds against a fixed simulated clock (`src/data/mock/`); never generate at module scope or with `Math.random`. Why: stable demos and Worker-safe module init.
- The 3D body is swapped via `src/features/body3d/active-model.ts`; any replacement must implement `BodyModelProps`. Why: replace the model without touching pages.
- Recharts axes/grid must be direct children or arrays, never wrapped in a fragment. Why: Recharts ignores fragment children.
