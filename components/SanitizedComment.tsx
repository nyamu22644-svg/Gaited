import React, { useState } from 'react';
import { sanitizeContent } from '../lib/utils';
import { Send, AlertTriangle } from 'lucide-react';

interface CommentProps {
  username: string;
  timestamp: string;
  content: string;
  isSeller?: boolean;
}

export const CommentItem: React.FC<CommentProps> = ({ username, timestamp, content, isSeller }) => (
  <div className={`flex gap-3 p-3 rounded-lg ${isSeller ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${isSeller ? 'bg-green-600' : 'bg-gray-400'}`}>
      {username.charAt(0).toUpperCase()}
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <h4 className="text-sm font-semibold text-gray-900">
          {username} {isSeller && <span className="ml-2 px-1.5 py-0.5 bg-green-200 text-green-800 text-[10px] rounded">SELLER</span>}
        </h4>
        <span className="text-xs text-gray-400">{timestamp}</span>
      </div>
      <p className="text-sm text-gray-700 mt-1 break-words">{content}</p>
    </div>
  </div>
);

export const CommentInput: React.FC<{ onSubmit: (text: string) => void }> = ({ onSubmit }) => {
  const [text, setText] = useState('');
  const [warning, setWarning] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setText(newVal);

    if (newVal !== sanitizeContent(newVal)) {
      setWarning('Warning: Phone numbers and emails are automatically hidden to prevent scams.');
    } else {
      setWarning('');
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(sanitizeContent(text));
    setText('');
    setWarning('');
  };

  return (
    <div className="mt-4">
      <div className="relative">
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
          rows={3}
          placeholder="Ask a question about this note..."
          value={text}
          onChange={handleChange}
        />
        <button
          onClick={handleSubmit}
          className="absolute bottom-3 right-3 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
      {warning && (
        <div className="flex items-center mt-2 text-xs text-amber-600">
          <AlertTriangle size={12} className="mr-1" />
          {warning}
        </div>
      )}
    </div>
  );
};
