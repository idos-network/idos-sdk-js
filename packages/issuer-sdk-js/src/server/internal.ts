export function ensureEntityId<T extends { id?: string }>(
  entity: T,
): Omit<T, "id"> & { id: string } {
  return {
    ...entity,
    id: entity.id ?? crypto.randomUUID(),
  };
}
