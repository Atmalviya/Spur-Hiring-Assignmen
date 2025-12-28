import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.sender === 'user';
  const isStreaming = message.isStreaming;

  return (
    <div
      className={`flex gap-3 max-w-[90%] sm:max-w-[85%] md:max-w-[75%] message ${isUser ? 'self-end flex-row-reverse message-user' : 'self-start message-ai'}`}
      data-sender={message.sender}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isUser ? 'bg-[#252525] text-[#f5f5f5] border border-[#333333]' : 'bg-[#1a1a1a] text-[#a3a3a3] border border-[#2a2a2a]'}`}>
        {isUser ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
            <path d="M12.0002 14.5C6.99016 14.5 2.91016 17.86 2.91016 22C2.91016 22.28 3.13016 22.5 3.41016 22.5H20.5902C20.8702 22.5 21.0902 22.28 21.0902 22C21.0902 17.86 17.0102 14.5 12.0002 14.5Z" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`px-4 py-3 rounded-xl break-words relative shadow-[0_1px_2px_0_rgba(0,0,0,0.3)] ${isUser ? 'bg-[#252525] text-[#f5f5f5] rounded-br-sm border border-[#333333]' : 'bg-[#1a1a1a] text-[#f5f5f5] rounded-bl-sm border border-[#2a2a2a]'}`}>
          <div className="leading-[1.6] whitespace-pre-wrap break-words text-[14.5px] text-white">{message.text || (isStreaming ? '' : '...')}</div>
          {isStreaming && (
            <div className="inline-flex gap-1 ml-2 items-center align-middle typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>
        <div className={`text-[11px] text-[#737373] mt-1.5 px-1 font-medium ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
