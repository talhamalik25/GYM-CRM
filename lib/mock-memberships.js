export const membershipPlans = [
  { id: 'plan-basic', name: 'Basic', description: 'A simple membership for everyday gym access.', price: 3000, duration: 1, durationUnit: 'month', features: ['Full gym floor access', 'Locker room access', 'One fitness assessment'], status: 'Active', maxMembers: 250, createdAt: '2025-01-14' },
  { id: 'plan-standard', name: 'Standard', description: 'More flexibility for members building a consistent routine.', price: 5000, duration: 1, durationUnit: 'month', features: ['Full gym floor access', 'Locker room access', 'Group classes', 'Monthly fitness assessment'], status: 'Active', maxMembers: 400, createdAt: '2025-02-02' },
  { id: 'plan-premium', name: 'Premium', description: 'The complete club experience with coaching and recovery perks.', price: 9000, duration: 1, durationUnit: 'month', features: ['All Standard features', 'Unlimited group classes', 'Monthly personal training session', 'Guest passes', 'Priority class booking'], status: 'Active', maxMembers: null, createdAt: '2025-03-18' },
  { id: 'plan-personal-training', name: 'Personal Training', description: 'Dedicated one-to-one coaching for focused progress.', price: 18000, duration: 1, durationUnit: 'month', features: ['Eight personal training sessions', 'Custom workout plan', 'Weekly progress check-in', 'Full gym floor access'], status: 'Inactive', maxMembers: 60, createdAt: '2025-06-09' },
];

const membershipSeeds = [
  { id: 'membership-001', memberId: 'm-001', planId: 'plan-premium', startDate: '2025-01-12', expiryDate: '2026-10-12', amount: 9000, paidAmount: 9000, paymentStatus: 'Paid', status: 'Expiring Soon', previousPlans: [{ planName: 'Standard', startDate: '2024-01-12', expiryDate: '2025-01-11', amount: 5000 }] },
  { id: 'membership-002', memberId: 'm-002', planId: 'plan-standard', startDate: '2025-03-08', expiryDate: '2027-03-08', amount: 5000, paidAmount: 5000, paymentStatus: 'Paid', status: 'Active', previousPlans: [] },
  { id: 'membership-003', memberId: 'm-003', planId: 'plan-basic', startDate: '2025-06-21', expiryDate: '2026-10-08', amount: 3000, paidAmount: 1500, paymentStatus: 'Partially Paid', status: 'Expiring Soon', previousPlans: [] },
  { id: 'membership-004', memberId: 'm-004', planId: 'plan-premium', startDate: '2024-10-02', expiryDate: '2026-10-08', amount: 9000, paidAmount: 9000, paymentStatus: 'Paid', status: 'Expiring Soon', previousPlans: [{ planName: 'Basic', startDate: '2023-10-02', expiryDate: '2024-10-01', amount: 3000 }] },
  { id: 'membership-005', memberId: 'm-005', planId: 'plan-standard', startDate: '2025-02-14', expiryDate: '2026-09-30', amount: 5000, paidAmount: 0, paymentStatus: 'Overdue', status: 'Expired', previousPlans: [] },
  { id: 'membership-006', memberId: 'm-006', planId: 'plan-basic', startDate: '2025-08-19', expiryDate: '2027-02-19', amount: 3000, paidAmount: 3000, paymentStatus: 'Paid', status: 'Active', previousPlans: [] },
  { id: 'membership-007', memberId: 'm-007', planId: 'plan-premium', startDate: '2025-09-04', expiryDate: '2027-09-04', amount: 9000, paidAmount: 9000, paymentStatus: 'Paid', status: 'Active', previousPlans: [] },
  { id: 'membership-008', memberId: 'm-008', planId: 'plan-personal-training', startDate: '2026-10-05', expiryDate: '2026-11-05', amount: 18000, paidAmount: 18000, paymentStatus: 'Paid', status: 'Active', previousPlans: [] },
  { id: 'membership-009', memberId: 'm-009', planId: 'plan-standard', startDate: '2026-10-04', expiryDate: '2027-04-04', amount: 5000, paidAmount: 2500, paymentStatus: 'Partially Paid', status: 'Active', previousPlans: [] },
  { id: 'membership-010', memberId: 'm-010', planId: 'plan-basic', startDate: '2026-10-02', expiryDate: '2026-12-02', amount: 3000, paidAmount: 0, paymentStatus: 'Pending', status: 'Active', previousPlans: [] },
  { id: 'membership-011', memberId: 'm-011', planId: 'plan-premium', startDate: '2026-09-30', expiryDate: '2027-09-30', amount: 9000, paidAmount: 9000, paymentStatus: 'Paid', status: 'Active', previousPlans: [] },
  { id: 'membership-012', memberId: 'm-012', planId: 'plan-standard', startDate: '2025-11-13', expiryDate: '2026-10-06', amount: 5000, paidAmount: 5000, paymentStatus: 'Paid', status: 'Suspended', previousPlans: [{ planName: 'Basic', startDate: '2024-11-13', expiryDate: '2025-11-12', amount: 3000 }] },
];

export const memberMemberships = membershipSeeds;
export const getMembershipById = (id) => memberMemberships.find((membership) => membership.id === id);
export const getMembershipPlanById = (id) => membershipPlans.find((plan) => plan.id === id);
