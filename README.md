# Terrier Pursuit MVP

Terrier Pursuit is a frontend-only MVP prototype for a campus scavenger hunt web application. The prototype is designed to visualize the core product flow for both event organizers and student participants.

Live demo: https://terrier-pursuit-prototype.vercel.app/organizer/dashboard

## Overview

This MVP demonstrates how organizers could create and manage a Terrier Pursuit event, review team submissions, and preview the participant experience. It also includes a mobile-responsive participant flow for joining an event, creating or joining a team, viewing clues, managing a shared upload folder, and submitting a hunt.

## Prototype Scope

This project is currently a UI/UX prototype with a Supabase foundation. The visible app still uses mock data and placeholder content. The Supabase setup adds database schema and environment configuration, but it does not yet connect authentication, email, file uploads, or the existing forms.

## Built With

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase client libraries

## Architecture Notes

### Why Supabase Instead of Just PostgreSQL?

Supabase is hosted PostgreSQL plus useful app-building services around it: a dashboard, API access, row level security integration, storage, and auth options. Terrier Pursuit still keeps its schema in standard SQL so it can move to a BU-managed PostgreSQL database later. Supabase is the inexpensive MVP host; PostgreSQL is the durable database foundation.

### What Is an Environment Variable?

An environment variable is a configuration value supplied outside the source code. Local values go in `.env.local`, and deployed values go in Vercel's environment variable settings. Real credentials should never be committed to GitHub.

This repository includes `.env.local.example` to show which values are required. Create your own `.env.local` from that file.

### Why Do We Need an Anon Key?

Supabase clients need the project URL and anon key to send requests to the right Supabase project. The anon key is intended for browser and server app usage, but it is not a substitute for permissions. Database access should be controlled with row level security policies. In this setup, the real MVP tables have row level security enabled with no public access policies yet.

### How Does Next.js Talk to the Database?

Next.js code creates a Supabase client using the values in environment variables. Browser-side code can use `src/lib/supabase/client.ts`, and server-side code can use `src/lib/supabase/server.ts`. All Supabase-specific helper code belongs in `src/lib/supabase` so the rest of the app can stay portable.

### What Is a Migration?

A migration is a version-controlled SQL file that changes the database schema. Migrations let us review, repeat, and migrate database changes instead of relying on manual dashboard clicks. The initial schema is in `supabase/migrations/20260714000000_initial_schema.sql`.

### Why Vercel Instead of Hosting the App Ourselves?

Vercel is a managed host built for Next.js. It handles builds, previews, HTTPS, deployment from GitHub, and environment variables with little operational overhead. That keeps the MVP inexpensive and lets the project focus on product learning. Later, the app can move to BU infrastructure if needed because the app is still ordinary Next.js and PostgreSQL-oriented SQL.

## Supabase Setup

### 1. Install Dependencies

If dependencies are not installed yet, run:

```bash
npm install
```

The Supabase packages used by this project are:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/).
2. Create a free account or sign in.
3. Create a new project.
4. Choose an organization, project name, region, and database password.
5. Save the database password somewhere secure. Do not commit it to GitHub.

### 3. Add Local Environment Variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

In Supabase, open your project, then go to **Project Settings > API**.

Put these values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

`.env.local` is ignored by Git and must stay private.

### 4. Apply the SQL Schema

In Supabase, open **SQL Editor**, create a new query, paste the full contents of:

```text
supabase/migrations/20260714000000_initial_schema.sql
```

Then click **Run**.

This creates the initial MVP tables for events, participants, event locations, teams, team memberships, and submissions.

Events also include data-retention timestamps so participant data and uploaded photos can be scheduled for deletion after the game. The intended MVP policy is to schedule deletion about one week after the event ends, then record when deletion actually happens.

### 5. Current Integration Status

The database schema is ready to apply, but the existing pages still use mock data. The first real integration step will be the participant Excel import flow.

You can still run the local prototype with:

```bash
npm run dev
```

## Main Flows

- Organizer login and dashboard
- Event creation and publish confirmation
- Event dashboard with team submission review
- Team review page with photo placeholders
- Participant onboarding
- Team creation, joining, and assignment states
- Mobile hunt home, team page, shared folder, and profile

## Deployment

The MVP is deployed on Vercel and connected to the GitHub repository for easy updates.
