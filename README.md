# Kanban Board

A full-stack kanban application for managing boards, lists, and cards with authentication and real-time updates.

## Overview

This project includes:

- A Next.js frontend for the user interface
- An Express.js backend API for authentication and board data
- Prisma ORM with PostgreSQL for persistent storage
- Socket.IO for live board updates across clients
- Drag-and-drop task management for kanban workflows

## Features

- User registration and login
- Create and manage multiple boards
- Create, update, and delete lists within a board
- Create, update, and delete cards within a list
- Reorder cards and lists by position
- Real-time updates using Socket.IO
- Protected routes with JWT-based authentication

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Socket.IO client
- Zustand for state management
- @dnd-kit for drag-and-drop interactions

### Backend
- Node.js
- Express 5
- TypeScript
- Prisma ORM
- PostgreSQL
- Socket.IO
- JWT authentication
- bcrypt for password hashing

## Project Structure

```text
kanban-board/
├── client/                  # Next.js frontend
│   ├── src/
│   ├── package.json
│   ├── next.config.ts
│   └── README.md
├── server/                  # Express + Prisma backend
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
├── README.md                # Project overview and setup
└── .gitignore
```

## Prerequisites

Before running the app, make sure you have the following installed:

- Node.js 20 or later
- npm
- PostgreSQL database

## Environment Setup

### Server

Create a `.env` file inside the `server/` directory with values similar to:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kanban_board"
JWT_SECRET="your-super-secret-key"
CLIENT_URL="http://localhost:3000"
PORT=4000
```

### Client

The frontend is configured to talk to the backend at `http://localhost:4000` by default, unless you update the API base URL in the client code.

## Installation

### 1. Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 2. Set up the database

```bash
cd server
npx prisma migrate dev --name init
```

If Prisma client is not generated yet:

```bash
npx prisma generate
```

## Running the App

### Start the backend

```bash
cd server
npm run dev
```

The API will run on:

- http://localhost:4000

### Start the frontend

```bash
cd client
npm run dev
```

The app will run on:

- http://localhost:3000

## Available Scripts

### Client

```bash
npm run dev      # Start the Next.js development server
npm run build    # Create a production build
npm run start    # Run the production build
npm run lint     # Run ESLint
```

### Server

```bash
npm run dev      # Start the Express server with ts-node-dev
npm run build    # Compile TypeScript
npm run start     # Start the compiled server
npm run test      # Run Jest tests
```

## API Overview

The backend exposes REST endpoints under `/api`.

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Boards

- `GET /api/boards`
- `POST /api/boards`
- `GET /api/boards/:id`
- `DELETE /api/boards/:id`
- `POST /api/boards/:id/lists`

### Lists and Cards

The app also exposes routes for creating and updating list and card content via the `server/src/routes` files, using board ownership checks and JWT auth.

## Real-Time Behavior

The server uses Socket.IO to handle board-specific updates. Clients join a room for a board and receive change events when board data changes.

## Notes

- The app uses a multi-package setup, so frontend and backend are started independently.
- The backend requires a PostgreSQL connection string in `DATABASE_URL`.
- Authentication is required for most board-related operations.

## Typical Development Workflow

1. Start PostgreSQL.
2. Create a `.env` in `server/`.
3. Run `npx prisma migrate dev --name init`.
4. Start `server` with `npm run dev`.
5. Start `client` with `npm run dev`.
6. Open http://localhost:3000 in the browser.

## Contributing

Feel free to fork the repository and submit pull requests with improvements, bug fixes, or feature additions.
