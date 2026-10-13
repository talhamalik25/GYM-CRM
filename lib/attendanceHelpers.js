export function getDurationMinutes(checkInAt, checkOutAt) {
  if (!checkInAt || !checkOutAt) return null;
  return Math.max(0, Math.floor((new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 60000));
}

