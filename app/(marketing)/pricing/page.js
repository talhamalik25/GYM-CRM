import MarketingPageIntro from "../../../components/marketing/marketing-page-intro.js";
import { MARKETING_PAGES } from "../../../lib/marketing/site.js";

export const metadata = { title: "Pricing | Fitivo", description: MARKETING_PAGES["pricing"].description };

export default function Page() {
  return <MarketingPageIntro page="pricing" />;
}
