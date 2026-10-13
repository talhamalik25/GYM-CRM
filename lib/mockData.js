/**
 * Temporary development data for the dashboard.
 * Replace this import at the dashboard page with API data when the backend is ready.
 */
export const dashboardMockData = {
  stats: [
    { key: "activeMembers", label: "Active Members", value: 216, supportingText: "Members with an active plan" },
    { key: "expiringMemberships", label: "Expiring in 7 Days", value: 8, supportingText: "Members to follow up with" },
    { key: "collectedMonth", label: "Collected This Month", value: 650000, format: "currency", supportingText: "Recorded payments this month" },
    { key: "todayCheckIns", label: "Today's Check-ins", value: 42, supportingText: "Member visits recorded today" },
  ],
  expiringMemberships: [
    { memberId: "m-004", memberName: "Emma Wilson", plan: "Unlimited", expiryDate: "2026-10-08", daysLeft: 0 },
    { memberId: "m-003", memberName: "Priya Patel", plan: "Off-peak", expiryDate: "2026-10-10", daysLeft: 2 },
    { memberId: "m-001", memberName: "Sophie Chen", plan: "Unlimited", expiryDate: "2026-10-14", daysLeft: 6 },
  ],
  recentPayments: [
    { id: "pay-001", memberName: "Sophie Chen", amount: 5000, date: "2026-10-08", status: "Paid" },
    { id: "pay-002", memberName: "Marcus Johnson", amount: 7500, date: "2026-10-08", status: "Paid" },
    { id: "pay-003", memberName: "Priya Patel", amount: 5000, date: "2026-10-07", status: "Pending" },
  ],
};

/** Temporary development records for the Plans area. Durations are stored in days. */
export const mockPlans = [
  { id: "plan-basic", name: "Basic", price: 5000, durationDays: 30, description: "A simple membership for regular gym access.", status: "Active" },
  { id: "plan-standard", name: "Standard", price: 13500, durationDays: 90, description: "Three months of consistent training.", status: "Active" },
  { id: "plan-premium", name: "Premium", price: 48000, durationDays: 365, description: "A full year of uninterrupted gym access.", status: "Active" },
  { id: "plan-personal-training", name: "Personal Training", price: 8000, durationDays: 30, description: "One month of focused personal training.", status: "Active" },
];

// Kept as an alias for existing consumers while they migrate to plansService.
export const memberPlans = mockPlans;

export const mockMembers = [
  { id: "m-001", name: "Sophie Chen", phone: "+1 (555) 014-2789", email: "sophie.chen@email.com", gender: "Female", dateOfBirth: "1994-03-18", planId: "plan-premium", startDate: "2025-10-14", notes: "" },
  { id: "m-002", name: "Marcus Johnson", phone: "+1 (555) 019-4420", email: "marcus.j@email.com", gender: "Male", dateOfBirth: "1988-11-04", planId: "plan-standard", startDate: "2026-08-08", notes: "" },
  { id: "m-003", name: "Priya Patel", phone: "+1 (555) 012-9631", email: "priya.p@email.com", gender: "Female", dateOfBirth: "1997-06-22", planId: "plan-basic", startDate: "2026-10-02", notes: "" },
  { id: "m-004", name: "Emma Wilson", phone: "+1 (555) 016-3852", email: "emma.w@email.com", gender: "Female", dateOfBirth: "1992-02-14", planId: "plan-premium", startDate: "2025-10-08", notes: "" },
  { id: "m-005", name: "Daniel Lee", phone: "+1 (555) 011-7096", email: "daniel.lee@email.com", gender: "Male", dateOfBirth: "1985-09-09", planId: "plan-standard", startDate: "2025-06-30", notes: "" },
  { id: "m-006", name: "Olivia Reed", phone: "+1 (555) 018-1604", email: "olivia.r@email.com", gender: "Female", dateOfBirth: "1999-12-02", planId: "plan-personal-training", startDate: "2026-10-01", notes: "" },
  { id: "m-007", name: "Noah Brooks", phone: "+1 (555) 017-2209", email: "noah.b@email.com", gender: "Male", dateOfBirth: "1995-04-26", planId: "plan-basic", startDate: "2026-08-14", notes: "" },
];

/** Temporary development records for the Payments area. Amounts are PKR. */
export const mockPayments = [
  { id: "pay-0001", receiptNumber: "FIT-0001", memberId: "m-001", planId: "plan-premium", amountDue: 48000, amountPaid: 48000, method: "Bank Transfer", date: "2026-10-08", notes: "" },
  { id: "pay-0002", receiptNumber: "FIT-0002", memberId: "m-002", planId: "plan-standard", amountDue: 13500, amountPaid: 7000, method: "Cash", date: "2026-10-08", notes: "" },
  { id: "pay-0003", receiptNumber: "FIT-0003", memberId: "m-003", planId: "plan-basic", amountDue: 5000, amountPaid: 0, method: "JazzCash", date: "2026-10-07", notes: "" },
  { id: "pay-0004", receiptNumber: "FIT-0004", memberId: "m-004", planId: "plan-premium", amountDue: 48000, amountPaid: 48000, method: "Easypaisa", date: "2026-10-06", notes: "" },
  { id: "pay-0005", receiptNumber: "FIT-0005", memberId: "m-006", planId: "plan-personal-training", amountDue: 8000, amountPaid: 8000, method: "Cash", date: "2026-09-28", notes: "" },
];

