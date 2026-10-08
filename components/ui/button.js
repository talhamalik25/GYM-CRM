import Link from "next/link";

const variants = {
  primary: "ui-button-primary",
  secondary: "ui-button-secondary",
  ghost: "ui-button-ghost",
  danger: "ui-button-danger",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  ...props
}) {
  const classes = `ui-button ${variants[variant] || variants.primary} ui-button-${size} ${className}`.trim();
  if (href) return <Link className={classes} href={href} {...props}>{children}</Link>;
  return <button className={classes} {...props}>{children}</button>;
}
