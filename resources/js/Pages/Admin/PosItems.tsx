import { Head, router, useForm } from '@inertiajs/react';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Empty } from '../../Components/ops';
import SettingsLayout from '../../Components/SettingsLayout';
import { money } from '../../types';

type Item = { id: number; name: string; category: string; price: string; track_stock: boolean; stock: number; active: boolean };
const blank = { name: '', category: 'Minibar', price: '', track_stock: false, stock: 0, active: true };

export default function PosItems({ items }: { items: Item[] }) {
  const [editing, setEditing] = useState<Item | 'new' | null>(items.length ? null : 'new');
  const categories = Array.from(new Set(['Minibar', 'Snacks', 'Food', 'Services', 'Housekeeping', ...items.map(i => i.category)]));
  const grouped = categories.map(c => [c, items.filter(i => i.category === c)] as const).filter(([, list]) => list.length);
  return <SettingsLayout title="POS items" subtitle="What staff can sell at the counter: minibar, food, services and fees. Prices include tax."
    actions={editing === null ? <button type="button" onClick={() => setEditing('new')} className="btn btn-pink"><Plus size={15}/>Add item</button> : undefined}>
    <Head title="POS items | Settings"/>
    {editing !== null && <ItemForm key={editing === 'new' ? 'new' : editing.id} item={editing === 'new' ? null : editing} categories={categories} onDone={() => setEditing(null)}/>}
    {items.length === 0 && editing === null && <div className="card"><Empty icon={<Package size={18}/>} title="No items yet" body="Add the things guests buy on-site."/></div>}
    <div className="mt-5 grid gap-5">{grouped.map(([category, list]) => <section key={category} className="card overflow-hidden">
      <h3 className="border-b border-[var(--line)] px-5 py-3 text-sm font-bold">{category} <span className="font-semibold text-[var(--muted)]">· {list.length}</span></h3>
      <ul>{list.map(item => <li key={item.id} className={`flex flex-wrap items-center gap-3 border-b border-[var(--line)] px-5 py-3 last:border-0 ${item.active ? '' : 'opacity-55'}`}>
        <span className="min-w-0 flex-1"><span className="block font-bold">{item.name}{!item.active && <span className="pill ml-2">hidden</span>}</span><span className="num text-sm text-[var(--muted)]">{money(item.price)}</span></span>
        {item.track_stock ? <StockControl item={item}/> : <span className="text-xs font-semibold text-[var(--muted)]">No stock tracking</span>}
        <button type="button" onClick={() => setEditing(item)} className="btn btn-light btn-sm"><Pencil size={13}/>Edit</button>
        <button type="button" aria-label={`Delete ${item.name}`} onClick={() => confirm(`Delete ${item.name}? Past receipts keep it.`) && router.delete(`/admin/settings/pos-items/${item.id}`, { preserveScroll: true })} className="btn btn-danger btn-sm"><Trash2 size={13}/></button>
      </li>)}</ul>
    </section>)}</div>
  </SettingsLayout>;
}

function StockControl({ item }: { item: Item }) {
  const [change, setChange] = useState('');
  const apply = (e: FormEvent) => { e.preventDefault(); const n = Number(change); if (!Number.isInteger(n) || n === 0) return; router.put(`/admin/settings/pos-items/${item.id}/stock`, { change: n }, { preserveScroll: true, onSuccess: () => setChange('') }); };
  return <form onSubmit={apply} className="flex items-center gap-2"><span className={`num text-sm font-semibold ${item.stock <= 3 ? 'text-[var(--danger)]' : ''}`}>{item.stock} in stock</span><input type="number" step="1" value={change} onChange={e => setChange(e.target.value)} placeholder="+12 / -2" aria-label={`Adjust stock for ${item.name}`} className="num w-24 rounded-lg border border-[var(--line)] bg-[#f4f6fa] px-2 py-1 text-sm"/><button className="btn btn-soft btn-sm">Adjust</button></form>;
}

function ItemForm({ item, categories, onDone }: { item: Item | null; categories: string[]; onDone: () => void }) {
  const form = useForm(item ? { name: item.name, category: item.category, price: item.price, track_stock: item.track_stock, stock: item.stock, active: item.active } : blank);
  const submit = (e: FormEvent) => { e.preventDefault(); const opts = { preserveScroll: true, onSuccess: onDone }; if (item) form.put(`/admin/settings/pos-items/${item.id}`, opts); else form.post('/admin/settings/pos-items', opts); };
  const err = (k: keyof typeof blank) => form.errors[k] && <small role="alert" className="font-semibold text-[var(--danger)]">{form.errors[k]}</small>;
  return <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-2">
    <h3 className="font-bold sm:col-span-2">{item ? `Edit ${item.name}` : 'New item'}</h3>
    <label className="field">Name<input required autoFocus maxLength={80} value={form.data.name} onChange={e => form.setData('name', e.target.value)} placeholder="e.g. Bottled water"/>{err('name')}</label>
    <label className="field">Category<input required maxLength={40} list="pos-categories" value={form.data.category} onChange={e => form.setData('category', e.target.value)}/><datalist id="pos-categories">{categories.map(c => <option key={c} value={c}/>)}</datalist>{err('category')}</label>
    <label className="field">Price<input required type="number" min="0" step="0.01" value={form.data.price} onChange={e => form.setData('price', e.target.value)}/>{err('price')}</label>
    <div className="grid gap-2">
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.data.track_stock} onChange={e => form.setData('track_stock', e.target.checked)} className="size-4 accent-[#F3176C]"/>Track stock</label>
      {form.data.track_stock && <label className="field">{item ? 'Stock on hand' : 'Opening stock'}<input type="number" min="0" step="1" value={form.data.stock} onChange={e => form.setData('stock', Number(e.target.value))}/>{err('stock')}</label>}
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.data.active} onChange={e => form.setData('active', e.target.checked)} className="size-4 accent-[#F3176C]"/>Show on the register</label>
    </div>
    <div className="flex gap-2 sm:col-span-2"><button type="button" onClick={onDone} className="btn btn-light">Cancel</button><button disabled={form.processing} className="btn btn-pink">{item ? 'Save item' : 'Add item'}</button></div>
  </form>;
}
