# Contributing

## Guidelines

- Keep changes focused and production-oriented.
- Preserve the GitHub-style dark UI language unless a product decision says otherwise.
- Keep geospatial coordinate handling in `{ lat, lng }` format across client, server, and shared contracts.
- Update documentation whenever routes, APIs, packaging, or deployment behavior changes.

## Code Style

- Shared contracts belong in `shared/src`.
- Server-side intelligence, routing, and enrichment logic belong in `server/src/services`.
- UI primitives belong in `client/src/components`.
- Prefer typed interfaces and predictable JSON responses.
- Keep animations subtle and operational, not decorative or noisy.

## Pull Request Workflow

1. Create a focused branch.
2. Run local checks and smoke-test the main scan flow.
3. Update `API.md`, `README.md`, or `CHANGELOG.md` when behavior changes.
4. Include screenshots for visible UI work when possible.
5. Open a PR with a concise summary, testing notes, and any deployment implications.
