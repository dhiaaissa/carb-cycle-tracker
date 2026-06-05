# Carb Cycle Tracker

A personal 56-day carb cycling diet and workout tracker built with React, Express, and SQLite.

## Prerequisites

- Node.js 18+
- npm

## Install

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

## Setup Database

```bash
# Create database tables
npm run migrate

# Seed with today as start date
npm run seed
```

## Run Development Server

```bash
npm run dev
```

This starts both the Express API on `http://localhost:3001` and the Vite dev server on `http://localhost:5173`.

## Phase Schedule

The 56-day programme is split into 4 phases:

| Phase | Days | Goal | Carb Pattern |
|-------|------|------|-------------|
| 1 (Weeks 1–2) | 0–13 | Adaptation | Alternate Med/Low |
| 2 (Weeks 3–4) | 14–27 | Fat loss increase | 3× Low, 1× Med |
| 3 (Weeks 5–6) | 28–41 | Strong fat burning | 6× Low, 1× Med |
| 4 (Weeks 7–8) | 42–55 | Recovery & Performance | Week 7: H/M/L cycle, Week 8: Alt Med/Low |

## Workout Rule

Workouts are **only on Medium carb days**. When a workout is logged, +200 kcal is added to the day's calorie target. No workouts on Low (deficit rest) or High (recovery) days. The number of workouts per week varies naturally by phase.

## Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite via better-sqlite3
- **ORM**: Drizzle ORM
