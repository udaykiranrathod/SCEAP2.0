import React, { useState } from 'react';
import type { BulkRow } from '../../types/cable';
import type { CableInput, CableOutput } from '../../types/cable';
import { api } from '../../api/client';
import CableUploadWizard from './CableUploadWizard';
import CatalogWizardModal from '../catalog/CatalogWizardModal';
import CableSpecDrawer from './CableSpecDrawer';
import ExportModal from './ExportModal';
import type { CatalogMatchPerRow } from '../../types/catalog';

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
    r_ohm_per_km: undefined,
    x_ohm_per_km: undefined,
  derating1: 1,
  derating2: 0.9,
  sc_current: 8000,
  sc_time: 1,
  k_const: 115,
});

const CableBulkTable: React.FC<Props> = ({ onSelectResult }) => {
  const [rows, setRows] = useState<BulkRow[]>([createEmptyRow(0), createEmptyRow(1), createEmptyRow(2)]);
  const [loading, setLoading] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<BulkRow | null>(null);
  const [groupingThreshold, setGroupingThreshold] = useState<number>(0.85);
  const [exportOpen, setExportOpen] = useState(false);

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

  const applyCatalogMatches = async (matches: CatalogMatchPerRow[]) => {
    // Apply best suggestion for each matched row
    setRows((prev) => {
      const next = [...prev];
      matches.forEach((m) => {
        const idx = m.row_index ?? -1;
        if (idx < 0 || idx >= next.length) return;
        const best = m.suggestions?.[0]?.entry;
        if (!best) return;
        next[idx] = {
          ...next[idx],
          r_ohm_per_km: best.r_ohm_per_km,
          x_ohm_per_km: best.x_ohm_per_km,
          catalog_vendor: best.vendor,
          catalog_part_no: best.part_no,
          catalog_od_mm: best.od_mm,
          catalog_weight_kg_per_km: best.weight_kg_per_km,
          catalog_csa_mm2: best.csa_mm2,
          catalog_rated_current_air: best.rated_current_air ?? undefined,
          catalog_rated_current_trench: best.rated_current_trench ?? undefined,
          catalog_rated_current_duct: best.rated_current_duct ?? undefined,
        };
      });
      return next;
    });

    // Re-run sizing with updated R/X values
    await runBulkSizing();
  };

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
        r_ohm_per_km: row.r_ohm_per_km,
        x_ohm_per_km: row.x_ohm_per_km,
        derating_factors: [row.derating1 ?? 1, row.derating2 ?? 1],
        csa_options: defaultCSAOptions,
        sc_current: row.sc_current ?? 0,
        sc_time: row.sc_time ?? 1,
        k_const: row.k_const ?? 115,
        // pass catalog rated currents to backend for thermal checks
        catalog_rated_current_air: row.catalog_rated_current_air,
        catalog_rated_current_trench: row.catalog_rated_current_trench,
        catalog_rated_current_duct: row.catalog_rated_current_duct,
        // include optional grouping threshold if provided (global control)
        grouping_threshold: groupingThreshold,
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
          r_ohm_per_km: getNumber('r_ohm_per_km', 0),
          x_ohm_per_km: getNumber('x_ohm_per_km', 0),
          derating1: getNumber('derating1', 1),
          derating2: getNumber('derating2', 1),
          sc_current: getNumber('sc_current', 0),
          sc_time: getNumber('sc_time', 1),
          k_const: getNumber('k_const', 115),
        } as BulkRow;
      }),
    ]);
  };

  const exportToExcel = async () => {
    try {
      const payload = {
        rows: rows.map((row) => ({
          cable_number: row.cable_number,
          from_equipment: row.from_equipment,
          to_equipment: row.to_equipment,
          voltage: row.voltage,
          load_kw: row.load_kw,
          length: row.length,
          result: row.result,
        })),
      };

      const res = await api.post<{ downloadUrl: string; filename: string }>('/cable/export-excel', payload);
      const { downloadUrl, filename } = res.data;

      // Download the file via direct URL or fetch
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Excel export failed. Ensure backend has openpyxl installed.');
    }
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
            onClick={() => setCatalogOpen(true)}
            className="px-3 py-1.5 rounded-full text-[11px] border border-sceap-border bg-sceap-panel/70 hover:border-sceap-accent-soft"
          >
            📚 Catalog
          </button>
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
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="text-xs text-slate-400">Grouping</span>
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={groupingThreshold}
              onChange={(e) => setGroupingThreshold(Number(e.target.value))}
              className="w-20 bg-transparent border border-sceap-border/60 rounded px-1 py-0.5 text-right"
              title="Grouping threshold (0-1). Lower allows more derating reduction before flagging"
            />
          </label>
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
          <button
            type="button"
            onClick={exportToExcel}
            className="px-3 py-1.5 rounded-full text-[11px] border border-sceap-border bg-sceap-panel/70 hover:border-sceap-accent-soft"
          >
            📊 Export Excel
          </button>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="px-3 py-1.5 rounded-full text-[11px] bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-soft-glow"
          >
            Export 📦
          </button>
        </div>
      </div>

      <CatalogWizardModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        bulkRows={rows}
        onApplyMatches={(matches) => applyCatalogMatches(matches)}
      />

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
              <th className="px-2 py-2 text-right">R (Ohm/km)</th>
              <th className="px-2 py-2 text-right">X (Ohm/km)</th>
              <th className="px-2 py-2 text-right">Derate1</th>
              <th className="px-2 py-2 text-right">Derate2</th>
              <th className="px-2 py-2 text-right">CSA (mm²)</th>
              <th className="px-2 py-2 text-center">Vdrop</th>
              <th className="px-2 py-2 text-center">SC</th>
              <th className="px-2 py-2 text-center">Status</th>
              <th className="px-2 py-2 text-center">Grouping</th>
              <th className="px-2 py-2 text-left">Vendor</th>
              <th className="px-2 py-2 text-left">Part</th>
              <th className="px-2 py-2 text-right">OD (mm)</th>
              <th className="px-2 py-2 text-right">Wt (kg/km)</th>
              <th className="px-2 py-2 text-center">View</th>
              <th className="px-2 py-2 text-center">✕</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const r = row.result;
              const bg = r && (!r.vdrop_ok || !r.sc_ok) ? 'bg-rose-950/40' : r ? 'bg-emerald-950/20' : 'bg-slate-950/10';

              const matchPresent = Boolean(row.catalog_part_no || row.catalog_csa_mm2 || (r && r.selected_csa));
              const complianceOk = r ? (r.vdrop_ok && r.sc_ok && (!r.compliance || r.compliance.every((c: any) => c.ok))) : false;

              const groupingItem = r?.compliance?.find((c: any) => c.type === 'grouping');

              const statusEl = (() => {
                if (!r) return <span className="text-[10px] text-slate-500">--</span>;
                if (matchPresent && complianceOk)
                  return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">VERIFIED</span>
                  );
                if (matchPresent && !complianceOk)
                  return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/40">NEED REVIEW</span>
                  );
                return (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/40">MISMATCH</span>
                );
              })();

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
                      step="0.0001"
                      className="w-20 text-right bg-transparent border border-sceap-border/60 rounded px-1 py-0.5"
                      value={row.r_ohm_per_km ?? ''}
                      onChange={(e) => handleChange(row.id, 'r_ohm_per_km', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      step="0.0001"
                      className="w-20 text-right bg-transparent border border-sceap-border/60 rounded px-1 py-0.5"
                      value={row.x_ohm_per_km ?? ''}
                      onChange={(e) => handleChange(row.id, 'x_ohm_per_km', e.target.value)}
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
                  <td className="px-2 py-1.5 text-center">{statusEl}</td>
                  <td className="px-2 py-1.5 text-center">
                    {groupingItem ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${groupingItem.ok ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/10 text-rose-300 border border-rose-500/40'}`} title={groupingItem.msg}>
                        {groupingItem.ok ? 'GROUP OK' : 'GROUP ISSUE'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-left text-slate-200">{row.catalog_vendor ?? '--'}</td>
                  <td className="px-2 py-1.5 text-left text-slate-200">{row.catalog_part_no ?? '--'}</td>
                  <td className="px-2 py-1.5 text-right">{row.catalog_od_mm ?? '--'}</td>
                  <td className="px-2 py-1.5 text-right">{row.catalog_weight_kg_per_km ?? '--'}</td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      disabled={!r}
                      onClick={() => { setSelectedRow(row); setDrawerOpen(true); if (row.result) onSelectResult?.(row.result); }}
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

      <CableSpecDrawer open={drawerOpen} row={selectedRow} onClose={() => { setDrawerOpen(false); setSelectedRow(null); }} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} rows={rows} />
    </div>
  );
};

export default CableBulkTable;
