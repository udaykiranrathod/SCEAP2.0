// frontend/src/components/layout/Topbar.tsx
import React from 'react';
import BackendStatus from './BackendStatus';
import { api } from '../../api/client';

const Topbar: React.FC = () => {
  return (
    <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-sceap-border bg-black/30 backdrop-blur-xl">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Module</div>
        <div className="text-sm md:text-base font-semibold text-slate-100">
          Cable Sizing &amp; Visualization
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:inline text-xs text-slate-400">
          API: <span className="text-slate-100 font-semibold">{String(api.defaults.baseURL)}</span>
        </div>
        {/* Show a visible warning if the API baseURL looks like local 127.0.0.1 or http (in codespaces this will not work) */}
        {String(api.defaults.baseURL).includes('127.0.0.1') || String(api.defaults.baseURL).startsWith('http://') ? (
          <div className="text-[10px] px-2 py-0.5 rounded-full bg-rose-700/10 border border-rose-800 text-rose-200">API: Local (not reachable from Codespaces)</div>
        ) : null}
        <BackendStatus />
        <span className="hidden sm:inline text-xs text-slate-400">
          Project: <span className="text-slate-100">Demo Power Plant</span>
        </span>
        <button className="h-8 px-3 rounded-full bg-sceap-panel text-xs text-slate-300 border border-sceap-border hover:border-sceap-accent-soft hover:text-sceap-accent-soft transition">
          🔁 Recalculate All
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sceap-accent-soft to-indigo-500 flex items-center justify-center text-xs font-bold">
          U
        </div>
      </div>
    </header>
  );
};

export default Topbar;
