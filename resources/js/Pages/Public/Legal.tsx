import { Head } from '@inertiajs/react';
import GuestShell, { type SiteTenant } from '../../Components/GuestShell';

export default function Legal({ tenant, title, body }: { tenant: SiteTenant; page: 'privacy' | 'terms'; title: string; body: string }) {
  return <GuestShell tenant={tenant}><Head title={`${title} | ${tenant?.business_name ?? ''}`}/>
    <article className="container max-w-3xl py-14"><p className="section-eyebrow">{tenant?.business_name}</p><h1 className="section-title mt-3">{title}</h1>
      <div className="mt-8 whitespace-pre-line leading-8 text-slate">{body}</div></article>
  </GuestShell>;
}
