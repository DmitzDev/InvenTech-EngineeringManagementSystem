import React, { useState } from 'react';
import { Sparkles, X, Plus, Send, BookOpen, Layers } from 'lucide-react';
import { useTransaction } from '../../context/TransactionContext';
import { AI_EXPERIMENT_PRESETS, EQUIPMENT_ITEMS } from '../../data/equipmentData';

export default function AIAssistant({ isOpen, onClose }) {
  const { selectedLab, addMultipleToCart, cart, showToast, theme } = useTransaction();
  const isDark = theme === 'dark';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div className={`rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border ${
        isDark
          ? 'neu-card border-slate-800 text-slate-100 shadow-black'
          : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
      }`}>
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#111a2c] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isDark ? 'neu-inset text-cyan-400' : 'bg-blue-50 text-blue-700 border border-blue-200/80'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black flex items-center gap-2 ${
                isDark ? 'text-slate-100' : 'text-slate-950 font-black'
              }`}>
                <span>AI Lab Experiment Assistant</span>
                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  isDark
                    ? 'neu-inset-sm text-cyan-400'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  SYLLABUS MATCH
                </span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                1-Click equipment bundles for standard accredited university experiments.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 cursor-pointer transition-transform ${
              isDark
                ? 'neu-btn-raised text-slate-400 hover:text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Experiment Presets List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="space-y-3">
            <div className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
              isDark ? 'text-slate-300' : 'text-slate-800'
            }`}>
              <BookOpen className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-700'}`} />
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
                  className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? isDark
                        ? 'neu-card ring-2 ring-cyan-500/80 shadow-[0_0_16px_rgba(6,182,212,0.25)] border-cyan-500/40'
                        : 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                      : isDark
                      ? 'neu-card-sm neu-card-hover border-slate-800/80'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-950 font-black'}`}>
                        {preset.title}
                      </h4>
                      <p className={`text-xs font-mono font-bold mt-0.5 ${
                        isDark ? 'text-cyan-400' : 'text-blue-700'
                      }`}>
                        {preset.subtitle}
                      </p>
                      <p className={`text-xs mt-1 leading-relaxed ${
                        isDark ? 'text-slate-400' : 'text-slate-600 font-medium'
                      }`}>
                        {preset.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAddPresetItems(preset, e)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center transition-transform active:scale-95 ${
                        isDark
                          ? 'neu-btn-primary text-slate-950 font-black'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                      }`}
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Add All ({presetItems.length} Tools)</span>
                    </button>
                  </div>

                  {/* Included Apparatus preview list */}
                  <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                    <div className={`text-[11px] mb-1.5 font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                      Included Apparatus:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {presetItems.map((item) => (
                        <span
                          key={item.id}
                          className={`text-xs px-2.5 py-1 rounded-lg font-mono font-semibold ${
                            isDark
                              ? 'neu-inset-sm text-slate-200'
                              : 'bg-slate-100 text-slate-900 border border-slate-200'
                          }`}
                        >
                          {item.name} <span className={isDark ? 'text-cyan-400 font-bold' : 'text-blue-700 font-black'}>({item.tagCode})</span>
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
            <div className={`text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-2 ${
              isDark ? 'text-slate-300' : 'text-slate-800'
            }`}>
              <Layers className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-700'}`} />
              <span>Or Ask AI for Custom Apparatus</span>
            </div>

            <form onSubmit={handleCustomSearch} className="flex gap-2.5">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ask AI: e.g. 'Breadboard Logic Circuit', 'Slump Cone Test'..."
                className={`flex-1 min-h-[46px] px-4 rounded-xl text-sm focus:outline-none transition-all ${
                  isDark
                    ? 'neu-inset text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500'
                    : 'bg-white border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              <button
                type="submit"
                className={`px-5 min-h-[46px] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer ${
                  isDark
                    ? 'neu-btn-raised text-cyan-400'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            {/* Custom Search Result Box */}
            {customSuggestions && (
              <div className={`mt-3 p-4 rounded-2xl space-y-2.5 border ${
                isDark ? 'neu-inset border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`flex items-center justify-between text-xs font-bold ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  <span>{customSuggestions.title}</span>
                  {customSuggestions.items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => addMultipleToCart(customSuggestions.items)}
                      className={`text-xs hover:underline font-bold ${
                        isDark ? 'text-cyan-400' : 'text-blue-700'
                      }`}
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
                        className={`text-xs flex items-center justify-between p-2.5 rounded-xl border ${
                          isDark
                            ? 'neu-card-sm text-slate-300 border-slate-800'
                            : 'bg-white text-slate-900 border-slate-200 shadow-2xs'
                        }`}
                      >
                        <span className="font-semibold">{item.name}</span>
                        <span className={`font-mono text-[11px] font-bold ${
                          isDark ? 'text-cyan-400' : 'text-blue-700'
                        }`}>{item.tagCode}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                    No matching apparatus found. Try terms like 'resistor', 'flask', 'wires', or 'multimeter'.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-end shrink-0 ${
          isDark ? 'bg-[#111a2c] border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[44px] px-6 py-2 rounded-xl font-bold text-xs active:scale-95 cursor-pointer transition-transform ${
              isDark
                ? 'neu-btn-raised text-slate-200'
                : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 shadow-xs'
            }`}
          >
            Done & Return to Catalog
          </button>
        </div>
      </div>
    </div>
  );
}
