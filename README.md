# Spur AI Live Chat Agent

A full-stack AI-powered live chat support agent built with React (frontend) and Node.js/TypeScript (backend). This application simulates a customer support chat where an AI agent answers user questions using OpenAI's GPT models with streaming responses.

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Neon.tech)
- **ORM**: Prisma
- **LLM**: OpenAI API (GPT-4o)
- **Validation**: Zod

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL database (we recommend [Neon.tech](https://neon.tech) for a free hosted PostgreSQL)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Atmalviya/Spur-Hiring-Assignmen.git
cd Spur-Hiring-Assignmen
```

### 2. Database Setup

#### Option 1: Using Neon.tech

1. Sign up for a free account at [Neon.tech](https://neon.tech)
2. Create a new project
3. Copy your connection string (it will look like: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`)

### 3. Backend Setup

```bash
cd backend
npm install
# OR if using pnpm:
pnpm install
```

Create a `.env` file in the `backend` directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o

# Server Configuration
PORT=3001

# Database Configuration (Neon.tech connection string)
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

Then set up the database schema:

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (creates tables)
pnpm db:push
```

Run the backend:

```bash
npm run dev
# OR
pnpm run dev
```

The backend will start on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend
pnpm install  # or npm install
```

Create a `.env` file in the `frontend` directory (optional, defaults to localhost:3001):

```env
VITE_API_URL=http://localhost:3001
```

Run the frontend:

```bash
pnpm dev  # or npm run dev
```

The frontend will start on `http://localhost:3000`

**Note:** Make sure to run `pnpm db:generate` and `pnpm db:push` before starting the server for the first time.

## API Endpoints

### POST `/chat/message`

Send a message to the AI agent.

**Request:**
```json
{
  "message": "What's your return policy?",
  "sessionId": "optional-session-id"
}
```

**Response:** Server-Sent Events stream
```
data: {"chunk": "Hello", "done": false}
data: {"chunk": "! ", "done": false}
data: {"chunk": "", "done": true, "sessionId": "uuid"}
```

### GET `/chat/history/:sessionId`

Get conversation history for a session.

**Response:**
```json
{
  "sessionId": "uuid",
  "messages": [
    {
      "id": "msg-id",
      "sender": "user",
      "text": "Hello",
      "timestamp": 1234567890
    }
  ]
}
```

## LLM Integration

### Provider
- **OpenAI** GPT-4o

### Prompting Strategy

The system prompt includes:
- Role definition: "You are a helpful support agent for a small e-commerce store"
- FAQ knowledge: Shipping policies, return/refund policies, support hours
- Tone guidance: "Answer clearly and concisely"

Conversation history is included in each request to maintain context. The last 20 messages are sent to the LLM.

### Configuration

- **Model**: Configurable via `OPENAI_MODEL` env var (default: `gpt-4o`)
- **Max Tokens**: 500 (configurable in `llm.ts`)
- **Temperature**: 0.7 (balanced creativity/consistency)

## Error Handling

The application handles various error scenarios:

1. **Invalid API Key**: Returns user-friendly error message
2. **Rate Limiting**: Informs user to try again later
3. **Network Errors**: Displays error in UI, allows retry
4. **Long Messages**: Truncates to 5000 characters
5. **Empty Messages**: Prevented by UI validation
6. **LLM Failures**: Gracefully caught and displayed to user

## Testing the Application

1. Start both backend and frontend servers
2. Open `http://localhost:3000` in your browser
3. Try asking questions like:
   - "What's your return policy?"
   - "Do you ship to USA?"
   - "What are your support hours?"
   - "How much is shipping?"

## Trade-offs & Future Improvements

### Current Trade-offs

1. **PostgreSQL**: Chosen for production-readiness and better concurrency support
2. **No Authentication**: Simplified for the assignment, but would be needed in production
3. **In-memory Session**: Session ID stored in localStorage only, no server-side session management
4. **Simple Error Handling**: Basic error messages, could be more detailed

### If I Had More Time...

1. **Testing**: Add unit tests for services and integration tests for API endpoints
2. **Rate Limiting**: Implement per-user rate limiting to prevent abuse
3. **Message History Pagination**: For long conversations, implement pagination
4. **File Uploads**: Support image/file uploads for product inquiries
5. **Help Ticket generation**: Create a help ticket to connect with a Human Assistant.
6. **Redis Caching**: Cache common FAQ responses for faster replies
7. **WebSocket**: Replace SSE with WebSocket for bidirectional communication

## Deployment

## Contact

