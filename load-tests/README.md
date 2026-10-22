# Terrier Pursuit load tests

These k6 tests measure latency, p95/p99 response time, throughput, and errors
under increasing numbers of virtual users.

## Safety rules

- Use a dedicated Vercel staging deployment and test Supabase project/event.
- Do not use real participant names or email addresses.
- Known live (`terrier-pursuit.vercel.app`) and prototype
  (`terrier-pursuit-prototype.vercel.app`) hosts are blocked unless
  `ALLOW_PRODUCTION=true` is explicitly provided. Do not enable this override
  for routine testing. Other aliases are not automatically detected: verify
  both the deployment and its database before running any scenario.
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

These standalone scripts are not part of the Next.js build or unit tests.
The read-only scenario measures the participant page and the organizer
dashboard's redirect to login, not an authenticated organizer dashboard.
The onboarding scenario writes synthetic registration and consent records
and measures participant API reads.

The read-only test does not create database records:

```sh
TARGET_URL="https://your-staging-deployment.vercel.app" \
PROFILE=smoke \
bash load-tests/run.sh read-only
```

## Participant onboarding test

`staging-event.json` is an example publish payload with synthetic participants,
`example.com` addresses, and a fictional landmark. Its year-2099 dates are
placeholders: set suitable dates in a local copy before creating a staging
event. Publishing requires an authorized organizer session. This fixture is
not loaded automatically. Use a dedicated disposable database; a different
Vercel URL alone does not guarantee data isolation.

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

Historical results are local, ignored artifacts. Preserve useful HTML reports,
JSON summaries, and PDFs before cleaning temporary files. Old results describe
the code, infrastructure, and scenario at the time of the run; they do not
establish current capacity or authenticated dashboard performance.

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
