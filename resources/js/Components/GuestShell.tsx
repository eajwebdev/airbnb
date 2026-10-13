import { Link, router, usePage } from '@inertiajs/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useState, type PropsWithChildren } from 'react';
import FlashToast from './FlashToast';
import type { TenantSettings } from '../types';

export type SiteTenant = { slug: string; business_name: string; logo: string | null; primary_color: string; secondary_color: string; business_email: string | null; business_phone: string | null; hero_headline: string | null; hero_description: string | null; hero_image: string | null; business_address: string | null; settings?: TenantSettings } | null;
export default function GuestShell({ tenant, children }: PropsWithChildren<{ tenant: SiteTenant }>) {
  const [open, setOpen] = useState(false);
  const { auth } = usePage<{ auth: { user: { role: string } | null } }>().props;
  const suffix = tenant ? `?tenant=${encodeURIComponent(tenant.slug)}` : '';
  return <div className="guest-site min-h-screen" style={{ '--guest-primary': tenant?.primary_color || '#0A1134', '--guest-accent': tenant?.secondary_color || '#F3176C' } as React.CSSProperties}>
    <FlashToast/><header className="guest-header"><div className="container flex h-20 items-center justify-between gap-4"><Link href={`/${suffix}`} className={`guest-brand ${tenant?.logo ? 'has-tenant-logo' : ''}`} aria-label={`${tenant?.business_name || 'EAJ Stays'} home`}><img src={tenant?.logo || '/branding/eaj-primary.png'} alt={tenant?.business_name || 'EAJ Web Development Services'}/></Link><button type="button" className="guest-menu-button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="guest-navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button><nav id="guest-navigation" className={`${open ? 'flex' : 'hidden'} guest-nav md:flex`}><Link href={`/stays${suffix}`} onClick={() => setOpen(false)}>Explore stays</Link>{auth.user?.role === 'GUEST' && <Link href="/account/bookings">My bookings</Link>}{auth.user ? <button type="button" onClick={() => router.post('/logout')}>Sign out</button> : <Link href="/login">Sign in</Link>}<Link className="guest-nav-cta" href={`/stays${suffix}`}>Book now <ArrowUpRight size={16}/></Link></nav></div></header>
    <main>{children}</main>
    <footer className="guest-footer"><div className="container grid gap-10 py-14 md:grid-cols-3"><div><h2 className="text-xl font-semibold">{tenant?.business_name || 'Discover stays'}</h2><p className="mt-4 max-w-sm text-sm leading-7 text-white/65">Explore available rooms and book your next stay directly.</p></div><div><h3 className="font-semibold">Explore</h3><div className="mt-4 grid gap-3 text-sm text-white/70"><Link href={`/stays${suffix}`}>All stays</Link><Link href="/account/bookings">My bookings</Link></div></div><div><h3 className="font-semibold">Contact</h3><div className="mt-4 grid gap-3 text-sm text-white/70">{tenant?.business_email && <a href={`mailto:${tenant.business_email}`}>{tenant.business_email}</a>}{tenant?.business_phone && <a href={`tel:${tenant.business_phone}`}>{tenant.business_phone}</a>}{tenant?.business_address && <p>{tenant.business_address}</p>}</div></div></div><div className="border-t border-white/10 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} {tenant?.business_name || 'Stays'} · Powered by <Link href="/platform" className="underline underline-offset-2">EAJ Web Development Services</Link></div></footer>
  </div>;
}


