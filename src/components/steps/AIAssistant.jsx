import React, { useState } from 'react';
import { Sparkles, X, Plus, Send, BookOpen, Layers } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { AI_EXPERIMENT_PRESETS, EQUIPMENT_ITEMS } from '../../data/equipmentData';

export default function AIAssistant({ isOpen, onClose }) {
  const { selectedLab, addMultipleToCart, cart, showToast } = useTransaction();
  const [activePresetId, setActivePresetId] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customSuggestions, setCustomSuggestions] = useState(null);

  if (!isOpen) return null;

  const filteredPresets = AI_EXPERIMENT_PRESETS.filter(
    (p) => !selectedLab || (selectedLab === 'DIGITAL_ECE' ? (p.lab === 'DIGITAL' || p.lab === 'ECE') : p.lab === selectedLab)
  );

  const handleAddPresetItems = (preset, e) => {
    e.stopPropagation();
    const itemsToAdd = EQUIPMENT_ITEMS.filter((item) =>
      preset.itemTagCodes.includes(item.tagCode)
    );

    if (itemsToAdd.length > 0) {
      addMultipleToCart(itemsToAdd);
    }
  };

  const handleCustomSearch = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    const query = customPrompt.toLowerCase();
    const matchingItems = EQUIPMENT_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tagCode.toLowerCase().includes(query)
    );

    if (matchingItems.length > 0) {
      setCustomSuggestions({
        title: `AI Match for "${customPrompt}"`,
        items: matchingItems.slice(0, 4),
      });
      showToast(`AI identified ${matchingItems.length} apparatus`, 'info');
    } else {
      setCustomSuggestions({
        title: `No direct match for "${customPrompt}"`,
        items: [],
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in select-none">
      <div className="neu-card rounded-3xl max-w-2xl w-full shadow-2xl shadow-black flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#111a2c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>AI Lab Experiment Assistant</span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full neu-inset-sm text-cyan-400 font-bold">
                  SYLLABUS MATCH
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                1-Click equipment bundles for standard accredited university experiments.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl neu-btn-raised text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Experiment Presets List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Recommended Syllabus Experiment Packs</span>
            </div>

            {filteredPresets.map((preset) => {
              const isSelected = activePresetId === preset.id;
              const presetItems = EQUIPMENT_ITEMS.filter((item) =>
                preset.itemTagCodes.includes(item.tagCode)
              );

              return (
                <div
                  key={preset.id}
                  onClick={() => setActivePresetId(isSelected ? null : preset.id)}
                  className={`p-4 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? 'neu-card ring-2 ring-cyan-500/80 shadow-[0_0_16px_rgba(6,182,212,0.25)]'
                      : 'neu-card-sm neu-card-hover'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{preset.title}</h4>
                      <p className="text-xs font-mono text-cyan-400 font-semibold mt-0.5">{preset.subtitle}</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{preset.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddPresetItems(preset, e)}
                      className="px-4 py-2 rounded-xl neu-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Add All ({presetItems.length} Tools)</span>
                    </button>
                  </div>

                  {/* Included Apparatus preview list */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <div className="text-[11px] text-slate-400 mb-1.5 font-semibold">Included Apparatus:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {presetItems.map((item) => (
                        <span
                          key={item.id}
                          className="text-xs px-2.5 py-1 rounded-lg neu-inset-sm text-slate-200 font-mono"
                        >
                          {item.name} <span className="text-cyan-400 font-bold">({item.tagCode})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Natural Language Prompt Query */}
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Or Ask AI for Custom Apparatus</span>
            </div>

            <form onSubmit={handleCustomSearch} className="flex gap-2.5">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ask AI: e.g. 'Breadboard Logic Circuit', 'Slump Cone Test'..."
                className="flex-1 min-h-[48px] px-4 rounded-xl neu-inset text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                className="px-5 min-h-[48px] rounded-xl neu-btn-raised text-cyan-400 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            {/* Custom Search Result Box */}
            {customSuggestions && (
              <div className="mt-3 p-4 rounded-2xl neu-inset space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>{customSuggestions.title}</span>
                  {customSuggestions.items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => addMultipleToCart(customSuggestions.items)}
                      className="text-xs text-cyan-400 hover:underline font-bold"
                    >
                      + Add All Matches
                    </button>
                  )}
                </div>
                {customSuggestions.items.length > 0 ? (
                  <div className="space-y-1.5">
                    {customSuggestions.items.map((item) => (
                      <div
                        key={item.id}
                        className="text-xs text-slate-300 flex items-center justify-between p-2.5 rounded-xl neu-card-sm"
                      >
                        <span className="font-semibold">{item.name}</span>
                        <span className="font-mono text-cyan-400 text-[11px] font-bold">{item.tagCode}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    No matching apparatus found. Try terms like 'resistor', 'flask', 'wires', or 'multimeter'.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#111a2c] flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl neu-btn-raised text-slate-200 font-bold text-xs"
          >
            Done & Return to Catalog
          </button>
        </div>
      </div>
    </div>
  );
}
