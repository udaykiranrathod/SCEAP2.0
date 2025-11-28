// frontend/src/components/cable/CableVisualizationCard.tsx
import React from 'react';
import type { CableOutput } from '../../types/cable';

interface Props {
  result?: CableOutput;
}

const CableVisualizationCard: React.FC<Props> = ({ result }) => {
  if (!result) {
    return (
      <div className="h-full min-h-[180px] bg-black/30 border border-dashed border-sceap-border rounded-2xl flex items-center justify-center text-xs text-slate-500">
        Run the sizing engine to see a live cable visualization here.
      </div>
    );
  }

  const statusBadge = (ok: boolean, label: string) => (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] border ${
        ok
          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
          : 'bg-rose-500/10 text-rose-300 border-rose-500/40'
      }`}
    >
      {label}: {ok ? 'PASS' : 'FAIL'}
    </span>
  );

  const cores = 4; // for visualization; later link to catalogue

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-sceap-border/60 shadow-soft-glow">
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-sceap-accent-soft/10 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="relative p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-[0.22em]">
              Selected Cable
            </div>
            <div className="text-sm font-semibold text-slate-50">
              {result.cable_number || 'Cable'}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-1">
              {statusBadge(result.vdrop_ok, 'Vdrop')}
              {statusBadge(result.sc_ok, 'SC')}
            </div>
            <div className="text-[10px] text-slate-400">
              Sized at <span className="text-sceap-accent-soft">{result.flc.toFixed(1)} A</span>
            </div>
          </div>
        </div>

        {/* Cable core visualization */}
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 rounded-full bg-slate-900/80 border border-sceap-border flex items-center justify-center">
            <div className="absolute inset-1 rounded-full bg-slate-900" />
            <div className="relative h-18 w-18 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-1">
                {Array.from({ length: cores }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-7 w-7 rounded-full bg-gradient-to-br from-sceap-accent-soft to-indigo-500 flex items-center justify-center text-[10px] font-semibold text-slate-950 shadow-soft-glow"
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-xs">
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded-full bg-sceap-panel/70 border border-sceap-border text-[10px]">
                Size: <span className="font-semibold">{result.selected_csa} mm² (approx)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sceap-panel/70 border border-sceap-border text-[10px]">
                Derated: <span className="font-semibold">{result.derated_current.toFixed(1)} A</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sceap-panel/70 border border-sceap-border text-[10px]">
                Vdrop: <span className="font-semibold">{result.vdrop_percent.toFixed(2)}%</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              A {result.selected_csa} mm² multi-core cable is selected so that it can safely carry
              the derated current and withstand the short-circuit requirement. Voltage drop status
              is{' '}
              <span className={result.vdrop_ok ? 'text-emerald-300' : 'text-rose-300'}>
                {result.vdrop_ok ? 'within limit' : 'above limit'}
              </span>
              , so you can quickly see if route length or size needs adjustment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CableVisualizationCard;
