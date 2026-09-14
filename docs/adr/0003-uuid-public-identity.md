# ADR-0003 — UUID is public identity

Status: Accepted

Every durable user-addressable graph node has a UUID. Integer entity ids may be used internally for joins but never cross public/plugin/sync contracts as the sole identity.
