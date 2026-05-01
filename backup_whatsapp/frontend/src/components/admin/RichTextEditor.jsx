import React, { useMemo } from 'react';
import JoditEditor from 'jodit-react';

/**
 * A React 19 compatible Rich Text Editor using Jodit.
 * Restores formatting toolbar (Bold, Italic, Lists, etc.)
 */
const RichTextEditor = ({ value, onChange, placeholder = 'Write something amazing...' }) => {
  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: placeholder || 'Start typing...',
      toolbarAdaptive: false,
      buttons: [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        '|',
        'ul',
        'ol',
        '|',
        'font',
        'fontsize',
        'brush',
        'paragraph',
        '|',
        'image',
        'table',
        'link',
        '|',
        'align',
        'undo',
        'redo',
        '|',
        'hr',
        'eraser',
        'fullsize',
      ],
      height: 400,
      style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
      },
    }),
    [placeholder]
  );

  return (
    <div className="rich-text-editor border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <JoditEditor
        value={value || ''}
        config={config}
        tabIndex={1}
        onBlur={(newContent) => onChange(newContent)}
        onChange={() => {}}
      />
    </div>
  );
};

export default RichTextEditor;
