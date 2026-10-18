import "./globals.css";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"], display: "swap", variable: "--font-app" });

export const metadata = {
  title: "Fitivo",
  description: "Fitivo gym management.",
};

export default function RootLayout({ children }) {
  return <html lang="en" className={geist.variable} suppressHydrationWarning><body>{children}</body></html>;
}
