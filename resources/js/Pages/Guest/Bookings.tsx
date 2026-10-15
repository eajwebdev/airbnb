import { Head, Link, useForm } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { type FormEvent } from 'react';
import GuestShell from '../../Components/GuestShell';
import StatusBadge from '../../Components/StatusBadge';
import type { Booking } from '../../types';

export default function Bookings({ bookings }: { bookings: Booking[] }) {
  return <GuestShell tenant={null}><Head title="My bookings"/><div className="container min-h-[65vh] py-12"><p className="section-eyebrow">Your journeys</p><h1 className="section-title mt-3">My bookings</h1><div className="mt-9 grid gap-4">{bookings.map(booking => <div key={booking.reference} className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-semibold text-pink">{booking.reference}</p><h2 className="mt-2 text-xl font-semibold">{booking.property.name}</h2><p className="mt-2 text-sm text-slate">{booking.room.name} · {booking.check_in.slice(0, 10)} to {booking.check_out.slice(0, 10)}</p></div><StatusBadge status={booking.status}/></div>
      {booking.review ? <div className="mt-5 border-t border-slate-100 pt-4"><div className="flex gap-1" aria-label={`${booking.review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={17} className={index < booking.review!.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}/>)}</div><p className="mt-2 text-sm text-slate">{booking.review.comment || 'Rating submitted.'} {!booking.review.approved && <span className="font-semibold">Awaiting moderation.</span>}</p></div>
        : booking.status === 'COMPLETED' ? <ReviewForm bookingId={booking.id}/> : null}
    </div>)}{!bookings.length && <div className="rounded-2xl bg-white p-12 text-center"><h2 className="text-xl font-semibold">No bookings yet</h2><p className="mt-2 text-slate">Your next stay is waiting.</p><Link href="/stays" className="btn btn-pink mt-5">Explore stays</Link></div>}</div></div></GuestShell>;
}

function ReviewForm({ bookingId }: { bookingId: number }) {
  const form = useForm({ booking_id: bookingId, rating: 5, comment: '' });
  const submit = (event: FormEvent) => { event.preventDefault(); form.post('/account/reviews', { preserveScroll: true }); };
  return <form onSubmit={submit} className="mt-5 border-t border-slate-100 pt-4"><p className="font-semibold">How was your stay?</p><div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" role="radio" aria-checked={form.data.rating === value} aria-label={`${value} star${value === 1 ? '' : 's'}`} onClick={() => form.setData('rating', value)}><Star size={24} className={value <= form.data.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}/></button>)}</div><label className="field mt-3">Review (optional)<textarea maxLength={1000} rows={3} value={form.data.comment} onChange={event => form.setData('comment', event.target.value)} placeholder="Tell future guests what stood out."/></label>{Object.values(form.errors).map((error, index) => <p key={index} className="mt-1 text-sm text-red-600">{error}</p>)}<button disabled={form.processing} className="guest-button mt-3">Submit review</button></form>;
}
