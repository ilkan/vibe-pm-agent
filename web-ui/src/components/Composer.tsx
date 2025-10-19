import { useState, useRef, KeyboardEvent } from 'react';
import { Send, StopCircle, RotateCw, Paperclip, Settings2, Slash } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';

interface ComposerProps {
  onSend: (message: string, files?: File[]) => void;
  onStop?: () => void;
  onRegenerate?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const TOOL_COMMANDS = [
  { command: '/analyze', description: 'Analyze business opportunity' },
  { command: '/onepager', description: 'Create a one-pager document' },
  { command: '/interview', description: 'Run mock PM interview' },
  { command: '/prfaq', description: 'Generate PR-FAQ' },
  { command: '/case', description: 'Generate business case' }
];

export function Composer({ 
  onSend, 
  onStop, 
  onRegenerate,
  isStreaming = false,
  disabled = false,
  placeholder = "Ask anything, or type / to run a tool…"
}: ComposerProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [temperature, setTemperature] = useState([0.7]);
  const [showCommands, setShowCommands] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message, files.length > 0 ? files : undefined);
      setMessage('');
      setFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }

    // Show commands on /
    if (e.key === '/' && message === '') {
      setShowCommands(true);
    }

    // Hide commands on Escape
    if (e.key === 'Escape') {
      setShowCommands(false);
    }
  };

  const handleCommandSelect = (command: string) => {
    setMessage(command + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-grow textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';

    // Hide commands if not starting with /
    if (!e.target.value.startsWith('/')) {
      setShowCommands(false);
    }
  };

  return (
    <div className="border-t bg-background">
      <div className="max-w-3xl mx-auto p-4">
        {/* Tool Commands Palette */}
        {showCommands && (
          <div className="mb-2 border rounded-lg bg-card shadow-lg overflow-hidden">
            <div className="p-2 bg-muted/50 text-xs opacity-60">Tool Commands</div>
            {TOOL_COMMANDS.map((tool) => (
              <button
                key={tool.command}
                onClick={() => handleCommandSelect(tool.command)}
                className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors flex items-start gap-3"
              >
                <Slash className="w-4 h-4 mt-0.5 opacity-50" />
                <div>
                  <div className="text-sm">{tool.command}</div>
                  <div className="text-xs opacity-60">{tool.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* File Attachments */}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((file, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {file.name}
                <button
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="relative border rounded-xl bg-card shadow-sm">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[60px] max-h-[240px] resize-none border-0 focus-visible:ring-0 pr-32"
            rows={1}
          />

          {/* Bottom Actions */}
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.csv,.pptx,.doc,.docx"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-xs"
              >
                <Paperclip className="w-3 h-3 mr-1" />
                Attach
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Settings2 className="w-3 h-3 mr-1" />
                    Settings
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs opacity-70 mb-2 block">
                        Temperature: {temperature[0]}
                      </label>
                      <Slider
                        value={temperature}
                        onValueChange={setTemperature}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-1">
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="h-7 text-xs"
                >
                  <RotateCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              )}

              {isStreaming ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onStop}
                  className="h-7 text-xs"
                >
                  <StopCircle className="w-3 h-3 mr-1" />
                  Stop
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() || disabled}
                  size="sm"
                  className="h-7 text-xs"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Send
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2 text-xs text-center opacity-40">
          Press ⌘/Ctrl+Enter to send • Type / for tools • ↑ to edit last message
        </div>
      </div>
    </div>
  );
}
