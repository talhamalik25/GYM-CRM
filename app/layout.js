import "./globals.css";
import { Inter } from "next/font/google";
import { SITE } from "../config/site.js";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: "Fitivo | Gym Management",
  description: "Fitivo — manage members, plans, payments and attendance in one place.",
  openGraph: { title: "Fitivo | Gym Management", description: "Fitivo — manage members, plans, payments and attendance in one place.", images: [{ url: "/logo.png", width: 866, height: 288, alt: "Fitivo" }] },
  twitter: { card: "summary_large_image", title: "Fitivo | Gym Management", description: "Fitivo — manage members, plans, payments and attendance in one place.", images: ["/logo.png"] },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth motion-reduce:scroll-auto`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
