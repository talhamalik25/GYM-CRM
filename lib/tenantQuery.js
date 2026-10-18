export function scopedTenantFilter(gymId, filter = {}) {
  if (!gymId) throw new Error("A trusted gym context is required for this operation.");
  return { $and: [{ gymId }, filter] };
}
