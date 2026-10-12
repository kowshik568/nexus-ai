import React from 'react';
import { Sparkles, Code2, Search, FileText, Lightbulb, Compass, Zap } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string, enableSearch?: boolean) => void;
  activeModelName: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectPrompt,
  activeModelName,
}) => {
  const suggestions = [
    {
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      title: 'Debug & Refactor Code',
      description: 'Write a TypeScript debounce function with proper cancellation and tests',
      prompt: 'Write a clean TypeScript debounce utility function with generic parameter typing, immediate-execution support, and a cancel method. Explain the implementation step by step.',
      enableSearch: false,
    },
    {
      icon: <Search className="w-4 h-4 text-indigo-400" />,
      title: 'Current Web Research',
      description: 'Search latest developments in frontier multimodal AI models and cite sources',
      prompt: 'What are the most recent frontier multimodal AI developments, architectures, and benchmarks released recently? Ground your answer in recent sources and provide citations.',
      enableSearch: true,
    },
    {
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      title: 'Document Analysis',
      description: 'Learn how to inspect codebases, PDFs, and extract structured tables',
      prompt: 'I want to analyze documents and extract key technical insights. Can you provide a structured template for summarizing technical specifications with action items and risks?',
      enableSearch: false,
    },
    {
      icon: <Lightbulb className="w-4 h-4 text-rose-400" />,
      title: 'Complex Reasoning',
      description: 'Break down a tricky system design problem step by step',
      prompt: 'Design a distributed rate limiter supporting millions of requests per second with Redis sliding window logs. Compare token bucket vs sliding window counters.',
      enableSearch: false,
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto text-center">
      {/* Insignia / Brand mark */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-2xl shadow-indigo-500/25 mb-6 ring-1 ring-white/15">
        <Sparkles className="w-7 h-7 text-white" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
        Where knowledge meets precision.
      </h1>
      <p className="text-sm sm:text-base text-zinc-400 max-w-lg mb-8 leading-relaxed">
        Nexus AI is ready to solve technical challenges, reason through deep questions, search the live web, and synthesize documents.
      </p>

      {/* Feature Capabilities Pill */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
          <Zap className="w-3 h-3 text-amber-400" />
          Powered by {activeModelName}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
          <Search className="w-3 h-3 text-indigo-400" />
          Google Search Grounding
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
          <FileText className="w-3 h-3 text-emerald-400" />
          Document & Vision Understanding
        </span>
      </div>

      {/* Suggested Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {suggestions.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(item.prompt, item.enableSearch)}
            className="flex flex-col p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-850/80 border border-zinc-800/80 hover:border-zinc-700 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1.5">
              {item.icon}
              <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                {item.title}
              </span>
            </div>
            <p className="text-xs text-zinc-400 group-hover:text-zinc-300 leading-relaxed">
              {item.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
