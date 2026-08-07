update public.platform_templates
set participant_instructions = $instructions$
FOR PARTICIPANTS

1. Open the participant link or scan the event QR code.
2. If you were pre-registered, sign in with the same name and email submitted by the organizer. If you are joining spontaneously, select “I was not pre-registered” to create your registration.
3. The event link normally fills in the game code. If needed, get the game code from a teammate, orientation leader, event organizer, or administrator.
4. Create a new team or join the correct existing team. To join, ask a teammate or team leader for the team code shown on their Profile page. The team code is different from the game code.
5. If you do not create or join a team, the event organizer may assign you to one.
6. Destination clues become visible when the game starts.

FOR CAMPUS PARTNERS AND ORIENTATION LEADERS

Create teams when needed, share each team code with the correct teammates, and confirm that everyone joins the intended team. Help spontaneous participants register with the event game code, then direct them to create or join the appropriate team.
$instructions$,
email_body = $email$
Dear Participant,

Welcome to the Terrier Pursuit game!

Game: {{eventName}}
Game starts: {{startsAt}}
Submission deadline: {{submissionDeadline}}
Game code: {{gameCode}}

Sign in here: {{participantUrl}}

Instructions:
{{participantInstructions}}

Game rules:
{{rules}}

Questions or technical support:
Student Wellbeing
studentwellbeing@bu.edu
930 Commonwealth Ave, Suite 1020
Boston, MA

Good luck and have fun!
Terrier Pursuit
$email$
where template_key = 'event_defaults';
