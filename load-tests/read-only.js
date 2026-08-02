import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";
import { targetUrl, testConfig } from "./config.js";

export const options = testConfig();

const failures = new Rate("journey_failures");
const baseUrl = targetUrl();

export default function () {
  const participantPage = http.get(`${baseUrl}/participant/welcome`, {
    tags: { name: "participant_welcome_page" },
  });
  const participantOk = check(participantPage, {
    "participant page returns 200": (response) => response.status === 200,
    "participant page contains join form": (response) =>
      response.body.includes("Join the Event"),
  });

  sleep(Math.random() * 2 + 1);

  const organizerPage = http.get(`${baseUrl}/organizer/dashboard`, {
    tags: { name: "organizer_dashboard" },
  });
  const organizerOk = check(organizerPage, {
    "organizer dashboard returns 200": (response) => response.status === 200,
    "organizer dashboard contains heading": (response) =>
      response.body.includes("Organizer Dashboard"),
  });

  failures.add(!(participantOk && organizerOk));
  sleep(Math.random() * 3 + 2);
}
