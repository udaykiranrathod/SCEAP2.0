import React, { useState } from 'react';
import { BulkRow } from '../../types/cable';
import type { CableInput, CableOutput } from '../../types/cable';
import { api } from '../../api/client';
import CableUploadWizard from './CableUploadWizard';

interface Props {
  onSelectResult: (result: CableOutput) => void;
}

const defaultCSAOptions = [25, 35, 50, 70, 95, 120, 150, 185, 240];

const createEmptyRow = (index: number): BulkRow => ({
  id: `row-${index}-${Date.now()}`,
  cable_number: `CBL-${index + 1}`,
  from_equipment: '',
  to_equipment: '',
  load_kw: 0,
  load_kva: 0,
  current: 0,
  voltage: 415,
  pf: 0.85,
  eff: 0.95,
  length: 50,
  mv_per_a_m: 0.44,
  derating1: 1,
  derating2: 0.9,
  sc_current: 8000,
  sc_time: 1,
  k_const: 115,
});

const CableBulkTable: React.FC<Props> = ({ onSelectResult }) => {
  const [rows, setRows] = useState<BulkRow[]>([createEmptyRow(0), createEmptyRow(1), createEmptyRow(2)]);
  const [loading, setLoading] = useState(false);

  const handleChange = (id: string, field: keyof BulkRow, value: string | number) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: typeof row[field] === 'number' ? Number(value) : value,
            }
          : row,
      ),
    );
  };

  const addRow = () => setRows((prev) => [...prev, createEmptyRow(prev.length)]);
  const deleteRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const runBulkSizing = async () => {
    try {
      setLoading(true);
      const payload: CableInput[] = rows.map((row) => ({
        cable_number: row.cable_number,
        load_kw: row.load_kw ?? 0,
        load_kva: row.load_kva ?? 0,
        current: row.current ?? 0,
        voltage: row.voltage,
        pf: row.pf ?? 1,
        eff: row.eff ?? 1,
        length: row.length,
        mv_per_a_m: row.mv_per_a_m,
        derating_factors: [row.derating1 ?? 1, row.derating2 ?? 1],
        csa_options: defaultCSAOptions,
        sc_current: row.sc_current ?? 0,
        sc_time: row.sc_time ?? 1,
        k_const: row.k_const ?? 115,
      }));

      const res = await api.post<CableOutput[]>('/cable/bulk-size', payload);
      const results = res.data;
      setRows((prev) => prev.map((row, idx) => ({ ...row, result: results[idx] })));
    } catch (err) {
       
      console.error(err);
      alert('Bulk sizing failed. Check backend /cable/bulk-size & CORS.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    const headers = [
      'Cable No',
      'From',
      'To',
      'Voltage',
      'Load kW',
      'Length m',
      'FLC A',
      'Derated A',
      'CSA mm2',
      'Vdrop %',
      'Vdrop OK',
      'SC OK',
    ];

    const lines = rows.map((row) => {
      const r = row.result;
      return [
        row.cable_number,
        row.from_equipment ?? '',
        row.to_equipment ?? '',
        row.voltage,
        row.load_kw ?? '',
        row.length,
        r?.flc ?? '',
        r?.derated_current ?? '',
        r?.selected_csa ?? '',
        r?.vdrop_percent ?? '',
        r?.vdrop_ok ? 'YES' : 'NO',
        r?.sc_ok ? 'YES' : 'NO',
      ].join(',');
    });

    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sceap_bulk_cable_sizing.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportBoq = () => {
    // BOQ: unique selected_csa, total length and count
    const map: Record<string, { csa: number; totalLength: number; count: number }> = {};
    rows.forEach((row) => {
      const r = row.result;
      const csa = r?.selected_csa ?? row?.result?.selected_csa ?? null;
      const len = Number(row.length || 0) || 0;
      if (csa) {
        const key = String(csa);
        if (!map[key]) map[key] = { csa: csa, totalLength: 0, count: 0 };
        map[key].totalLength += len;
        map[key].count += 1;
      }
    });
    const headers = ['CSA_mm2', 'Count', 'TotalLength_m'];
    const lines = Object.values(map).map((v) => [v.csa, v.count, v.totalLength].join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sceap_boq.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importRows = (imported: Record<string, unknown>[]) => {
    // Convert imported rows into BulkRow entries
    setRows((prev) => [
      ...prev,
      ...imported.map((r, i) => {
        const getString = (k: string, d = ''): string => {
          const v = (r as Record<string, unknown>)[k];
          return v === undefined || v === null ? d : String(v);
        };
        const getNumber = (k: string, d = 0): number => {
          const v = (r as Record<string, unknown>)[k];
          const n = Number(v ?? d);
          return Number.isFinite(n) ? n : d;
        };

        return {
          id: `imp-${Date.now()}-${i}`,
          cable_number: getString('cable_number') || `CBL-IMP-${i + 1}`,
          from_equipment: getString('from_equipment', ''),
          to_equipment: getString('to_equipment', ''),
          load_kw: getNumber('load_kw', 0),
          load_kva: getNumber('load_kva', 0),
          current: getNumber('current', 0),
          voltage: getNumber('voltage', 415),
          pf: getNumber('pf', 1),
          eff: getNumber('eff', 1),
          length: getNumber('length', 0),
          mv_per_a_m: getNumber('mv_per_a_m', 0.44),
          derating1: getNumber('derating1', 1),
          derating2: getNumber('derating2', 1),
          sc_current: getNumber('sc_current', 0),
          sc_time: getNumber('sc_time', 1),
          k_const: getNumber('k_const', 115),
        } as BulkRow;
      }),
    ]);
  };

  const statusChip = (ok?: boolean) => {
    if (ok === undefined) return <span className="text-[10px] text-slate-500">--</span>;
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] border ${
          ok
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/40'
        }`}
      >
        {ok ? 'PASS' : 'CHECK'}
      </span>
    );
  };

  return (
    <div className="bg-black/30 border border-sceap-border rounded-2xl p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Bulk Cable Sizing</h3>
          <p className="text-[11px] text-slate-400">
            Add multiple feeders, run sizing in one go, and export results. Later this will be
            wired to Excel upload and project-level libraries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CableUploadWizard onImportRows={importRows} />
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-1.5 rounded-full text-[11px] border border-sceap-border bg-sceap-panel/70 hover:border-sceap-accent-soft"
          >
            + Add Row
          </button>
          <button
            type="button"
            onClick={runBulkSizing}
            disabled={loading}
            className="px-3 py-1.5 rounded-full text-[11px] bg-gradient-to-r from-sceap-accent-soft to-sky-500 text-slate-950 shadow-soft-glow disabled:opacity-60"
          >
            {loading ? 'Calculating…' : '⚡ Run Bulk Sizing'}
          </button>
          <button
            type="button"
            onClick={exportToCsv}
            className="px-3 py-1.5 rounded-full text-[11px] border border-sceap-border bg-sceap-panel/70 hover:border-sceap-accent-soft"
          >
            ⬇ Export CSV
          </button>
          <button
            type="button"
            onClick={exportBoq}
            className="px-3 py-1.5 rounded-full text-[11px] border border-sceap-border bg-sceap-panel/70 hover:border-sceap-accent-soft"
          >
            ⬇ Export BOQ
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-sceap-border/70">
        <table className="min-w-full text-[11px]">
          <thead className="bg-sceap-panel/90 border-b border-sceap-border/80">
            <tr className="text-slate-300">
              <th className="px-2 py-2 text-left">#</th>
              <th className="px-2 py-2 text-left">Cable No</th>
              <th className="px-2 py-2 text-left">From</th>
              <th className="px-2 py-2 text-left">To</th>
              <th className="px-2 py-2 text-right">kW</th>
              <th className="px-2 py-2 text-right">V</th>
              <th className="px-2 py-2 text-right">Length (m)</th>
              <th className="px-2 py-2 text-right">PF</th>
              <th className="px-2 py-2 text-right">Derate1</th>
              <th className="px-2 py-2 text-right">Derate2</th>
              <th className="px-2 py-2 text-right">CSA (mm²)</th>
              <th className="px-2 py-2 text-center">Vdrop</th>
              <th className="px-2 py-2 text-center">SC</th>
              <th className="px-2 py-2 text-center">Visualize</th>
              <th className="px-2 py-2 text-center">✕</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const r = row.result;
              const bg =
                r && (!r.vdrop_ok || !r.sc_ok) ? 'bg-rose-950/40' : r ? 'bg-emerald-950/20' : 'bg-slate-950/10';

              return (
                <tr key={row.id} className={`${bg} border-b border-sceap-border/40`}>
                  <td className="px-2 py-1.5 text-slate-500">{idx + 1}</td>
                  <td className="px-2 py-1.5">
                    <input
                      className="w-28 bg-transparent border border-sceap-border/60 rounded px-1 py-0.5"
                      value={row.cable_number}
                      onChange={(e) => handleChange(row.id, 'cable_number', e.target.value as string)}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      className="w-40 bg-transparent border border-sceap-border/60 rounded px-1 py-0.5"
                      value={row.from_equipment ?? ''}
                      onChange={(e) => handleChange(row.id, 'from_equipment', e.target.value as string)}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      className="w-40 bg-transparent border border-sceap-border/60 rounded px-1 py-0.5"
                      value={row.to_equipment ?? ''}
                      onChange={(e) => handleChange(row.id, 'to_equipment', e.target.value as string)}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      className="w-20 text-right bg-transparent border border-sceap-border/60 rounded px-1 py-0.5"
                      value={row.load_kw ?? ''}
                      onChange={(e) => handleChange(row.id, 'load_kw', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      className="w-20 text-right bg-transparent border border-sceap-border/60 rounded px-1 py-0.5"
                      value={row.voltage}
                      onChange={(e) => handleChange(row.id, 'voltage', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      className="w-20 text-right bg-transparent border border-sceap-border/60 rounded px-1 py-0.5"
                      value={row.length}
                      onChange={(e) => handleChange(row.id, 'length', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right bg-transparent border border-sceap-border/60 rounded px-1 py-0.5"
                      value={row.pf ?? ''}
                      onChange={(e) => handleChange(row.id, 'pf', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right bg-transparent border border-sceap-border/60 rounded px-1 py-0.5"
                      value={row.derating1}
                      onChange={(e) => handleChange(row.id, 'derating1', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right bg-transparent border border-sceap-border/60 rounded px-1 py-0.5"
                      value={row.derating2}
                      onChange={(e) => handleChange(row.id, 'derating2', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right text-slate-100">{r ? r.selected_csa : '--'}</td>
                  <td className="px-2 py-1.5 text-center">{statusChip(r?.vdrop_ok)}</td>
                  <td className="px-2 py-1.5 text-center">{statusChip(r?.sc_ok)}</td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      disabled={!r}
                      onClick={() => r && onSelectResult(r)}
                      className="px-2 py-0.5 rounded-full border border-sceap-border/70 text-[10px] hover:border-sceap-accent-soft disabled:opacity-40"
                    >
                      View
                    </button>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CableBulkTable;
