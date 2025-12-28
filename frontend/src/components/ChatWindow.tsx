import { useState, useEffect, useRef } from 'react';
import type { Message as MessageType, Chat } from '../types';
import { sendMessage, getChatHistory } from '../services/api';
import Message from './Message';

interface ChatWindowProps {
  chat: Chat | null;
  onUpdateChat: (chatId: string, updates: Partial<Chat>) => void;
}

export default function ChatWindow({ chat, onUpdateChat }: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages([]);
    setError(null);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [chat?.id]);

  useEffect(() => {
    if (chat && chat.sessionId) {
      if (chat.lastMessage || chat.title !== 'New Chat') {
        loadHistory(chat.sessionId);
      }
    }
  }, [chat?.id, chat?.sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async (sessionId: string) => {
    if (!chat || !sessionId) return;

    try {
      const data = await getChatHistory(sessionId);
      
      if (chat && chat.sessionId === sessionId) {
        const loadedMessages = data.messages.map((msg: MessageType) => ({
          id: msg.id,
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp,
        }));
        setMessages(loadedMessages);

        if (chat.title === 'New Chat' && loadedMessages.length > 0) {
          const firstUserMessage = loadedMessages.find((m: MessageType) => m.sender === 'user');
          if (firstUserMessage) {
            const title = firstUserMessage.text.length > 30
              ? firstUserMessage.text.substring(0, 30) + '...'
              : firstUserMessage.text;
            onUpdateChat(chat.id, { title });
          }
        }
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('404') && !err.message.includes('not found')) {
        console.error('Failed to load history:', err);
      }
    }
  };

  const handleSend = async () => {
    if (!chat) return;

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    if (trimmedInput.length > 5000) {
      setError('Message is too long. Please keep it under 5000 characters.');
      return;
    }

    setError(null);
    const userMessage: MessageType = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmedInput,
      timestamp: Math.floor(Date.now() / 1000),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: MessageType = {
      id: aiMessageId,
      sender: 'ai',
      text: '',
      timestamp: Math.floor(Date.now() / 1000),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, aiMessage]);

    try {
      let fullReply = '';

      for await (const data of sendMessage(trimmedInput, chat.sessionId)) {
        if (data.error) {
          throw new Error(data.error);
        }

        if (data.chunk) {
          fullReply += data.chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, text: fullReply }
                : msg
            )
          );
        }

        if (data.done) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, isStreaming: false, text: fullReply }
                : msg
            )
          );


          onUpdateChat(chat.id, {
            lastMessage: fullReply || trimmedInput,
            lastMessageTime: Math.floor(Date.now() / 1000),
          });

          if (chat.title === 'New Chat') {
            const title = trimmedInput.length > 30
              ? trimmedInput.substring(0, 30) + '...'
              : trimmedInput;
            onUpdateChat(chat.id, { title });
          }

          break;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-[60px] px-5 text-center text-[#a3a3a3]">
        <div className="mb-6 text-[#737373]">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" opacity="0.3">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="currentColor"/>
          </svg>
        </div>
        <h3 className="m-0 mb-2 text-xl font-semibold text-[#f5f5f5]">Select a chat to start</h3>
        <p className="m-0 text-sm text-[#737373]">Choose an existing conversation or create a new one</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5 bg-[#0a0a0a] ">
        {messages.length === 0 && (
          <div className="text-center text-[#a3a3a3] py-[60px] px-5 max-w-[500px] mx-auto">
            <h3 className="m-0 mb-3 text-2xl font-semibold text-[#f5f5f5]">Welcome! 👋</h3>
            <p className="m-0 mb-8 text-[15px] text-[#a3a3a3]">I'm your support assistant. I can help you with:</p>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-4 mb-8">
              <div className="flex items-center gap-2.5 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] text-sm text-[#f5f5f5] transition-all duration-200 hover:border-[#2a2a2a] hover:bg-[#252525] hover:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)]">
                <svg className="text-[#a3a3a3] flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                  <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="currentColor"/>
                </svg>
                <span>Shipping & Delivery</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] text-sm text-[#f5f5f5] transition-all duration-200 hover:border-[#2a2a2a] hover:bg-[#252525] hover:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)]">
                <svg className="text-[#a3a3a3] flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6H16L14 4H10L8 6H4C2.9 6 2 6.9 2 8V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
                </svg>
                <span>Returns & Refunds</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] text-sm text-[#f5f5f5] transition-all duration-200 hover:border-[#2a2a2a] hover:bg-[#252525] hover:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)]">
                <svg className="text-[#a3a3a3] flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                </svg>
                <span>Product Information</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] text-sm text-[#f5f5f5] transition-all duration-200 hover:border-[#2a2a2a] hover:bg-[#252525] hover:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)]">
                <svg className="text-[#a3a3a3] flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
                </svg>
                <span>Support Hours</span>
              </div>
            </div>
            <p className="m-0 text-sm text-[#737373] italic">How can I assist you today?</p>
          </div>
        )}
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] text-[#fca5a5] px-4 py-3 mx-0 md:mx-6 rounded-xl flex items-center gap-2.5 text-sm border border-[rgba(239,68,68,0.3)] chat-error">
          <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
          <span>{error}</span>
          <button className="bg-transparent border-none text-[#fca5a5] cursor-pointer p-1 ml-auto flex items-center justify-center rounded transition-colors duration-200 hover:bg-[rgba(239,68,68,0.2)]" onClick={() => setError(null)} aria-label="Close error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      )}

      <div className="p-4 px-5 md:p-5 md:px-6 bg-[#111111] border-t border-[#2a2a2a]">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            className="flex-1 px-4 py-3 border-2 border-[#2a2a2a] rounded-xl text-[14.5px] font-inherit resize-none min-h-[48px] max-h-[120px] leading-[1.5] bg-[#1a1a1a] text-[#f5f5f5] transition-all duration-200 focus:outline-none focus:border-[#333333] focus:shadow-[0_0_0_3px_rgba(64,64,64,0.2)] focus:bg-[#252525] disabled:bg-[#111111] disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-[#737373]"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            disabled={isLoading}
            maxLength={5000}
          />
          <button
            className="w-12 h-12 bg-[#252525] hover:bg-[#1a1a1a] text-[#f5f5f5] border border-[#2a2a2a] hover:border-[#333333] rounded-xl cursor-pointer flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-[0_1px_2px_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.4),0_2px_4px_-1px_rgba(0,0,0,0.3)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            {isLoading ? (
              <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
                </circle>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-[#737373] md:flex-col md:items-start md:gap-1">
          <span className="font-medium">{input.length}/5000</span>
          <span className="opacity-70">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}

