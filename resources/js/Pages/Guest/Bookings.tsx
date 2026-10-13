import { Head, Link } from '@inertiajs/react';
import GuestShell from '../../Components/GuestShell';
import StatusBadge from '../../Components/StatusBadge';
import type { Booking } from '../../types';
export default function Bookings({bookings}:{bookings:Booking[]}) {
  return <GuestShell tenant={null}><Head title="My bookings"/><div className="container min-h-[65vh] py-12"><p className="section-eyebrow">Your journeys</p><h1 className="section-title mt-3">My bookings</h1><div className="mt-9 grid gap-4">{bookings.map(b=><div key={b.reference} className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-semibold text-pink">{b.reference}</p><h2 className="mt-2 text-xl font-semibold">{b.property.name}</h2><p className="mt-2 text-sm text-slate">{b.room.name} · {b.check_in.slice(0,10)} to {b.check_out.slice(0,10)}</p></div><StatusBadge status={b.status}/></div></div>)}{!bookings.length&&<div className="rounded-2xl bg-white p-12 text-center"><h2 className="text-xl font-semibold">No bookings yet</h2><p className="mt-2 text-slate">Your next stay is waiting.</p><Link href="/stays" className="btn btn-pink mt-5">Explore stays</Link></div>}</div></div></GuestShell>;
}

