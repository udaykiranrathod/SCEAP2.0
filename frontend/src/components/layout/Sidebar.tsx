// frontend/src/components/layout/Sidebar.tsx
import React from 'react';
import { LightningBoltIcon } from '@radix-ui/react-icons';

const Sidebar: React.FC = () => {
  const items = [
    'Dashboard',
    'Project Setup',
    'Cable Sizing',
    'Routing',
    'Tray Fill',
    'Raceway Viewer',
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 bg-black/40 border-r border-sceap-border backdrop-blur-xl">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-sceap-border">
        <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-sceap-accent to-sceap-accent-soft flex items-center justify-center shadow-soft-glow">
          <LightningBoltIcon className="h-5 w-5 text-slate-950" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">SCEAP</div>
          <div className="text-xs text-slate-400">Smart Cable Engineering</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {items.map((label, idx) => (
          <button
            key={label}
            className={`w-full text-left px-4 py-2 text-sm rounded-r-full transition
              ${label === 'Cable Sizing'
                ? 'bg-sceap-panel/70 text-sceap-accent shadow-soft-glow'
                : 'text-slate-400 hover:bg-sceap-panel/40 hover:text-slate-100'
              }`}
          >
            {idx === 2 && '⚡ '}{label}
          </button>
        ))}
      </nav>
      <div className="p-4 text-xs text-slate-500 border-t border-sceap-border">
        v0.1 • Cable Sizing MVP
      </div>
    </aside>
  );
};

export default Sidebar;
