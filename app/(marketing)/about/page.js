import MarketingPageIntro from "../../../components/marketing/marketing-page-intro.js";
import { MARKETING_PAGES } from "../../../lib/marketing/site.js";

export const metadata = { title: "About | Fitivo", description: MARKETING_PAGES["about"].description };

export default function Page() {
  return <MarketingPageIntro page="about" />;
}
