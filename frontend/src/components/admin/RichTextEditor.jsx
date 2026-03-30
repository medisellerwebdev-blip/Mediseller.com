import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * A customized Rich Text Editor using React Quill
 * @param {string} value - The HTML content
 * @param {function} onChange - Callback function for change events
 * @param {string} placeholder - Placeholder text
 */
const RichTextEditor = ({ value, onChange, placeholder = 'Write something amazing...' }) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'clean'],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

  return (
    <div className="rich-text-editor bg-white rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      <ReactQuill 
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="min-h-[150px]"
      />
      <style jsx global>{`
        .ql-container.ql-snow {
          border: none !important;
          font-family: inherit;
          font-size: 0.875rem;
          min-height: 150px;
        }
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background-color: #f8fafc;
        }
        .ql-editor {
          min-height: 150px;
          line-height: 1.6;
        }
        .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
