import { useState, useEffect } from 'react';
import type { Chat } from '../types';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

const generateId = () => crypto.randomUUID();

const loadInitialChats = (): { chats: Chat[]; activeChatId: string | null } => {
  const savedChats = localStorage.getItem('chats');
  const savedActiveChatId = localStorage.getItem('activeChatId');

  if (savedChats) {
    const parsedChats = JSON.parse(savedChats);
    let activeId: string | null = null;

    if (savedActiveChatId && parsedChats.find((c: Chat) => c.id === savedActiveChatId)) {
      activeId = savedActiveChatId;
    } else if (parsedChats.length > 0) {
      activeId = parsedChats[0].id;
    }

    return { chats: parsedChats, activeChatId: activeId };
  }


  const oldSessionId = localStorage.getItem('chatSessionId');
  if (oldSessionId) {
    const migratedChat: Chat = {
      id: generateId(),
      title: 'Chat',
      sessionId: oldSessionId,
      createdAt: Math.floor(Date.now() / 1000),
    };
    localStorage.setItem('chats', JSON.stringify([migratedChat]));
    localStorage.removeItem('chatSessionId');
    return { chats: [migratedChat], activeChatId: migratedChat.id };
  }

  return { chats: [], activeChatId: null };
};

export default function Chat() {
  const [chats, setChats] = useState<Chat[]>(() => loadInitialChats().chats);
  const [activeChatId, setActiveChatId] = useState<string | null>(() => loadInitialChats().activeChatId);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }, [chats]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem('activeChatId', activeChatId);
    }
  }, [activeChatId]);

  const handleNewChat = () => {
    const existingEmptyChat = chats.find(
      (chat) => chat.title === 'New Chat' && !chat.lastMessage
    );

    if (existingEmptyChat) {
      setActiveChatId(existingEmptyChat.id);
    } else {
      const newChat: Chat = {
        id: generateId(),
        title: 'New Chat',
        sessionId: generateId(),
        createdAt: Math.floor(Date.now() / 1000),
      };

      setActiveChatId(newChat.id);
      setChats((prev) => [newChat, ...prev]);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => {
      const filtered = prev.filter((chat) => chat.id !== chatId);
      if (filtered.length === 0) {
        setActiveChatId(null);
        localStorage.removeItem('chats');
        localStorage.removeItem('activeChatId');
      } else if (activeChatId === chatId) {
        setActiveChatId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleUpdateChat = (chatId: string, updates: Partial<Chat>) => {
    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, ...updates } : chat))
    );
  };

  const activeChat = chats.find((chat) => chat.id === activeChatId) || null;

  return (
    <div className="w-full max-w-full lg:max-w-[1400px] h-screen max-h-screen md:h-[90vh] md:max-h-[900px] bg-[#111111] rounded-none md:rounded-[24px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.6),0_10px_10px_-5px_rgba(0,0,0,0.5)] flex overflow-hidden relative z-[1] border border-[#2a2a2a]">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="w-full md:flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="p-4 px-5 md:p-5 md:px-6 bg-[#1a1a1a] text-[#f5f5f5] flex justify-between items-center border-b border-[#2a2a2a] gap-3">
          <button className="flex md:hidden items-center justify-center bg-transparent hover:bg-[#252525] border-none text-[#f5f5f5] cursor-pointer p-2 rounded-lg transition-all duration-200 flex-shrink-0" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z" fill="currentColor"/>
            </svg>
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0 md:flex-initial md:min-w-[auto]">
            <div className="w-10 h-10 bg-[#252525] rounded-xl flex items-center justify-center border border-[#2a2a2a]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h2 className="m-0 text-xl md:text-xl font-semibold tracking-[-0.02em]">{activeChat?.title || 'Support Assistant'}</h2>
              <p className="mt-0.5 mb-0 text-[13px] md:text-xs opacity-90 font-normal">We're here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] opacity-95">
            <span className="w-2 h-2 bg-[#10b981] rounded-full status-dot"></span>
            <span>Online</span>
          </div>
        </div>
        <ChatWindow chat={activeChat} onUpdateChat={handleUpdateChat} />
      </div>
    </div>
  );
}
