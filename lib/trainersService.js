function mapTrainer(item) {
  return { id: String(item._id), fullName: item.fullName, email: item.email, phone: item.phone, specialization: item.specialization, joiningDate: item.joiningDate, status: item.status, profileImage: item.profileImage || "", notes: item.notes || "", assignedMemberCount: item.assignedMemberCount || 0, assignedMembers: item.assignedMembers || [], createdAt: item.createdAt, updatedAt: item.updatedAt };
}

async function request(path, options) {
  const response = await fetch(path, { cache: "no-store", ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  let result;
  try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response. Please try again."); }
  if (!response.ok || !result.success) { const error = new Error(result.error?.message || "Could not access trainers."); error.status = response.status; error.fields = result.error?.fields || {}; throw error; }
  return result.data;
}

export async function listTrainers({ search = "", status = "all", specialization = "", page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ search, status, page: String(page), limit: String(limit) }); if (specialization) params.set("specialization", specialization);
  const result = await request(`/api/trainers?${params}`); return { ...result, items: result.items.map(mapTrainer) };
}
export async function getTrainer(id) { return mapTrainer(await request(`/api/trainers/${encodeURIComponent(id)}`)); }
export async function saveTrainer(values, id = null) { return mapTrainer(await request(id ? `/api/trainers/${encodeURIComponent(id)}` : "/api/trainers", { method: id ? "PATCH" : "POST", body: JSON.stringify(values) })); }
