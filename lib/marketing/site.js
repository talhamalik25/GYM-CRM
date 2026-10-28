// Public marketing content; this does not change app access or live billing.
export const SITE = {
  name: "Fitivo",
  url: "https://gym-crm-pi.vercel.app",
  company: "AKTech Digital Solutions",
  companyUrl: "https://aktech.tech",
  email: "hello@aktech.tech",
  phone: "+92 371 3410797",
  phoneHref: "tel:+923713410797",
  location: "Karachi, Pakistan",
  region: "PK",
  announcement: "Portal guides & setup guidance included",
  tagline: "Your gym day. Better connected.",
  description: "Members, people and daily operations in one gym management workspace.",
  trial: {
    days: 14,
    approvalRequired: true,
    creditCardRequired: false,
    note: "14-day trial · Approval required",
    microcopy: "14-day trial · No credit card · Approval required",
    // TODO: Add an approved 14-day request workflow. /register currently
    // starts an immediate seven-day trial and must not be repurposed here.
    requestMode: "email",
    requestSubject: "Fitivo: request a 14-day gym trial",
  },
  navigation: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Demo", href: "/demo" },
    { label: "Portal guide", href: "/guide" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  explore: [
    { label: "Features", href: "/features" },
    { label: "Plans & pricing", href: "/pricing" },
    { label: "Product demo", href: "/demo" },
    { label: "Portal guide & onboarding", href: "/guide" },
    { label: "Request a free trial", href: "/free-trial" },
    { label: "Portal login", href: "/login" },
  ],
};

export const MARKETING_PAGES = {
  features: { eyebrow: "The product / Connected operations", title: "The work of a gym. In one place.", description: "Keep member records, memberships, check-ins and recorded payments connected to your gym and team.", link: { href: "/#features", label: "Explore current features" } },
  pricing: { eyebrow: "Pricing / Room to grow", title: "A plan for your gym’s next chapter.", description: "Marketing plan prices are awaiting confirmation. Contact AKTech for a quote; existing gym owners can view their current subscription in Plan & billing.", link: { href: "/billing", label: "Open plan & billing" } },
  demo: { eyebrow: "Inside Fitivo / Product preview", title: "See how your gym fits together.", description: "Explore four connected workspaces. These labeled placeholders describe each area; product screenshots are not yet available.", link: { href: "/free-trial", label: "Request a guided trial" } },
  guide: { eyebrow: "Fitivo / Getting started", title: "A clear start for your team.", description: "Start with your gym setup and membership plans, then add members and staff. Ask AKTech for portal guidance and help applying Fitivo to your daily routine.", link: { href: "/#how-it-works", label: "See the setup steps" } },
  about: { eyebrow: "Fitivo / By AKTech Digital Solutions", title: "For the people behind every gym day.", description: "Fitivo brings member records, attendance, memberships and payments into a shared workspace. A sister product to Acadivo, built by AKTech Digital Solutions in Karachi, Pakistan.", link: { href: "/contact", label: "Talk to AKTech" } },
  contact: { eyebrow: "Contact / AKTech Digital Solutions", title: "Let’s talk about your gym.", description: "Ask about Fitivo, pricing, setup guidance or a walkthrough for your team. Tell us how your gym works and where you want to start." },
  "free-trial": { eyebrow: "Your gym / A connected start", title: "Request a 14-day trial.", description: "Contact AKTech with your name, gym name and email to request a trial. Approval is required before access is arranged. No credit card or upfront payment is needed to request it." },
};

export function trialRequestHref() {
  return `mailto:${SITE.email}?subject=${encodeURIComponent(SITE.trial.requestSubject)}`;
}
