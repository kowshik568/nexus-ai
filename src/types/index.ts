export type Role = 'user' | 'assistant' | 'system';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string; // mime type
  dataUrl?: string; // base64 data url for images or preview
  inlineData?: {
    mimeType: string;
    data: string; // base64 without prefix
  };
  textContent?: string; // text extracted for text documents
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingSupport {
  groundingChunkIndices?: number[];
  segment?: {
    startIndex?: number;
    endIndex?: number;
    text?: string;
  };
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
  searchEntryPoint?: {
    renderedContent?: string;
  };
}

export interface ToolDisclosure {
  name: string;
  status: 'active' | 'configured' | 'unavailable';
  description: string;
  type: 'built-in' | 'multimodal' | 'retrieval' | 'utility' | 'external';
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  groundingMetadata?: GroundingMetadata;
  activatedMemories?: string[];
  toolInvocations?: {
    tool: string;
    input: Record<string, unknown>;
    output?: unknown;
    status: 'running' | 'success' | 'error';
  }[];
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  systemInstruction?: string;
  webSearchEnabled?: boolean;
  messageCount?: number;
  lastMessagePreview?: string;
}

export interface UserMemory {
  id: string;
  fact: string;
  category: 'preference' | 'personal' | 'work' | 'instruction';
  createdAt: number;
  updatedAt: number;
  sourceConversationId?: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  defaultModel: string;
  enableMemory: boolean;
  enableWebSearch: boolean;
  temperature: number;
  maxOutputTokens?: number;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
  recommendedFor: string;
  supportsSearch: boolean;
  supportsMultimodal: boolean;
}

export interface ServerHealth {
  status: 'ok' | 'degraded' | 'error';
  geminiConfigured: boolean;
  defaultModel: string;
  activeStorage: 'firestore' | 'local_store';
  availableModels: ModelOption[];
  toolsDisclosure: ToolDisclosure[];
  notice?: string;
}
