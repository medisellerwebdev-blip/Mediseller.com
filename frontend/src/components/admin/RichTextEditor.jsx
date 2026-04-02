import React from 'react';

/**
 * A React 19 compatible Rich Text Editor alternative.
 * Uses a styled textarea to avoid the 'findDOMNode' crash in react-quill.
 */
const RichTextEditor = ({ value, onChange, placeholder = 'Write something amazing...' }) => {
  return (
    <div className="rich-text-editor bg-white rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      <div className="bg-slate-50 border-bottom px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
        <span>Editor (HTML Compatible)</span>
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Reactive Mode</span>
      </div>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[300px] p-4 text-sm font-mono text-slate-700 focus:outline-none resize-y leading-relaxed bg-white"
      />
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <span className="text-[10px] text-slate-400">Press Enter for new lines. HTML tags are supported.</span>
        <div className="flex gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-[10px] text-slate-500 italic">Safe Version Active</span>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
