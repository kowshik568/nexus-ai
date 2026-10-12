import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Check,
  RotateCw,
  Sparkles,
  User,
  FileText,
  AlertCircle,
  BrainCircuit,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Message } from '../types';
import { renderMarkdown, copyToClipboard } from '../utils/markdown';
import { SourceCitations } from './SourceCitations';

interface MessageItemProps {
  message: Message;
  isLastAssistant: boolean;
  onRegenerate?: () => void;
  isStreaming?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isLastAssistant,
  onRegenerate,
  isStreaming = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Stop speech if message changes or unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleReadAloud = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*_`>\[\]]/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const isUser = message.role === 'user';

  // Attach event listeners for the copy-code buttons inside rendered markdown
  useEffect(() => {
    if (!contentRef.current) return;

    const copyButtons = contentRef.current.querySelectorAll('.copy-code-btn');
    const handlers: Array<{ btn: Element; handler: (e: Event) => void }> = [];

    copyButtons.forEach((btn) => {
      const handler = async (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const encodedCode = btn.getAttribute('data-code');
        if (encodedCode) {
          const rawCode = decodeURIComponent(encodedCode);
          await copyToClipboard(rawCode);
          const originalHTML = btn.innerHTML;
          btn.innerHTML = `
            <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span class="text-emerald-400 font-medium">Copied!</span>
          `;
          setTimeout(() => {
            btn.innerHTML = originalHTML;
          }, 2000);
        }
      };

      btn.addEventListener('click', handler);
      handlers.push({ btn, handler });
    });

    return () => {
      handlers.forEach(({ btn, handler }) => {
        btn.removeEventListener('click', handler);
      });
    };
  }, [message.content]);

  const handleCopyMessage = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`py-5 px-4 sm:px-6 transition-colors ${isUser ? 'bg-transparent' : 'bg-zinc-950/40 border-y border-zinc-900/50'}`}>
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {isUser ? (
            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-indigo-600/90 border border-indigo-500/30 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 overflow-hidden space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-200">
              {isUser ? 'You' : 'Nexus AI'}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* User Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
                >
                  {att.dataUrl && att.type.startsWith('image/') ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-8 h-8 rounded object-cover border border-zinc-700"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  )}
                  <div className="overflow-hidden">
                    <div className="truncate max-w-[180px] font-medium text-[11px]">{att.name}</div>
                    <div className="text-[10px] text-zinc-500">{(att.size / 1024).toFixed(0)} KB</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Text / Markdown Content */}
          {isUser ? (
            <div className="text-zinc-100 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
              {message.content}
            </div>
          ) : (
            <div>
              <div
                ref={contentRef}
                className="prose-nexus text-sm sm:text-[15px] leading-relaxed break-words"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
              />
              {isStreaming && (
                <span className="streaming-cursor" />
              )}
            </div>
          )}

          {/* Error Banner */}
          {message.error && (
            <div className="mt-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{message.error}</span>
            </div>
          )}

          {/* Activated Memories pill if present */}
          {!isUser && message.activatedMemories && message.activatedMemories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1 text-indigo-400 font-medium">
                <BrainCircuit className="w-3 h-3" />
                Memories referenced:
              </span>
              {message.activatedMemories.map((mem, idx) => (
                <span key={idx} className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-300">
                  {mem}
                </span>
              ))}
            </div>
          )}

          {/* Grounding Source Citations (if present) */}
          {message.groundingMetadata && (
            <SourceCitations metadata={message.groundingMetadata} />
          )}

          {/* Bottom Actions for Assistant Message */}
          {!isUser && !isStreaming && message.content && (
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Copy entire response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={toggleReadAloud}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                  isSpeaking
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
                title={isSpeaking ? 'Stop reading' : 'Read response aloud'}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-indigo-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isSpeaking ? 'Stop' : 'Read'}</span>
              </button>

              {isLastAssistant && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
                  title="Regenerate this response"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
