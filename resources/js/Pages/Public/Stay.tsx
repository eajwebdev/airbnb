import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, MapPin, Star } from 'lucide-react';
import { Fragment, useEffect, useMemo, useState, type FormEvent } from 'react';
import DateRangePicker, { type DateRange } from '../../Components/DateRangePicker';
import GuestShell, { type SiteTenant } from '../../Components/GuestShell';
import ImageGallery from '../../Components/ImageGallery';
import type { Property, Room } from '../../types';
import { includedGuests, money, pricingLabel, roomSpecs, time12, type AddOn, type Quote } from '../../types';

type GuestReview = { id: number; rating: number; comment: string | null; created_at: string; user: { name: string } | null };

export default function Stay({ property, tenant, bookable, selection, addOns = [], reviews = [], reviewSummary }: {
  property: Property;
  tenant: SiteTenant;
  bookable: boolean;
  selection?: { check_in?: string; check_out?: string; guests?: number };
  addOns?: AddOn[];
  reviews?: GuestReview[];
  reviewSummary?: { count: number; average: number | null };
}) {
  const [roomId, setRoomId] = useState(property.rooms[0]?.id || 0);
  const [dates, setDates] = useState<DateRange>({ start: selection?.check_in || '', end: selection?.check_out || '' });
  const [guests, setGuests] = useState(selection?.guests || 2);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState<Record<number, boolean>>({});
  const [checking, setChecking] = useState(false);
  const [ruleMessage, setRuleMessage] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [extras, setExtras] = useState<Record<number, number>>({});
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState('');
  const [promoError, setPromoError] = useState('');
  const eligible = useMemo(() => property.rooms.filter(room => room.maximum_occupancy >= guests), [property.rooms, guests]);

  useEffect(() => {
    if (!dates.start || !dates.end) { setAvailability({}); setRuleMessage(''); setChecking(false); return; }
    const controller = new AbortController();
    setChecking(true);
    Promise.all(property.rooms.map(async room => {
      const params = new URLSearchParams({ room_id: String(room.id), check_in: dates.start, check_out: dates.end });
      try {
        const response = await fetch(`/availability?${params}`, { signal: controller.signal });
        if (!response.ok) return [room.id, false, null] as const;
        const body = await response.json();
        return [room.id, body.available === true, (body.message as string | null) ?? null] as const;
      } catch { return [room.id, false, null] as const; }
    })).then(results => {
      if (controller.signal.aborted) return;
      setAvailability(Object.fromEntries(results.map(([id, available]) => [id, available])) as Record<number, boolean>);
      setRuleMessage(results.find(([, , message]) => message)?.[2] || '');
      setRoomId(current => results.find(([id]) => id === current)?.[1] ? current : (results.find(([, available]) => available)?.[0] || current));
      setChecking(false);
    });
    return () => controller.abort();
  }, [dates.start, dates.end, property.rooms]);

  useEffect(() => {
    if (!eligible.some(room => room.id === roomId)) setRoomId(eligible[0]?.id || 0);
  }, [eligible, roomId]);

  const room = property.rooms.find(item => item.id === roomId);
  const roomAvailable = Boolean(dates.start && dates.end && !checking && availability[roomId] === true);
  const roomExtras = addOns.filter(addOn => !addOn.room_ids?.length || addOn.room_ids.includes(roomId));
  const chosenExtras = Object.fromEntries(Object.entries(extras).filter(([id, qty]) => qty > 0 && roomExtras.some(addOn => addOn.id === Number(id))));
  const extrasKey = JSON.stringify(chosenExtras);
  const setExtra = (id: number, qty: number) => setExtras(current => ({ ...current, [id]: qty }));

  useEffect(() => {
    if (!roomAvailable) { setQuote(null); setQuoteError(''); return; }
    const controller = new AbortController();
    const params = new URLSearchParams({ room_id: String(roomId), check_in: dates.start, check_out: dates.end, guests: String(guests), ...(promo ? { promo_code: promo } : {}) });
    const quoteExtras = JSON.parse(extrasKey) as Record<string, number>;
    Object.entries(quoteExtras).forEach(([id, qty]) => params.set(`add_ons[${id}]`, String(qty)));
    fetch(`/quote?${params}`, { headers: { Accept: 'application/json' }, signal: controller.signal }).then(async response => {
      const body = await response.json();
      if (response.ok) { setQuote(body); setQuoteError(''); return; }
      const errors = (body.errors || {}) as Record<string, string[]>;
      if (errors.promo_code) { setPromoError(errors.promo_code[0]); setPromo(''); return; }
      setQuote(null);
      setQuoteError(Object.values(errors)[0]?.[0] || 'We could not price this stay.');
    }).catch(() => {});
    return () => controller.abort();
  }, [roomAvailable, roomId, dates.start, dates.end, guests, promo, extrasKey]);

  const rules = tenant?.settings;
  const maxGuests = Math.max(1, ...property.rooms.map(item => item.maximum_occupancy));

  function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!dates.start || !dates.end) { setError('Choose your check-in and check-out dates.'); return; }
    if (checking || availability[roomId] !== true) { setError('This room is not available for your dates. Choose another room or date range.'); return; }
    router.post('/bookings', { room_id: roomId, check_in: dates.start, check_out: dates.end, guests, guest_name: name, guest_email: email, guest_phone: phone, promo_code: promo || null, add_ons: chosenExtras }, { onError: errors => setError(Object.values(errors)[0] || 'Please check your details.') });
  }

  return <GuestShell tenant={tenant}>
    <Head title={`${property.name} | ${tenant?.business_name || 'Stay'}`}>
      <meta name="description" content={property.short_description || property.description || `Book ${property.name} in ${property.city}, ${property.province}.`}/>
      <meta property="og:title" content={`${property.name} | ${tenant?.business_name || 'Stay'}`}/>
      <meta property="og:description" content={property.short_description || property.description || ''}/>
      {property.cover_image && <meta property="og:image" content={property.cover_image}/>}
    </Head>
    <div className="container pb-14 pt-6 sm:pt-9">
      <Link href={`/stays?tenant=${tenant?.slug || ''}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate"><ArrowLeft size={16}/> All stays</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-serif text-4xl md:text-5xl">{property.name}</h1><p className="mt-2 flex items-center gap-1 text-slate"><MapPin size={17}/>{property.city}, {property.province}, Philippines</p></div>
        <a href="#booking-form" className="inline-flex items-center gap-2 text-sm font-bold text-pink">Check dates & book <ArrowRight size={17}/></a>
      </div>
      {property.cover_image ? <ImageGallery className="mt-6 grid" imageClassName="h-[260px] sm:h-[380px] lg:h-[460px]" items={[{ src: property.cover_image, alt: property.name }]}/> : <div className="mt-6 h-64 rounded-2xl bg-slate-200"/>}

      <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
        <div className="min-w-0">
          <p className="section-eyebrow">The stay</p>
          <h2 className="section-title mt-2">Make yourself at home.</h2>
          <p className="mt-4 max-w-2xl whitespace-pre-line leading-7 text-slate">{property.description || property.short_description}</p>

          <div className="mt-9 flex flex-wrap items-end justify-between gap-2"><div><p className="section-eyebrow">01 / CHOOSE YOUR ROOM</p><h3 className="mt-2 text-2xl font-semibold">Rooms & suites</h3></div><p className="text-xs text-slate">Select a room to see its price and availability.</p></div>
          <div className="mt-4 grid gap-3">{eligible.map(item => <RoomChoice key={item.id} room={item} selected={roomId === item.id} dates={dates} checking={checking} available={availability[item.id]} onSelect={() => setRoomId(item.id)}/>)}</div>
          {dates.start && dates.end && !checking && eligible.length > 0 && eligible.every(item => availability[item.id] === false) && <div role="status" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{ruleMessage || 'No rooms are available for these dates. Change your dates or contact the property.'}</div>}
          {eligible.length === 0 && <p className="mt-4 text-sm text-slate">No room fits this guest count. Try fewer guests.</p>}
          {(rules?.house_rules || rules?.cancellation_policy) && <details className="mt-9 rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-semibold">House rules & cancellation</summary><div className="mt-5 grid gap-5 sm:grid-cols-2">{rules.house_rules && <div><h4 className="font-semibold">House rules</h4><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate">{rules.house_rules}</p></div>}{rules.cancellation_policy && <div><h4 className="font-semibold">Cancellation policy</h4><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate">{rules.cancellation_policy}</p></div>}</div></details>}
        </div>

        <form id="booking-form" onSubmit={submit} className="surface-card h-fit scroll-mt-24 p-5 sm:p-6 lg:sticky lg:top-28">
          <p className="section-eyebrow">02 / CHECK YOUR DATES</p>
          <h2 className="mt-2 text-xl font-semibold">Book your stay</h2>
          <p className="mt-1 text-sm text-slate">{room?.name || 'Choose a room'} <span aria-hidden="true">·</span> from <strong className="text-navy">{money(room?.base_rate || 0)}</strong> / night</p>
          <div className="mt-5"><DateRangePicker value={dates} onChange={setDates} label="Check-in – check-out"/></div>
          <label className="field mt-4">Guests<input type="number" min="1" max={maxGuests} value={guests} onChange={event => setGuests(Number(event.target.value))}/></label>
          {room && Number(room.extra_guest_fee) > 0 && guests > includedGuests(room) && <p className="mt-2 text-xs text-slate">{guests - includedGuests(room)} extra {guests - includedGuests(room) === 1 ? 'guest' : 'guests'} × {money(room.extra_guest_fee)} per night is added at checkout.</p>}
          {!dates.start || !dates.end ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate">Select your dates to check availability and see the full price.</p> : checking ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate" role="status">Checking your dates…</p> : !roomAvailable ? <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800" role="status">{ruleMessage || 'This room is not available for your dates. Try another room or date range.'}</p> : null}

          {roomAvailable && <>
            {room && roomExtras.length > 0 && <fieldset className="mt-6 border-t border-slate-100 pt-5"><legend className="text-sm font-semibold">Add extras <span className="font-normal text-slate">(optional)</span></legend><div className="mt-2 grid gap-2">{roomExtras.map(addOn => { const qty = extras[addOn.id] || 0; return <div key={addOn.id} className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${qty > 0 ? 'border-pink/50 bg-pink/5' : 'border-slate-200'}`}><label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">{addOn.max_quantity === 1 && <input type="checkbox" className="mt-0.5 size-4 accent-[var(--brand-pink)]" checked={qty > 0} onChange={event => setExtra(addOn.id, event.target.checked ? 1 : 0)}/>}<span className="min-w-0"><span className="block font-semibold">{addOn.name}</span><span className="block text-xs text-slate">{money(addOn.price)} {pricingLabel[addOn.pricing]}{addOn.description ? ` · ${addOn.description}` : ''}</span></span></label>{addOn.max_quantity > 1 && <div className="flex items-center gap-1"><button type="button" aria-label={`Fewer ${addOn.name}`} disabled={qty === 0} onClick={() => setExtra(addOn.id, qty - 1)} className="grid size-7 place-items-center rounded-full border border-slate-200 disabled:opacity-40">−</button><span className="w-5 text-center font-semibold" aria-live="polite">{qty}</span><button type="button" aria-label={`More ${addOn.name}`} disabled={qty >= addOn.max_quantity} onClick={() => setExtra(addOn.id, qty + 1)} className="grid size-7 place-items-center rounded-full border border-slate-200 disabled:opacity-40">+</button></div>}</div>; })}</div></fieldset>}

            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm" aria-live="polite">
              {quote ? <><div className="flex items-end justify-between gap-3"><div><p className="font-semibold">Your stay total</p><p className="mt-1 text-xs text-slate">{quote.nights} {quote.nights === 1 ? 'night' : 'nights'} · all fees included</p></div><strong className="text-xl text-navy">{money(quote.total)}</strong></div><details className="mt-3 border-t border-slate-200 pt-3"><summary className="cursor-pointer text-xs font-semibold text-slate">View price details</summary><dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5"><dt className="text-slate">Room subtotal</dt><dd>{money(quote.subtotal)}</dd>{quote.extra_guest_fee > 0 && <><dt className="text-slate">Extra guests</dt><dd>{money(quote.extra_guest_fee)}</dd></>}{quote.discounts.map(line => <Fragment key={line.label}><dt className="text-green-700">{line.label}</dt><dd className="text-green-700">−{money(line.amount)}</dd></Fragment>)}{quote.add_ons.map(line => <Fragment key={line.id}><dt className="text-slate">{line.name}{line.quantity > 1 ? ` ×${line.quantity}` : ''}</dt><dd>{money(line.amount)}</dd></Fragment>)}{quote.cleaning_fee > 0 && <><dt className="text-slate">Cleaning fee</dt><dd>{money(quote.cleaning_fee)}</dd></>}{quote.service_fee > 0 && <><dt className="text-slate">Service fee</dt><dd>{money(quote.service_fee)}</dd></>}{quote.tax > 0 && <><dt className="text-slate">{quote.tax_label}</dt><dd>{money(quote.tax)}</dd></>}</dl></details></> : quoteError ? <p role="alert" className="text-red-600">{quoteError}</p> : <p className="text-slate">Calculating your total…</p>}
            </div>
            <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">Have a promo code?</summary><div className="mt-3">{promo ? <p className="flex items-center justify-between gap-2"><span>Code <strong className="font-mono">{promo}</strong> applied</span><button type="button" onClick={() => { setPromo(''); setPromoInput(''); }} className="text-xs font-semibold text-slate underline">Remove</button></p> : <div className="flex gap-2"><input aria-label="Promo code" placeholder="Promo code" maxLength={20} className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 font-mono uppercase" value={promoInput} onChange={event => { setPromoInput(event.target.value.toUpperCase()); setPromoError(''); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (promoInput.trim()) setPromo(promoInput.trim()); } }}/><button type="button" disabled={!promoInput.trim()} onClick={() => setPromo(promoInput.trim())} className="rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold disabled:opacity-50">Apply</button></div>}{promoError && <p role="alert" className="mt-1.5 text-xs text-red-600">{promoError}</p>}</div></details>

            <div className="mt-6 border-t border-slate-100 pt-5"><p className="section-eyebrow">03 / YOUR DETAILS</p><h3 className="mt-2 text-lg font-semibold">Who’s checking in?</h3><div className="mt-4 grid gap-3"><label className="field">Full name<input required autoComplete="name" value={name} onChange={event => setName(event.target.value)}/></label><label className="field">Email<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)}/></label><label className="field">Phone (optional)<input type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)}/></label></div></div>
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            <button disabled={!bookable || !room || !quote} className="guest-button mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50">Continue to review <ArrowRight size={18}/></button>
            {!bookable && <p className="mt-3 text-center text-xs text-slate">Bookings are temporarily unavailable.</p>}
            <p className="mt-3 text-center text-xs text-slate">You’ll review your details before payment.</p>
          </>}
          {rules && <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate">Check-in from {time12(rules.check_in_time)} · Check-out by {time12(rules.check_out_time)}</p>}
        </form>
      </div>
      {reviews.length > 0 && <section className="mt-14 border-t border-slate-200 pt-10" aria-labelledby="guest-reviews"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="section-eyebrow">Guest reviews</p><h2 id="guest-reviews" className="section-title mt-2">Stayed here, loved here.</h2></div><p className="flex items-center gap-2 font-semibold"><Star size={19} className="fill-amber-400 text-amber-400"/>{reviewSummary?.average} from {reviewSummary?.count} {reviewSummary?.count === 1 ? 'review' : 'reviews'}</p></div><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{reviews.map(review => <article key={review.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex gap-1" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} className={index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}/>)}</div><p className="mt-3 text-sm leading-6">{review.comment || 'A great stay.'}</p><p className="mt-4 text-xs font-semibold text-slate">{review.user?.name || 'Verified guest'}</p></article>)}</div></section>}
    </div>
  </GuestShell>;
}

function RoomChoice({ room, selected, dates, checking, available, onSelect }: {
  room: Room;
  selected: boolean;
  dates: DateRange;
  checking: boolean;
  available?: boolean;
  onSelect: () => void;
}) {
  const unavailable = Boolean(dates.start && dates.end && !checking && !available);
  return <div className={`surface-card overflow-hidden ${selected ? 'border-pink shadow-md' : ''} ${unavailable ? 'opacity-60' : ''}`}>
    <button type="button" onClick={onSelect} disabled={unavailable} className="w-full p-4 text-left disabled:cursor-not-allowed sm:p-5" aria-pressed={selected}>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-2"><div className="min-w-0"><h4 className="font-semibold">{room.name}</h4><p className="mt-1 text-xs text-slate">{roomSpecs(room)} · Up to {room.maximum_occupancy} guests</p></div><div className="text-left sm:text-right"><strong className="block whitespace-nowrap text-sm text-pink">{money(room.base_rate)} / night</strong><span className="mt-1 block text-xs font-semibold text-slate">{selected ? 'Selected room' : 'Select room'}</span></div></div>
      {dates.start && dates.end && <p className="mt-2 text-xs text-slate">{checking ? 'Checking availability…' : available ? 'Available for your dates' : 'Unavailable for these dates'}</p>}
      {selected && <><p className="mt-3 text-sm leading-6 text-slate">{room.description}</p>{Number(room.extra_guest_fee) > 0 && includedGuests(room) < room.maximum_occupancy && <p className="mt-2 text-xs text-slate">Rate covers {includedGuests(room)} · {money(room.extra_guest_fee)} per extra guest / night</p>}{room.min_nights && room.min_nights > 1 && <p className="mt-1 text-xs text-slate">Minimum {room.min_nights} nights</p>}{(room.amenities || []).length > 0 && <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Amenities">{(room.amenities || []).slice(0, 5).map(amenity => <li key={amenity} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs"><Check size={12}/>{amenity}</li>)}</ul>}</>}
    </button>
    {selected && (room.photos?.length || 0) > 0 && <ImageGallery className="grid grid-cols-3 gap-2 px-4 pb-4 sm:grid-cols-4 sm:px-5 sm:pb-5" imageClassName="h-20" items={(room.photos || []).map((src, index) => ({ src, alt: `${room.name} photo ${index + 1}` }))}/>}
  </div>;
}
