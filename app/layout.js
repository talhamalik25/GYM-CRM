import "./globals.css";
import { SITE } from "../config/site.js";
import { getLocale, getMessages, getTimeZone } from "next-intl/server";
import LocaleProvider from "../components/i18n/locale-provider.js";
import { getLocaleDirection } from "../config/locales.js";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: "Fitivo | Gym Management",
  description: "Fitivo — manage members, plans, payments and attendance in one place.",
  openGraph: { title: "Fitivo | Gym Management", description: "Fitivo — manage members, plans, payments and attendance in one place.", images: [{ url: "/logo.png", width: 866, height: 288, alt: "Fitivo" }] },
  twitter: { card: "summary_large_image", title: "Fitivo | Gym Management", description: "Fitivo — manage members, plans, payments and attendance in one place.", images: ["/logo.png"] },
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = await getTimeZone();
  return (
    <html lang={locale} dir={getLocaleDirection(locale)} className="scroll-smooth motion-reduce:scroll-auto">
      <body><LocaleProvider locale={locale} messages={messages} timeZone={timeZone}>{children}</LocaleProvider></body>
    </html>
  );
}
