const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function* sendMessage(
  message: string,
  sessionId?: string
): AsyncGenerator<{ chunk: string; done: boolean; sessionId?: string; error?: string }, void, unknown> {
  const response = await fetch(`${API_BASE_URL}/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send message' }));
    throw new Error(error.error || 'Failed to send message');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            yield data;
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    // Process remaining buffer
    if (buffer.startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.slice(6));
        yield data;
      } catch (e) {
        // Skip invalid JSON
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function getChatHistory(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`);
  if (!response.ok) {
    if (response.status === 404) {
      // Chat doesn't exist yet, return empty messages
      return { sessionId, messages: [] };
    }
    throw new Error('Failed to fetch chat history');
  }
  return response.json();
}

