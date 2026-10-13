import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Check, ClipboardCheck, Copy, Download, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import Shell from '../../Components/Shell';

// Monthly PHP prices per property. Update these when EAJ confirms its rate card.
const BASE_PRICE = 1799;
const WEBSITES = [
  { id: 'none', name: 'No public website', price: 0, eyebrow: 'MANAGEMENT ONLY', description: 'Keep your existing website or booking channels. Use EAJ for your internal reservation workflow.' },
  { id: 'business', name: 'Business landing page', price: 499, eyebrow: 'SHOWCASE YOUR BRAND', description: 'A branded home page for your business with services, gallery, contact details and an inquiry link.' },
  { id: 'booking', name: 'Booking website + customer accounts', price: 999, eyebrow: 'DIRECT RESERVATIONS', description: 'Property pages, stay search, checkout, guest registration, sign-in and booking history.' },
] as const;
const ADDONS = [
  { id: 'pos', name: 'Point of sale', price: 499, description: 'Front desk sales, items, charges and transaction records.' },
  { id: 'cleaning', name: 'Cleaning & staff tasks', price: 299, description: 'Room turnover assignments, status updates and task photos.' },
  { id: 'promotions', name: 'Promos & seasonal rates', price: 249, description: 'Date-based pricing, discount codes and offers.' },
  { id: 'messages', name: 'Guest messaging', price: 299, description: 'Message templates and booking communication tools. Delivery fees are separate.' },
  { id: 'reports', name: 'Advanced reports & insights', price: 349, description: 'Expanded booking, revenue and operations views.' },
  { id: 'payments', name: 'Online payment integration', price: 399, description: 'Connect a supported provider to online booking checkout. Provider fees are separate.', requiresBooking: true },
  { id: 'face', name: 'Face recognition login', price: 999, description: 'Camera-based staff sign-in with enrollment and a password fallback. Subject to privacy review.' },
] as const;
type WebsiteId = typeof WEBSITES[number]['id'];
type AddonId = typeof ADDONS[number]['id'];
const addonIds = new Set<string>(ADDONS.map(addon => addon.id));
const peso = (amount: number) => `₱${amount.toLocaleString('en-PH')}`;
const count = (value: string | null) => Math.max(1, Math.min(20, Number.parseInt(value || '', 10) || 1));

function initialSelection() {
  if (typeof window === 'undefined') return { properties: 1, website: 'none' as WebsiteId, addons: [] as AddonId[] };
  const params = new URLSearchParams(window.location.search);
  const requestedWebsite = params.get('website');
  const website = WEBSITES.some(option => option.id === requestedWebsite) ? requestedWebsite as WebsiteId : 'none';
  const addons = (params.get('addons') || '').split(',').filter((id): id is AddonId => addonIds.has(id));
  if (params.get('face') === '1' && !addons.includes('face')) addons.push('face');
  return { properties: count(params.get('properties')), website, addons: addons.filter(id => id !== 'payments' || website === 'booking') };
}

