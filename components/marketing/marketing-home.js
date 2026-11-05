import MarketingHero from "./marketing-hero.js";
import { AttendanceStory, CapabilityStrip, ConnectedWorkflow, MemberStory, MembershipPayments, OwnerVisibility } from "./marketing-home-sections.js";
import { GettingStarted, HomepageClosing, HomepageFaq, PricingPreview, TeamAndLocations } from "./marketing-home-conversion.js";
import styles from "./marketing-home.module.css";

export default function MarketingHome() {
  return <div className={styles.home}>
    <MarketingHero />
    <CapabilityStrip />
    <ConnectedWorkflow />
    <MemberStory />
    <MembershipPayments />
    <AttendanceStory />
    <OwnerVisibility />
    <TeamAndLocations />
    <GettingStarted />
    <PricingPreview />
    <HomepageFaq />
    <HomepageClosing />
  </div>;
}
