export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatResponse {
  chunk?: string;
  done: boolean;
  sessionId?: string;
  error?: string;
}

export interface Chat {
  id: string;
  title: string;
  sessionId: string;
  lastMessage?: string;
  lastMessageTime?: number;
  createdAt: number;
}
