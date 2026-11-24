/**
 * Preview-only table code: a stable 3-character code derived from the table name.
 * The real code will come from the game server when a table is created.
 */
export function previewCode(tableName: string): string {
  const s = tableName.trim() || "kadi";
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 46656; // 36^3
  return h.toString(36).toUpperCase().padStart(3, "0").slice(-3);
}
