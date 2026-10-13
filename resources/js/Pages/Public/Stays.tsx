import { Head, Link, router } from '@inertiajs/react';
import { ArrowDown, ArrowRight, ArrowUpRight, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import DateRangePicker, { type DateRange } from '../../Components/DateRangePicker';
import FlashToast from '../../Components/FlashToast';
import type { SiteTenant } from '../../Components/GuestShell';
import { money, type Property } from '../../types';
import '../../../css/stays.css';

type Filters = { location?: string; check_in?: string; check_out?: string; guests?: number };
type PageLink = { url: string | null; label: string; active: boolean };

export default function Stays({ tenant, properties, filters }: {
  tenant: SiteTenant;
  properties: { data: Property[]; links: PageLink[] };
  filters: Filters;
}) {
  const [location, setLocation] = useState(filters.location || '');
  const [dates, setDates] = useState<DateRange>({ start: filters.check_in || '', end: filters.check_out || '' });
  const [guests, setGuests] = useState(filters.guests || 2);
  const featured = properties.data.find(property => property.cover_image);
  const heroImage = tenant?.hero_image || featured?.cover_image || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1800&q=85';
  const stayQuery = new URLSearchParams({
    check_in: filters.check_in || '',
    check_out: filters.check_out || '',
    guests: String(filters.guests || 2),
  }).toString();
  const homeUrl = tenant ? `/stays?tenant=${encodeURIComponent(tenant.slug)}` : '/stays';

  function search(event: React.FormEvent) {
    event.preventDefault();
    router.get('/stays', { tenant: tenant?.slug, location, check_in: dates.start, check_out: dates.end, guests });
  }

  return <div className="stays-landing">
    <Head title={`${tenant?.business_name || 'EAJ Stays'} | Book direct`}/>
    <Head><meta name="description" content={`Explore places to stay and book directly with ${tenant?.business_name || 'EAJ Stays'}.`}/></Head>
    <FlashToast/>

    <header className="sl-header">
      <div className="sl-header-inner">
        <Link href={homeUrl} className={`sl-brand ${tenant?.logo ? 'has-tenant-logo' : ''}`} aria-label={`${tenant?.business_name || 'EAJ Stays'} home`}>
          {tenant?.logo ? <img src={tenant.logo} alt={tenant.business_name}/> : <img src="/branding/eaj-primary.png" alt="EAJ Web Development Services"/>}
        </Link>
        <nav className="sl-nav" aria-label="Main navigation">
          <a href="#find-stay" className="sl-nav-book">Book now <ArrowUpRight size={16}/></a>
          <Link href="/login" className="sl-nav-signin">Sign in</Link>
        </nav>
      </div>
    </header>

    <main>
      <section className="sl-hero" aria-labelledby="sl-hero-title">
        <div className="sl-hero-copy">
          <p className="sl-eyebrow">{tenant?.business_name || 'EAJ STAYS'} <span>/</span> DIRECT BOOKING</p>
          <h1 id="sl-hero-title">Find your place.<br/><em>Stay your way.</em></h1>
          <p className="sl-hero-description">A considered collection of places to stay. Explore rooms, choose your dates and book directly with the property.</p>
          <div className="sl-hero-actions">
            <a href="#find-stay" className="sl-button sl-button-accent">Book your stay <ArrowUpRight size={18}/></a>
            <a href="#collection" className="sl-text-link">Explore the collection <ArrowDown size={17}/></a>
          </div>
          <div className="sl-hero-index"><span>THE COLLECTION</span><span>01 / DISCOVER</span></div>
        </div>
        <div className="sl-hero-visual">
          <img src={heroImage} alt=""/>
          {featured && <div className="sl-image-caption"><span>FEATURED STAY</span><strong>{featured.name}</strong><small>{featured.city}, {featured.province}</small></div>}
        </div>
      </section>

      <section id="find-stay" className="sl-search-wrap" aria-labelledby="sl-search-title">
        <div className="sl-search-intro"><div><p className="sl-eyebrow">MAKE YOUR MOVE</p><h2 id="sl-search-title">Where to next?</h2></div><p>Find the right place for the dates that matter.</p></div>
        <form onSubmit={search} className="sl-search-form">
          <label className="sl-field">Destination<input value={location} onChange={event => setLocation(event.target.value)} placeholder="City or property"/></label>
          <DateRangePicker value={dates} onChange={setDates} label="Stay dates" className="sl-date-trigger"/>
          <label className="sl-field">Guests<input type="number" min="1" max="20" value={guests} onChange={event => setGuests(Number(event.target.value))}/></label>
          <button type="submit" className="sl-button sl-button-dark"><Search size={18}/> Find stays</button>
        </form>
      </section>

      <section id="collection" className="sl-collection" aria-labelledby="sl-collection-title">
        <div className="sl-section-head"><div><p className="sl-eyebrow">THE PLACES</p><h2 id="sl-collection-title">Stays worth discovering.</h2></div><p>Thoughtful spaces for a few nights away, a longer pause, or wherever the journey takes you.</p></div>
        {properties.data.length ? <div className="sl-property-grid">{properties.data.map((property, index) => <LandingStayCard key={property.id} property={property} href={`/stays/${property.slug}?${stayQuery}`} index={index + 1}/>)}</div> : <div className="sl-empty"><p className="sl-eyebrow">NO MATCHES YET</p><h3>No stays found for this search.</h3><p>Try another destination or search without dates.</p><Link href={homeUrl} className="sl-button sl-button-dark">View all stays <ArrowRight size={17}/></Link></div>}
        {properties.links?.length > 3 && <nav aria-label="Pagination" className="sl-pagination">{properties.links.map((link, index) => link.url ? <Link key={index} href={link.url} className={link.active ? 'is-active' : ''} dangerouslySetInnerHTML={{ __html: link.label }}/> : null)}</nav>}
      </section>

      <section className="sl-how" aria-labelledby="sl-how-title"><div className="sl-how-heading"><p className="sl-eyebrow">BOOK DIRECT</p><h2 id="sl-how-title">From browsing<br/>to booked.</h2><p>Everything you need to make a confident choice, in one place.</p></div><div className="sl-steps"><div><span>01</span><h3>Search your dates.</h3><p>See stays with room options that work for your trip and your guests.</p></div><div><span>02</span><h3>Choose your room.</h3><p>Review the room details, availability and full price before you reserve.</p></div><div><span>03</span><h3>Keep your plans close.</h3><p>Get a booking reference and find your reservations in your guest account.</p></div></div></section>

      <section className="sl-final" aria-labelledby="sl-final-title"><p className="sl-eyebrow">YOUR NEXT STAY</p><h2 id="sl-final-title">A change of scene<br/><em>looks good on you.</em></h2><a href="#find-stay" className="sl-button sl-button-accent">Find your stay <ArrowUpRight size={18}/></a></section>
    </main>

    <footer className="sl-footer"><div><strong>{tenant?.business_name || 'EAJ Stays'}</strong><p>Explore, choose and book directly.</p></div><div className="sl-footer-links">{tenant?.business_email && <a href={`mailto:${tenant.business_email}`}>Contact</a>}<Link href="/login">Sign in</Link><a href="#find-stay">Book now</a></div><small>© {new Date().getFullYear()} {tenant?.business_name || 'EAJ Stays'} · Powered by EAJ Web Development Services</small></footer>
  </div>;
}

function LandingStayCard({ property, href, index }: { property: Property; href: string; index: number }) {
  const lowest = property.rooms.length ? Math.min(...property.rooms.map(room => Number(room.base_rate))) : 0;
  return <Link href={href} className="sl-stay-card">
    <div className="sl-stay-image">{property.cover_image ? <img src={property.cover_image} alt={property.name} loading="lazy"/> : <div className="sl-image-fallback"/>}<span>{String(index).padStart(2, '0')} / STAY</span></div>
    <div className="sl-stay-details"><div><p><MapPin size={14}/>{property.city}, {property.province}</p><h3>{property.name}</h3><span>{property.short_description}</span></div><div className="sl-stay-price"><small>FROM / NIGHT</small><strong>{money(lowest)}</strong><ArrowUpRight size={19}/></div></div>
  </Link>;
}
