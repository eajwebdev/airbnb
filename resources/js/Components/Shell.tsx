import { Link, usePage, router } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import FlashToast from './FlashToast';

type AuthUser = { name: string; role: string } | null;
export default function Shell({ children }: PropsWithChildren) {
  const { auth } = usePage<{ auth: { user: AuthUser } }>().props;
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-[var(--background)]">
    <FlashToast/><header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--brand-navy)] text-white shadow-lg shadow-slate-900/10">
      <div className="container flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-wide"><img src="/branding/eaj-primary.png" alt="EAJ Web Development Services" className="h-10 max-w-36 object-contain" /><span className="hidden border-l border-white/30 pl-3 text-xs uppercase tracking-[.24em] text-white/70 sm:block">Booking</span></Link>
        <button aria-label="Toggle menu" className="md:hidden" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
        <nav className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-20 flex-col gap-1 bg-[var(--brand-navy)] p-5 md:static md:flex md:flex-row md:items-center md:gap-7 md:bg-transparent md:p-0`}>
          <Link href="/stays" className="navlink">Explore stays</Link><Link href="/platform" className="navlink">Platform</Link>
          {auth.user ? <><Link href={auth.user.role === 'SUPERADMIN' ? '/superadmin' : auth.user.role === 'GUEST' ? '/account/bookings' : '/admin'} className="navlink">Dashboard</Link>{auth.user.role==='SUPERADMIN'&&<Link href="/superadmin/clients" className="navlink">Clients</Link>}{['ADMIN','STAFF'].includes(auth.user.role)&&<><Link href="/admin/properties" className="navlink">Properties</Link><Link href="/admin/bookings" className="navlink">Bookings</Link></>}<button className="navlink text-left" onClick={() => router.post('/logout')}>Sign out</button></> : <Link href="/login" className="btn btn-pink text-center">Sign in</Link>}
        </nav>
      </div>
    </header>
    <main>{children}</main>
    <footer className="bg-[var(--brand-navy)] text-white"><div className="container grid gap-10 py-14 md:grid-cols-3"><div><img src="/branding/eaj-primary.png" alt="EAJ" className="h-12 max-w-40 object-contain"/><p className="mt-5 max-w-xs text-sm leading-6 text-white/60">Powering better stays for modern Philippine hospitality.</p></div><div><h3 className="font-semibold">Explore</h3><div className="mt-4 grid gap-2 text-sm text-white/60"><Link href="/stays">Stays</Link><Link href="/platform">Platform</Link></div></div><div><h3 className="font-semibold">EAJ Web Development Services</h3><p className="mt-4 text-sm text-white/60">Built in the Philippines, for hospitality businesses everywhere.</p></div></div><div className="border-t border-white/10 py-5 text-center text-xs text-white/40">© {new Date().getFullYear()} EAJ Web Development Services</div></footer>
  </div>;
}


