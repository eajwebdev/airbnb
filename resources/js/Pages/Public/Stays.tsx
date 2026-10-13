import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import DateRangePicker, { type DateRange } from '../../Components/DateRangePicker';
import GuestShell, { type SiteTenant } from '../../Components/GuestShell';
import StayCard from '../../Components/StayCard';
import type { Property } from '../../types';
type Filters = { location?: string; check_in?: string; check_out?: string; guests?: number };
export default function Stays({ tenant, properties, filters }: { tenant: SiteTenant; properties: { data: Property[]; links: { url: string | null; label: string; active: boolean }[] }; filters: Filters }) {
  const [location, setLocation] = useState(filters.location || '');
  const [dates, setDates] = useState<DateRange>({start:filters.check_in || '',end:filters.check_out || ''});
  const [guests, setGuests] = useState(filters.guests || 2);
  const stayQuery=new URLSearchParams({check_in:filters.check_in||'',check_out:filters.check_out||'',guests:String(filters.guests||2)}).toString();
  return <GuestShell tenant={tenant}><Head title={`Explore stays | ${tenant?.business_name || 'Stays'}`}/><section className="bg-[var(--guest-primary)] py-16 text-white"><div className="container"><p className="text-xs font-bold uppercase tracking-[.2em] text-white/65">Discover your place</p><h1 className="mt-4 font-serif text-5xl">Explore our stays.</h1><p className="mt-4 max-w-xl text-white/75">Find your room, choose your dates, and make it yours.</p></div></section><div className="container py-12"><form onSubmit={e => {e.preventDefault();router.get('/stays',{tenant:tenant?.slug,location,check_in:dates.start,check_out:dates.end,guests});}} className="surface-card mb-10 grid gap-4 p-5 md:grid-cols-[1fr_1.3fr_.5fr_auto] md:items-end"><label className="field">Destination<input placeholder="City or property" value={location} onChange={e=>setLocation(e.target.value)}/></label><DateRangePicker value={dates} onChange={setDates} label="Stay dates"/><label className="field">Guests<input type="number" min="1" max="20" value={guests} onChange={e=>setGuests(Number(e.target.value))}/></label><button className="guest-button"><Search size={17}/> Search</button></form>{properties.data.length ? <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">{properties.data.map(p=><StayCard key={p.id} property={p} href={`/stays/${p.slug}?${stayQuery}`}/>)}</div> : <div className="surface-card p-14 text-center"><h2 className="text-2xl font-semibold">No stays found</h2><p className="mt-3 text-slate">Try another destination or clear your search.</p></div>}{properties.links?.length > 3 && <nav aria-label="Pagination" className="mt-8 flex justify-center gap-2">{properties.links.map((link,i) => link.url ? <Link key={i} href={link.url} className={`rounded-lg px-3 py-2 text-sm ${link.active?'bg-navy text-white':'bg-white'}`} dangerouslySetInnerHTML={{__html:link.label}}/> : null)}</nav>}</div></GuestShell>;
}
