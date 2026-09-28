# Target architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ React renderer / editor                                    │
│ UI state only: route, focus, selection, panels, drag state │
└──────────────────────────────┬──────────────────────────────┘
                               │ typed RPC + subscriptions
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Graph Client                                                │
│ command/query facade · immutable snapshots · revision cache │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Authoritative Graph Worker                                  │
│ command dispatcher · outliner · parser/ref derivation       │
│ properties/classes · tasks/journals · Datalog · render delta│
└───────────────┬──────────────────────┬──────────────────────┘
                │ commit               │ post-commit consumers
                ▼                      ├──────── search
┌──────────────────────────────┐       ├──────── sync queue
│ SQLite authoritative graph  │       ├──────── checksum
│ entities/attrs/datoms/txs   │       └──────── mirror/export
└──────────────────────────────┘
```

## Runtime profiles

### Implemented local-hosted editor

```text
Browser React -> GraphClient -> same-origin /local/editor transport
              -> serialized Node worker -> outliner -> filesystem SQLite
```

`scripts/editor-host.ts` adapts Vite dev/preview to the public desktop-runtime host. That host authenticates loopback requests, owns an exclusive graph lock and forwards validated commands to the sole SQLite worker. Compatible clients reuse its authenticated endpoint; legacy live PID locks fail safely. The HTTP adapter does not open SQLite or manufacture datoms. The worker validates semantic requests, rejects stale revisions and passes the request operation UUID into the graph transaction. Replies carry full snapshots; read-only polling discovers commits from other tabs. There is no parallel subscription publication for the same edit.

Textarea drafts, caret, selection and collapse are non-authoritative renderer state. Pending drafts survive failed requests within the live tab; retry is explicit. This first local profile uses full snapshots and host-session undo history, not persistent history or incremental subscribed resources. The browser-only and other target profiles below remain distinct deliverables.

### Browser

```text
React -> GraphClient -> WebWorker -> SQLite WASM/OPFS
```

### Desktop

```text
Electron renderer -> GraphClient -> graph-bound localhost daemon
                  -> Node graph worker -> filesystem SQLite
```

The implemented Electron client uses a stable secure `tessera://app` origin for packaged resources and renderer-local persistence. Main proxies only the fixed semantic editor route to the authenticated loopback host; the renderer never receives its credential, a filesystem API or generic IPC. Sandboxed/context-isolated windows deny external navigation, popups, permissions and remote resource requests. A narrow validated preload handshake protects drafts during close. Main owns windows/dialogs/lifecycle, not graph state. Builds bundle the worker separately and use Electron's bundled Node SQLite. See `docs/DESKTOP.md` for launch, data and distribution details. This local editor host is not full implementation of every public CLI/daemon route in the target specification.

### CLI

```text
CLI -> same graph-bound daemon -> same worker core
```

### Remote collaboration

```text
Graph worker -> sync client -> HTTP/WebSocket
             -> graph-scoped ordered sync authority
```

## Mutating flow

```text
UI / plugin / CLI / sync semantic request
              │
              ▼
        CommandEnvelope
              │
              ▼
        runtime validation
              │
              ▼
       domain validation
              │
              ▼
     derive graph mutation
              │
              ▼
        SQLite transaction
              │
              ▼
           commit
              │
       ┌──────┴─────────┐
       ▼                ▼
 render delta       post-commit
 subscriptions      search/sync/etc.
```

## Core invariants

1. One mutable graph authority per runtime graph.
2. UUID is public identity.
3. One semantic command produces one logical operation id.
4. Every successful graph commit advances revision.
5. Parent/order define outliner structure.
6. A subtree cannot contain structural cycles.
7. Properties are typed schema entities.
8. Class inheritance is a DAG.
9. Datalog/simple-query behavior is part of compatibility.
10. Renderer applies only monotonic revision-aware immutable deltas.
11. Markdown/Org are compatibility formats, not the DB-first authority.
12. Ordered sync rejects stale writes and requires pull/rebase.
