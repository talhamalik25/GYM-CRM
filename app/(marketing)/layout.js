import MarketingNavigation from "../../components/marketing/marketing-navigation.js";
import MarketingFooter from "../../components/marketing/marketing-footer.js";
import MarketingAnnouncement from "../../components/marketing/marketing-announcement.js";
import styles from "../../components/marketing/marketing.module.css";


export default function MarketingLayout({ children }) {
  return <div id="home" className={`${styles.marketing} ${"m-marketing-shell-shell exact:[--shell-brand:#4f46e5] exact:[--shell-ink:#171c30] exact:[--shell-muted:#5d6374] exact:[--shell-line:#e7e8ef] exact:[&_a:focus-visible]:[outline:3px_solid_var(--shell-brand)] exact:[&_a:focus-visible]:[outline-offset:5px] exact:[&_button:focus-visible]:[outline:3px_solid_var(--shell-brand)] exact:[&_button:focus-visible]:[outline-offset:5px] exact:less-motion:[&_*]:[transition:none]! exact:less-motion:[&_*]:[animation:none]! exact:less-motion:[&_*::before]:[transition:none]! exact:less-motion:[&_*::before]:[animation:none]! exact:less-motion:[&_*::after]:[transition:none]! exact:less-motion:[&_*::after]:[animation:none]!"}`}>
    <a href="#main-content" className={"m-marketing-shell-skipLink exact:fixed exact:[top:12px] exact:[left:12px] exact:[z-index:100] exact:[padding:12px_18px] exact:[border-radius:8px] exact:[background:white] exact:[color:var(--shell-brand)] exact:[transform:translateY(-160%)] exact:[&:focus]:[transform:translateY(0)]"}>Skip to main content</a>
    <MarketingAnnouncement />
    <MarketingNavigation />
    <main id="main-content" tabIndex={-1}>{children}</main>
    <MarketingFooter />
  </div>;
}
