import { knowledge } from "./knowledge.js";

export function normalizeQuestion(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
export function matchQuestion(question) {
  const text = ` ${normalizeQuestion(question)} `;
  // Account-specific and unverified capabilities must go to the team.
  if (/\b(weather|workout|diet|password|refund|guarantee|biometric|api|integration|integrations|discount|unlimited|my account|mera account|credit card|jazzcash|easypaisa)\b/.test(text)) return "fallback";
  let best = "fallback";
  let score = 0;
  for (const [id, item] of Object.entries(knowledge)) {
    for (const phrase of item.keywords || []) {
      if (text.includes(` ${phrase} `) && phrase.length > score) { best = id; score = phrase.length; }
    }
  }
  return best;
}
