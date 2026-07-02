"use client";
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import axios from '@/lib/axios';

export default function SecurityToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/admin/settings/ghost-mode/')
      .then(res => {
        setEnabled(res.data.ghost_mode_enabled);
      })
      .catch((err) => {
        console.error("Failed to load ghost mode setting:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    const newState = !enabled;
    setEnabled(newState); // Optimistic update
    setLoading(true);
    try {
      const res = await axios.put('/admin/settings/ghost-mode/', { ghost_mode_enabled: newState });
      setEnabled(res.data.ghost_mode_enabled);
    } catch {
      setEnabled(!newState); // Revert on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
      <div>
        <h3 className="text-emerald-400 font-bold">Ghost Player Security</h3>
        <p className="text-slate-400 text-sm">Enable DevTools booby traps and URL encryption.</p>
      </div>
      {loading ? (
        <Loader2 size={20} className="animate-spin text-slate-400" />
      ) : (
        <button 
          onClick={toggle}
          className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-700'} relative`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      )}
    </div>
  );
}
