## Context

The existing React editor consumes `/local/editor` JSON responses through graph-client. `scripts/editor-host.ts` couples server creation to Vite and starts an unbundled TypeScript worker via tsx. Electron is not installed. `packages/desktop-cli-runtime` supplies an injected registry abstraction, not a production cross-process host. Reuse domain behavior; do not assume these scaffolds already satisfy desktop lifecycle requirements.

## Goals / Non-Goals

**Goals:** packaged Windows x64 client, current editor interactions, secure local transport, stable data paths, tested ownership/shutdown and offline launch.

**Non-Goals:** modifying graph semantics, changing local collapse, remote collaboration, new rich-text functionality, signing or auto-update infrastructure. Existing public daemon/CLI specs remain intact; this does not claim completion of all Phase 11 deliverables.

## Decisions

### Runtime and authority

Use Electron main only for lifecycle, window/session policy and native dialogs. Extract a reusable Node local host from the Vite adapter into an exported runtime package. The host serves compiled assets and forwards the existing validated protocol to a separately compiled Node worker. The worker alone opens SQLite. Use Electron's bundled Node runtime, verifying `node:sqlite` with the selected pinned Electron version before committing to packaging.

Dependency path: renderer -> graph-client -> semantic transport -> worker/outliner -> graph-db. Desktop main imports only public runtime entry points; no `apps/* -> graph-db` or private cross-package source imports. Vite becomes an adapter over the same host components. Bundle first-party TS entry points for production; do not depend on workspace symlinks or tsx in the distributable.

Alternative considered: starting `pnpm dev:web` from Electron. Rejected because installed clients would depend on the repository, package manager and development server. Direct renderer SQLite is forbidden by authority constraints.

### Transport and window security

Use an authenticated loopback graph host bound to 127.0.0.1, not a publicly listening server. A per-host cryptographically random credential is held by Electron main and attached only to requests for the exact trusted local endpoint, never remote requests or URLs. Validate Host/Origin, authentication, JSON envelope, revision and size. Validate worker replies and impose request/startup deadlines. Static asset routing resolves beneath the packaged asset directory and denies traversal.

Enable sandbox, context isolation and web security; disable Node integration, webviews, unwanted permissions, popups and untrusted navigation. Set restrictive production CSP. Expose only a minimal validated lifecycle bridge if needed for dirty/save handshake, never arbitrary IPC, filesystem paths or raw Node objects. Check IPC sender frame and exact trusted origin. Official security/testing guidance: https://www.electronjs.org/docs/latest/tutorial/security and https://www.electronjs.org/docs/latest/tutorial/automated-testing.

Use a persistent Electron session and stable asset origin so accepted local collapse state survives desktop restart even if the graph host port changes. A registered secure `tessera://app` asset origin can proxy the exact local graph route through main with authentication; this avoids making localStorage identity depend on an ephemeral port. The graph endpoint remains a loopback host consistent with the target architecture. Renderer cannot choose arbitrary proxy destinations.

### Graph selection and ownership

Default graph: `app.getPath('userData')/graphs/default/graph.sqlite`. `TESSERA_GRAPH_PATH` selects an explicit existing graph for development/tests or user-directed reuse. Show the active graph path in a native About/data-location action or startup diagnostics. Never auto-migrate the repository's web graph.

Use Electron single-instance activation for the same application profile. Runtime ownership is a separate graph lock shared by web and desktop hosts: preserve safe handling of legacy PID-only locks, canonicalize graph paths and do not steal live ownership. Reuse a healthy host when authenticated ownership metadata provides a usable endpoint; a legacy or unverifiable live owner produces a clear locked error, not a second writer. Release only the acquired owner's lock. A missing response alone must not authorize deleting a live owner's lock.

### Mutation and lifecycle sequence

Renderer draft -> flush -> graph-client operation UUID/current revision -> authenticated host validation -> worker serialization -> semantic outliner operation -> one SQLite commit/revision -> one response snapshot -> clear only acknowledged draft. Polling is read-only. Stale and failed saves preserve the draft and require explicit retry; uncertain structural mutations are not blindly retried.

Window close first performs a bounded dirty/save handshake. Saving must finish before owned host teardown; failure leaves the window available, cancellation aborts close, explicit discard is the only normal close path losing drafts. Drain committed/in-flight operations and close SQLite before releasing ownership. A reused host is not terminated by its client. Startup failures clean up partially acquired resources and show actionable errors. Native export handles renderer-generated Markdown download through a user-selected save dialog, without introducing a general file-write bridge.

### Build and test

Add `dev:desktop`, `build:desktop`, `package:desktop` and `test:desktop` scripts. Use a pinned maintained Electron version and a reproducible Windows packager, bundling main, preload if needed, worker and frontend resources. Deliver an unsigned unpacked/zip Windows x64 distribution; no certificates or publishing required. Package output is disposable; user data is never inside it.

Playwright Electron tests run with a separate temporary user profile and graph. Exercise built and packaged startup without Vite, full process restart, native export/cancel, dirty close, worker failure and isolation. Compare the same editor scenarios across web and Electron; classify that as cross-shell regression evidence, not upstream equivalence. Keep upstream provenance and accepted collapse deviation explicit.

## Risks / Trade-offs

- [Electron bundled Node/SQLite support] -> verify the actual selected binary opens SQLite in a worker; do not ship a mocked or memory fallback.
- [Runtime lock refactor affects web] -> focused ownership tests plus the existing web E2E suite before delivery.
- [ASAR/resource paths] -> launch a packaged artifact from a path containing spaces with a different working directory.
- [Unsigned binary warnings] -> document unsigned distribution; do not claim signed installation support.
- [Existing qualification debt] -> do not equate the new client or upstream's own tests with closure of all compatibility gates.

## Migration Plan

No schema changes. Add a separate default desktop graph only on first launch. An explicit existing path uses the existing graph unchanged under exclusive ownership. Rollback removes/reverts application files only; SQLite and local interface state remain in user data. No automatic copying or deletion of notes.
