import MarketingNavigation from "../../components/marketing/marketing-navigation.js";
import MarketingFooter from "../../components/marketing/marketing-footer.js";
import MarketingAnnouncement from "../../components/marketing/marketing-announcement.js";



export default function MarketingLayout({ children }) {
  return <div id="home" className={`${"m-marketing-marketing exact:[--m-ink:#161b2e] exact:[--m-muted:#646979] exact:[--m-line:#e7e8ef] exact:[--m-tint:#f7f8fc] exact:[--m-navy:#13182d] exact:[--m-accent:var(--brand,_#4f46e5)] exact:[--m-radius:20px] exact:[--m-section:clamp(72px,_7.5vw,_112px)] exact:[--m-shadow:0_24px_70px_-25px_rgb(32_35_80_/_22%),_0_3px_12px_rgb(32_35_80_/_4%)] exact:[color:var(--m-ink)] exact:[background:white] exact:[font-family:var(--font-app)] exact:[font-size:15px] exact:[line-height:1.65] exact:[overflow:clip] exact:[&_main:focus]:[outline:none] exact:[&_section:focus]:[outline:none] exact:[&_section[id]]:[scroll-margin-top:96px] exact:less-motion:[&_*]:[animation:none]! exact:less-motion:[&_*]:[transition:none]! exact:less-motion:[&_*]:[scroll-behavior:auto]!"} ${"m-marketing-shell-shell exact:[--shell-brand:#4f46e5] exact:[--shell-ink:#171c30] exact:[--shell-muted:#5d6374] exact:[--shell-line:#e7e8ef] exact:[&_a:focus-visible]:[outline:3px_solid_var(--shell-brand)] exact:[&_a:focus-visible]:[outline-offset:5px] exact:[&_button:focus-visible]:[outline:3px_solid_var(--shell-brand)] exact:[&_button:focus-visible]:[outline-offset:5px] exact:less-motion:[&_*]:[transition:none]! exact:less-motion:[&_*]:[animation:none]! exact:less-motion:[&_*::before]:[transition:none]! exact:less-motion:[&_*::before]:[animation:none]! exact:less-motion:[&_*::after]:[transition:none]! exact:less-motion:[&_*::after]:[animation:none]!"}`}>
    <a href="#main-content" className={"m-marketing-shell-skipLink exact:fixed exact:[top:12px] exact:[left:12px] exact:[z-index:100] exact:[padding:12px_18px] exact:[border-radius:8px] exact:[background:white] exact:[color:var(--shell-brand)] exact:[transform:translateY(-160%)] exact:[&:focus]:[transform:translateY(0)]"}>Skip to main content</a>
    <MarketingAnnouncement />
    <MarketingNavigation />
    <main id="main-content" tabIndex={-1}>{children}</main>
    <MarketingFooter />
  </div>;
}
