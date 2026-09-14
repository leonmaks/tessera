export abstract class DomainError extends Error {
  abstract readonly code: string;
}

export class EntityNotFoundError extends DomainError {
  readonly code = "ENTITY_NOT_FOUND";
}

export class OutlinerCycleError extends DomainError {
  readonly code = "OUTLINER_CYCLE";
}

export class RevisionConflictError extends DomainError {
  readonly code = "REVISION_CONFLICT";
}

export class InvalidPropertyValueError extends DomainError {
  readonly code = "INVALID_PROPERTY_VALUE";
}

export class GraphLockedError extends DomainError {
  readonly code = "GRAPH_LOCKED";
}
