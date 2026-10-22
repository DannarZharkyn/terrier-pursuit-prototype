# Terrier Pursuit

A web application developed for Boston University Student Wellbeing to organize team scavenger hunts across Boston. Organizers manage events and review photo submissions; participants register, form teams, follow clues, and submit hunt photos from their phones.

- [Live application](https://terrier-pursuit.vercel.app/participant/welcome)
- [Development prototype](https://terrier-pursuit-prototype.vercel.app)

## Project background

I worked as the lead software engineer on Terrier Pursuit as part of the Boston University Student Wellbeing team, collaborating with colleagues to bring the platform to life.

The platform has been used by over 400 students across university orientation and community events and continues to evolve based on participant feedback and stakeholder needs.

## Features

- Protected organizer dashboard with event creation, editing, and submission review.
- Reusable location library, campus filters, spreadsheet imports, and duplicate-landmark detection.
- Event-specific game codes, QR links, and editable invitation emails for manual sending.
- Participant registration, consent records, team creation/joining, leader designation, and balanced team assignment.
- Supabase Storage photo uploads and persistent team submissions.
- Time-controlled clues, Boston timezone handling, and realtime participant updates.

## Technology and engineering work

Next.js App Router, React, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Authentication, Storage, and Realtime), and Vercel.

Engineering work includes relational data modeling through SQL migrations, server-side organizer authorization, validated spreadsheet imports, event-specific template snapshots, team-assignment algorithms, daylight-saving-aware dates, automated tests, and k6 performance testing. Live and prototype deploy from `main` and `development`; event records are separated by an environment label within the shared database.

## Local development

```sh
npm ci
cp .env.local.example .env.local
npm run dev
```

Configure the example variables using a dedicated development Supabase project with the repository's migrations already applied in order. Keep the service-role key server-only and real credentials out of Git. The example contains placeholders; it does not provision a database. Review local connections before running workflows that write data.

```sh
npm test                 # Local unit tests
npx tsc --noEmit         # TypeScript validation
npm run build           # Production compilation
```

## Performance testing

The [k6 guide](load-tests/README.md) covers scenarios, staged concurrency profiles, latency/error thresholds, the synthetic fixture, and generated reports. Load tests require a dedicated disposable staging deployment and database. Profiles up to 1,000 users are available; this does not imply every profile has been validated successfully.

## Deployment

Vercel builds live from `main` and the prototype from `development`. Each project supplies its Supabase configuration and its own `NEXT_PUBLIC_APP_URL`. SQL migrations are versioned in `supabase/migrations/`; deploying code does not apply them automatically. Never commit `.env.local` or database credentials.
