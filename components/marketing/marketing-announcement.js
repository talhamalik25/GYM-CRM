import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function MarketingAnnouncement() {
  return <aside aria-label="Fitivo trial announcement" className="bg-[#18191d] font-sans text-white">
    <div className="mx-auto flex h-8 items-center justify-center gap-5 px-4 text-[10px] leading-none">
      <span className="hidden sm:inline">Everything you need to run your gym.</span>
      <Link href="/register" className="inline-flex h-8 items-center gap-2 whitespace-nowrap font-semibold text-white! transition-colors hover:text-indigo-200! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none">Start 7-Day Trial <ArrowRight size={12} aria-hidden="true" /></Link>
      <span className="hidden text-white/70 md:inline">Gym management made simple</span>
    </div>
  </aside>;
}
