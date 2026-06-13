"use client";
import { useState, useEffect } from 'react';

export default function SecurityToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ghostMode');
    if (saved !== null) setEnabled(saved === 'true');
  }, []);

  const toggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    localStorage.setItem('ghostMode', String(newState));
    // Dispatch storage event manually for same-tab updates if testing on same screen
    window.dispatchEvent(new StorageEvent('storage', { key: 'ghostMode', newValue: String(newState) }));
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
      <div>
        <h3 className="text-emerald-400 font-bold">Ghost Player Security</h3>
        <p className="text-slate-400 text-sm">Enable DevTools booby traps and UI locks.</p>
      </div>
      <button 
        onClick={toggle}
        className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-700'} relative`}
      >
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
