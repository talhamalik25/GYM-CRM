import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import MarketingContainer from "./marketing-container.js";

export function StorySection({ id, className = "", children }) {
  return <section id={id} className={`scroll-mt-28 py-16 sm:py-20 lg:py-28 ${className}`}><MarketingContainer>{children}</MarketingContainer></section>;
}

export function StoryHeading({ eyebrow, title, children, centered = false, inverse = false }) {
  return <div className={`max-w-2xl ${centered ? "mx-auto mb-12 text-center" : ""}`}>
    <p className={`mb-5 text-[10px] font-semibold uppercase tracking-[0.18em] ${inverse ? "text-indigo-200" : "text-slate-500"}`}>{eyebrow}</p>
    <h2 className={`text-[34px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[44px] lg:text-[56px] ${inverse ? "text-white" : "text-slate-900"}`}>{title}</h2>
    {children && <p className={`mt-6 max-w-xl text-base leading-7 sm:text-[17px] sm:leading-8 ${inverse ? "text-slate-300" : "text-slate-500"}`}>{children}</p>}
  </div>;
}

export function StoryLink({ href, children, inverse = false }) {
  return <Link href={href} className={`group inline-flex min-h-11 items-center gap-3 border-b text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 motion-reduce:transition-none ${inverse ? "border-white/20 text-white! hover:border-white/60" : "border-slate-200 text-slate-900! hover:border-indigo-400 hover:text-indigo-700!"}`}>{children}<ArrowUpRight size={16} aria-hidden="true" className="transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none" /></Link>;
}

export function ProductCrop({ src, width, height, alt, caption, label = "Inside Fitivo", inverse = false, className = "" }) {
  return <figure className={className}>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 sm:p-3">
      <div className="flex items-center justify-between gap-4 px-2 pb-3 pt-1 text-[10px] text-slate-500"><span className="font-semibold uppercase tracking-widest">{label}</span><span>Real product view</span></div>
      <div className="overflow-hidden rounded-lg bg-slate-50">
        <Image src={src} width={width} height={height} alt={alt} sizes="(max-width: 1023px) 1000px, 1184px" className="h-auto w-full min-w-[1000px] max-w-none lg:min-w-0" />
      </div>
    </div>
    <figcaption className={`mt-4 text-xs leading-5 ${inverse ? "text-slate-400" : "text-slate-500"}`}>{caption}</figcaption>
  </figure>;
}
