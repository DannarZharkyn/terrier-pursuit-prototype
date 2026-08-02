# Terrier Pursuit load tests

These k6 tests measure latency, p95/p99 response time, throughput, and errors
under increasing numbers of virtual users.

## Safety rules

- Use a dedicated Vercel staging deployment and test Supabase project/event.
- Do not use real participant names or email addresses.
- Production is blocked unless `ALLOW_PRODUCTION=true` is explicitly provided.
- Run profiles in order. Do not jump to 500 or 1,000 users before reviewing 100.
- The onboarding scenario creates participant and consent records. Clean up the
  test event after the run.
- Photo upload and team mutation tests are intentionally deferred until their
  storage and database cleanup process is defined.

## Install k6

On macOS:

```sh
brew install k6
```

## First smoke test

The read-only test does not create database records:

```sh
TARGET_URL="https://your-staging-deployment.vercel.app" \
PROFILE=smoke \
bash load-tests/run.sh read-only
```

## Participant onboarding test

Create a published staging event and use its six-character game code:

```sh
TARGET_URL="https://your-staging-deployment.vercel.app" \
GAME_CODE="ABC123" \
PROFILE=smoke \
bash load-tests/run.sh onboarding
```

## Profiles

Run these sequentially:

1. `smoke` — 1 user
2. `five` — 5 users
3. `twentyFive` — 25 users
4. `hundred` — 100 users
5. `oneFifty` — 150 users
6. `twoHundred` — 200 users
7. `fiveHundred` — 500 users
8. `thousand` — 1,000 users

Example:

```sh
TARGET_URL="https://your-staging-deployment.vercel.app" \
GAME_CODE="ABC123" \
PROFILE=hundred \
bash load-tests/run.sh onboarding
```

## Results

Every run creates a timestamped directory under `load-tests/results` with:

- `report.html` — graphs and an interactive test report
- `summary.json` — machine-readable aggregate metrics

The report includes request duration over time, request rate, failures, active
virtual users, and percentile latency. Endpoint tags make it possible to locate
the slow part of the participant journey.

## Initial pass/fail thresholds

- Overall error rate below 1%
- Overall p95 below 1 second
- Overall p99 below 3 seconds
- Registration and consent writes p95 below 2 seconds
- Disclaimer, rules, and team reads p95 below 1 second

These thresholds are initial targets and should be revised after the first
controlled baseline.
