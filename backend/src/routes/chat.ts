import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { conversationRepo, messageRepo } from '../db/database.js';
import { generateReplyStream } from '../services/llm.js';

const router = Router();

const messageSchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().optional(),
});

router.post('/message', async (req, res) => {
  try {
    const validationResult = messageSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.errors,
      });
    }

    const { message, sessionId } = validationResult.data;


    const truncatedMessage = message.length > 5000 ? message.substring(0, 5000) : message;

    const conversationId = sessionId || uuidv4();
    await conversationRepo.getOrCreate(conversationId);


    const userMessageId = uuidv4();
    await messageRepo.create({
      id: userMessageId,
      conversationId: conversationId,
      sender: 'user',
      text: truncatedMessage,
    });


    const history = await messageRepo.getByConversationId(conversationId);


    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let aiReply = '';

    try {
      for await (const chunk of generateReplyStream(history, truncatedMessage)) {
        aiReply += chunk;
        res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
      }

      const aiMessageId = uuidv4();
      await messageRepo.create({
        id: aiMessageId,
        conversationId: conversationId,
        sender: 'ai',
        text: aiReply,
      });

      res.write(`data: ${JSON.stringify({ chunk: '', done: true, sessionId: conversationId })}\n\n`);
      res.end();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to generate reply. Please try again.';
      res.write(`data: ${JSON.stringify({ error: errorMessage, done: true })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error('Error in /chat/message:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.',
      });
    }
  }
});

router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversation = await conversationRepo.getById(sessionId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await messageRepo.getByConversationId(sessionId);

    res.json({
      sessionId,
      messages: messages.map((msg) => ({
        id: msg.id,
        sender: msg.sender,
        text: msg.text,
        timestamp: Math.floor(new Date(msg.timestamp).getTime() / 1000),
      })),
    });
  } catch (error: any) {
    console.error('Error in /chat/history:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch conversation history',
    });
  }
});

export default router;

