# Minduel: A Dynamic Learning Platform

Minduel reimagines studying as an interactive, one-on-one knowledge challenge. Designed to enhance learning, this platform pairs students in head-to-head sessions where they test each other with multiple-choice questions. Every question you answer correctly becomes a card you can later use to challenge opponents, while incorrect answers remove the card and reduce your health points.

## How It Works

- **Match Structure**: Each session begins with five knowledge cards randomly selected from your personal collection, or "backpack." Using a card requires focus points, with more advanced cards demanding greater effort and longer preparation time.
- **Knowledge Exchange**: When you present a card, your partner has a brief window to respond. A correct answer allows them to add the card to their collection, while an incorrect answer deducts progress points.
- **Building Your Collection**: New cards can be earned through practice sets or review activities, but you must answer each card's question accurately to retain it. Mistakes mean missed opportunities.

## Features for Effective Learning

- **Personalized Matching**: The platform connects learners based on subject interests, skill level, and card difficulty, ensuring balanced and meaningful interactions.
- **Collaborative Connections**: A peer system lets you connect with others, revisit challenges with study partners, and share progress, fostering a supportive learning community.

## Game Mechanics

- **Card Collection**: Build your personal collection of knowledge cards by answering questions correctly.
- **Duels**: Challenge your friends or get matched with other learners for knowledge duels.
- **Pack Opening**: Open new packs periodically to expand your collection with new questions and topics.
- **Friend System**: Connect with other learners, send friend requests, and track your dueling history.
- **Leaderboard System**: View where your friends and everyone are and study your way to the top.

## Why It Enhances Learning

Minduel encourages critical thinking under time constraints and exposes learners to diverse perspectives on the same topics. Post-session reviews allow you to revisit incorrect answers and discuss complex questions, deepening understanding. Beyond rote memorization, Minduel cultivates sharp recall, strategic reasoning, and collaborative problem-solving.

By integrating intellectual challenges with peer interaction, Minduel transforms studying into an engaging, effective, and socially enriching experience.

## Technologies

### Frontend

- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [React 19](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Clerk](https://clerk.com/) - Authentication and user management
- [Socket.io](https://socket.io/) - Real-time communication (not in demo)
- [DiceBear](https://www.dicebear.com/) - Avatar generation

### Backend

- [Prisma](https://www.prisma.io/) - ORM for database access
- [PostgreSQL](https://www.postgresql.org/) - Database (via Neon)
- [Bun](https://bun.sh/) - JavaScript runtime for server components
- [Socket.io](https://socket.io/) - Real-time communication (not in demo)

## Environment Setup

To run this project locally, you'll need to set up the following environment variables in a `.env` file:

```
# Database connection
DATABASE_URL=your_postgres_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Development

```bash
# Install dependencies
npm install
# or
bun install

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Run the development server
npm run dev
# or
bun run dev
```

For the Socket.IO server:

```bash
cd server
bun install
bun run index.ts
```

## Hosting

This application can be deployed on:

- [Vercel](https://vercel.com/) - Recommended for the Next.js frontend
- [Railway](https://railway.app/) or [Fly.io](https://fly.io/) - For the Socket.IO server
- [Neon](https://neon.tech/) - For the PostgreSQL database

## Why this stack
