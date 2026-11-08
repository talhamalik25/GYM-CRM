"use client";

import MarketingHero from "./marketing-hero.js";
import MarketingProductShowcase from "./marketing-product-showcase.js";
import {
  AttendanceStory,
  CapabilityStrip,
  ConnectedWorkflow,
  MemberStory,
  MembershipPayments,
  OwnerVisibility,
} from "./marketing-home-sections.js";
import {
  GettingStarted,
  HomepageClosing,
  HomepageFaq,
  PricingPreview,
  TeamAndLocations,
} from "./marketing-home-conversion.js";

export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      <MarketingHero />
      <CapabilityStrip />
      <MarketingProductShowcase showDetailsLink={true} />
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
    </div>
  );
}
