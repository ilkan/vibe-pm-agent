import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, RotateCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { cn } from './ui/utils';

type ToolStatus = 'queued' | 'running' | 'completed' | 'failed';

interface ToolRunCardProps {
  toolName: string;
  status: ToolStatus;
  parameters?: Record<string, any>;
  logs?: string[];
  results?: any;
  onRerun?: () => void;
  onViewDetails?: () => void;
}

const statusConfig = {
  queued: { icon: Loader2, label: 'Queued', className: 'text-muted-foreground' },
  running: { icon: Loader2, label: 'Running…', className: 'text-blue-500 animate-spin' },
  completed: { icon: CheckCircle2, label: 'Completed', className: 'text-green-500' },
  failed: { icon: XCircle, label: 'Failed', className: 'text-red-500' }
};

export function ToolRunCard({
  toolName,
  status,
  parameters,
  logs = [],
  results,
  onRerun,
  onViewDetails
}: ToolRunCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div 
      className="my-4 border rounded-xl bg-card overflow-hidden"
      role="region"
      aria-label={`${toolName} tool execution`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-muted/30">
        <StatusIcon className={cn("w-4 h-4", config.className)} />
        <div className="flex-1">
          <h3 className="flex items-center gap-2">
            {toolName}
          </h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {config.label}
        </Badge>
      </div>

      {/* Parameters Summary */}
      {parameters && Object.keys(parameters).length > 0 && (
        <div className="px-4 py-3 border-t bg-muted/10">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Parameters
          </button>
          {expanded && (
            <div className="mt-2 text-xs space-y-1 font-mono">
              {Object.entries(parameters).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="opacity-60">{key}:</span>
                  <span>{JSON.stringify(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <Accordion type="single" collapsible className="border-t">
          <AccordionItem value="logs" className="border-0">
            <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline">
              View logs ({logs.length})
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="bg-muted/50 rounded p-3 text-xs font-mono space-y-1 max-h-40 overflow-auto">
                {logs.map((log, i) => (
                  <div key={i} className="opacity-70">{log}</div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Results Preview */}
      {results && status === 'completed' && (
        <div className="px-4 py-3 border-t">
          <div className="text-sm opacity-80 mb-2">Results:</div>
          <div className="bg-muted/50 rounded p-3 text-xs">
            {typeof results === 'string' ? results : JSON.stringify(results, null, 2)}
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === 'failed' && (
        <div className="px-4 py-3 border-t bg-red-500/5">
          <p className="text-sm text-red-600 dark:text-red-400">
            The tool returned an error. Review inputs or try again.
          </p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex gap-2 px-4 py-3 border-t bg-muted/10">
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="h-7 text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View in Right Rail
          </Button>
        )}
        {onRerun && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRerun}
            className="h-7 text-xs"
          >
            <RotateCw className="w-3 h-3 mr-1" />
            Rerun with edits
          </Button>
        )}
      </div>
    </div>
  );
}
