// frontend/src/components/cable/CableSizingForm.tsx
import React, { useState } from 'react';
import type { CableInput } from '../../types/cable';

interface Props {
  onCalculate: (payload: CableInput) => void;
  loading: boolean;
}

const defaultCSAOptions = [25, 35, 50, 70, 95, 120, 150, 185, 240];

const CableSizingForm: React.FC<Props> = ({ onCalculate, loading }) => {
  const [form, setForm] = useState({
    cable_number: 'CBL-001',
    load_kw: 55,
    load_kva: 0,
    current: 0,
    voltage: 415,
    pf: 0.85,
    eff: 0.95,
    length: 100,
    mv_per_a_m: 0.44,
    derating1: 1.0,
    derating2: 0.9,
    sc_current: 8000,
    sc_time: 1,
    k_const: 115,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value === '' ? '' : Number.isNaN(Number(value)) ? value : Number(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CableInput = {
      cable_number: form.cable_number,
      load_kw: form.load_kw || 0,
      load_kva: form.load_kva || 0,
      current: form.current || 0,
      voltage: form.voltage,
      pf: form.pf || 1,
      eff: form.eff || 1,
      length: form.length,
      mv_per_a_m: form.mv_per_a_m,
      derating_factors: [form.derating1 || 1, form.derating2 || 1],
      csa_options: defaultCSAOptions,
      sc_current: form.sc_current || 0,
      sc_time: form.sc_time || 1,
      k_const: form.k_const || 115,
    };

    onCalculate(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-black/30 border border-sceap-border rounded-2xl p-4 md:p-5 space-y-4 backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Single Feeder Sizing</h2>
          <p className="text-xs text-slate-400">
            Enter load &amp; circuit details — engine will size, check Vdrop &amp; SC.
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-1 border border-emerald-500/30">
          Live • IEC style
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="col-span-2">
          <label className="block text-[11px] text-slate-400 mb-1">Cable Number</label>
          <input
            name="cable_number"
            value={form.cable_number}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, cable_number: e.target.value }))
            }
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Load (kW)</label>
          <input
            name="load_kw"
            type="number"
            value={form.load_kw}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Load (kVA)</label>
          <input
            name="load_kva"
            type="number"
            value={form.load_kva}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Current (A)</label>
          <input
            name="current"
            type="number"
            value={form.current}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Voltage (V)</label>
          <input
            name="voltage"
            type="number"
            value={form.voltage}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Power Factor</label>
          <input
            name="pf"
            type="number"
            step="0.01"
            value={form.pf}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Efficiency</label>
          <input
            name="eff"
            type="number"
            step="0.01"
            value={form.eff}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Length (m)</label>
          <input
            name="length"
            type="number"
            value={form.length}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">mV / A / m</label>
          <input
            name="mv_per_a_m"
            type="number"
            step="0.001"
            value={form.mv_per_a_m}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Derating 1</label>
          <input
            name="derating1"
            type="number"
            step="0.01"
            value={form.derating1}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Derating 2</label>
          <input
            name="derating2"
            type="number"
            step="0.01"
            value={form.derating2}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">SC Current (A)</label>
          <input
            name="sc_current"
            type="number"
            value={form.sc_current}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">SC Time (s)</label>
          <input
            name="sc_time"
            type="number"
            value={form.sc_time}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">k Constant</label>
          <input
            name="k_const"
            type="number"
            value={form.k_const}
            onChange={handleChange}
            className="w-full px-2 py-1.5 rounded-lg bg-sceap-panel/70 border border-sceap-border focus:outline-none focus:border-sceap-accent-soft text-xs"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-1 py-2 rounded-xl bg-gradient-to-r from-sceap-accent-soft to-sky-500 text-xs font-semibold text-slate-950 shadow-soft-glow hover:opacity-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Calculating…' : '⚡ Run Cable Sizing Engine'}
      </button>
    </form>
  );
};

export default CableSizingForm;
