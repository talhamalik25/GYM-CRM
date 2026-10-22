import PageHeader from "./page-header";

export default function PageHeading({ action, children, ...props }) {
  return <PageHeader {...props} actions={action || children ? <>{children}{action}</> : undefined} />;
}
