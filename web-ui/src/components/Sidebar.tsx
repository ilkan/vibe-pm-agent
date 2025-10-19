import { useState } from 'react';
import { Plus, MessageSquare, Pin, Trash2, Star, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { cn } from './ui/utils';

interface Chat {
  id: string;
  title: string;
  timestamp: string;
  isPinned?: boolean;
  hasTools?: boolean;
}

interface SidebarProps {
  chats: Chat[];
  currentChatId?: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onPinChat: (id: string) => void;
}

export function Sidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onPinChat
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'starred' | 'tools'>('all');

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'starred' ? chat.isPinned :
      filter === 'tools' ? chat.hasTools :
      true;
    
    return matchesSearch && matchesFilter;
  });

  const pinnedChats = filteredChats.filter(c => c.isPinned);
  const regularChats = filteredChats.filter(c => !c.isPinned);

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <Button onClick={onNewChat} className="w-full justify-start gap-2">
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 opacity-40" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="px-3 pt-3">
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="starred" className="text-xs">Starred</TabsTrigger>
          <TabsTrigger value="tools" className="text-xs">With Tools</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {/* Pinned */}
          {pinnedChats.length > 0 && (
            <div className="mb-4">
              <div className="text-xs opacity-50 mb-2 px-2">Pinned</div>
              {pinnedChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  onSelect={() => onSelectChat(chat.id)}
                  onDelete={() => onDeleteChat(chat.id)}
                  onPin={() => onPinChat(chat.id)}
                />
              ))}
            </div>
          )}

          {/* Regular */}
          {regularChats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === currentChatId}
              onSelect={() => onSelectChat(chat.id)}
              onDelete={() => onDeleteChat(chat.id)}
              onPin={() => onPinChat(chat.id)}
            />
          ))}

          {filteredChats.length === 0 && (
            <div className="text-center py-8 text-sm opacity-50">
              No chats found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ChatItem({ 
  chat, 
  isActive, 
  onSelect, 
  onDelete, 
  onPin 
}: { 
  chat: Chat; 
  isActive: boolean; 
  onSelect: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={cn(
        "group relative rounded-lg px-3 py-2 cursor-pointer transition-colors",
        isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
      )}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-50" />
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate">{chat.title}</div>
          <div className="text-xs opacity-50">{chat.timestamp}</div>
        </div>
        {chat.isPinned && (
          <Pin className="w-3 h-3 mt-1 flex-shrink-0 opacity-50" />
        )}
      </div>

      {showActions && (
        <div 
          className="absolute right-2 top-2 flex gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onPin}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
          >
            <Pin className={cn("w-3 h-3", chat.isPinned && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
