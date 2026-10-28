import { ImageIcon, Layers3 } from "lucide-react";
import styles from "./marketing-home.module.css";

export default function MarketingPreviewPlaceholder({ title, description, areas = [], compact = false }) {
  return <figure className={`${styles.preview} ${compact ? styles.compactPreview : ""}`}>
    <div className={styles.previewBar}><span><Layers3 size={15} aria-hidden="true" /> Fitivo / {title}</span><span>Preview placeholder</span></div>
    <div className={styles.previewBody}>
      <div className={styles.placeholderMark}><ImageIcon size={30} strokeWidth={1.3} aria-hidden="true" /></div>
      <p className={styles.previewTitle}>{title}</p>
      <p>{description}</p>
      <div className={styles.previewAreas}>{areas.map(area => <span key={area}>{area}</span>)}</div>
    </div>
    <figcaption>Screenshot not yet available · This frame describes the workspace.</figcaption>
  </figure>;
}
