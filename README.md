# AI Health Consultant

Expo + Tamagui + Better-Auth starter with local Supabase.

## Prerequisites

- **[Docker](https://docs.docker.com/get-docker/)** — Required for local Supabase

## Setup

### 1. Install Nix

This project uses a Nix flake for a reproducible development environment. Install Nix using the [Determinate Systems installer](https://determinate.systems/):

```bash
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
```

### 2. Install direnv

[direnv](https://direnv.net/) auto-activates the Nix environment when you enter the project directory.

```bash
# macOS
brew install direnv

# Add to your shell (e.g., ~/.zshrc)
eval "$(direnv hook zsh)"
```

Then allow it for this project:

```bash
echo "use flake" > .envrc
direnv allow
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Configure Environment

```bash
cp .env.example .env.local
```

### 5. Start Development

```bash
bun run dev
```

This starts both Supabase and Expo. Press `w` to open in web browser.

## Local URLs

| Service | URL |
|---------|-----|
| Expo Web | http://localhost:8081 |
| Supabase Studio | http://127.0.0.1:54323 |

## Tech Stack

- [Expo](https://expo.dev/) + [Expo Router](https://docs.expo.dev/router/)
- [Tamagui](https://tamagui.dev/)
- [Better-Auth](https://better-auth.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Supabase](https://supabase.com/) (local PostgreSQL)
