import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: false, // Disallow arbitrary HTML for safety against injection
  xhtmlOut: true,
  breaks: true,
  linkify: true,
  typographer: true,
});

// Customize link renderer to open in new tab securely
const defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const aIndex = tokens[idx].attrIndex('target');
  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']);
  } else {
    tokens[idx].attrs![aIndex][1] = '_blank';
  }
  const relIndex = tokens[idx].attrIndex('rel');
  if (relIndex < 0) {
    tokens[idx].attrPush(['rel', 'noopener noreferrer']);
  } else {
    tokens[idx].attrs![relIndex][1] = 'noopener noreferrer';
  }
  return defaultRender(tokens, idx, options, env, self);
};

// Custom fence renderer with copy button and language tag
md.renderer.rules.fence = function (tokens, idx) {
  const token = tokens[idx];
  const info = token.info ? token.info.trim() : '';
  const lang = info ? info.split(/\s+/)[0] : 'code';
  const rawCode = token.content;

  // Escape HTML characters
  const escapedCode = md.utils.escapeHtml(rawCode);

  return `
<div class="code-block my-4 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/90 shadow-sm">
  <div class="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs font-mono text-zinc-400">
    <span class="font-medium lowercase">${lang}</span>
    <button class="copy-code-btn flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 transition-colors text-xs cursor-pointer" data-code="${encodeURIComponent(rawCode)}">
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
      </svg>
      <span>Copy code</span>
    </button>
  </div>
  <pre class="p-4 overflow-x-auto text-sm font-mono text-zinc-200 leading-relaxed scrollbar-thin"><code>${escapedCode}</code></pre>
</div>
`;
};

export function renderMarkdown(text: string): string {
  if (!text) return '';
  return md.render(text);
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  } else {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return Promise.resolve(successful);
    } catch {
      document.body.removeChild(textArea);
      return Promise.resolve(false);
    }
  }
}
