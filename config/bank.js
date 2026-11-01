// Single source for public bank details. Literal placeholders, not payment
// instructions. Do not accept transfers while configured is false.
export const BANK = {
  configured: false,
  BANK_NAME: "BANK_NAME",
  ACCOUNT_TITLE: "ACCOUNT_TITLE",
  ACCOUNT_NUMBER: "ACCOUNT_NUMBER",
  IBAN: "IBAN",
  reviewWindowHours: 24,
  activationNote: "Access activates after verification, not on submission.",
  // Existing billing supports reference claims and manual approval only.
  // Screenshot storage/submission requires a separate backend workflow.
  screenshotUploadAvailable: false,
};

export const BANK_FIELDS = [["BANK_NAME", "Bank name"], ["ACCOUNT_TITLE", "Account title"], ["ACCOUNT_NUMBER", "Account number"], ["IBAN", "IBAN"]];

// Local preview only; this does not authorize or validate a server upload.
export const PAYMENT_SCREENSHOT_PREVIEW = {
  maxBytes: 5 * 1024 * 1024,
  mimeTypes: ["image/png", "image/jpeg", "image/webp"],
};
