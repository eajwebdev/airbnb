import { Link, router, usePage } from '@inertiajs/react';
import { Activity, BookOpen, Building2, CalendarDays, ChartLine, ChevronDown, CircleHelp, ClipboardCheck, Clock3, Ellipsis, Globe, LayoutGrid, LogOut, Menu, Settings, ShoppingBasket, SprayCan, Star, Users, X } from 'lucide-react';
import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';
import FlashToast from './FlashToast';

type Props = PropsWithChildren<{ title?: string; subtitle?: ReactNode; actions?: ReactNode; platform?: boolean; bare?: boolean }>;
type NavItem = readonly [href: string, label: string, icon: typeof LayoutGrid];

const opsNav: readonly NavItem[] = [
  ['/admin', 'Dashboard', LayoutGrid], ['/admin/calendar', 'Calendar', CalendarDays], ['/admin/cleaning', 'Cleaning', SprayCan], ['/admin/attendance', 'Attendance', Clock3],
  ['/admin/bookings', 'Booking', BookOpen], ['/admin/pos', 'POS', ShoppingBasket], ['/admin/insights', 'Insights', ChartLine],
];
const staffNav: readonly NavItem[] = [
  ['/admin/my-tasks', 'My tasks', ClipboardCheck], ['/admin/attendance', 'Attendance', Clock3], ['/admin/bookings', 'Bookings', BookOpen],
  ['/admin/calendar', 'Calendar', CalendarDays], ['/admin/pos', 'POS', ShoppingBasket],
];
const staffShortcuts: readonly NavItem[] = staffNav.filter(([href]) => href !== '/admin/calendar');
const platformNav: readonly NavItem[] = [['/superadmin', 'Overview', LayoutGrid], ['/superadmin/clients', 'Clients', Users], ['/superadmin/health', 'System health', Activity]];
const moreLinks: readonly NavItem[] = [['/admin/properties', 'Properties & units', Building2], ['/admin/customers', 'Customers', Users], ['/admin/reviews', 'Reviews', Star], ['/', 'Guest site', Globe], ['/admin/settings/help', 'Help & guides', CircleHelp]];

/** The EAJ artwork ships on a navy background, so it is cropped to the mark and wordmark and sits on the navy sidebar. */
function Logo({ platform, staff, compact = false }: { platform: boolean; staff: boolean; compact?: boolean }) {
  return <Link href={platform ? '/superadmin' : staff ? '/admin/my-tasks' : '/admin'} aria-label="EAJ home" className={`block overflow-hidden rounded-lg ${compact ? 'h-10 w-[84px]' : 'h-[68px] w-full max-w-[176px]'}`}>
    <img src="/branding/eaj-primary.png" alt="EAJ Web Development Services" className="h-full w-full scale-[1.08] object-cover"/>
  </Link>;
}

