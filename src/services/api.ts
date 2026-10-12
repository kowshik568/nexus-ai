import { Conversation, Message, UserMemory, AppSettings, ServerHealth, Attachment, GroundingMetadata } from '../types';

export interface StreamChatPayload {
  conversationId: string;
  message: string;
  history: Message[];
  model: string;
  webSearchEnabled: boolean;
  temperature?: number;
  topP?: number;
  attachments?: Attachment[];
}

export function getSessionUserId(): string {
  try {
    let id = localStorage.getItem('nexus_user_session_id');
    if (!id) {
      id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('nexus_user_session_id', id);
    }
    return id;
  } catch {
    return 'default-user';
  }
}

export function getAuthHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-user-id': getSessionUserId(),
  };
}

export const api = {
  async getHealth(): Promise<ServerHealth> {
    const res = await fetch('/api/health', {
      headers: { 'x-user-id': getSessionUserId() },
    });
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getConversations(): Promise<Conversation[]> {
    const res = await fetch('/api/conversations', {
      headers: { 'x-user-id': getSessionUserId() },
    });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async createConversation(data?: Partial<Conversation>): Promise<Conversation> {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async getConversation(id: string): Promise<Conversation & { messages: Message[] }> {
    const res = await fetch(`/api/conversations/${id}`, {
      headers: { 'x-user-id': getSessionUserId() },
    });
    if (!res.ok) throw new Error('Failed to load conversation');
    return res.json();
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getSessionUserId() },
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
  },

  async saveMessage(convId: string, message: Message): Promise<Message> {
    const res = await fetch(`/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Failed to save message');
    return res.json();
  },

  async clearMessages(convId: string): Promise<void> {
    const res = await fetch(`/api/conversations/${convId}/messages`, {
      method: 'DELETE',
      headers: { 'x-user-id': getSessionUserId() },
    });
    if (!res.ok) throw new Error('Failed to clear messages');
  },

  async getMemories(): Promise<UserMemory[]> {
    const res = await fetch('/api/memories', {
      headers: { 'x-user-id': getSessionUserId() },
    });
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  },

  async addMemory(fact: string, category: UserMemory['category'] = 'preference'): Promise<UserMemory> {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fact, category }),
    });
    if (!res.ok) throw new Error('Failed to add memory');
    return res.json();
  },

  async updateMemory(id: string, fact: string, category: UserMemory['category']): Promise<UserMemory> {
    const res = await fetch(`/api/memories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fact, category }),
    });
    if (!res.ok) throw new Error('Failed to update memory');
    return res.json();
  },

  async deleteMemory(id: string): Promise<void> {
    const res = await fetch(`/api/memories/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getSessionUserId() },
    });
    if (!res.ok) throw new Error('Failed to delete memory');
  },

  async getSettings(): Promise<AppSettings> {
    const res = await fetch('/api/settings', {
      headers: { 'x-user-id': getSessionUserId() },
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async exportData(): Promise<any> {
    const res = await fetch('/api/data/export', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to export data');
    return res.json();
  },

  async clearAllData(): Promise<void> {
    const res = await fetch('/api/data/all', {
      method: 'DELETE',
      headers: { 'x-user-id': getSessionUserId() },
    });
    if (!res.ok) throw new Error('Failed to clear data');
  },

  /**
   * SSE Stream chat message to backend
   */
  async streamChat(
    payload: StreamChatPayload,
    callbacks: {
      onChunk: (text: string) => void;
      onGrounding: (metadata: GroundingMetadata) => void;
      onActivatedMemories?: (memories: string[]) => void;
      onError: (error: string) => void;
      onDone: (fullText: string, metadata?: GroundingMetadata, activatedMemories?: string[]) => void;
    },
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Connection failed' }));
        callbacks.onError(errorData.error || `HTTP error ${response.status}`);
        return;
      }

      if (!response.body) {
        callbacks.onError('Response body is null');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';
      let accumulatedGrounding: GroundingMetadata | undefined;
      let accumulatedMemories: string[] | undefined;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.error) {
              callbacks.onError(data.error);
              return;
            }

            if (data.text) {
              accumulatedText += data.text;
              callbacks.onChunk(data.text);
            }

            if (data.activatedMemories) {
              accumulatedMemories = data.activatedMemories;
              callbacks.onActivatedMemories?.(data.activatedMemories);
            }

            if (data.groundingMetadata) {
              accumulatedGrounding = data.groundingMetadata;
              callbacks.onGrounding(data.groundingMetadata);
            }

            if (data.done) {
              callbacks.onDone(
                data.fullText || accumulatedText,
                data.groundingMetadata || accumulatedGrounding,
                data.activatedMemories || accumulatedMemories
              );
              return;
            }
          } catch (parseErr) {
            console.error('Failed to parse SSE line:', jsonStr, parseErr);
          }
        }
      }

      callbacks.onDone(accumulatedText, accumulatedGrounding, accumulatedMemories);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        callbacks.onDone('', undefined);
      } else {
        callbacks.onError(err.message || 'Stream connection failed');
      }
    }
  },
};
