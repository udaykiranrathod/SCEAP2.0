// frontend/src/components/cable/CableResultsPanel.tsx
import React from 'react';
import type { CableOutput } from '../../types/cable';

interface Props {
  result?: CableOutput;
}

const CableResultsPanel: React.FC<Props> = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-black/30 border border-sceap-border rounded-2xl p-4 md:p-5 text-xs text-slate-400">
        Run a sizing calculation to see engineering metrics here.
      </div>
    );
  }

  const metric = (label: string, value: string, sub?: string) => (
    <div className="flex flex-col px-3 py-2 rounded-xl bg-sceap-panel/80 border border-sceap-border/80">
      <span className="text-[10px] uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-50">{value}</span>
      {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
    </div>
  );

  return (
    <div className="bg-black/30 border border-sceap-border rounded-2xl p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100">Engineering Results</h2>
        <span className="text-[10px] text-slate-500">
          Engine sized this feeder based on IEC-style checks.
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {metric('Full Load Current', `${result.flc.toFixed(1)} A`, 'Base at PF & η')}
        {metric(
          'Derated Current',
          `${result.derated_current.toFixed(1)} A`,
          'After all correction factors',
        )}
        {metric('Selected CSA', `${result.selected_csa} mm²`, 'From catalogue options')}
        {metric('Voltage Drop', `${result.vdrop_percent.toFixed(2)} %`, 'Against project limit')}
        {metric(
          'SC Required Area',
          `${result.sc_required_area.toFixed(1)} mm²`,
          result.sc_ok ? 'OK for short-circuit duty' : 'Increase size or limit fault',
        )}
        {metric(
          'Status',
          result.vdrop_ok && result.sc_ok ? 'ACCEPTABLE' : 'CHECK',
          result.vdrop_ok && result.sc_ok
            ? 'You can freeze this sizing.'
            : 'SC / Vdrop needs validation.',
        )}
      </div>
    </div>
  );
};

export default CableResultsPanel;
