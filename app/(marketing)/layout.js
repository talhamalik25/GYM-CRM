import MarketingNavigation from "../../components/marketing/marketing-navigation.js";
import MarketingFooter from "../../components/marketing/marketing-footer.js";
import MarketingAnnouncement from "../../components/marketing/marketing-announcement.js";
import styles from "../../components/marketing/marketing.module.css";
import shell from "../../components/marketing/marketing-shell.module.css";

export default function MarketingLayout({ children }) {
  return <div id="home" className={`${styles.marketing} ${shell.shell}`}>
    <a href="#main-content" className={shell.skipLink}>Skip to main content</a>
    <MarketingAnnouncement />
    <MarketingNavigation />
    <main id="main-content" tabIndex={-1}>{children}</main>
    <MarketingFooter />
  </div>;
}
