import React, { useState } from 'react';
import { api } from '../../api/client';

interface Props {
  onImportRows: (rows: Record<string, unknown>[]) => void;
}

const mapTargets = [
  'cable_number',
  'from_equipment',
  'to_equipment',
  'load_kw',
  'load_kva',
  'current',
  'voltage',
  'pf',
  'eff',
  'length',
  'mv_per_a_m',
  'derating1',
  'derating2',
  'sc_current',
  'sc_time',
  'k_const',
];

const CableUploadWizard: React.FC<Props> = ({ onImportRows }) => {
  const [token, setToken] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sample, setSample] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setLoading(true);
    try {
      const res = await api.post<{ token: string; headers: string[]; sample: Record<string, unknown>[] }>(
        '/cable/upload',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setToken(res.data.token);
      setHeaders(res.data.headers || []);
      setSample(res.data.sample || []);
    } catch (e) {
      console.error('Upload failed', e);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const applyMapping = async () => {
    if (!token) return alert('Upload a file first');
    setLoading(true);
    try {
      const res = await api.post<Record<string, unknown>[]>('/cable/map-upload', { token, mapping });
      onImportRows(res.data || []);
      // reset
      setToken(null);
      setHeaders([]);
      setSample([]);
      setMapping({});
    } catch (e) {
      console.error('Mapping failed', e);
      alert('Mapping failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-start">
      <label className="px-3 py-1 rounded border border-sceap-border bg-sceap-panel/80 cursor-pointer text-sm">
        Upload Excel
        <input
          type="file"
          accept=".xls,.xlsx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files ? e.target.files[0] : null)}
        />
      </label>

      {headers.length > 0 && (
        <div className="p-3 rounded border border-sceap-border bg-sceap-panel/70">
          <div className="text-xs mb-2">Map columns (optional) — sample rows shown below</div>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
            {mapTargets.map((t) => (
              <div key={t} className="flex items-center gap-2">
                <div className="text-[11px] w-28">{t}</div>
                <select
                  value={mapping[t] || ''}
                  onChange={(e) => setMapping((m) => ({ ...m, [t]: e.target.value }))}
                  className="text-sm bg-transparent border border-sceap-border/60 rounded px-1 py-0.5"
                >
                  <option value="">—</option>
                  {headers.map((h) => (
                    <option value={h} key={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={applyMapping}
              disabled={loading}
              className="px-3 py-1 rounded bg-gradient-to-r from-sceap-accent-soft to-sky-500 text-slate-900 text-sm"
            >
              Apply Mapping & Import
            </button>
            <div className="text-[11px] text-slate-400">Sample rows: {sample.length}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CableUploadWizard;
