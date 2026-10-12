import React, { useRef, useEffect } from 'react';
import {
  PanelLeft,
  Share2,
  Trash2,
  Download,
  Globe,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Message, Conversation, ModelOption, Attachment } from '../types';
import { MessageItem } from './MessageItem';
import { WelcomeScreen } from './WelcomeScreen';
import { Composer } from './Composer';

interface ChatAreaProps {
  conversation: (Conversation & { messages: Message[] }) | null;
  activeModel: string;
  onChangeModel: (modelId: string) => void;
  availableModels: ModelOption[];
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  onRegenerate: () => void;
  onClearMessages: () => void;
  onExportConversation: (format: 'markdown' | 'json') => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  activeModel,
  onChangeModel,
  availableModels,
  webSearchEnabled,
  onToggleWebSearch,
  onSendMessage,
  isStreaming,
  onStopGeneration,
  onRegenerate,
  onClearMessages,
  onExportConversation,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const messages = conversation?.messages || [];

  // Auto-scroll to bottom when new messages arrive or while streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
  }, [messages, isStreaming]);

  const activeModelObj = availableModels.find((m) => m.id === activeModel) || availableModels[0] || {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
            title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          {/* Model Selector dropdown */}
          <div className="relative group">
            <select
              value={activeModel}
              onChange={(e) => onChangeModel(e.target.value)}
              className="appearance-none bg-zinc-900 hover:bg-zinc-850 text-zinc-200 text-xs font-medium pl-3 pr-8 py-1.5 rounded-xl border border-zinc-800 focus:outline-hidden focus:border-indigo-500/50 cursor-pointer transition-colors shadow-xs"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.id === 'gemini-3.8-flash' ? '(Recommended)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Grounding Search Status Pill */}
          <div
            onClick={onToggleWebSearch}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-all ${
              webSearchEnabled
                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
                : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
            title="Toggle Google Search Grounding for current conversation"
          >
            <Globe className="w-3 h-3" />
            <span>{webSearchEnabled ? 'Search Grounding: On' : 'Search Grounding: Off'}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <>
              {/* Export dropdown */}
              <button
                onClick={() => onExportConversation('markdown')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Export chat as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Clear chat */}
              <button
                onClick={onClearMessages}
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                title="Clear conversation messages"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Conversation Scrollable View */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin flex flex-col"
      >
        {messages.length === 0 ? (
          <WelcomeScreen
            onSelectPrompt={(prompt, enableSearch) => {
              if (enableSearch !== undefined && enableSearch !== webSearchEnabled) {
                onToggleWebSearch();
              }
              onSendMessage(prompt, []);
            }}
            activeModelName={activeModelObj.name}
          />
        ) : (
          <div className="py-4 space-y-1">
            {messages.map((msg, index) => {
              const isLastAssistant =
                msg.role === 'assistant' &&
                index === messages.length - 1;

              return (
                <MessageItem
                  key={msg.id || index}
                  message={msg}
                  isLastAssistant={isLastAssistant}
                  onRegenerate={onRegenerate}
                  isStreaming={msg.isStreaming}
                />
              );
            })}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Fixed Composer Bottom */}
      <div className="shrink-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pt-4">
        <Composer
          onSendMessage={onSendMessage}
          isStreaming={isStreaming}
          onStopGeneration={onStopGeneration}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={onToggleWebSearch}
        />
      </div>
    </div>
  );
};
