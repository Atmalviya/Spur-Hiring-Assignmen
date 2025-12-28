import { PrismaClient, MessageSender } from '@prisma/client';

// Create Prisma client instance
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Initialize database connection
export async function initializeDatabase() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export interface Conversation {
  id: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const conversationRepo = {
  create: async (id: string): Promise<Conversation> => {
    return await prisma.conversation.create({
      data: { id },
    });
  },

  getById: async (id: string): Promise<Conversation | null> => {
    return await prisma.conversation.findUnique({
      where: { id },
    });
  },

  getOrCreate: async (id: string): Promise<Conversation> => {
    let conversation = await conversationRepo.getById(id);
    if (!conversation) {
      conversation = await conversationRepo.create(id);
    }
    return conversation;
  },
};

export const messageRepo = {
  create: async (message: Omit<Message, 'timestamp'>): Promise<Message> => {
    const result = await prisma.message.create({
      data: {
        id: message.id,
        conversationId: message.conversationId,
        sender: message.sender === 'user' ? MessageSender.user : MessageSender.ai,
        text: message.text,
      },
    });
    return {
      id: result.id,
      conversationId: result.conversationId,
      sender: result.sender === MessageSender.user ? 'user' : 'ai',
      text: result.text,
      timestamp: result.timestamp,
    };
  },

  getByConversationId: async (conversationId: string): Promise<Message[]> => {
    const results = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
    });
    return results.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      sender: msg.sender === MessageSender.user ? 'user' : 'ai',
      text: msg.text,
      timestamp: msg.timestamp,
    }));
  },
};
