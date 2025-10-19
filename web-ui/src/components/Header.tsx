import { Share2, Download, Settings, ChevronRight, LogOut, User } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface HeaderProps {
  workspace?: string;
  chatTitle?: string;
  model?: string;
  latency?: string;
  status?: 'online' | 'offline' | 'connecting';
  userEmail?: string;
  onShare?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-red-500',
  connecting: 'bg-yellow-500'
};

export function Header({
  workspace = 'Workspace',
  chatTitle = 'New Chat',
  model = 'Bedrock Agent • Nova Pro',
  latency,
  status = 'online',
  userEmail,
  onShare,
  onExport,
  onSettings,
  onLogout
}: HeaderProps) {
  return (
    <div className="h-14 border-b bg-background flex items-center justify-between px-4">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="opacity-50">{workspace}</span>
        <ChevronRight className="w-4 h-4 opacity-30" />
        <span>{chatTitle}</span>
      </div>

      {/* Right: Model info & actions */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
          {model}
        </Badge>

        {latency && (
          <Badge variant="outline" className="text-xs">
            ~{latency}
          </Badge>
        )}

        <div className="flex items-center gap-1">
          {onShare && (
            <Button variant="ghost" size="sm" onClick={onShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExport}>
                Export to Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport}>
                Export to PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport}>
                Send to Docs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {userEmail && (
                <>
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {userEmail}
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              {onSettings && (
                <DropdownMenuItem onClick={onSettings}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              )}
              {onLogout && (
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