export default function DashboardShell({ children, title, subtitle, actions, platform = false, bare = false }: Props) {
  const [open, setOpen] = useState(false);
  const { auth, myTaskCount } = usePage<{ auth: { user: { name: string; role: string } }; myTaskCount?: number }>().props;
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const staff = auth.user.role === 'STAFF' && !platform;
  const nav = platform ? platformNav : staff ? staffNav : opsNav;
  const isActive = (href: string) => href === '/admin' || href === '/superadmin' ? path === href : path.startsWith(href);
  const [more, setMore] = useState(() => moreLinks.some(([href]) => href !== '/' && path.startsWith(href)));
  const inSettings = path.startsWith('/admin/settings') || path === '/admin/branding';
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  const linkClass = (on: boolean) => `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14.5px] transition ${on ? 'bg-[#F3176C] font-bold text-white shadow-[0_8px_20px_rgba(243,23,108,.28)]' : 'font-semibold text-white/65 hover:bg-white/8 hover:text-white'}`;
  const role = auth.user.role === 'ADMIN' ? 'Admin' : auth.user.role === 'STAFF' ? 'Staff' : 'Platform owner';

  return <div className={`tapp min-h-screen md:grid md:grid-cols-[200px_minmax(0,1fr)] ${staff ? 'staff-workspace' : ''}`}>
    <FlashToast/>
    <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-[#0A1134] px-3 md:hidden">
      <Logo platform={platform} staff={staff} compact/>
      <button type="button" className="grid size-10 place-items-center rounded-lg text-white" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    </div>
    {open && <button type="button" className="fixed inset-0 z-40 bg-black/40 md:hidden" aria-label="Close navigation" onClick={() => setOpen(false)}/>}
    <aside className={`${open ? 'fixed inset-y-0 left-0 z-50 flex w-[260px]' : 'hidden'} flex-col bg-[#0A1134] text-white md:sticky md:top-0 md:flex md:h-screen md:w-auto thin-scroll overflow-y-auto`}>
      <div className="px-3 pt-3"><Logo platform={platform} staff={staff}/></div>
      <p className="mt-5 px-5 text-[10px] font-bold uppercase tracking-[.2em] text-white/35">{platform ? 'Platform' : staff ? 'Staff workspace' : 'Operations'}</p>
      <nav className="mt-2 grid gap-1 px-2.5" aria-label="Main">
        {nav.map(([href, label, Icon]) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={isActive(href) ? 'page' : undefined} className={linkClass(isActive(href))}><Icon size={19} strokeWidth={1.8}/>{label}
          {href === '/admin/my-tasks' && (myTaskCount ?? 0) > 0 && <span className={`num ml-auto grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${isActive(href) ? 'bg-white text-[#F3176C]' : 'bg-[#F3176C] text-white'}`} aria-label={`${myTaskCount} open`}>{myTaskCount}</span>}</Link>)}
        {!platform && !staff && <>
          <button type="button" onClick={() => setMore(!more)} aria-expanded={more} className={linkClass(false)}><Ellipsis size={19}/>More<ChevronDown size={15} className={`ml-auto transition ${more ? 'rotate-180' : ''}`}/></button>
          {more && <div className="ml-5 grid gap-0.5 border-l border-white/10 pl-2">
            {moreLinks.map(([href, label, Icon]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold ${href !== '/' && path.startsWith(href) ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white'}`}><Icon size={15}/>{label}</Link>)}
          </div>}
        </>}
        {staff && <Link href="/admin/settings/profile" onClick={() => setOpen(false)} className={linkClass(inSettings)}><Settings size={19}/>My profile</Link>}
      </nav>
      <div className="mt-auto border-t border-white/10 p-2.5">
        <div className={`flex items-center gap-2.5 rounded-xl p-2 ${inSettings ? 'bg-white/10' : ''}`}>
          <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#F3176C] text-sm font-bold text-white">{(auth.user.name.trim()[0] || '?').toUpperCase()}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-bold">{auth.user.name}</p><p className="text-[11px] font-semibold text-white/50">{role}</p></div>
          {platform
            ? <button type="button" title="Sign out" aria-label="Sign out" onClick={() => router.post('/logout')} className="grid size-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"><LogOut size={17}/></button>
            : <Link href="/admin/settings/profile" title="Settings" aria-label="Settings" className={`grid size-8 place-items-center rounded-lg ${inSettings ? 'border border-white/60 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}><Settings size={17}/></Link>}
        </div>
      </div>
    </aside>
    <div className="min-w-0">
      {bare ? children : <>
        <header className="page-head px-5 pb-4 pt-5 md:px-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><h1 className="text-[22px] font-bold leading-tight tracking-tight">{title}</h1>{subtitle && <div className="mt-1 text-[13px] font-semibold text-[var(--muted)]">{subtitle}</div>}</div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </header>
        <main className="px-5 pb-10 md:px-7">{children}</main>
      </>}
    </div>
    {staff && <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[var(--line)] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(10,17,52,.08)] md:hidden" aria-label="Staff shortcuts">
      {staffShortcuts.map(([href, label, Icon]) => <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined} className={`flex min-h-[62px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-bold ${isActive(href) ? 'text-[#F3176C]' : 'text-[#66708a]'}`}><Icon size={20}/><span>{label}</span></Link>)}
    </nav>}
  </div>;
}
