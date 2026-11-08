"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import MarketingContainer from "./marketing-container.js";

export function StorySection({ id, className = "", children }) {
  return (
    <section id={id} className={`scroll-mt-24 py-16 sm:py-20 lg:py-24 ${className}`}>
      <MarketingContainer>{children}</MarketingContainer>
    </section>
  );
}

export function StoryHeading({ eyebrow, title, children, centered = false, inverse = false }) {
  return (
    <div className={`max-w-2xl ${centered ? "mx-auto mb-12 text-center" : ""}`}>
      {eyebrow && (
        <p
          className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            inverse ? "text-indigo-400" : "text-indigo-600"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`text-3xl font-bold tracking-tight sm:text-4xl lg:text-[42px] lg:leading-[1.15] ${
          inverse ? "text-white" : "text-slate-900"
        }`}
      >
        {title}
      </h2>
      {children && (
        <p
          className={`mt-4 text-base leading-relaxed sm:text-lg ${
            inverse ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {children}
        </p>
      )}
    </div>
  );
}

export function StoryLink({ href, children, inverse = false }) {
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 motion-reduce:transition-none ${
        inverse
          ? "text-indigo-300 hover:text-white"
          : "text-indigo-600 hover:text-indigo-700"
      }`}
    >
      <span className="underline-offset-4 group-hover:underline">{children}</span>
      <ArrowUpRight
        size={16}
        aria-hidden="true"
        className="transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 rtl:motion-safe:group-hover:-translate-x-0.5 rtl:-scale-x-100 motion-reduce:transition-none"
      />
    </Link>
  );
}

export function ProductCrop({
  src,
  width,
  height,
  alt,
  caption,
  label = "Inside Fitivo",
  inverse = false,
  className = "",
}) {
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-900/5 sm:p-3">
        <div className="flex items-center justify-between gap-4 px-2 pb-3 pt-1 text-[11px] text-slate-500">
          <span className="font-semibold uppercase tracking-wider text-indigo-600">{label}</span>
          <span className="text-slate-400">Live system capture</span>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
          <Image
            src={src}
            width={width}
            height={height}
            alt={alt}
            sizes="(max-width: 1024px) 100vw, 1100px"
            className="h-auto w-full object-cover"
          />
        </div>
        {caption && (
          <figcaption className="px-2 pt-2.5 text-xs text-slate-500">
            {caption}
          </figcaption>
        )}
      </div>
    </figure>
  );
}
