import { cn } from "../../lib/cn.js";
export default function MarketingContainer({ className, children, ...props }) {
  return <div className={cn("mx-auto w-[calc(100%-40px)] max-w-[1184px] sm:w-[calc(100%-64px)]", className)} {...props}>{children}</div>;
}
