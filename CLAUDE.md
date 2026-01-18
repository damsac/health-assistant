# AI Health Consultant

A holistic health consultation app built with React Native (Expo) and AI-powered chat.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React Native (Expo Router), Tamagui, TanStack Query |
| Backend | Hono.js, Drizzle ORM |
| Database | PostgreSQL (Supabase) |
| AI | Anthropic Claude (Vercel AI SDK) |
| Auth | Supabase Auth (Better Auth) |
| Integrations | Garmin Health API |

## File Structure

```
app/          # Expo Router pages (auth, chat, profile sections)
components/   # Reusable UI components and chat components
lib/          # Database schema, API clients, hooks
server/       # Hono backend with agents, actions, routes
supabase/     # Database migrations
```

## Key Patterns

### Agent Architecture
- Health consultant agent in `server/agents/health-consultant.ts`
- Tools system with approval flow for profile updates and goal management
- Context includes user profile, health data, and active goals

### Database Migrations
- Use `bun run db:generate` to create migrations from schema changes
- Migrations go in `supabase/migrations/`
- See `.shared-rules/database-migrations.mdc` for detailed workflow

### Profile Management
- Multi-section profile: eating, lifestyle, sleep, supplements
- Config in `lib/profile-sections-config.ts`
- Use `useUpsertProfile()` hook for updates

### Chat System
- Conversation history with message streaming
- Tool approval cards for user consent
- Support for thinking process display

## Common Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Start dev server |
| `bun run db:generate` | Generate migration from schema |
| `bun run db:push` | Push schema to database |
| `bun run db:studio` | Open Drizzle Studio |

## Skills & References

- `.claude/skills/update-context/` - Maintaining this CLAUDE.md file
- `.shared-rules/` - Project conventions (database, git, architecture)
- `docs/garmin-*.md` - Garmin integration setup

## Type Preferences

Prefer `type` over `interface` unless interface features (extends, declaration merging) are needed.