export default function Quotation() {
  const [initial] = useState(initialSelection);
  const [properties, setProperties] = useState(initial.properties);
  const [website, setWebsite] = useState<WebsiteId>(initial.website);
  const [selected, setSelected] = useState<AddonId[]>(initial.addons);
  const [copied, setCopied] = useState(false);
  const chosenWebsite = WEBSITES.find(option => option.id === website)!;
  const chosenAddons = ADDONS.filter(addon => selected.includes(addon.id) && (!('requiresBooking' in addon) || website === 'booking'));
  const perProperty = BASE_PRICE + chosenWebsite.price + chosenAddons.reduce((sum, addon) => sum + addon.price, 0);
  const total = perProperty * properties;

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    url.searchParams.delete('billing');
    url.searchParams.delete('face');
    url.searchParams.set('properties', String(properties));
    if (website === 'none') url.searchParams.delete('website');
    else url.searchParams.set('website', website);
    if (chosenAddons.length) url.searchParams.set('addons', chosenAddons.map(addon => addon.id).join(','));
    else url.searchParams.delete('addons');
    window.history.replaceState(window.history.state, '', url);
  }, [properties, website, selected]);

  function selectWebsite(value: WebsiteId) {
    setWebsite(value);
    if (value !== 'booking') setSelected(current => current.filter(id => id !== 'payments'));
  }

  function toggleAddon(id: AddonId) {
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Copy this quotation link', window.location.href);
    }
  }

  return <Shell><Head title="EAJ Booking Platform quotation"/><div className="quotation-page print-area bg-[#f6f8fb] text-[#14253c]">
    <section className="bg-[#0a2542] text-white"><div className="container grid gap-9 py-16 lg:grid-cols-[1fr_270px] lg:items-center lg:py-20">
      <div><p className="text-xs font-bold uppercase tracking-[.23em] text-sky-300">EAJ Web Development Services / Quotation</p><h1 className="mt-5 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">A booking platform that fits your business.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-white/70">Start with reservation essentials at ₱1,799 per month. Choose a public website and add the tools your team needs.</p></div>
      <div className="hidden rounded-3xl border border-white/20 bg-white/5 p-7 lg:block"><p className="text-xs font-bold uppercase tracking-[.2em] text-sky-200">Quote reference</p><p className="mt-3 text-2xl font-bold">EAJ-Q-2026-1013</p><div className="mt-8 border-t border-white/20 pt-5 text-sm leading-7 text-white/70">Prepared for<br/><strong className="text-white">Prospective client</strong><br/>Philippines</div></div>
    </div></section>

    <div className="container grid gap-9 py-12 lg:grid-cols-[minmax(0,1fr)_355px] lg:items-start lg:py-16">
      <main className="space-y-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><SectionHeading number="01" label="Starting plan" title="Booking Core" description="The back-office foundation for your property. Website and specialist modules are optional."/>
          <div className="mt-7 flex flex-col justify-between gap-5 rounded-2xl bg-[#eaf3f8] p-6 sm:flex-row sm:items-end"><div><p className="text-lg font-bold">EAJ Booking Core</p><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Property and room setup, availability calendar, manual reservations, guest records, manual payment tracking, basic dashboard and staff access.</p></div><p className="shrink-0 text-2xl font-extrabold text-[#0a456a]">{peso(BASE_PRICE)}<span className="block text-xs font-medium text-slate-500 sm:text-right">/ month / property</span></p></div>
          <div className="mt-5 flex flex-wrap gap-2">{['Cloud hosting', 'SSL', 'Routine updates', 'Backups'].map(item => <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">{item}</span>)}</div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><SectionHeading number="02" label="Website option" title="Choose your public site" description="Pick one option. The business landing page is a showcase site; the booking website adds guest accounts and direct reservations."/>
          <div className="mt-7 grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Website option">{WEBSITES.map(option => <label key={option.id} className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-5 transition ${website === option.id ? 'border-[#1779a8] bg-[#f0f8fc]' : 'border-slate-200 hover:border-sky-300'}`}><input className="sr-only" type="radio" name="website" value={option.id} checked={website === option.id} onChange={() => selectWebsite(option.id)}/><span className="text-[10px] font-bold tracking-[.14em] text-[#16709d]">{option.eyebrow}</span><strong className="mt-4 text-base leading-snug">{option.name}</strong><span className="mt-2 flex-1 text-xs leading-5 text-slate-500">{option.description}</span><span className="mt-5 text-lg font-extrabold text-[#0a456a]">{option.price ? `+ ${peso(option.price)}` : 'Included'}{option.price > 0 && <small className="ml-1 text-xs font-medium text-slate-500">/ mo</small>}</span>{website === option.id && <Check className="absolute right-4 top-4 text-[#16709d]" size={17}/>}</label>)}</div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><SectionHeading number="03" label="Monthly add-ons" title="Add the modules you need" description="Each selected add-on is billed monthly per property. These prices are estimates that EAJ can update later."/>
          <div className="mt-7 divide-y divide-slate-100 rounded-2xl border border-slate-200">{ADDONS.map(addon => { const disabled = 'requiresBooking' in addon && website !== 'booking'; const checked = selected.includes(addon.id); return <label key={addon.id} className={`flex gap-4 p-4 sm:items-center sm:p-5 ${disabled ? 'cursor-not-allowed bg-slate-50 opacity-50' : 'cursor-pointer hover:bg-slate-50'}`}><input type="checkbox" className="mt-1 size-5 shrink-0 accent-[#16709d] sm:mt-0" checked={checked} disabled={disabled} onChange={() => toggleAddon(addon.id)}/><span className="min-w-0 flex-1"><strong className="block text-sm">{addon.name}</strong><small className="mt-1 block text-xs leading-5 text-slate-500">{addon.description}</small></span><strong className="shrink-0 text-sm text-[#0a456a]">+ {peso(addon.price)}<span className="block text-right text-[10px] font-medium text-slate-500">/ month</span></strong></label>; })}</div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Online payment integration requires the Booking Website add-on. Payment provider and messaging delivery fees are separate. Face recognition needs supported cameras, consent and an agreed privacy process.</p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><SectionHeading number="04" label="Terms" title="Before activation" description="The final agreement confirms scope, prices, support and launch timing."/><div className="mt-7 grid gap-5 sm:grid-cols-2">{[
          ['Monthly billing', 'The base plan and selected add-ons are billed monthly in advance per property.'],
          ['Included services', 'Cloud hosting, SSL, routine updates and backups are included in the base subscription.'],
          ['External charges', 'Payment processing, message delivery, domains and other provider charges are separate.'],
          ['Customer accounts', 'Customer registration and booking history are included with the Booking Website option.'],
        ].map(([title, body]) => <div key={title} className="border-l-2 border-sky-300 pl-4"><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{body}</p></div>)}</div></section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><SectionHeading number="05" label="Acceptance" title="Ready to move forward?" description="Save this selection as a PDF and confirm the final details with EAJ before signing."/><div className="mt-16 grid gap-8 sm:grid-cols-2"><div className="border-t border-slate-400 pt-3 text-xs"><strong>EAJ Web Development Services</strong><span className="mt-1 block text-slate-500">Authorized representative / Date</span></div><div className="border-t border-slate-400 pt-3 text-xs"><strong>Client representative</strong><span className="mt-1 block text-slate-500">Signature / Date</span></div></div></section>
      </main>

      <aside className="quote-summary sticky top-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5"><div className="bg-[#0a456a] p-6 text-white"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-200">Live quotation</p><h2 className="mt-2 text-2xl font-bold">Your monthly plan</h2><p className="mt-1 text-xs text-white/70">Prices in Philippine pesos</p></div><div className="p-6">
        <div className="flex items-center justify-between gap-3"><div><strong className="text-sm">Properties</strong><p className="text-xs text-slate-500">Priced per property</p></div><div className="no-print flex items-center rounded-xl border border-slate-200"><button type="button" className="p-2 disabled:opacity-30" aria-label="Remove one property" disabled={properties === 1} onClick={() => setProperties(value => Math.max(1, value - 1))}><Minus size={16}/></button><input className="w-10 text-center text-sm font-bold outline-none" aria-label="Number of properties" type="number" min="1" max="20" value={properties} onChange={event => setProperties(count(event.target.value))}/><button type="button" className="p-2 disabled:opacity-30" aria-label="Add one property" disabled={properties === 20} onClick={() => setProperties(value => Math.min(20, value + 1))}><Plus size={16}/></button></div><span className="hidden text-sm font-bold print:inline">{properties}</span></div>
        <div className="mt-6 space-y-3 border-y border-slate-200 py-5 text-xs"><PriceRow label={`Booking Core × ${properties}`} amount={BASE_PRICE * properties}/>{chosenWebsite.price > 0 && <PriceRow label={`${chosenWebsite.name} × ${properties}`} amount={chosenWebsite.price * properties}/>}{chosenAddons.map(addon => <PriceRow key={addon.id} label={`${addon.name} × ${properties}`} amount={addon.price * properties}/>)}</div>
        <div className="pt-5"><p className="text-xs font-bold uppercase tracking-[.13em] text-slate-500">Total per month</p><p className="mt-1 text-4xl font-extrabold tracking-tight text-[#0a456a]">{peso(total)}</p><p className="mt-2 text-xs leading-5 text-slate-500">{peso(perProperty)} per property, billed monthly in advance.</p></div>
        <p className="mt-5 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Add-on prices are illustrative. EAJ will confirm them before a final offer.</p>
        <div className="no-print mt-6 grid gap-2"><button type="button" onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-xl bg-[#16709d] px-4 py-3 text-sm font-bold text-white hover:bg-[#0a456a]"><Download size={16}/> Print / Save PDF</button><button type="button" onClick={copyLink} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-[#0a456a] hover:bg-slate-50">{copied ? <ClipboardCheck size={16}/> : <Copy size={16}/>} {copied ? 'Link copied' : 'Copy selection link'}</button></div>
        <p className="mt-5 text-[11px] leading-5 text-slate-500">Indicative quotation only. Applicable taxes, external provider fees and final service terms are confirmed separately.</p>
      </div></aside>
    </div>
    <div className="no-print border-t border-slate-200 bg-white"><div className="container flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-slate-500"><span>EAJ Web Development Services · Booking Platform</span><Link href="/platform" className="inline-flex items-center gap-1 font-bold text-[#0a456a]">Explore the platform <ArrowRight size={14}/></Link></div></div>
  </div></Shell>;
}

function SectionHeading({ number, label, title, description }: { number: string; label: string; title: string; description: string }) {
  return <div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-full border border-sky-200 text-xs font-bold text-[#16709d]">{number}</span><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#16709d]">{label}</p><h2 className="mt-1 font-serif text-3xl leading-tight">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p></div></div>;
}

function PriceRow({ label, amount }: { label: string; amount: number }) {
  return <div className="flex justify-between gap-3"><span className="text-slate-500">{label}</span><strong className="shrink-0">{peso(amount)}</strong></div>;
}
