import React, { useState } from 'react';
import {
  X,
  Settings,
  BrainCircuit,
  Sliders,
  Database,
  Shield,
  Download,
  Trash2,
  Check,
  Plus,
  Edit2,
  ExternalLink,
  Cpu,
  Info
} from 'lucide-react';
import { AppSettings, UserMemory, ServerHealth, ModelOption } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'memories' | 'storage' | 'tools';
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  memories: UserMemory[];
  onAddMemory: (fact: string, category: UserMemory['category']) => void;
  onUpdateMemory: (id: string, fact: string, category: UserMemory['category']) => void;
  onDeleteMemory: (id: string) => void;
  health: ServerHealth | null;
  onExportAllData: () => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'general',
  settings,
  onUpdateSettings,
  memories,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  health,
  onExportAllData,
  onClearAllData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'memories' | 'storage' | 'tools'>(initialTab);
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState<UserMemory['category']>('preference');
  const [editingMemId, setEditingMemId] = useState<string | null>(null);
  const [editingFact, setEditingFact] = useState('');
  const [editingCategory, setEditingCategory] = useState<UserMemory['category']>('preference');
  const [confirmWipe, setConfirmWipe] = useState(false);

  if (!isOpen) return null;

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    onAddMemory(newFact.trim(), newCategory);
    setNewFact('');
  };

  const handleSaveEditMemory = (id: string) => {
    if (!editingFact.trim()) return;
    onUpdateMemory(id, editingFact.trim(), editingCategory);
    setEditingMemId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Nexus AI Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-900 px-6 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General & Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('memories')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'memories'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>User Memories ({memories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'storage'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Storage & Privacy</span>
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tools'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Tools & Grounding</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin text-xs">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Theme Selection */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                <div>
                  <div className="font-semibold text-zinc-200 text-sm">Color Theme</div>
                  <div className="text-zinc-400 text-xs mt-0.5">
                    Near-black charcoal with subtle slate surfaces
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateSettings({ theme: 'dark' })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                      settings.theme === 'dark'
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    Dark (Charcoal)
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ theme: 'light' })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                      settings.theme === 'light'
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    Dark Minimal
                  </button>
                </div>
              </div>

              {/* Default Model */}
              <div className="pb-4 border-b border-zinc-900 space-y-2">
                <div className="font-semibold text-zinc-200 text-sm">Default Model</div>
                <div className="text-zinc-400 text-xs">
                  Select which Gemini model will be selected for new conversations.
                </div>
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {(health?.availableModels || []).map((m: ModelOption) => (
                    <label
                      key={m.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        settings.defaultModel === m.id
                          ? 'bg-indigo-950/20 border-indigo-500/50 text-white'
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="defaultModel"
                        checked={settings.defaultModel === m.id}
                        onChange={() => onUpdateSettings({ defaultModel: m.id })}
                        className="mt-0.5 accent-indigo-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">{m.name}</span>
                          {m.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{m.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="pb-4 border-b border-zinc-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-zinc-200 text-sm">Creativity (Temperature)</div>
                  <span className="font-mono text-zinc-400">{settings.temperature}</span>
                </div>
                <div className="text-zinc-400 text-xs">
                  Lower values (0.2 - 0.5) produce deterministic, precise answers. Higher values (0.7 - 1.0) produce more creative responses.
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.temperature}
                  onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* System Instruction Transparency */}
              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center gap-2 font-medium text-zinc-300">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nexus AI Personality System Rule</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Nexus AI is configured with honest, thoughtful general-purpose instructions that mandate direct answers, step-by-step explanations, grounded sources for current facts, and zero fabrication.
                </p>
              </div>
            </div>
          )}

          {/* MEMORIES TAB */}
          {activeTab === 'memories' && (
            <div className="space-y-5">
              {/* Memory master toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div>
                  <div className="font-semibold text-zinc-200 text-sm">Enable Personal Memory</div>
                  <div className="text-zinc-400 text-xs mt-0.5">
                    Inject saved user-approved preferences and facts into conversation context
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableMemory}
                    onChange={(e) => onUpdateSettings({ enableMemory: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Add Memory Form */}
              <form onSubmit={handleCreateMemory} className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2.5">
                <div className="font-semibold text-zinc-300 text-xs">Add New Memory / Fact</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., 'User prefers Python for data tasks and TypeScript for web development'"
                    value={newFact}
                    onChange={(e) => setNewFact(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-hidden"
                  >
                    <option value="preference">Preference</option>
                    <option value="personal">Personal</option>
                    <option value="work">Work/Project</option>
                    <option value="instruction">Instruction</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!newFact.trim()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </form>

              {/* Stored Memories List */}
              <div className="space-y-2">
                <div className="font-medium text-zinc-400 text-xs">
                  Saved Facts ({memories.length})
                </div>

                {memories.length === 0 ? (
                  <div className="p-4 text-center text-zinc-500 rounded-xl border border-zinc-900">
                    No explicit memories saved yet. Memories are user-controlled and never silently recorded.
                  </div>
                ) : (
                  memories.map((mem) => {
                    const isEditing = editingMemId === mem.id;

                    return (
                      <div
                        key={mem.id}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start justify-between gap-3"
                      >
                        {isEditing ? (
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={editingFact}
                              onChange={(e) => setEditingFact(e.target.value)}
                              className="w-full bg-zinc-950 border border-indigo-500 rounded px-2 py-1 text-xs text-white"
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <select
                                value={editingCategory}
                                onChange={(e) => setEditingCategory(e.target.value as any)}
                                className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-300"
                              >
                                <option value="preference">Preference</option>
                                <option value="personal">Personal</option>
                                <option value="work">Work/Project</option>
                                <option value="instruction">Instruction</option>
                              </select>
                              <button
                                onClick={() => handleSaveEditMemory(mem.id)}
                                className="px-2 py-1 rounded bg-indigo-600 text-white text-[11px]"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingMemId(null)}
                                className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-300 border border-zinc-700/60">
                                  {mem.category}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  {new Date(mem.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-zinc-200 text-xs leading-relaxed">{mem.fact}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingMemId(mem.id);
                                  setEditingFact(mem.fact);
                                  setEditingCategory(mem.category);
                                }}
                                className="p-1 text-zinc-500 hover:text-zinc-200 rounded"
                                title="Edit memory"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteMemory(mem.id)}
                                className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                                title="Delete memory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STORAGE & PRIVACY TAB */}
          {activeTab === 'storage' && (
            <div className="space-y-5">
              {/* Storage Backend Information */}
              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-zinc-200 text-sm">Storage Status</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Local Persistent Store Active
                  </span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Conversations and memories are persisted to the server file system (<code className="text-zinc-300">data/nexus-store.json</code>). They remain intact across browser refreshes and server reboots.
                </p>
                <div className="text-[11px] text-zinc-500">
                  Cloud Firestore integration is supported as a persistent backend when configured.
                </div>
              </div>

              {/* Export Data */}
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-200 text-sm">Export Data</div>
                <p className="text-zinc-400 text-xs">
                  Download a complete backup of all conversations, messages, and memories as a structured JSON file.
                </p>
                <button
                  onClick={onExportAllData}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export All Data (JSON)</span>
                </button>
              </div>

              {/* Wipe Data */}
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                <div className="font-semibold text-rose-300 text-sm">Erase All Data</div>
                <p className="text-zinc-400 text-xs">
                  Permanently delete all conversations, messages, and memories from the system. This cannot be undone.
                </p>
                {confirmWipe ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onClearAllData();
                        setConfirmWipe(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs cursor-pointer"
                    >
                      Yes, Permanently Delete Everything
                    </button>
                    <button
                      onClick={() => setConfirmWipe(false)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmWipe(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 text-xs font-medium border border-rose-800/50 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All Conversations & Memories</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TOOLS & GROUNDING TAB */}
          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div>
                <div className="font-semibold text-zinc-200 text-sm">Assistant Tools & Capabilities Disclosure</div>
                <div className="text-zinc-400 text-xs mt-0.5">
                  Real-time status of configured integrations, capabilities, and intentionally disabled external tools.
                </div>
              </div>

              <div className="space-y-2.5">
                {(health?.toolsDisclosure || []).map((tool, idx) => {
                  const isActive = tool.status === 'active';
                  const isConfigured = tool.status === 'configured';

                  return (
                    <div key={idx} className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-zinc-200 text-xs flex items-center gap-2">
                          <span>{tool.name}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            {tool.type}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isConfigured
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {isActive ? 'Active' : isConfigured ? 'Configured' : 'Not Available'}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed">{tool.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Gemini Server Connection */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-zinc-200 text-xs">Gemini Server Engine Connection</div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      health?.geminiConfigured
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {health?.geminiConfigured ? 'Connected' : 'Missing API Key'}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs">
                  {health?.geminiConfigured
                    ? 'Connected securely via server-side @google/genai SDK with User-Agent telemetry.'
                    : 'The server could not detect GEMINI_API_KEY. Configure it in the Secrets panel in AI Studio.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-900 bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
