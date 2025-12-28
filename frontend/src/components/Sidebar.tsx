import { useState } from 'react';
import type { Chat } from '../types';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isOpen,
  onClose,
}: SidebarProps) {
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);

  const handleChatSelect = (chatId: string) => {
    onSelectChat(chatId);
    onClose(); // Close sidebar on mobile after selection
  };

  const handleNewChat = () => {
    onNewChat();
    onClose(); // Close sidebar on mobile after creating new chat
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      {isOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-[999] backdrop-blur-sm" onClick={onClose} />}
      <div className={`fixed md:static left-0 top-0 h-screen md:h-auto w-[280px] lg:w-[260px] min-w-[280px] lg:min-w-[260px] bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col overflow-hidden md:relative z-[1000] md:z-[100] -translate-x-full md:translate-x-0 transition-transform duration-300 md:transition-none shadow-[0_20px_25px_-5px_rgba(0,0,0,0.6),0_10px_10px_-5px_rgba(0,0,0,0.5)] md:shadow-none ${isOpen ? 'translate-x-0' : ''}`}>
        <div className="p-4 border-b border-[#2a2a2a] flex items-center gap-3">
          <button className="flex md:hidden items-center justify-center bg-transparent border-none text-[#a3a3a3] hover:bg-[#252525] hover:text-[#f5f5f5] cursor-pointer p-1 rounded transition-all duration-200 flex-shrink-0" onClick={onClose} aria-label="Close sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
            </svg>
          </button>
          <button className="flex-1 w-full px-4 py-3 bg-[#252525] hover:bg-[#111111] text-[#f5f5f5] border border-[#2a2a2a] hover:border-[#333333] rounded-xl text-sm font-medium cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.4),0_2px_4px_-1px_rgba(0,0,0,0.3)] active:translate-y-0" onClick={handleNewChat}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sidebar-content">
        {chats.length === 0 ? (
          <div className="text-center py-[60px] px-5 text-[#737373]">
            <svg className="mx-auto mb-4 text-[#737373]" width="48" height="48" viewBox="0 0 24 24" fill="none" opacity="0.3">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
            </svg>
            <p className="my-2 text-sm">No chats yet</p>
            <p className="text-xs opacity-70">Start a new conversation</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between gap-2 relative border ${
                  activeChatId === chat.id 
                    ? 'bg-[#252525] border-[#333333] shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-[#252525] hover:border-[#2a2a2a]'
                }`}
                onClick={() => handleChatSelect(chat.id)}
                onMouseEnter={() => setHoveredChatId(chat.id)}
                onMouseLeave={() => setHoveredChatId(null)}
              >
                <div className="flex-1 flex items-center gap-2.5 min-w-0">
                  <div className={`flex-shrink-0 ${activeChatId === chat.id ? 'text-[#f5f5f5]' : 'text-[#a3a3a3]'}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${activeChatId === chat.id ? 'text-[#f5f5f5] font-semibold' : 'text-[#f5f5f5] font-medium'}`}>{chat.title}</div>
                    {chat.lastMessage && (
                      <div className="text-xs text-[#737373] whitespace-nowrap overflow-hidden text-ellipsis">
                        {chat.lastMessage.length > 40
                          ? chat.lastMessage.substring(0, 40) + '...'
                          : chat.lastMessage}
                      </div>
                    )}
                  </div>
                </div>
                {chat.lastMessageTime && (
                  <div className="text-[11px] text-[#737373] flex-shrink-0 ml-auto">{formatTime(chat.lastMessageTime)}</div>
                )}
                <button
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded flex items-center justify-center cursor-pointer transition-all duration-200 text-[#fca5a5] hover:bg-[rgba(239,68,68,0.2)] hover:border-[rgba(239,68,68,0.5)] ${hoveredChatId === chat.id ? 'opacity-100' : 'opacity-0'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  aria-label="Delete chat"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

