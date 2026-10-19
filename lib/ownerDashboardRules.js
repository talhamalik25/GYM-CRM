export function serializeOwnerDashboard(gym, counts) {
  return {
    gym: {
      name: gym.name,
      slug: gym.slug,
      status: gym.status,
      timezone: gym.timezone,
    },
    counts: {
      members: counts.members,
      plans: counts.plans,
      trainers: counts.trainers,
    },
  };
}

export function getOwnerSetupSteps(counts) {
  return [
    { key: "plans", label: "Create a membership plan", href: "/memberships/plans/new", complete: counts.plans > 0 },
    { key: "trainers", label: "Add a trainer", href: "/trainers/new", complete: counts.trainers > 0 },
    { key: "members", label: "Add your first member", href: "/members/new", complete: counts.members > 0 },
  ];
}
