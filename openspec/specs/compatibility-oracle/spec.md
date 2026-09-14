# Compatibility Oracle Specification

## Purpose

Define differential verification against a pinned Logseq baseline.

## Requirements

### Requirement: Baseline is pinned
Parity results SHALL name the exact upstream commit SHA.

#### Scenario: Unpinned baseline
- **WHEN** a parity run starts with no baseline SHA
- **THEN** it SHALL fail or explicitly skip as `UNPINNED`
- **AND** SHALL NOT claim compatibility

### Requirement: Providers execute the same scenario
A parity fixture SHALL be executable against both the upstream reference provider and the TypeScript candidate provider.

### Requirement: Comparison uses canonical state
Comparison SHALL normalize internal entity ids, transaction ids and permitted nondeterministic metadata while preserving UUIDs, content, hierarchy, properties, references and relevant ordering.

### Requirement: Deviations are explicit
Any intentional incompatibility SHALL be recorded as a named deviation with scope and rationale. The normalizer SHALL NOT silently hide semantic differences.

### Requirement: Every parity bug becomes a fixture
Once a discrepancy is fixed, the reproducer SHALL remain in the parity corpus.
