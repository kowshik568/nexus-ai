import React, { useState } from 'react';
import { Globe, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Search } from 'lucide-react';
import { GroundingMetadata } from '../types';

interface SourceCitationsProps {
  metadata: GroundingMetadata;
}

export const SourceCitations: React.FC<SourceCitationsProps> = ({ metadata }) => {
  const [expanded, setExpanded] = useState(false);

  const chunks = metadata.groundingChunks || [];
  const webChunks = chunks.filter((c) => c.web && c.web.uri);
  const queries = metadata.webSearchQueries || [];

  if (webChunks.length === 0 && queries.length === 0) {
    return null;
  }

  // Get clean domain from URL
  const getDomain = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  return (
    <div className="mt-3.5 pt-3 border-t border-zinc-800/80 rounded-xl bg-zinc-900/40 p-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-300 font-medium">
          <div className="flex items-center justify-center w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Globe className="w-3 h-3" />
          </div>
          <span>Grounded with Google Search</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            {webChunks.length} {webChunks.length === 1 ? 'source' : 'sources'}
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <span>{expanded ? 'Hide sources' : 'View sources'}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Search Queries badge */}
      {queries.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Search className="w-2.5 h-2.5" />
            Searched:
          </span>
          {queries.map((q, idx) => (
            <span
              key={idx}
              className="text-[11px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/50"
            >
              "{q}"
            </span>
          ))}
        </div>
      )}

      {/* Sources list */}
      {expanded ? (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {webChunks.map((chunk, index) => {
            const uri = chunk.web?.uri || '#';
            const title = chunk.web?.title || 'Web Reference';
            const domain = getDomain(uri);

            return (
              <a
                key={index}
                href={uri}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2.5 p-2 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-all text-left"
              >
                <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-mono text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-500/40">
                  {index + 1}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="text-[12px] font-medium text-zinc-200 group-hover:text-indigo-300 truncate transition-colors">
                    {title}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono mt-0.5">
                    <span className="truncate">{domain}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        /* Compact pills row when collapsed */
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {webChunks.slice(0, 4).map((chunk, index) => {
            const uri = chunk.web?.uri || '#';
            const domain = getDomain(uri);
            return (
              <a
                key={index}
                href={uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-950/80 hover:bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300 hover:text-indigo-300 transition-colors"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-zinc-800 text-[9px] font-mono text-zinc-400 flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="max-w-[140px] truncate">{domain}</span>
                <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
              </a>
            );
          })}
          {webChunks.length > 4 && (
            <button
              onClick={() => setExpanded(true)}
              className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-900 text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              +{webChunks.length - 4} more
            </button>
          )}
        </div>
      )}
    </div>
  );
};
