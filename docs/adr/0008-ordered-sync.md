# ADR-0008 — Ordered sync with stale rejection/rebase

Status: Accepted

Remote graph writes preserve authoritative ordering. A client batch declares the server position it is based on; stale batches are rejected and clients pull/rebase before retrying.
