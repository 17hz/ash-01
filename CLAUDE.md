# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development**: `pnpm dev` (uses Turbopack for faster builds)  
- **Build**: `pnpm build`
- **Production**: `pnpm start`
- **Lint**: `pnpm lint` (ESLint with Next.js config)

## Tech Stack & Architecture

This is a Next.js 15 full-stack application with the following key components:

### Core Technologies
- **Next.js 15** with App Router (src/app directory structure)
- **TypeScript** with strict configuration
- **React 19** with React DOM
- **Tailwind CSS 4** for styling
- **Ant Design** for UI components
- **PostgreSQL** with Neon serverless
- **Drizzle ORM** for database operations

### AI Integration
- **AI SDK** (`ai` package) for chat functionality
- **DeepSeek** as the default AI model provider
- **React hooks** (`@ai-sdk/react`) for chat UI state management

### Database Architecture
- Database configuration in `drizzle.config.ts`
- Schema definitions in `src/db/schema.ts`
- Migrations output to `src/db/migrations/`
- Environment variables in `.env.local`

### Application Structure
```
src/
├── app/                 # Next.js App Router
│   ├── api/chat/       # AI chat API endpoint
│   ├── chat/           # Chat interface page
│   ├── db/             # Database demo page  
│   └── layout.tsx      # Root layout with Geist fonts
├── db/
│   └── schema.ts       # Drizzle schema definitions
└── lib/
    └── utils.ts        # Tailwind utility functions
```

### Key Features
1. **AI Chat Interface** (`/chat`) - Full-featured chat UI using Ant Design components with streaming support
2. **Database Demo** (`/db`) - Simple page displaying user data from PostgreSQL
3. **Tool Integration** - Weather tool example in chat API with Zod validation

### Development Notes
- Uses `pnpm` as package manager
- Prettier configured with import organization and Tailwind class sorting
- GitHub markdown CSS for rendered content in chat
- Logging with Pino for API requests
- Environment variables required: `DATABASE_URL`

### Code Patterns
- Client components marked with `'use client'` directive
- Database connections use Neon serverless with Drizzle
- Chat messages support both text and tool execution
- Responsive design with Ant Design's layout system
- Markdown rendering with GitHub-flavored syntax support