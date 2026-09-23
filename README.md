# Hair Booking Platform

Mobile-first booking site for a home-based hairstylist, with a private admin
dashboard for managing bookings and weekly availability.

## Stack

- Frontend: React + Vite (JavaScript)
- Backend: Node.js + Express (ES Modules)
- Database: MongoDB + Mongoose

## Requirements

- Node.js 18.11 or newer
- A MongoDB database (local or Atlas) — not required until Phase 2

## Setup

```bash
# Backend
cd server
npm install
cp .env.example .env
npm run dev

# Frontend (in a second terminal)
cd client
npm install
cp .env.example .env
npm run dev
```

## Environment variables

Real values live in `server/.env` and `client/.env`, which are git-ignored.
See `.env.example` in each folder for the required keys.
`MONGODB_URI` may be left empty during Phase 1.

## Project status

- [x] Phase 1 — project foundation, health endpoint, config, error handling
- [ ] Phase 2 — data models (Business, Service, ServiceOption, Availability, Booking)
- [ ] Phase 3 — availability and slot generation
- [ ] Phase 4 — customer booking flow
- [ ] Phase 5 — admin authentication and dashboard