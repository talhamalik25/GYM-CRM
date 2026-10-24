// The Gym id also identifies its default branch, including before migration.
export function branchScope(gymId, branchId) {
  if (!gymId) throw new Error("A trusted organization is required.");
  if (branchId === "all") return { gymId };
  if (!branchId || String(branchId) === String(gymId)) return { gymId, $or: [{ branchId: gymId }, { branchId: null }] };
  return { gymId, branchId };
}
export function canSelectBranch({ role, assignedBranchId, gymId, requestedBranchId, multiBranch, consolidated, readOnly }) {
  const assigned = String(assignedBranchId || gymId);
  const selected = String(requestedBranchId || (role === "gym_owner" ? gymId : assigned));
  if (selected === "all") return role === "gym_owner" && multiBranch && consolidated && readOnly;
  if (role !== "gym_owner" && selected !== assigned) return false;
  return selected === String(gymId) || multiBranch;
}
