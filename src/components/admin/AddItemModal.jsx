import React, { useState } from 'react';
import { X, Plus, Package } from 'lucide-react';
import { ADMIN_LAB_OPTIONS } from '../../data/equipmentData';

export default function AddItemModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    tagCode: '',
    lab: '',
    category: 'Tools & Assets',
    stock: 1,
    unit: 'pc',
    description: '',
  });

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.tagCode.trim() || !form.lab) return;

    const labPrefix = (form.lab || 'item').toLowerCase();
    const uniqueId = `${labPrefix}-${Date.now().toString(36)}`;

    const newItem = {
      id: uniqueId,
      name: form.name.trim(),
      tagCode: form.tagCode.trim().toUpperCase(),
      lab: form.lab,
      category: form.category,
      stock: Math.max(1, parseInt(form.stock, 10) || 1),
      status: 'Available',
      unit: form.unit.trim() || 'pc',
      description: form.description.trim(),
    };

    onSave(newItem);
    setForm({ name: '', tagCode: '', lab: '', category: 'Equipment & Apparatus', stock: 1, unit: 'pc', description: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-lg bg-[#0a1220] border border-slate-700/80 rounded-3xl shadow-2xl text-slate-100 flex flex-col max-h-[85vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Register New Equipment</h3>
              <p className="text-xs text-slate-400 mt-0.5">Adds item directly to inventory catalog and booking system</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-[#070d18] border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">Equipment Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Solderless Breadboard (830 Points)"
              required
              className="w-full h-11 px-3.5 rounded-xl bg-[#060b14] border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Tag Code & Lab */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">Tag Code *</label>
              <input
                type="text"
                value={form.tagCode}
                onChange={(e) => updateField('tagCode', e.target.value)}
                placeholder="e.g. ECE-BRD-02"
                required
                className="w-full h-11 px-3.5 rounded-xl bg-[#060b14] border border-slate-800 text-sm font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">Laboratory *</label>
              <select
                value={form.lab}
                onChange={(e) => updateField('lab', e.target.value)}
                required
                className="w-full h-11 px-3.5 rounded-xl bg-[#060b14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="">Select Laboratory...</option>
                {ADMIN_LAB_OPTIONS.map((lab) => (
                  <option key={lab.id} value={lab.id}>{lab.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Unit & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[#060b14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="Equipment & Apparatus">Equipment & Apparatus</option>
                <option value="Consumables">Consumables</option>
                <option value="Trainer Modules & Instruments">Trainer Modules & Instruments</option>
                <option value="Tools & Assets">Tools & Assets</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">Unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => updateField('unit', e.target.value)}
                placeholder="pc / set / box"
                className="w-full h-11 px-3.5 rounded-xl bg-[#060b14] border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">Initial Stock</label>
              <input
                type="number"
                min={1}
                value={form.stock}
                onChange={(e) => updateField('stock', e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#060b14] border border-slate-800 text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">Specifications / Notes</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief description or storage locker location..."
              rows={2}
              className="w-full p-3 rounded-xl bg-[#060b14] border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            />
          </div>

          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-4 p-4 border-t border-slate-800 bg-[#070d18] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#060b14] border border-slate-800 text-sm font-semibold text-slate-400 hover:text-slate-200 active:scale-95 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Inventory</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
