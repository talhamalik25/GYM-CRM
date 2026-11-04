import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MarketingContainer from "./marketing-container.js";

export default function MarketingAnnouncement() {
  return <aside aria-label="Fitivo product overview" className="bg-[#0B1120] font-sans text-slate-300">
    <MarketingContainer className="flex h-9 items-center justify-center text-[11px] font-medium sm:justify-between sm:text-xs">
      <div className="hidden items-center gap-5 sm:flex"><span className="text-slate-100">Built for modern gym operations</span><span aria-hidden="true" className="h-3 w-px bg-slate-600" /><span>Members · Payments · Attendance</span></div>
      <Link href="/demo" className="inline-flex h-9 items-center gap-2 text-white hover:text-indigo-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><span className="sm:hidden">Explore Fitivo</span><span className="hidden sm:inline">Product Tour</span><ArrowRight size={13} aria-hidden="true" /></Link>
    </MarketingContainer>
  </aside>;
}
