import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import Shell from '../../Components/Shell';

const roles = [
  ['admin', 'Property management'],
  ['staff', 'Booking operations'],
  ['guest', 'Customer experience'],
];

export default function Login() {
  const { demo } = usePage<{ demo: boolean }>().props;
  const form = useForm<{ email: string; password: string; remember: boolean }>({
    email: '',
    password: '',
    remember: false,
  });

  return <Shell>
    <Head title="Sign in | EAJ Booking"/>
    <div className="grid min-h-[calc(100svh-80px)] min-w-0 lg:grid-cols-2">
      <div className="relative hidden min-h-full overflow-hidden bg-navy lg:block">
        <img
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=85"
          alt="Coastal accommodation"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent"/>
        <div className="absolute bottom-10 left-8 right-8 text-white xl:bottom-16 xl:left-12 xl:right-12">
          <p className="section-eyebrow">EAJ Booking Platform</p>
          <h1 className="mt-4 max-w-lg font-serif text-4xl leading-tight xl:text-5xl">Your next great stay starts here.</h1>
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-center px-4 py-9 sm:px-8 sm:py-12 lg:px-8 lg:py-10 xl:px-16">
        <div className="w-full min-w-0 max-w-md">
          <p className="section-eyebrow">Welcome back</p>
          <h1 className="section-title mt-3">Sign in to continue.</h1>
          <p className="mt-4 text-slate">Manage your reservations and hospitality business in one place.</p>

          <form onSubmit={e => { e.preventDefault(); form.post('/login'); }} className="mt-8 grid gap-5 sm:mt-9">
            <label className="field">Email address
              <input type="email" required autoComplete="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)}/>
              {form.errors.email && <span className="text-xs text-red-600">{form.errors.email}</span>}
            </label>
            <label className="field">Password
              <input type="password" required autoComplete="current-password" value={form.data.password} onChange={e => form.setData('password', e.target.value)}/>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate">
              <input type="checkbox" checked={form.data.remember} onChange={e => form.setData('remember', e.target.checked)}/>
              Remember me
            </label>
            <button className="btn btn-pink w-full" disabled={form.processing}>Sign in</button>
          </form>

          <p className="mt-5 text-sm text-slate">New here? <Link href="/register" className="font-semibold text-pink">Create a guest account</Link></p>

          {demo && <div className="mt-8 border-t border-slate-200 pt-7 sm:mt-9">
            <h2 className="font-semibold">Quick Demo Access</h2>
            <p className="mt-1 text-sm text-slate">Explore the platform with a seeded demo account.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
              {roles.map(([role, label]) => <button
                key={role}
                type="button"
                onClick={() => router.post('/demo/login', { role })}
                className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-pink hover:shadow-md"
              >
                <strong className="block break-words capitalize">{role}</strong>
                <span className="mt-1 block break-words text-xs text-slate">{label}</span>
              </button>)}
            </div>
          </div>}
        </div>
      </div>
    </div>
  </Shell>;
}
