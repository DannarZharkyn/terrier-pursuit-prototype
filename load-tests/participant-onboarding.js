import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";
import { targetUrl, testConfig } from "./config.js";

export const options = testConfig();

const failures = new Rate("journey_failures");
const baseUrl = targetUrl();
const gameCode = __ENV.GAME_CODE || "";
const runId = __ENV.RUN_ID || `${Date.now()}`;
let session;

if (!gameCode) {
  throw new Error("GAME_CODE is required for participant onboarding tests.");
}

const jsonHeaders = { "Content-Type": "application/json" };

export default function () {
  let onboardingOk = true;

  if (!session) {
    const identity = `${runId}-${__VU}`;
    const participant = {
      firstName: "Load",
      lastName: `Tester${identity}`,
      email: `load-test-${identity}@example.com`,
      gameCode,
      selfRegister: true,
    };

    const joinResponse = http.post(
      `${baseUrl}/api/participant/join`,
      JSON.stringify(participant),
      { headers: jsonHeaders, tags: { name: "participant_join" } },
    );
    const joined = check(joinResponse, {
      "participant registration succeeds": (response) =>
        response.status === 200 && response.json("ok") === true,
      "participant and event IDs are returned": (response) =>
        Boolean(response.json("participant.id")) && Boolean(response.json("event.id")),
    });

    if (!joined) {
      failures.add(true);
      sleep(1);
      return;
    }

    session = {
      participantId: joinResponse.json("participant.id"),
      eventId: joinResponse.json("event.id"),
    };
    sleep(Math.random() * 2 + 1);

    const disclaimerUrl =
      `${baseUrl}/api/participant/disclaimer?eventId=${session.eventId}`
      + `&participantId=${session.participantId}`;
    const disclaimerResponse = http.get(disclaimerUrl, {
      tags: { name: "disclaimer_get" },
    });
    const disclaimerLoaded = check(disclaimerResponse, {
      "disclaimer loads": (response) =>
        response.status === 200 && response.json("ok") === true,
    });

    const acceptanceResponse = http.post(
      `${baseUrl}/api/participant/disclaimer`,
      JSON.stringify({
        eventId: session.eventId,
        participantId: session.participantId,
        activitySafetyAccepted: true,
        mediaDataAccepted: true,
      }),
      { headers: jsonHeaders, tags: { name: "disclaimer_accept" } },
    );
    const disclaimerAccepted = check(acceptanceResponse, {
      "disclaimer acceptance saves": (response) =>
        response.status === 200 && response.json("accepted") === true,
    });

    onboardingOk = disclaimerLoaded && disclaimerAccepted;
  }

  sleep(Math.random() * 2 + 1);

  const rulesUrl =
    `${baseUrl}/api/participant/rules-review?eventId=${session.eventId}`
    + `&participantId=${session.participantId}`;
  const rulesResponse = http.get(rulesUrl, {
    tags: { name: "rules_get" },
  });
  const rulesLoaded = check(rulesResponse, {
    "rules status loads": (response) =>
      response.status === 200 && response.json("ok") === true,
  });

  const teamResponse = http.get(
    `${baseUrl}/api/participant/teams?eventId=${session.eventId}`
      + `&participantId=${session.participantId}`,
    { tags: { name: "team_lookup" } },
  );
  const teamLoaded = check(teamResponse, {
    "team status loads": (response) =>
      response.status === 200 && response.json("ok") === true,
  });

  failures.add(
    !(onboardingOk && rulesLoaded && teamLoaded),
  );
  sleep(Math.random() * 4 + 2);
}
