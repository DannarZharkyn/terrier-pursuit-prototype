const profiles = {
  smoke: [
    { duration: "15s", target: 1 },
    { duration: "15s", target: 1 },
    { duration: "10s", target: 0 },
  ],
  five: [
    { duration: "30s", target: 5 },
    { duration: "1m", target: 5 },
    { duration: "20s", target: 0 },
  ],
  twentyFive: [
    { duration: "1m", target: 25 },
    { duration: "3m", target: 25 },
    { duration: "30s", target: 0 },
  ],
  hundred: [
    { duration: "2m", target: 100 },
    { duration: "5m", target: 100 },
    { duration: "1m", target: 0 },
  ],
  oneFifty: [
    { duration: "3m", target: 150 },
    { duration: "5m", target: 150 },
    { duration: "1m", target: 0 },
  ],
  oneFiftyDiagnostic: [
    { duration: "2m", target: 150 },
    { duration: "2m", target: 150 },
    { duration: "30s", target: 0 },
  ],
  twoHundred: [
    { duration: "3m", target: 200 },
    { duration: "5m", target: 200 },
    { duration: "1m", target: 0 },
  ],
  twoHundredDiagnostic: [
    { duration: "2m", target: 200 },
    { duration: "2m", target: 200 },
    { duration: "30s", target: 0 },
  ],
  fiveHundred: [
    { duration: "5m", target: 500 },
    { duration: "10m", target: 500 },
    { duration: "2m", target: 0 },
  ],
  thousand: [
    { duration: "8m", target: 1000 },
    { duration: "10m", target: 1000 },
    { duration: "3m", target: 0 },
  ],
};

export function testConfig() {
  const profileName = __ENV.PROFILE || "smoke";
  const stages = profiles[profileName];

  if (!stages) {
    throw new Error(
      `Unknown PROFILE "${profileName}". Use smoke, five, twentyFive, hundred, oneFifty, oneFiftyDiagnostic, twoHundred, twoHundredDiagnostic, fiveHundred, or thousand.`,
    );
  }

  return {
    scenarios: {
      participant_journey: {
        executor: "ramping-vus",
        stages,
        gracefulRampDown: "30s",
        gracefulStop: "30s",
      },
    },
    thresholds: {
      http_req_failed: ["rate<0.01"],
      http_req_duration: ["p(95)<1000", "p(99)<3000"],
      "http_req_duration{name:participant_welcome_page}": ["p(95)<1000"],
      "http_req_duration{name:organizer_dashboard}": ["p(95)<1000"],
      journey_failures: ["rate<0.01"],
      "http_req_duration{name:participant_join}": ["p(95)<2000"],
      "http_req_duration{name:disclaimer_get}": ["p(95)<1000"],
      "http_req_duration{name:disclaimer_accept}": ["p(95)<2000"],
      "http_req_duration{name:rules_get}": ["p(95)<1000"],
      "http_req_duration{name:team_lookup}": ["p(95)<1000"],
    },
  };
}

export function targetUrl() {
  const value = (__ENV.TARGET_URL || "").replace(/\/$/, "");

  if (!value) {
    throw new Error("TARGET_URL is required. Use a dedicated staging deployment.");
  }

  const isProduction = value === "https://terrier-pursuit-prototype.vercel.app";
  if (isProduction && __ENV.ALLOW_PRODUCTION !== "true") {
    throw new Error(
      "Production load testing is blocked. Use staging, or explicitly set ALLOW_PRODUCTION=true after approval.",
    );
  }

  return value;
}
