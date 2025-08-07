# Copilot Instructions

This is a Next.js 15 full-stack application with AI chat capabilities, built with modern tooling and strict conventions.

## Architecture Overview

**Core Stack**: Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + Ant Design + PostgreSQL (Neon) + Drizzle ORM + AI SDK

**Key Directories**:
- `src/app/` - Next.js App Router with API routes and pages
- `src/db/` - Database schema and migrations
- `src/lib/` - Shared utilities (primarily Tailwind class merging)

## Database Patterns

Database connections use **Neon serverless** with **Drizzle ORM**:
```typescript
const sql = neon(process.env.DATABASE_URL!)
const db = drizzle({ client: sql, schema: schema })
```

Schema in `src/db/schema.ts` uses Drizzle's table definitions with PostgreSQL types. All migrations output to `src/db/migrations/`.

## AI Integration Architecture

The chat system uses **AI SDK** with **DeepSeek** as the provider:
- Chat API endpoint: `src/app/api/chat/route.ts`
- Uses `streamText()` with tool integration and step counting (`stepCountIs(5)`)
- Tools defined with Zod schemas for input validation
- UI components use `useChat()` hook from `@ai-sdk/react`

## Development Conventions

**Package Manager**: Use `pnpm` exclusively
**Commands**: 
- `pnpm dev` (uses Turbopack for faster builds)
- `pnpm build` and `pnpm start` for production

**Code Style**:
- Prettier configured with import organization and Tailwind class sorting
- Single quotes, no semicolons (`singleQuote: true, semi: false`)
- Client components must have `'use client'` directive

**UI Patterns**:
- **Ant Design** for all components (Cards, Buttons, Avatars, etc.)
- **GitHub markdown CSS** for rendered content in chat
- Responsive design with inline styles for layout
- Icons from `@ant-design/icons`

## Chat Interface Specifics

Chat page (`src/app/chat/page.tsx`) follows these patterns:
- Full-height layout with flex containers
- Empty state with `RobotOutlined` icon
- Message cards with role-based avatars (`UserOutlined` vs `RobotOutlined`)
- Markdown rendering with `react-markdown` and `remark-gfm`
- Loading states with Ant Design `Spin` component

## Tool Integration

Tools in chat API follow this structure:
```typescript
tools: {
  weather: tool({
    description: 'Get the weather in a location (fahrenheit)',
    inputSchema: z.object({
      location: z.string().describe('The location to get the weather for'),
    }),
    execute: async ({ location }) => {
      // Tool implementation
    }
  })
}
```

## Environment Setup

Required environment variables in `.env.local`:
- `DATABASE_URL` - Neon PostgreSQL connection string

Drizzle config points to `.env.local` and outputs to `src/db/migrations/`.

## Logging & Debugging

Uses **Pino** for structured logging in API routes:
```typescript
const pino = Pino({ level: 'info' })
pino.info(messages) // In prepareStep callback
```

Console logs for debugging UI messages and model message conversion.
