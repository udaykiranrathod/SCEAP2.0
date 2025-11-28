import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

const BackendStatus: React.FC = () => {
  const [status, setStatus] = useState<'unknown' | 'up' | 'down'>('unknown');
  const [checking, setChecking] = useState(false);

  const check = async (notify = false) => {
    setChecking(true);
    try {
      await api.get('/');
      setStatus('up');
      if (notify) {
         
        console.info('[API] Connection OK');
      }
    } catch (e) {
      setStatus('down');
      if (notify) {
         
        console.warn('[API] Connection failed', e);
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
    const id = setInterval(check, 10_000);
    return () => clearInterval(id);
  }, []);

  const label =
    status === 'up' ? (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-800 text-emerald-200">API: UP</span>
    ) : status === 'down' ? (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-700/10 border border-rose-800 text-rose-200">API: DOWN</span>
    ) : (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/10 border border-slate-700 text-slate-300">API: ...</span>
    );

  return (
    <div className="flex items-center gap-2">
      {label}
      <button
        className="text-[10px] px-2 py-0.5 rounded-full bg-sceap-panel/80 border border-sceap-border text-slate-300 hover:bg-sceap-panel/70"
        onClick={() => check(true)}
        disabled={typeof checking !== 'undefined' ? checking : false}
      >
        {typeof checking !== 'undefined' && checking ? 'Checking…' : 'Test'}
      </button>
    </div>
  );
};

export default BackendStatus;
