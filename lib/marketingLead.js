export function validateMarketingLead(value) {
  const errors = {};
  const name = typeof value?.name === "string" ? value.name.trim() : "";
  const gymName = typeof value?.gymName === "string" ? value.gymName.trim() : "";
  const rawPhone = typeof value?.phone === "string" ? value.phone.trim() : "";
  let phone = rawPhone.replace(/[\s()-]/g, "");
  if (/^03\d{9}$/.test(phone)) phone = `+92${phone.slice(1)}`;
  if (name.length < 2 || name.length > 80 || /[\x00-\x1f<>]/.test(name)) errors.name = "Enter your name (2–80 characters).";
  if (gymName.length < 2 || gymName.length > 120 || /[\x00-\x1f<>]/.test(gymName)) errors.gymName = "Enter your gym name (2–120 characters).";
  if (rawPhone.length > 30 || !/^\+[1-9]\d{7,14}$/.test(phone)) errors.phone = "Use a Pakistani mobile number or an international number with + and country code.";
  if (value?.consent !== true) errors.consent = "Please agree to be contacted.";
  if (!["pricing", "demo", "trial"].includes(value?.topic)) errors.topic = "Choose pricing, demo or trial.";
  return { errors, data: { name, gymName, phone, topic: value?.topic } };
}
