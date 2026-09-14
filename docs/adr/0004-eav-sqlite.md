# ADR-0004 — SQLite persistence with EAV-compatible logical model

Status: Accepted

SQLite is authoritative persistence. The logical model must support entity/attribute/value transaction semantics and Datalog-compatible queries even if optimized physical tables/indexes are added.
