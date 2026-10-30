export default function Card({ as: Component = "section", className = "", children, ...props }) {
  return <Component className={`ui-card exact:[background:var(--surface)] exact:[border:1px_solid_var(--line)] exact:[border-radius:var(--radius-card)] exact:[box-shadow:none] ${className}`.trim()} {...props}>{children}</Component>;
}
