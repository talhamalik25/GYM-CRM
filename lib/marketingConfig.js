const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "";
const supportWhatsApp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || "";

function emailChannel(value) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return { href: `mailto:${value}`, label: value };
}

function whatsappChannel(value) {
  if (/^\+?[\d\s()-]{8,20}$/.test(value)) {
    const phone = value.replace(/\D/g, "");
    return phone ? { href: `https://wa.me/${phone}`, label: "WhatsApp" } : null;
  }

  try {
    const url = new URL(value);
    if (url.protocol === "https:" && ["wa.me", "api.whatsapp.com"].includes(url.hostname)) {
      return { href: url.toString(), label: "WhatsApp" };
    }
  } catch {
    return null;
  }
  return null;
}

export const MARKETING_SUPPORT_CHANNEL = Object.freeze(
  emailChannel(supportEmail) || whatsappChannel(supportWhatsApp),
);
