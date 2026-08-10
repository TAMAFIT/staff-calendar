export function historySemanticKey(entry) {
  return [
    entry?.action || "",
    entry?.customerName || "",
    entry?.startAt || "",
    entry?.endAt || "",
    entry?.beforeSummary || ""
  ].join("|");
}

export function historyEntryKey(entry) {
  if (entry?.mutationId) return `mutation:${entry.mutationId}`;
  if (entry?.historyId) return `history:${entry.historyId}`;
  return `semantic:${historySemanticKey(entry)}`;
}
