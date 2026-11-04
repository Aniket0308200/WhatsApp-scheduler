import React, { useState, useEffect } from 'react';

export default function PollModal({ isOpen, onClose, onSave, initialData }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData && initialData.question) {
        setQuestion(initialData.question || '');
        setOptions(
          Array.isArray(initialData.options) && initialData.options.length >= 2
            ? [...initialData.options]
            : ['', '']
        );
        setAllowMultiple(Boolean(initialData.allowMultiple));
      } else {
        setQuestion('');
        setOptions(['', '']);
        setAllowMultiple(false);
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
    if (error) setError('');
  };

  const handleAddOption = () => {
    if (options.length >= 12) {
      setError('WhatsApp polls allow a maximum of 12 options.');
      return;
    }
    setOptions([...options, '']);
    setError('');
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      setError('A poll must have at least 2 options.');
      return;
    }
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    setError('');
  };

  const handleSave = () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Please enter a poll question.');
      return;
    }

    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setError('Please provide at least 2 non-empty options.');
      return;
    }

    onSave({
      question: trimmedQuestion,
      options: validOptions,
      allowMultiple
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#1f2c34] rounded-2xl shadow-2xl border border-slate-200 dark:border-wa-dbdr overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-wa-teal dark:bg-[#128c7e] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {initialData ? 'Edit WhatsApp Poll' : 'Create WhatsApp Poll'}
              </h3>
              <p className="text-[11px] text-emerald-100/80">Interactive live voting in chat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Question Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ask a question..."
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#111b21] border border-slate-300 dark:border-wa-dbdr text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-wa-dmuted focus:outline-none focus:ring-2 focus:ring-wa-teal dark:focus:ring-wa-green transition-all"
            />
          </div>

          {/* Options Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Options ({options.length}/12) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-wa-dmuted">Min. 2 options</span>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-6 text-center text-xs font-bold text-slate-400 dark:text-wa-dmuted shrink-0">
                    {idx + 1}.
                  </div>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-[#111b21] border border-slate-300 dark:border-wa-dbdr text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-wa-dmuted focus:outline-none focus:ring-2 focus:ring-wa-teal dark:focus:ring-wa-green transition-all"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0"
                      title="Remove option"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 12 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2.5 w-full py-2 px-3 rounded-xl border border-dashed border-emerald-400/60 dark:border-emerald-600/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Option</span>
              </button>
            )}
          </div>

          {/* Allow Multiple Answers Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111b21] border border-slate-200/80 dark:border-wa-dbdr flex items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                Allow multiple answers
              </p>
              <p className="text-[11px] text-slate-500 dark:text-wa-dmuted">
                People can choose more than one option
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={allowMultiple}
              onClick={() => setAllowMultiple(!allowMultiple)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                allowMultiple ? 'bg-wa-teal dark:bg-wa-green' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  allowMultiple ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50/80 dark:bg-[#111b21]/80 border-t border-slate-200 dark:border-wa-dbdr flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-wa-dsurf transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-wa-teal hover:bg-teal-600 dark:bg-wa-green dark:hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{initialData ? 'Update Poll' : 'Attach Poll'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
