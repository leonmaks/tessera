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

### Browser

```text
React -> GraphClient -> WebWorker -> SQLite WASM/OPFS
```

### Desktop

```text
Electron renderer -> GraphClient -> graph-bound localhost daemon
                  -> Node graph worker -> filesystem SQLite
```

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
