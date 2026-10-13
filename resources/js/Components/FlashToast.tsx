import { usePage } from '@inertiajs/react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
export default function FlashToast(){
  const {flash,errors}=usePage<{flash:{success?:string|null};errors:Record<string,string>}>().props;
  const message=flash?.success||Object.values(errors||{})[0]||'';
  const kind=flash?.success?'success':'error';
  const [visible,setVisible]=useState(false);
  useEffect(()=>{if(!message)return;setVisible(true);const timer=window.setTimeout(()=>setVisible(false),5000);return()=>window.clearTimeout(timer);},[message]);
  return visible&&message?<div role={kind==='error'?'alert':'status'} className={`fixed bottom-5 right-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border bg-white p-4 text-sm font-semibold text-navy shadow-2xl ${kind==='error'?'border-rose-200':'border-emerald-200'}`}>{kind==='error'?<CircleAlert className="shrink-0 text-rose-600" size={20}/>:<CircleCheck className="shrink-0 text-emerald-600" size={20}/>}<span>{message}</span><button type="button" className="ml-2" aria-label="Dismiss notification" onClick={()=>setVisible(false)}><X size={17}/></button></div>:null;
}
