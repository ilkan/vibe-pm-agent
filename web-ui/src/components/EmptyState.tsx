import { Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface StarterPrompt {
  title: string;
  prompt: string;
}

interface EmptyStateProps {
  onPromptSelect: (prompt: string) => void;
}

const STARTER_PROMPTS: StarterPrompt[] = [
  {
    title: 'Analyze opportunity',
    prompt: 'Analyze business opportunity for AI code review assistant'
  },
  {
    title: 'Generate PR-FAQ',
    prompt: 'Generate a PR-FAQ from this draft'
  },
  {
    title: 'Create one-pager',
    prompt: 'Create a board one-pager with citations'
  },
  {
    title: 'Mock interview',
    prompt: 'Run mock PM interview (CIRCLES)'
  }
];

export function EmptyState({ onPromptSelect }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="mb-2">
          Welcome to Vibe PM Agent
        </h1>
        <p className="opacity-60">
          Ask questions, run analysis tools, and get answers with citations. Start a conversation below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
        {STARTER_PROMPTS.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptSelect(prompt.prompt)}
            className="p-4 text-left border rounded-lg hover:bg-muted/50 hover:border-primary/50 transition-all group"
          >
            <h3 className="mb-1 group-hover:text-primary transition-colors">
              {prompt.title}
            </h3>
            <p className="text-sm opacity-60">{prompt.prompt}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 text-xs text-center opacity-40 max-w-xl">
        Tip: Use / commands for quick access to tools like /analyze, /onepager, or /interview
      </div>
    </div>
  );
}
