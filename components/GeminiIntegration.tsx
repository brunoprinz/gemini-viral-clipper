import React, { useState } from 'react';
import { Copy, ExternalLink, Check } from 'lucide-react';

export const GeminiIntegration: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const promptText = `Analyze this video for viral potential and behavioral engagement. Identify 3 to 7 standalone segments that work perfectly as viral Shorts or Reels.

CRITICAL RULE FOR TIMESTAMPS:
- Every segment MUST have a complete, self-contained narrative arc. 
- The `end` timestamp MUST coincide strictly with the complete end of a full sentence, a concluded thought, or a natural thematic resolution. 
- NEVER cut a sentence mid-way, never leave a phrase hanging, and never cut off a story before its immediate micro-resolution or payoff, unless explicitly requested.

For each segment, identify:
1. A high "Retenção Inicial" hook (strong immediate impact to stop the scroll in the first seconds).
2. A "Social Gap" or curiosity factor that drives engagement, identification, or comments.
3. A complete, provocative thought that stands alone without needing prior context.

Return strictly a valid JSON array with no markdown formatting, no code blocks, and no extra text outside the JSON structure. 

The JSON structure must be exactly:
[
  {
    "title": "Catchy Click-Ready Viral Headline in Portuguese",
    "start": "MM:SS",
    "end": "MM:SS",
    "description": "Explicação detalhada contendo: 1. Qual gatilho psicológico está presente. 2. Por que ele gera retenção. 3. Qual o melhor estilo de abertura/gancho para o short."
  }
]`;

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 w-2 h-6 rounded-full"></span>
        1. Get AI Instructions
      </h2>
      
      <p className="text-gray-400 text-sm mb-4">
        Since we want to save your API quota and process large videos without uploading them to a third-party server blindly, we use a manual handshake.
      </p>

      <div className="space-y-4">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 relative group">
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono break-words">
            {promptText}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-white"
            title="Copy Prompt"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
          
          <a
            href="https://gemini.google.com/app"
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-cyan-500/20"
          >
            <ExternalLink size={18} />
            Open Gemini Chat
          </a>
        </div>
      </div>
    </div>
  );
};
