import Image from "next/image";

export default function MarketingCapabilityPanel({ title, description, areas = [], screenshot }) {
  return (
    <section aria-label={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Product areas</p>
      <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {screenshot ? <Image src={screenshot.src} alt={`${title} dashboard screenshot`} width={screenshot.width} height={screenshot.height} sizes="(max-width: 640px) 100vw, 90vw" className="mt-5 h-auto w-full rounded-lg border border-slate-200" /> : areas.length > 0 && <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {areas.map((area) => <li key={area} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{area}</li>)}
      </ul>}
    </section>
  );
}
