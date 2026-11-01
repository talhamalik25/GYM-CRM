import MarketingHome from "../../components/marketing/marketing-home.js";
import { SITE } from "../../config/site.js";

export const metadata = {
  metadataBase: new URL(SITE.url),
  alternates: { canonical: "/" },
  title: "Fitivo | Your whole gym. Working as one.",
  description: "Keep gym members, memberships, attendance, fees and your team connected. A gym management workspace by AKTech Digital Solutions.",
  openGraph: {
    title: "Fitivo | Your whole gym. Working as one.",
    description: SITE.description,
    type: "website",
    images: [{ url: "/logo.png", width: 866, height: 288, alt: "Fitivo" }],
  },
  twitter: { card: "summary_large_image", title: "Fitivo | Your whole gym. Working as one.", description: SITE.description, images: ["/logo.png"] },
};

export default function HomePage() {
  return <MarketingHome />;
}
