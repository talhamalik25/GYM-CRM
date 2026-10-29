import { SITE } from "../../../lib/marketing/site.js";
import { PLANS } from "../../../lib/marketing/plans.js";
import { PageHero } from "../../../components/marketing/marketing-page-sections.js";
import MarketingPayment from "../../../components/marketing/marketing-payment.js";
import styles from "../../../components/marketing/marketing-pages.module.css";

export const metadata = {
  title: "Plan & bank transfer | Fitivo",
  description: "Choose a Fitivo plan, review pricing and bank details, and learn how manual payment verification works.",
  alternates: { canonical: SITE.url + "/payment" },
};

export default async function Page({ searchParams }) {
  const query = await searchParams;
  const plan = PLANS.find(item => item.id === query.plan)?.id || PLANS[0].id;
  const cycle = query.cycle === "annual" ? "annual" : "monthly";
  const invalidSelection = (query.plan !== undefined && !PLANS.some(item => item.id === query.plan)) || (query.cycle !== undefined && !["monthly", "annual"].includes(query.cycle));

  return <div className={styles.pages}>
    <PageHero eyebrow="Your subscription / Bank transfer" title="A clear path to" accent="verified access." description="Choose your plan, confirm the quote, then pay by bank transfer. Your payment is reviewed before access is activated." />
    <MarketingPayment key={`${plan}-${cycle}-${invalidSelection}`} initialPlan={plan} initialCycle={cycle} invalidSelection={invalidSelection} />
  </div>;
}
