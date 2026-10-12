import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Globe,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Mic,
  MicOff
} from 'lucide-react';
import { Attachment } from '../types';

interface ComposerProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  placeholder?: string;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  isStreaming,
  onStopGeneration,
  webSearchEnabled,
  onToggleWebSearch,
  placeholder = 'Ask Nexus AI anything...',
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Voice input is not supported in this browser.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200; // max ~8 lines
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isStreaming) return;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    onSendMessage(trimmed, attachments);
    setText('');
    setAttachments([]);
    setErrorMsg(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Process files (multimodal images & text documents)
  const processFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);
    const newAttachments: Attachment[] = [];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg(`File "${file.name}" exceeds the 10MB size limit.`);
        continue;
      }

      const id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      if (file.type.startsWith('image/')) {
        // Read image as base64 inlineData
        const base64 = await readFileAsBase64(file);
        const cleanBase64 = base64.split(',')[1] || '';
        newAttachments.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: base64,
          inlineData: {
            mimeType: file.type,
            data: cleanBase64,
          },
        });
      } else {
        // Text / code document
        try {
          const content = await readFileAsText(file);
          newAttachments.push({
            id,
            name: file.name,
            size: file.size,
            type: file.type || 'text/plain',
            textContent: content,
          });
        } catch {
          // If binary or PDF, attempt base64 inlineData if supported
          const base64 = await readFileAsBase64(file);
          const cleanBase64 = base64.split(',')[1] || '';
          newAttachments.push({
            id,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            dataUrl: base64,
            inlineData: {
              mimeType: file.type || 'application/pdf',
              data: cleanBase64,
            },
          });
        }
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-2 p-2 bg-zinc-900/80 rounded-xl border border-zinc-800 backdrop-blur-xs">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/80 text-xs text-zinc-200 group"
            >
              {att.dataUrl && att.type.startsWith('image/') ? (
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  className="w-5 h-5 rounded object-cover border border-zinc-700"
                />
              ) : (
                <FileText className="w-4 h-4 text-indigo-400" />
              )}
              <span className="max-w-[140px] truncate text-[11px] font-medium">{att.name}</span>
              <span className="text-[10px] text-zinc-400">({(att.size / 1024).toFixed(0)}KB)</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="p-1 text-zinc-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Notice */}
      {errorMsg && (
        <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-rose-400 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Composer Input Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col rounded-2xl bg-zinc-900/95 border transition-all duration-200 shadow-xl ${
          isDragging
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-zinc-850'
            : 'border-zinc-800/90 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700'
        }`}
      >
        {/* Drag overlay notice */}
        {isDragging && (
          <div className="absolute inset-0 bg-indigo-950/70 border-2 border-dashed border-indigo-400 rounded-2xl flex items-center justify-center text-xs font-medium text-indigo-200 z-10 pointer-events-none">
            Drop images or documents here to analyze
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 px-4 pt-3.5 pb-2 text-sm sm:text-base resize-none focus:outline-hidden min-h-[50px] leading-relaxed"
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800/50">
          <div className="flex items-center gap-1">
            {/* File upload button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.txt,.md,.json,.csv,.py,.js,.ts,.tsx,.jsx,.html,.css,.pdf"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer group relative"
              title="Attach files or images"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web Search Grounding Toggle */}
            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                webSearchEnabled
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
              }`}
              title={webSearchEnabled ? 'Google Search Grounding active' : 'Click to enable Google Search Grounding'}
            >
              <Globe className={`w-3.5 h-3.5 ${webSearchEnabled ? 'text-indigo-400' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">Search Web</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Voice Dictation */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
            </button>

            {isStreaming ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer border border-zinc-700"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!text.trim() && attachments.length === 0}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  text.trim() || attachments.length > 0
                    ? 'bg-white text-black hover:bg-zinc-200 shadow-sm'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                }`}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-2">
        <span>Nexus AI can make mistakes. Check important information with citations.</span>
      </div>
    </div>
  );
};
