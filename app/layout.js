import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Fitivo | Gym Management",
  description: "Fitivo — manage members, plans, payments and attendance in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth motion-reduce:scroll-auto`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
