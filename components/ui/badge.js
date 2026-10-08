const tones = { neutral: "neutral", success: "success", warning: "warning", error: "error", brand: "brand" };
export default function Badge({ tone = "neutral", className = "", children, ...props }) {
  return <span className={`ui-badge ui-badge-${tones[tone] || tones.neutral} ${className}`.trim()} {...props}>{children}</span>;
}
