import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import MarketingContainer from "./marketing-container.js";

export function StorySection({ id, className = "", children }) {
  return <section id={id} className={`scroll-mt-28 py-16 sm:py-20 lg:py-24 ${className}`}><MarketingContainer>{children}</MarketingContainer></section>;
}

export function StoryLink({ href, children }) {
  return <Link href={href} className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600">{children}<ArrowUpRight size={16} aria-hidden="true" className="transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none" /></Link>;
}

export function ProductCrop({ src, width, height, alt, caption, className = "" }) {
  return <figure className={className}>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-900/5">
      <div className="overflow-hidden rounded-lg bg-slate-50">
        <Image src={src} width={width} height={height} alt={alt} sizes="(max-width: 767px) 900px, 1184px" className="h-auto w-full min-w-[900px] max-w-none md:min-w-0" />
      </div>
    </div>
    <figcaption className="mt-3 text-xs leading-5 text-slate-500">{caption}</figcaption>
  </figure>;
}
