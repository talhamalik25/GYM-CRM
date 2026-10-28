import Link from "next/link";

import { SITE, MARKETING_PAGES } from "../../../lib/marketing/site.js";
import { PageHero, PageSection, PageActions, NumberedSteps, IncludedGuidance, PageClosing } from "../../../components/marketing/marketing-page-sections.js";
import styles from "../../../components/marketing/marketing-pages.module.css";
import MarketingProductShowcase from "../../../components/marketing/marketing-product-showcase.js";
import MarketingDemoRoles from "../../../components/marketing/marketing-demo-roles.js";
export const metadata = { title: "Product demo | Fitivo", description: MARKETING_PAGES["demo"].description, alternates: { canonical: SITE.url + "/demo" } };

export default function Page() {
  return <div className={styles.pages}><PageHero eyebrow="Inside Fitivo / Workspace tour" title="See your gym from" accent="every responsibility." description={MARKETING_PAGES.demo.description}><PageActions primary="#team-workspaces" primaryLabel="Explore the workspaces" secondary="/contact" secondaryLabel="Request a walkthrough" /></PageHero>
    <PageSection id="product-areas" eyebrow="Connected operations" title="Four parts of the gym day."><MarketingProductShowcase showDetailsLink={false} /></PageSection>
    <PageSection id="team-workspaces" eyebrow="Choose a workspace" title="Different roles. The same gym records." description="These descriptions explain available responsibilities. Access depends on your account and the gym’s subscription." tinted><MarketingDemoRoles /></PageSection>
    <PageSection eyebrow="Getting started" title="From setup to your daily routine."><NumberedSteps /><PageActions primary="/contact" primaryLabel="Request a guided walkthrough" secondary="/pricing" secondaryLabel="Compare plan outlines" /></PageSection>
    <IncludedGuidance /><PageClosing /></div>;
}
