import "./globals.css";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"], display: "swap", variable: "--font-app" });

export const metadata = {
  title: "AKTech Gym CRM",
  description: "Gym management by AKTech Digital Solutions.",
};

export default function RootLayout({ children }) {
  return <html lang="en" className={geist.variable}><body>{children}</body></html>;
}
