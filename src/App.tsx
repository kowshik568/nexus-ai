import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { api } from './services/api';
import { Conversation, Message, UserMemory, AppSettings, ServerHealth, Attachment } from './types';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<(Conversation & { messages: Message[] }) | null>(null);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.8-flash');
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(true);
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    defaultModel: 'gemini-3.8-flash',
    enableMemory: true,
    enableWebSearch: true,
    temperature: 0.7,
  });
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'memories' | 'storage' | 'tools'>('general');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize application data
  useEffect(() => {
    async function init() {
      try {
        const [healthData, settingsData, memoriesData, convsData] = await Promise.all([
          api.getHealth().catch(() => null),
          api.getSettings().catch(() => null),
          api.getMemories().catch(() => []),
          api.getConversations().catch(() => []),
        ]);

        if (healthData) setHealth(healthData);
        if (settingsData) {
          setSettings(settingsData);
          setActiveModel(settingsData.defaultModel || 'gemini-3.8-flash');
          setWebSearchEnabled(settingsData.enableWebSearch ?? true);
        }
        setMemories(memoriesData);
        setConversations(convsData);

        // Load most recent conversation or create a new one
        if (convsData.length > 0) {
          const firstId = convsData[0].id;
          setActiveConversationId(firstId);
          loadConversation(firstId);
        } else {
          handleNewConversation();
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }

    init();
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K for New Chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewConversation();
      }
      if (e.key === 'Escape' && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen]);

  // Load conversation details
  const loadConversation = async (id: string) => {
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
      setActiveConversationId(conv.id);
      setActiveModel(conv.model || settings.defaultModel || 'gemini-3.8-flash');
      setWebSearchEnabled(conv.webSearchEnabled !== undefined ? conv.webSearchEnabled : true);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  // Create new conversation
  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation({
        title: 'New Chat',
        model: activeModel,
        webSearchEnabled,
      });
      setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
      setActiveConversationId(newConv.id);
      setCurrentConversation({ ...newConv, messages: [] });
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);

      if (activeConversationId === id) {
        if (remaining.length > 0) {
          loadConversation(remaining[0].id);
        } else {
          handleNewConversation();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Rename conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const updated = await api.updateConversation(id, { title: newTitle });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c)));
      if (currentConversation && currentConversation.id === id) {
        setCurrentConversation({ ...currentConversation, title: updated.title });
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  // Change model
  const handleChangeModel = async (modelId: string) => {
    setActiveModel(modelId);
    if (activeConversationId) {
      await api.updateConversation(activeConversationId, { model: modelId }).catch(console.error);
      if (currentConversation) {
        setCurrentConversation({ ...currentConversation, model: modelId });
      }
    }
  };

  // Toggle web search grounding
  const handleToggleWebSearch = async () => {
    const nextVal = !webSearchEnabled;
    setWebSearchEnabled(nextVal);
    if (activeConversationId) {
      await api.updateConversation(activeConversationId, { webSearchEnabled: nextVal }).catch(console.error);
      if (currentConversation) {
        setCurrentConversation({ ...currentConversation, webSearchEnabled: nextVal });
      }
    }
  };

  // Clear current conversation messages
  const handleClearMessages = async () => {
    if (!activeConversationId) return;
    if (window.confirm('Are you sure you want to clear all messages in this conversation?')) {
      try {
        await api.clearMessages(activeConversationId);
        if (currentConversation) {
          setCurrentConversation({ ...currentConversation, messages: [] });
        }
      } catch (err) {
        console.error('Failed to clear messages:', err);
      }
    }
  };

  // Export current conversation
  const handleExportConversation = (format: 'markdown' | 'json') => {
    if (!currentConversation) return;

    let content = '';
    let filename = `${currentConversation.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_export`;

    if (format === 'markdown') {
      filename += '.md';
      content = `# ${currentConversation.title}\n\n`;
      content += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
      for (const msg of currentConversation.messages) {
        const sender = msg.role === 'user' ? '### User' : '### Nexus AI';
        content += `${sender}\n\n${msg.content}\n\n`;
        if (msg.groundingMetadata?.groundingChunks?.length) {
          content += `#### Sources:\n`;
          for (const c of msg.groundingMetadata.groundingChunks) {
            if (c.web?.uri) {
              content += `- [${c.web.title || c.web.uri}](${c.web.uri})\n`;
            }
          }
          content += '\n';
        }
        content += '---\n\n';
      }
    } else {
      filename += '.json';
      content = JSON.stringify(currentConversation, null, 2);
    }

    const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Send message and stream response
  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if (!activeConversationId || isStreaming) return;

    // 1. Build and save user message
    const userMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // Update conversation local state with user message
    const updatedMessages = [...(currentConversation?.messages || []), userMsg];
    if (currentConversation) {
      setCurrentConversation({
        ...currentConversation,
        messages: updatedMessages,
      });
    }

    // Persist user message to backend
    await api.saveMessage(activeConversationId, userMsg).catch(console.error);

    // Refresh conversation title in sidebar if it was "New Chat"
    if (currentConversation?.title === 'New Chat') {
      const preview = text.trim().slice(0, 36);
      const newTitle = preview.length >= 36 ? `${preview}...` : preview;
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversationId ? { ...c, title: newTitle } : c))
      );
    }

    // 2. Prepare streaming assistant placeholder
    const assistantMsgId = `msg-${Date.now() + 1}-${Math.random().toString(36).substring(2, 6)}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setCurrentConversation((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, assistantMsg],
      };
    });

    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedContent = '';

    await api.streamChat(
      {
        conversationId: activeConversationId,
        message: text,
        history: currentConversation?.messages || [],
        model: activeModel,
        webSearchEnabled,
        temperature: settings.temperature,
        attachments,
      },
      {
        onChunk: (chunk: string) => {
          accumulatedContent += chunk;
          setCurrentConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
              ),
            };
          });
        },
        onGrounding: (metadata) => {
          setCurrentConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, groundingMetadata: metadata } : m
              ),
            };
          });
        },
        onActivatedMemories: (memories) => {
          setCurrentConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, activatedMemories: memories } : m
              ),
            };
          });
        },
        onError: (errorText: string) => {
          setIsStreaming(false);
          setCurrentConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      isStreaming: false,
                      error: errorText,
                      content: m.content || 'An error occurred while generating a response.',
                    }
                  : m
              ),
            };
          });
        },
        onDone: (fullText: string, metadata, memories) => {
          setIsStreaming(false);
          setCurrentConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      isStreaming: false,
                      content: fullText || accumulatedContent,
                      groundingMetadata: metadata || m.groundingMetadata,
                      activatedMemories: memories || m.activatedMemories,
                    }
                  : m
              ),
            };
          });
        },
      },
      controller.signal
    );
  };

  // Stop active generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setCurrentConversation((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: prev.messages.map((m) =>
          m.isStreaming ? { ...m, isStreaming: false } : m
        ),
      };
    });
  };

  // Regenerate last assistant response
  const handleRegenerate = async () => {
    if (!currentConversation || currentConversation.messages.length < 2 || isStreaming) return;

    // Find last user message
    const msgs = [...currentConversation.messages];
    const lastAssistantIdx = msgs.length - 1;
    if (msgs[lastAssistantIdx].role !== 'assistant') return;

    const userTurn = msgs[lastAssistantIdx - 1];
    if (!userTurn || userTurn.role !== 'user') return;

    // Remove the last assistant message
    const messagesWithoutLast = msgs.slice(0, lastAssistantIdx);
    setCurrentConversation({
      ...currentConversation,
      messages: messagesWithoutLast,
    });

    // Re-trigger generation for userTurn
    const priorHistory = messagesWithoutLast.slice(0, -1);

    const assistantMsgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setCurrentConversation((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, assistantMsg],
      };
    });

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let accumulatedContent = '';

    await api.streamChat(
      {
        conversationId: activeConversationId!,
        message: userTurn.content,
        history: priorHistory,
        model: activeModel,
        webSearchEnabled,
        temperature: settings.temperature,
        attachments: userTurn.attachments,
      },
      {
        onChunk: (chunk: string) => {
          accumulatedContent += chunk;
          setCurrentConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
              ),
            };
          });
        },
        onGrounding: (metadata) => {
          setCurrentConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, groundingMetadata: metadata } : m
              ),
            };
          });
        },
        onActivatedMemories: (memories) => {
          setCurrentConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, activatedMemories: memories } : m
              ),
            };
          });
        },
        onError: (errorText: string) => {
          setIsStreaming(false);
          setCurrentConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, isStreaming: false, error: errorText } : m
              ),
            };
          });
        },
        onDone: (fullText: string, metadata, memories) => {
          setIsStreaming(false);
          setCurrentConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      isStreaming: false,
                      content: fullText || accumulatedContent,
                      groundingMetadata: metadata || m.groundingMetadata,
                      activatedMemories: memories || m.activatedMemories,
                    }
                  : m
              ),
            };
          });
        },
      },
      controller.signal
    );
  };

  // Memory management handlers
  const handleAddMemory = async (fact: string, category: UserMemory['category']) => {
    try {
      const newMem = await api.addMemory(fact, category);
      setMemories((prev) => [newMem, ...prev]);
    } catch (err) {
      console.error('Failed to add memory:', err);
    }
  };

  const handleUpdateMemory = async (id: string, fact: string, category: UserMemory['category']) => {
    try {
      const updated = await api.updateMemory(id, fact, category);
      setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      console.error('Failed to update memory:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  // Export all application data
  const handleExportAllData = async () => {
    try {
      const backup = await api.exportData();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus_ai_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  // Clear all application data
  const handleClearAllData = async () => {
    try {
      await api.clearAllData();
      setConversations([]);
      setMemories([]);
      handleNewConversation();
      setIsSettingsOpen(false);
    } catch (err) {
      console.error('Failed to clear data:', err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 select-text">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={loadConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        memories={memories}
        onOpenSettings={() => {
          setSettingsInitialTab('general');
          setIsSettingsOpen(true);
        }}
        onOpenMemories={() => {
          setSettingsInitialTab('memories');
          setIsSettingsOpen(true);
        }}
        health={health}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Area */}
      <ChatArea
        conversation={currentConversation}
        activeModel={activeModel}
        onChangeModel={handleChangeModel}
        availableModels={health?.availableModels || []}
        webSearchEnabled={webSearchEnabled}
        onToggleWebSearch={handleToggleWebSearch}
        onSendMessage={handleSendMessage}
        isStreaming={isStreaming}
        onStopGeneration={handleStopGeneration}
        onRegenerate={handleRegenerate}
        onClearMessages={handleClearMessages}
        onExportConversation={handleExportConversation}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Settings & Memory Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsInitialTab}
        settings={settings}
        onUpdateSettings={async (updates) => {
          setSettings((prev) => ({ ...prev, ...updates }));
          await api.updateSettings(updates).catch(console.error);
        }}
        memories={memories}
        onAddMemory={handleAddMemory}
        onUpdateMemory={handleUpdateMemory}
        onDeleteMemory={handleDeleteMemory}
        health={health}
        onExportAllData={handleExportAllData}
        onClearAllData={handleClearAllData}
      />
    </div>
  );
}
