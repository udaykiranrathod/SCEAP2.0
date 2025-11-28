import React, { useState, useEffect } from 'react';
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

// Simple autosuggest: find best-matching header for each target field
const suggestMapping = (headers: string[], mapping: Record<string, string>): Record<string, string> => {
  const result = { ...mapping };
  mapTargets.forEach((target) => {
    if (result[target]) return; // already mapped
    const lowerTarget = target.toLowerCase();
    const match = headers.find((h) => {
      const lowerH = h.toLowerCase();
      return (
        lowerH === lowerTarget ||
        lowerH.includes(lowerTarget) ||
        lowerTarget.includes(lowerH.replace(/\s+/g, '_'))
      );
    });
    if (match) result[target] = match;
  });
  return result;
};

const CableUploadWizard: React.FC<Props> = ({ onImportRows }) => {
  const [token, setToken] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sample, setSample] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Load saved mapping on mount
  useEffect(() => {
    const saved = localStorage.getItem('sceap_upload_mapping');
    if (saved) {
      try {
        setMapping(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

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
      // Autosuggest mapping on upload
      const suggested = suggestMapping(res.data.headers || [], {});
      setMapping(suggested);
      localStorage.setItem('sceap_upload_mapping', JSON.stringify(suggested));
    } catch (e) {
      console.error('Upload failed', e);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    // Show what the first few rows would look like after mapping
    if (!sample.length) return;
    setPreview(sample.slice(0, 3));
  };

  const applyMapping = async () => {
    if (!token) return alert('Upload a file first');
    // Save mapping for next time
    localStorage.setItem('sceap_upload_mapping', JSON.stringify(mapping));
    setLoading(true);
    try {
      const res = await api.post<Record<string, unknown>[]>('/cable/map-upload', { token, mapping });
      onImportRows(res.data || []);
      // reset
      setToken(null);
      setHeaders([]);
      setSample([]);
      setPreview(null);
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
              onClick={generatePreview}
              className="px-3 py-1 rounded border border-sceap-border bg-sceap-panel/70 text-sm"
            >
              👁️ Preview
            </button>
            <button
              type="button"
              onClick={applyMapping}
              disabled={loading}
              className="px-3 py-1 rounded bg-gradient-to-r from-sceap-accent-soft to-sky-500 text-slate-900 text-sm"
            >
              {loading ? 'Importing…' : 'Apply & Import'}
            </button>
            <div className="text-[11px] text-slate-400">Rows: {sample.length}</div>
          </div>

          {preview && (
            <div className="mt-3 p-2 rounded bg-slate-900/50 border border-sceap-border/50">
              <div className="text-[10px] text-slate-300 mb-1">Preview (first 3 rows after mapping):</div>
              <div className="overflow-x-auto max-h-28 text-[9px]">
                <pre className="text-slate-300">{JSON.stringify(preview, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CableUploadWizard;
