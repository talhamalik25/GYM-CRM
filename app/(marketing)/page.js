import MarketingHome from "../../components/marketing/marketing-home.js";
import { SITE } from "../../lib/marketing/site.js";

export const metadata = {
  metadataBase: new URL(SITE.url),
  alternates: { canonical: "/" },
  title: "Fitivo | Your whole gym. Working as one.",
  description: "Keep gym members, memberships, attendance, fees and your team connected. A gym management workspace by AKTech Digital Solutions.",
  openGraph: {
    title: "Fitivo | Your whole gym. Working as one.",
    description: SITE.description,
    type: "website",
    images: [{ url: "/fitivo-social.svg", width: 1200, height: 630, alt: "Fitivo gym management platform" }],
  },
  twitter: { card: "summary_large_image", title: "Fitivo | Your whole gym. Working as one.", description: SITE.description, images: ["/fitivo-social.svg"] },
};

export default function HomePage() {
  return <MarketingHome />;
}
