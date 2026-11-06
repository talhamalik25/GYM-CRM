// Shared fixed-window abuse budgets. No trust in client-supplied IP headers.
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const PUBLIC_RATE_LIMITS = Object.freeze({
  login: { identity: 20, global: 1000 },
  register: { identity: 5, global: 100 },
  invitation: { identity: 10, global: 200 },
  marketingLead: { identity: 5, global: 100 },
});
export const MAX_MONEY_RUPEES = 100_000_000;
