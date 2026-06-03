'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminPage() {
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('');

  const addSeva = async () => {
    const { error } = await supabase.from('sevas').insert([{ title_en: title, cost: parseInt(cost) }]);
    if (error) alert(error.message);
    else {
      alert('Seva added! Refresh public page to see it.');
      setTitle(''); setCost('');
    }
  };

  return (
    <div className="p-10 max-w-md mx-auto bg-stone-100 min-h-screen">
      <h1 className="text-xl font-bold mb-6">Manage Public Data</h1>
      <input className="w-full p-2 mb-2 border" placeholder="Seva Name" value={title} onChange={e => setTitle(e.target.value)} />
      <input className="w-full p-2 mb-4 border" placeholder="Cost" value={cost} onChange={e => setCost(e.target.value)} />
      <button className="w-full bg-blue-600 text-white p-2 rounded" onClick={addSeva}>Push to Public Site</button>
    </div>
  );
}