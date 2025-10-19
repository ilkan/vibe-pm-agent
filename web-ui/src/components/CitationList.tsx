import { ExternalLink, Award } from 'lucide-react';
import { Badge } from './ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { cn } from './ui/utils';

interface Citation {
  id: number;
  source: string;
  title: string;
  date?: string;
  credibility?: 'high' | 'medium' | 'low';
  url?: string;
  excerpt?: string;
}

interface CitationListProps {
  citations: Citation[];
  inline?: boolean;
}

const credibilityColors = {
  high: 'bg-green-500/10 text-green-700 dark:text-green-400',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  low: 'bg-red-500/10 text-red-700 dark:text-red-400'
};

export function CitationList({ citations, inline = false }: CitationListProps) {
  if (citations.length === 0) {
    return (
      <div className="text-sm opacity-50 py-8 text-center">
        No citations available
      </div>
    );
  }

  if (inline) {
    return (
      <div className="flex flex-wrap gap-2 my-3">
        {citations.map((citation) => (
          <HoverCard key={citation.id}>
            <HoverCardTrigger asChild>
              <button className="inline-flex items-center gap-1 text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded border">
                <span className="opacity-60">[{citation.id}]</span>
                <span className="max-w-[120px] truncate">{citation.source}</span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" align="start">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm">{citation.title}</h4>
                  {citation.credibility && (
                    <Badge className={cn("text-xs", credibilityColors[citation.credibility])}>
                      {citation.credibility}
                    </Badge>
                  )}
                </div>
                <p className="text-xs opacity-70">{citation.source}</p>
                {citation.date && (
                  <p className="text-xs opacity-50">{citation.date}</p>
                )}
                {citation.excerpt && (
                  <p className="text-xs italic opacity-60 border-l-2 pl-2 mt-2">
                    "{citation.excerpt}"
                  </p>
                )}
                {citation.url && (
                  <a 
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                  >
                    Visit source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {citations.map((citation) => (
        <div 
          key={citation.id}
          className="p-3 border rounded-lg hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
              {citation.id}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm mb-1">{citation.title}</h4>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs opacity-60">{citation.source}</p>
                {citation.credibility && (
                  <Badge className={cn("text-xs h-4 px-1", credibilityColors[citation.credibility])}>
                    <Award className="w-2.5 h-2.5 mr-0.5" />
                    {citation.credibility}
                  </Badge>
                )}
              </div>
              {citation.date && (
                <p className="text-xs opacity-40 mb-2">{citation.date}</p>
              )}
              {citation.excerpt && (
                <p className="text-xs italic opacity-60 border-l-2 pl-2 mt-2">
                  "{citation.excerpt}"
                </p>
              )}
              {citation.url && (
                <a 
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                >
                  Visit source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
