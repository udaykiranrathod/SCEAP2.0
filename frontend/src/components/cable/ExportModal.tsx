import React, { useState } from 'react';
import { api } from '../../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  rows: any[];
}

const defaultColumns = [
  'Cable No', 'From', 'To', 'Voltage', 'Load kW', 'Length m',
  'FLC A', 'Derated A', 'CSA mm2', 'Vdrop %', 'Start Vdrop %', 'Start Method',
  'SC OK', 'SC Required Area', 'Catalog Vendor', 'Catalog Part', 'Remarks'
];

const ExportModal: React.FC<Props> = ({ open, onClose, rows }) => {
  const [cols, setCols] = useState<string[]>(defaultColumns);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const toggleCol = (col: string) => {
    setCols((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
  };

  const download = async (endpoint: string, payload: any) => {
    try {
      setLoading(true);
      const res = await api.post(endpoint, payload);
      const { downloadUrl, filename } = res.data;

      // trigger browser download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Export failed. Check server logs.');
    } finally {
      setLoading(false);
    }
  };

  const onDownloadBOQ = () => {
    download('/export/boq', { rows, project: 'SCEAP' });
  };

  const onDownloadSizing = () => {
    download('/export/sizing-report', { rows, columns: cols, project: 'SCEAP' });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-[820px] bg-[#031025] rounded-xl p-5 border border-cyan-600/20 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Export</h3>
          <button onClick={onClose} className="text-slate-400">✕</button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/30 rounded-md border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Cable BOQ Summary</div>
                <div className="text-xs text-slate-400 mt-1">Group by vendor, part, cores & CSA. Includes total weight.</div>
              </div>
              <div>
                <button onClick={onDownloadBOQ} disabled={loading} className="px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-semibold">📦 Download BOQ</button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900/30 rounded-md border border-slate-700/50">
            <div className="text-sm font-semibold text-white">Cable Sizing Report</div>
            <div className="text-xs text-slate-400 mt-1">Detailed row-by-row report. Select columns below.</div>

            <div className="mt-3 max-h-48 overflow-auto grid grid-cols-2 gap-2">
              {defaultColumns.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm text-slate-200">
                  <input type="checkbox" checked={cols.includes(c)} onChange={() => toggleCol(c)} />
                  <span>{c}</span>
                </label>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={onDownloadSizing} disabled={loading} className="px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-semibold">📑 Download Report</button>
            </div>
          </div>
        </div>

        {showToast && (
          <div className="absolute -bottom-8 right-6 bg-emerald-600/90 text-white px-4 py-2 rounded shadow">Download started</div>
        )}
      </div>
    </div>
  );
};

export default ExportModal;
