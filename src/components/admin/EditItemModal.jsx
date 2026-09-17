import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import { LAB_OPTIONS } from '../../data/equipmentData';

export default function EditItemModal({ isOpen, item, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    tagCode: '',
    lab: 'CE',
    category: 'Tools & Assets',
    stock: 1,
    unit: 'pc',
    description: '',
  });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        tagCode: item.tagCode || '',
        lab: item.lab || 'CE',
        category: item.category || 'Tools & Assets',
        stock: item.stock ?? 1,
        unit: item.unit || 'pc',
        description: item.description || '',
      });
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.tagCode.trim()) return;

    const updatedItem = {
      ...item,
      name: form.name.trim(),
      tagCode: form.tagCode.trim().toUpperCase(),
      lab: form.lab,
      category: form.category,
      stock: Math.max(0, parseInt(form.stock, 10) || 0),
      unit: form.unit.trim() || 'pc',
      description: form.description.trim(),
    };

    onSave(item.id, updatedItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fade-in select-none">
      <div className="w-full max-w-lg bg-[#0a1220] border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Edit3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Edit Equipment</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tag: <span className="text-cyan-300 font-bold">{item.tagCode}</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#070d18] border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">Equipment Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Equipment name..."
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
                placeholder="e.g. CE-SLP-01"
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
                {LAB_OPTIONS.map((lab) => (
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
                placeholder="pc / set / box / unit"
                className="w-full h-11 px-3.5 rounded-xl bg-[#060b14] border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">Total Stock</label>
              <input
                type="number"
                min={0}
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
              placeholder="Apparatus description, specifications, or model..."
              rows={2}
              className="w-full p-3 rounded-xl bg-[#060b14] border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#060b14] border border-slate-800 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
