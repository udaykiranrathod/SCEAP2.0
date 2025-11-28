// frontend/src/pages/CableSizingPage.tsx
import React, { useState } from 'react';
import LayoutShell from '../components/layout/LayoutShell';
import CableSizingForm from '../components/cable/CableSizingForm';
import CableResultsPanel from '../components/cable/CableResultsPanel';
import CableVisualizationCard from '../components/cable/CableVisualizationCard';
import type { CableInput, CableOutput } from '../types/cable';
import CableBulkTable from '../components/cable/CableBulkTable';
import { api } from '../api/client';

const CableSizingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CableOutput | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCalculate = async (payload: CableInput) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      // Log the API base URL being used (helpful to debug wrong baseURL usage)
       
      console.debug('[API] Posting to', api.defaults.baseURL + '/cable/size', payload);
      const res = await api.post<CableOutput>('/cable/size', payload);
      setResult(res.data);
    } catch (err: unknown) {
      // More verbose error for debugging
      console.error('[API] Request failed', err);
      let message = 'Unknown error';
      if (err && typeof err === 'object' && 'message' in err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message = (err as any).message || message;
      }
      setErrorMessage(`Error: ${message}. Check backend & CORS.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutShell>
      <div className="flex flex-col gap-4 md:gap-5">
        <div className="flex items-center justify-end">
          <button
            className="text-xs px-3 py-1 rounded-xl bg-slate-800/80 border border-sceap-border text-slate-200 hover:bg-slate-700"
            onClick={() =>
              setResult({
                cable_number: 'DEMO-001',
                flc: 96.54,
                derated_current: 107.1,
                selected_csa: 120,
                vdrop_percent: 2.345,
                sc_required_area: 78.8,
                sc_ok: true,
                vdrop_ok: true,
              })
            }
          >
            Show Demo Result
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <CableSizingForm onCalculate={handleCalculate} loading={loading} />
          </div>
          <div className="lg:col-span-3 flex flex-col gap-3">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-900/60 border border-rose-800 text-rose-100 text-xs">
                {errorMessage}
              </div>
            )}
            <CableVisualizationCard result={result} />
            <CableResultsPanel result={result} />
          </div>
        </div>

        <CableBulkTable
          onSelectResult={(r) => {
            setResult(r);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </LayoutShell>
  );
};

export default CableSizingPage;
