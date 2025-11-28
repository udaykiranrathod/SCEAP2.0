import React, { useState } from 'react';
import { uploadCatalog, mapCatalog, matchCatalog } from '../../api/catalog';
import type { CatalogUploadResponse } from '../../types/catalog';
import type { CatalogMatchPerRow } from '../../types/catalog';
import type { BulkRow } from '../../types/cable';

interface Props {
  open: boolean;
  onClose: () => void;
  bulkRows: BulkRow[];
  onApplyMatches: (matches: CatalogMatchPerRow[]) => void;
}

const REQUIRED_FIELDS = [
  'csa_mm2',
  'conductor',
  'cores',
  'armour',
  'r_ohm_per_km',
  'x_ohm_per_km',
  'od_mm',
  'weight_kg_per_km',
  'vendor',
  'part_no',
];

const CatalogWizardModal: React.FC<Props> = ({ open, onClose, bulkRows, onApplyMatches }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploadInfo, setUploadInfo] = useState<CatalogUploadResponse | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string | null>(null);
  const [matchesPreview, setMatchesPreview] = useState<CatalogMatchPerRow[]>([]);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const info = await uploadCatalog(file);
      setUploadInfo(info);
      setToken(info.token);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Failed to upload catalog.');
    } finally {
      setBusy(false);
    }
  };

  const handleMappingChange = (field: string, header: string) => {
    setMapping((prev) => ({ ...prev, [field]: header }));
  };

  const handleSaveMapping = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await mapCatalog(token, mapping);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Failed to map catalog.');
    } finally {
      setBusy(false);
    }
  };

  const handleRunMatch = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const rows = bulkRows.map((row) => ({
        cable_number: row.cable_number,
        voltage: row.voltage,
        derated_current: row.result?.derated_current ?? row.result?.flc ?? 0,
      }));
      const res = await matchCatalog(token, rows, 3);
      setMatchesPreview(res.matches);
    } catch (err) {
      console.error(err);
      alert('Failed to match catalog.');
    } finally {
      setBusy(false);
    }
  };

  const handleApply = () => {
    onApplyMatches(matchesPreview);
    onClose();
  };

  const headers = uploadInfo?.headers ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-4xl max-h-[80vh] bg-sceap-panel rounded-2xl border border-sceap-border shadow-soft-glow flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-sceap-border">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Cable Catalog Wizard</h2>
            <p className="text-[11px] text-slate-400">Upload vendor catalog, map columns, and auto-match suggestions to your bulk sizing rows.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg px-2">✕</button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4 text-xs">
          {step === 1 && (
            <div className="space-y-3">
              <div className="font-semibold text-slate-100">Step 1 — Upload Catalog</div>
              <p className="text-slate-400">Upload an Excel file (.xlsx) with cable sizes, R/X, OD, weight, vendor and part code.</p>
              <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="text-xs" />
            </div>
          )}

          {step === 2 && uploadInfo && (
            <div className="space-y-3">
              <div className="font-semibold text-slate-100">Step 2 — Map Columns</div>
              <p className="text-slate-400">Map each required field to a column from your catalog headers.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {REQUIRED_FIELDS.map((field) => (
                  <div key={field} className="space-y-1">
                    <div className="text-[11px] text-slate-300">{field}</div>
                    <select value={mapping[field] ?? ''} onChange={(e) => handleMappingChange(field, e.target.value)} className="w-full bg-slate-950/60 border border-sceap-border rounded px-2 py-1">
                      <option value="">-- select column --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={handleSaveMapping} disabled={busy} className="mt-3 px-3 py-1.5 rounded-full bg-sceap-accent-soft text-slate-950 text-[11px] shadow-soft-glow disabled:opacity-60">Save Mapping</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="font-semibold text-slate-100">Step 3 — Match & Apply</div>
              <p className="text-slate-400">Run auto-match; the engine will suggest the best catalog entries per cable based on derated current. You can preview before applying.</p>
              <button onClick={handleRunMatch} disabled={busy} className="px-3 py-1.5 rounded-full bg-sceap-accent-soft text-slate-950 text-[11px] shadow-soft-glow disabled:opacity-60">🔍 Run Auto-Match</button>

              {matchesPreview.length > 0 && (
                <div className="mt-3 border border-sceap-border rounded-xl overflow-auto">
                  <table className="min-w-full text-[11px]">
                    <thead className="bg-sceap-panel/90 border-b border-sceap-border/80">
                      <tr className="text-slate-300">
                        <th className="px-2 py-2 text-left">Cable</th>
                        <th className="px-2 py-2 text-left">Top Suggestion</th>
                        <th className="px-2 py-2 text-left">Vendor</th>
                        <th className="px-2 py-2 text-left">R/X</th>
                        <th className="px-2 py-2 text-left">OD / Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchesPreview.map((m) => {
                        const best = m.suggestions[0]?.entry;
                        if (!best) {
                          return (
                            <tr key={m.row_index} className="border-b border-sceap-border/40">
                              <td className="px-2 py-1.5">{m.cable_number}</td>
                              <td className="px-2 py-1.5 text-slate-500" colSpan={4}>No suitable suggestion (check catalog / derated current).</td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={m.row_index} className="border-b border-sceap-border/40">
                            <td className="px-2 py-1.5">{m.cable_number}</td>
                            <td className="px-2 py-1.5">{best.csa_mm2} mm² • {best.conductor.toUpperCase()} • {best.cores}C • {best.armour || 'unarmoured'}</td>
                            <td className="px-2 py-1.5">{best.vendor} • {best.part_no}</td>
                            <td className="px-2 py-1.5">R={best.r_ohm_per_km} Ω/km • X={best.x_ohm_per_km} Ω/km</td>
                            <td className="px-2 py-1.5">OD={best.od_mm} mm • {best.weight_kg_per_km} kg/km</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-sceap-border text-[11px]">
          <div className="text-slate-500">Step {step} of 3 • {token ? <span className="text-sceap-accent-soft">Token: {token}</span> : 'No catalog loaded yet'}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-full border border-sceap-border text-slate-300 hover:border-sceap-accent-soft">Cancel</button>
            {step === 3 && matchesPreview.length > 0 && (
              <button onClick={handleApply} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-sceap-accent-soft to-sky-500 text-slate-950 shadow-soft-glow">✅ Apply to Bulk Rows</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogWizardModal;
