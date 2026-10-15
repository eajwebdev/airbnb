import * as Dialog from '@radix-ui/react-dialog';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState, type KeyboardEvent } from 'react';

export type DateRange = { start: string; end: string };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const add = (d: Date, days: number) => { const next = new Date(d); next.setDate(next.getDate() + days); return next; };
const label = (s: string) => s ? parse(s).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select dates';
const same = (a: Date, b: Date) => iso(a) === iso(b);

export default function DateRangePicker({ value, onChange, mode = 'booking', label: title = 'Dates', className = '' }: {
  value: DateRange; onChange: (range: DateRange) => void; mode?: 'booking' | 'report'; label?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(value);
  const [month, setMonth] = useState(() => { const date = value.start ? parse(value.start) : new Date(); return new Date(date.getFullYear(), date.getMonth(), 1); });
  useEffect(() => { if (open) { setDraft({ start: value.start, end: value.end }); setMonth(new Date((value.start ? parse(value.start) : new Date()).getFullYear(), (value.start ? parse(value.start) : new Date()).getMonth(), 1)); } }, [open, value.start, value.end]);
  const today = iso(new Date());
  const days = Array.from({ length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1, 12));
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  function pick(date: Date) {
    const selected = iso(date);
    setDraft(!draft.start || draft.end || selected < draft.start ? { start: selected, end: '' } : { start: draft.start, end: selected });
  }
  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, day: Date) {
    const delta = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key as 'ArrowLeft'|'ArrowRight'|'ArrowUp'|'ArrowDown'];
    if (delta === undefined) return;
    event.preventDefault();
    const target = add(day, delta);
    if (mode === 'booking' && iso(target) < today) return;
    if (target.getMonth() !== month.getMonth() || target.getFullYear() !== month.getFullYear()) setMonth(new Date(target.getFullYear(), target.getMonth(), 1));
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-calendar-date="${iso(target)}"]`)?.focus());
  }
  function preset(kind: 'today' | 'week' | 'month' | 'lastMonth' | 'year') {
    const now = new Date();
    const ranges = {
      today: { start: iso(now), end: iso(now) },
      week: { start: iso(add(now, -((now.getDay() + 6) % 7))), end: iso(now) },
      month: { start: iso(new Date(now.getFullYear(), now.getMonth(), 1)), end: iso(now) },
      lastMonth: { start: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), end: iso(new Date(now.getFullYear(), now.getMonth(), 0)) },
      year: { start: iso(new Date(now.getFullYear(), 0, 1)), end: iso(now) },
    };
    setDraft(ranges[kind]); setMonth(parse(ranges[kind].start));
  }
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild><button type="button" className={`date-trigger ${className}`} aria-label={`${title}: ${value.start ? label(value.start) : 'select start'} to ${value.end ? label(value.end) : 'select end'}`}><CalendarDays size={19} aria-hidden="true"/><span><small>{title}</small><strong>{value.start && value.end ? `${label(value.start)} – ${label(value.end)}` : 'Select date range'}</strong></span></button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="date-overlay"/><Dialog.Content className="date-dialog" aria-describedby={undefined}>
      <div className="flex items-center justify-between gap-4"><div><Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title><p className="mt-1 text-sm text-slate">{mode === 'booking' ? 'Choose check-in, then check-out.' : 'Choose the dates for this report.'}</p></div><Dialog.Close className="icon-button" aria-label="Close calendar"><X size={20}/></Dialog.Close></div>
      {mode === 'report' && <div className="mt-5 flex flex-wrap gap-2">{([['today','Today'],['week','This week'],['month','This month'],['lastMonth','Last month'],['year','This year']] as const).map(([key, text]) => <button key={key} type="button" className="date-preset" onClick={() => preset(key)}>{text}</button>)}</div>}
      <div className="mt-6 flex items-center justify-between"><button type="button" className="icon-button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={20}/></button><strong>{month.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</strong><button type="button" className="icon-button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={20}/></button></div>
      <div className="date-grid mt-4">{['M','T','W','T','F','S','S'].map((day, i) => <span key={i} className="date-weekday">{day}</span>)}{Array.from({length: offset}, (_, i) => <span key={`blank-${i}`}/>)}{days.map(day => { const date = iso(day); const selected = date === draft.start || date === draft.end; const inRange = !!draft.end && date > draft.start && date < draft.end; const disabled = mode === 'booking' && date < today; return <button type="button" key={date} data-calendar-date={date} disabled={disabled} onClick={() => pick(day)} onKeyDown={event => moveFocus(event, day)} aria-label={day.toLocaleDateString('en-PH', { dateStyle: 'full' })} aria-pressed={selected} className={`date-day ${selected ? 'selected' : ''} ${inRange ? 'in-range' : ''} ${same(day, new Date()) ? 'today' : ''}`}>{day.getDate()}</button>; })}</div>
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-5"><span className="text-sm text-slate">{draft.start ? label(draft.start) : 'Start'} → {draft.end ? label(draft.end) : 'End'}</span><div className="flex gap-2"><button type="button" className="btn btn-light border border-slate-200" onClick={() => { onChange({start:'',end:''}); setOpen(false); }}>Clear</button><button type="button" className="btn btn-pink" disabled={!draft.start || !draft.end || (mode === 'booking' && draft.end === draft.start)} onClick={() => { onChange(draft); setOpen(false); }}>Apply</button></div></div>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
