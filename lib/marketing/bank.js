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
  // TODO: Screenshot storage/submission requires a separate backend workflow.
  screenshotUploadAvailable: false,
};
