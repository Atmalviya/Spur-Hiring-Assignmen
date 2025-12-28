import OpenAI from 'openai';
import type { Message as DbMessage } from '../db/database.js';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful support agent for a small e-commerce store. Answer clearly and concisely.

Here's some important information about our store:

SHIPPING POLICY:
- We ship to USA, Canada, UK, and Australia
- Standard shipping: 5-7 business days ($5.99)
- Express shipping: 2-3 business days ($12.99)
- Free shipping on orders over $50
- We do not ship to PO boxes

RETURN/REFUND POLICY:
- 30-day return window from delivery date
- Items must be unused and in original packaging
- Refunds processed within 5-7 business days after we receive the return
- Return shipping is free for defective items
- Store credit available for items returned after 30 days

SUPPORT HOURS:
- Monday-Friday: 9 AM - 6 PM EST
- Saturday: 10 AM - 4 PM EST
- Sunday: Closed
- Email support: support@store.com
- Response time: Within 24 hours

PRODUCT INFORMATION:
- We sell electronics, clothing, home goods, and accessories
- Most items ship from our warehouse within 1-2 business days
- Gift wrapping available at checkout

Be friendly, professional, and helpful. If you don't know something, admit it and offer to connect them with a human agent.`;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function buildMessages(history: DbMessage[]): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  for (const msg of history) {
    messages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    });
  }

  return messages;
}

export async function* generateReplyStream(
  history: DbMessage[],
  userMessage: string
): AsyncGenerator<string, void, unknown> {
  const messages = buildMessages(history);
  messages.push({ role: 'user', content: userMessage });

  try {
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: messages as any,
      stream: true,
      max_tokens: 500,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  } catch (error: any) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error('Invalid API key. Please check your OPENAI_API_KEY environment variable.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.status === 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      }
    }
    throw new Error(`Failed to generate reply: ${error.message || 'Unknown error'}`);
  }
}

export async function generateReply(
  history: DbMessage[],
  userMessage: string
): Promise<string> {
  let fullReply = '';
  for await (const chunk of generateReplyStream(history, userMessage)) {
    fullReply += chunk;
  }
  return fullReply;
}

