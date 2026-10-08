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
  todaysAttendance: [
    { id: "check-001", memberName: "Emma Wilson", checkInTime: "08:15 AM" },
    { id: "check-002", memberName: "Sophie Chen", checkInTime: "09:02 AM" },
    { id: "check-003", memberName: "Marcus Johnson", checkInTime: "10:27 AM" },
  ],
};
