import { useState } from 'react';
import { Play, FileText, History, BookOpen, X } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { CitationList } from './CitationList';
import { cn } from './ui/utils';

interface Tool {
  id: string;
  name: string;
  description: string;
  requiredInputs: string[];
}

interface ToolRun {
  id: string;
  toolName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  timestamp: string;
}

interface FileAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

interface RightRailProps {
  tools: Tool[];
  runs: ToolRun[];
  files: FileAttachment[];
  citations: any[];
  onRunTool: (toolId: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function RightRail({
  tools,
  runs,
  files,
  citations,
  onRunTool,
  onClose,
  isOpen = true
}: RightRailProps) {
  const [activeTab, setActiveTab] = useState('tools');

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l bg-muted/20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-sm">Tools & Context</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-4 h-8">
          <TabsTrigger value="tools" className="text-xs">
            <Play className="w-3 h-3 mr-1" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="runs" className="text-xs">
            <History className="w-3 h-3 mr-1" />
            Runs
          </TabsTrigger>
          <TabsTrigger value="files" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            Files
          </TabsTrigger>
          <TabsTrigger value="citations" className="text-xs">
            <BookOpen className="w-3 h-3 mr-1" />
            Refs
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Tools Tab */}
          <TabsContent value="tools" className="p-4 space-y-3 mt-0">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
              >
                <h3 className="text-sm mb-1">{tool.name}</h3>
                <p className="text-xs opacity-60 mb-3">{tool.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs opacity-50">
                    {tool.requiredInputs.length} inputs
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onRunTool(tool.id)}
                    className="h-7 text-xs"
                  >
                    Run tool
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Runs Tab */}
          <TabsContent value="runs" className="p-4 space-y-2 mt-0">
            {runs.length === 0 ? (
              <div className="text-center py-8 text-sm opacity-50">
                No tool runs yet
              </div>
            ) : (
              runs.map((run) => (
                <div
                  key={run.id}
                  className="p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm">{run.toolName}</h3>
                    <Badge
                      variant={run.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs h-4"
                    >
                      {run.status}
                    </Badge>
                  </div>
                  <div className="text-xs opacity-50">{run.timestamp}</div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="p-4 space-y-2 mt-0">
            {files.length === 0 ? (
              <div className="text-center py-8 text-sm opacity-50">
                No files uploaded
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  className="p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 opacity-50" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm truncate">{file.name}</h3>
                      <div className="text-xs opacity-50">{file.size} • {file.type}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Citations Tab */}
          <TabsContent value="citations" className="p-4 mt-0">
            <CitationList citations={citations} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
