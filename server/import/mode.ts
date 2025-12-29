export type ImportMode = "merge" | "sync";

export const getMergeQuantity = (
  existingQuantity: number | null | undefined,
  incomingQuantity: number | undefined
) => (existingQuantity ?? 0) + (incomingQuantity || 1);

export const getCreateQuantity = (incomingQuantity: number | undefined) =>
  incomingQuantity || 1;

export const getSyncQuantityUpdate = (
  hasIncomingQuantity: boolean,
  incomingQuantity: number | undefined
) => (hasIncomingQuantity ? incomingQuantity : undefined);
