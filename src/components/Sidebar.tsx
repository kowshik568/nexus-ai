import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  BrainCircuit,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Conversation, UserMemory, ServerHealth } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  memories: UserMemory[];
  onOpenSettings: () => void;
  onOpenMemories: () => void;
  health: ServerHealth | null;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  memories,
  onOpenSettings,
  onOpenMemories,
  health,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const saveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
    setDeleteConfirmId(null);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by time
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const groups: { [key: string]: Conversation[] } = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  filteredConversations.forEach((c) => {
    const diff = now - c.updatedAt;
    if (diff < ONE_DAY) {
      groups['Today'].push(c);
    } else if (diff < 2 * ONE_DAY) {
      groups['Yesterday'].push(c);
    } else if (diff < 7 * ONE_DAY) {
      groups['Previous 7 Days'].push(c);
    } else {
      groups['Older'].push(c);
    }
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 md:hidden"
          onClick={onToggleOpen}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col w-72 bg-zinc-950 border-r border-zinc-900 transition-all duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        }`}
      >
        <div className="flex flex-col h-full w-72">
          {/* Header */}
          <div className="p-3 border-b border-zinc-900/80">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                    Nexus AI
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      v3.8
                    </span>
                  </h1>
                </div>
              </div>
              <button
                onClick={onToggleOpen}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={onNewConversation}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-200 rounded-xl border border-zinc-800 transition-all duration-150 text-sm font-medium shadow-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-indigo-400 group-hover:rotate-90 transition-transform duration-200" />
                <span>New chat</span>
              </div>
              <kbd className="hidden sm:inline-block text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 rounded">
                ⌘K
              </kbd>
            </button>

            {/* Search Input */}
            <div className="mt-2.5 relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations History List */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
            {filteredConversations.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-zinc-500">
                {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
              </div>
            ) : (
              Object.entries(groups).map(([groupTitle, list]) => {
                if (list.length === 0) return null;
                return (
                  <div key={groupTitle} className="space-y-1">
                    <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-500 tracking-wide">
                      {groupTitle}
                    </div>
                    {list.map((conv) => {
                      const isActive = conv.id === activeConversationId;
                      const isEditing = editingId === conv.id;
                      const isConfirmingDelete = deleteConfirmId === conv.id;

                      return (
                        <div
                          key={conv.id}
                          onClick={() => onSelectConversation(conv.id)}
                          className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                            isActive
                              ? 'bg-zinc-800/90 text-white font-medium border border-zinc-700/60 shadow-xs'
                              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
                            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveRename(conv.id, e);
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                                className="w-full bg-zinc-950 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-hidden"
                              />
                            ) : (
                              <span className="truncate">{conv.title}</span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {isEditing ? (
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => saveRename(conv.id, e)}
                                className="p-1 text-emerald-400 hover:bg-zinc-800 rounded"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelRename}
                                className="p-1 text-zinc-400 hover:bg-zinc-800 rounded"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isConfirmingDelete ? (
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[10px] text-rose-400">Delete?</span>
                              <button
                                onClick={(e) => confirmDelete(conv.id, e)}
                                className="p-1 text-rose-400 hover:bg-rose-950/60 rounded"
                                title="Confirm delete"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className="p-1 text-zinc-400 hover:bg-zinc-800 rounded"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => startRename(conv, e)}
                                className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-750 rounded transition-colors"
                                title="Rename chat"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(conv.id);
                                }}
                                className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-750 rounded transition-colors"
                                title="Delete chat"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-3 border-t border-zinc-900 bg-zinc-950/80 space-y-1.5">
            {/* User Memory Quick Access */}
            <button
              onClick={onOpenMemories}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span>Personal Memory</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                {memories.length}
              </span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-zinc-400" />
                <span>Settings & Engine</span>
              </div>
            </button>

            {/* Health / Model Indicator */}
            <div className="pt-2 border-t border-zinc-900/60 px-2 flex items-center justify-between text-[11px] text-zinc-500">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${health?.geminiConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="truncate">
                  {health?.geminiConfigured ? 'Gemini 3.8 Flash' : 'API Key Setup Needed'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-600">Active</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
