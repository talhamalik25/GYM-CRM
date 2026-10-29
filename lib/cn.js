// Keep conditional class composition small; never resolve or merge visual values.
export function cn(...values) {
  return values.flat(Infinity).filter(Boolean).join(" ");
}
