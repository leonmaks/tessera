import type { PropertyType, PropertyValue, UUID } from "@logseq-ts/domain";

export interface PropertyDefinition {
  readonly uuid: UUID;
  readonly name: string;
  readonly type: PropertyType;
  readonly cardinality: "one" | "many";
  readonly allowedTags?: readonly UUID[];
  readonly hidden?: boolean;
}

export interface PropertyService {
  create(definition: Omit<PropertyDefinition, "uuid">): Promise<PropertyDefinition>;
  set(entity: UUID, property: UUID, value: PropertyValue | readonly PropertyValue[]): Promise<void>;
  remove(entity: UUID, property: UUID): Promise<void>;
  effectiveDefinitions(entity: UUID): Promise<readonly PropertyDefinition[]>;
}
