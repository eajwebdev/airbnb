import { Link } from '@inertiajs/react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { Property } from '../types';
import { money } from '../types';
export default function StayCard({property,href}:{property:Property;href?:string}) {
  const lowest=property.rooms.length?Math.min(...property.rooms.map(room=>Number(room.base_rate))):0;
  return <Link href={href||`/stays/${property.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="h-60 overflow-hidden bg-slate-200"><img src={property.cover_image||''} alt={property.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/></div><div className="p-6"><div className="flex items-start justify-between gap-3"><h3 className="text-xl font-semibold text-navy">{property.name}</h3><ArrowUpRight size={19} className="mt-1" style={{color:'var(--guest-accent)'}}/></div><p className="mt-2 flex items-center gap-1 text-sm text-slate"><MapPin size={14}/>{property.city}, {property.province}</p><p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-slate">{property.short_description}</p><div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5"><span className="text-sm text-slate">From <strong className="text-lg text-navy">{money(lowest)}</strong> / night</span><span className="text-sm font-semibold" style={{color:'var(--guest-accent)'}}>View stay →</span></div></div></Link>;
}
