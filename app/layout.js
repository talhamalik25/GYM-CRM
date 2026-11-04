import "./globals.css";
import { SITE } from "../config/site.js";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: "Fitivo | Gym Management",
  description: "Fitivo — manage members, plans, payments and attendance in one place.",
  openGraph: { title: "Fitivo | Gym Management", description: "Fitivo — manage members, plans, payments and attendance in one place.", images: [{ url: "/logo.png", width: 866, height: 288, alt: "Fitivo" }] },
  twitter: { card: "summary_large_image", title: "Fitivo | Gym Management", description: "Fitivo — manage members, plans, payments and attendance in one place.", images: ["/logo.png"] },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth motion-reduce:scroll-auto" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
