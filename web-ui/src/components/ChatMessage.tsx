import { useState } from 'react';
import { Copy, Pin, Edit2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';

interface ChatMessageProps {
  role: 'user' | 'agent';
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
  onEdit?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
}

export function ChatMessage({ 
  role, 
  content, 
  timestamp, 
  isStreaming,
  onEdit,
  onPin,
  isPinned
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={cn(
        "group flex gap-4 py-6 px-4 hover:bg-muted/30 transition-colors",
        role === 'user' && "bg-muted/10"
      )}
      role="article"
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {role === 'user' ? 'U' : 'AI'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-[680px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm opacity-80">
            {role === 'user' ? 'You' : 'Vibe PM Agent'}
          </span>
          {timestamp && (
            <span className="text-xs opacity-50">{timestamp}</span>
          )}
          {isPinned && (
            <Pin className="w-3 h-3 opacity-50" />
          )}
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{content}</p>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs"
          >
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          {role === 'user' && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-7 px-2 text-xs"
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Edit
            </Button>
          )}
          {onPin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPin}
              className="h-7 px-2 text-xs"
            >
              <Pin className="w-3 h-3 mr-1" />
              Pin
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
