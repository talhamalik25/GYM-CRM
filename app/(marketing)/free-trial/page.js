import MarketingPageIntro from "../../../components/marketing/marketing-page-intro.js";
import { MARKETING_PAGES } from "../../../lib/marketing/site.js";

export const metadata = { title: "Request a 14-day trial | Fitivo", description: MARKETING_PAGES["free-trial"].description };

export default function Page() {
  return <MarketingPageIntro page="free-trial" />;
}
