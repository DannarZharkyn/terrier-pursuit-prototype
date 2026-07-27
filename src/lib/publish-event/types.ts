export type PublishEventRequest = {
  event: {
    name: string;
    startsAt: string;
    submissionDeadline: string;
    rules: string;
    disclaimer: string;
  };
  participants: {
    firstName: string;
    lastName: string;
    email: string;
    normalizedFirstName: string;
    normalizedLastName: string;
    normalizedEmail: string;
  }[];
  locations: {
    position: number;
    landmark: string;
    normalizedLandmark: string;
    locationUrl: string;
    clue: string;
    campusPopulation: string;
  }[];
};

export type PublishEventSuccess = {
  ok: true;
  eventId: string;
  gameCode: string;
  participantCount: number;
  locationCount: number;
  emailTemplate: {
    recipients: string;
    subject: string;
    body: string;
  };
};

export type PublishEventFailure = {
  ok: false;
  error: string;
  details?: string[];
};

export type PublishEventResponse = PublishEventSuccess | PublishEventFailure;
