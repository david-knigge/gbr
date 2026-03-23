Race Fundraiser App — Product & Technical Design Document
1. Overview

This project is a mobile-first event web app for a charity race. The goal is to increase engagement and donations during the event by turning the racetrack into a lightweight interactive fundraiser experience.

Participants should be able to:

open the app instantly on their phone
participate without creating a full account
scan QR codes placed around the racetrack
answer a short multiple-choice question tied to the fundraising mission
earn raffle entries and/or temporary multipliers
optionally donate through Givebutter
link their donation to their in-app identity using a short code
see their progress and impact in a clear, rewarding way

This is not intended to be a full game, native app, or AR experience. It is a fast, low-friction sponsor/fundraising quest optimized for race-day participation.

2. Background and Product Rationale

At many charity events, donation prompts are passive and easy to ignore. People may be willing to contribute, but there is little urgency, fun, or repeated interaction. Static QR codes that only open a donation page do not create much engagement.

The idea here is to create a lightweight digital layer around the race so that people feel encouraged to interact multiple times throughout the event.

Instead of only saying:

“Donate here”

the app should create a loop more like:

“Explore the track, scan checkpoints, answer a quick mission question, earn raffle rewards, and optionally donate to boost your impact.”

The goal is to combine:

fundraising
education about the cause
movement around the event
light game mechanics
raffle incentives

without introducing too much friction.

The design should be realistic for an MVP and should prioritize:

simplicity
event-day usability
low technical complexity
easy deployment
easy donor verification
3. Fundraising Context

The fundraising campaign in this case supports the STEAM Wheel program.

Campaign content

Support STEAM Wheel
$2,363 Raised of $10,000
STEAM - Science, Technology, Engineering, Arts, and Math

Help Us Keep the Wheel Turning

Our elementary students are at risk of losing the STEAM Wheel program due to a lack of funding. Click the Donate button to learn more about this vibrant program and make a contribution of your choosing.

This campaign messaging should be integrated into the app in a meaningful way, not just shown as a static paragraph. The app should reinforce the mission through interaction.

4. Core Product Idea

The user experience should revolve around checkpoints around the racetrack.

At each checkpoint:

the participant scans a QR code
the app recognizes the checkpoint
the app presents a short mission-related multiple choice question
on successful completion, the user earns raffle entries and possibly a reward modifier
the app encourages continued participation or donation

This makes the experience more meaningful than merely scanning codes. It creates a moment of:

learning
participation
reward

The educational prompt also ties the event mechanics to the actual donation goal rather than making the app feel disconnected from the cause.

5. Product Goals
Primary goals
Increase total donations
Increase event engagement
Encourage repeated interactions during the race
Make the fundraising cause more visible and memorable
Provide a low-friction way to reward participation
Secondary goals
Capture emails for raffle contact
Create sponsor visibility opportunities
Produce a fun, family-friendly event mechanic
Allow organizers to track engagement
Make it easy to reconcile verified donations
6. Non-goals

This MVP should not attempt to be:

a full native app
a polished AR game
a social network
a heavy auth/account platform
a complex geolocation game
a highly secure anti-fraud platform
a full donor CRM

The product should remain intentionally narrow and event-focused.

7. High-Level User Experience
Core loop
Open the app
Get a lightweight local identity and app code
Scan a checkpoint
Answer a short mission question
Earn raffle entries
Repeat at other checkpoints
Optionally donate for bonus entries or a multiplier
See progress and impact
Emotional design intent

The app should feel:

immediate
cheerful
rewarding
purpose-driven
easy to understand in under 10 seconds

It should not feel:

corporate
bureaucratic
complicated
account-heavy
like homework
8. Key Mechanics
8.1 Checkpoint scans

Participants scan QR codes placed around the track. Each checkpoint should only count once per user.

The QR code should either:

encode a tokenized URL
or encode a token that the app submits to the backend

Each checkpoint can award:

base raffle entries
progress toward milestone bonuses
possibly mission completion progress
8.2 Multiple choice mission question

After scanning, the user gets a short question related to the fundraising cause.

Example:

What does STEAM stand for?

Science, Technology, Engineering, Arts, and Math ✅
Sports, Teamwork, Energy, Achievement, and Movement
Science, Theater, Education, Athletics, and Music
Study, Thinking, Exploration, Art, and Motivation

This serves several purposes:

makes scans more intentional
reinforces the cause
adds a moment of engagement
slows down drive-by farming
gives the checkpoints a distinct identity
Recommended question design
1 question per checkpoint interaction
3–4 answer choices
immediate feedback
short explanation after answering
keep tone light, not exam-like
Whether correct answers are required

For MVP, best approach:

always award the scan
award a bonus for correct answers

That prevents frustration while still rewarding engagement.

Example:

scan = +1 raffle entry
correct answer = +1 additional entry
8.3 Raffle entries

Raffle entries are the main behavioral incentive.

Participants earn entries from:

unique checkpoint scans
correct mission answers
milestone completion
verified donations
temporary multipliers

Entries should be visible and cumulative.

8.4 Donation bonuses

Donations should feel meaningful and rewarding but should not be required to participate.

Recommended messaging:

Play for free. Donate to boost your impact.

Donation perks can include:

bonus raffle entries
temporary multiplier
donor badge
unlocking a premium reward tier

For the MVP, the strongest combination is:

flat bonus entries by donation tier
optional temporary multiplier
Example donation reward structure
Donate $5+ → +5 raffle entries
Donate $20+ → +15 raffle entries
Donate $50+ → +50 raffle entries

Optional extra:

donate $20+ → 2x scan rewards for the next 30 minutes
or
donate once → 1.5x all future checkpoint rewards for the event

If multiplier logic is included, it should be simple and transparent.

8.5 Multipliers

Multipliers are more exciting than flat bonuses, but they add more logic and UI complexity.

Recommendation

For MVP:

support one simple multiplier mechanic
do not create many stacked modifiers
Good option

Donor Boost

verified donation activates 2x checkpoint entry rewards for the next 3 successful scans

This is easier than time-based logic and easier for users to understand.

Alternative:

verified donation grants 1.5x all future scan rewards

But fractional behavior complicates explanation and accounting slightly.

Best MVP multiplier

Use:

“Donate to unlock 2x rewards on your next 3 checkpoints.”

That is easy to explain and fun to use.

9. Identity and Onboarding Strategy

The app should avoid full login on first open.

On first visit

Create a guest identity:

user_id (UUID)
app_code (short human-readable code, e.g. WHEEL-4821)

Store in browser localStorage.

This gives:

immediate participation
no password/email friction
durable enough identity for the event
Email collection

Ask for email only when it becomes useful:

to join raffle eligibility
to claim prizes
optionally before donation flow

Suggested copy:

Enter your email so we can contact you if you win.

Why this is important

Race-day users have low patience. Any forced account flow at the beginning will hurt engagement.

10. Donation Verification Strategy

Donation verification should be done through Givebutter using a required custom field.

Flow
User taps Donate
App shows their short app_code
App tells them to enter that code during checkout
Givebutter checkout includes required field: race_app_code
Givebutter sends webhook on successful donation
Backend matches donation to app user using race_app_code
User gets donation bonuses

This avoids requiring login while still making donation verification possible.

Why this is the preferred approach
low friction
works without full auth
explicit, understandable linking
backend can trust the verified payment event
Important UX requirement

The code must be:

short
prominent
easy to copy
clearly explained before redirecting to Givebutter
11. Proposed User Flow
11.1 First open

User scans event poster QR or opens app URL.

App:

loads branded landing/home screen
creates guest user if not present
generates app code
explains the experience briefly

Suggested message:

Scan checkpoints around the race, answer quick STEAM questions, earn raffle entries, and donate to boost your impact.

11.2 Home screen

Show:

total raffle entries
checkpoints collected
current mission progress
active multiplier if any
donate button
big scan button
app code card
11.3 Scan checkpoint

User taps scan, opens camera, scans QR code.

Backend validates:

checkpoint exists
QR token valid
not already scanned by this user

If successful:

show checkpoint success state
present mission multiple-choice question
11.4 Answer question

User answers question.

Result screen:

correct / nice try
short educational explanation
entries earned
updated total

Example:

Correct! STEAM stands for Science, Technology, Engineering, Arts, and Math.
You earned 2 raffle entries.

or

Nice try! STEAM stands for Science, Technology, Engineering, Arts, and Math.
You earned 1 raffle entry for the checkpoint.

11.5 Progress continuation

Prompt user to:

scan the next checkpoint
check leaderboard
donate for a bonus
11.6 Donation flow

User taps Donate.

Screen shows:

fundraiser summary
current amount raised
campaign goal
donor perks
their app code
copy button
CTA to open Givebutter

Suggested content:
Support STEAM Wheel
$2,363 Raised of $10,000
Help Us Keep the Wheel Turning

Then:

Use your code at checkout to link your donation and unlock donor rewards.

11.7 Raffle/email flow

If user has not entered an email yet, prompt when:

they first accumulate meaningful rewards
they visit raffle/prizes page
they want to be eligible for prize contact

Keep it simple:

nickname
email

No password.

12. Suggested Reward System

Here is a concrete recommendation.

Base rewards
first-time checkpoint scan: +1 raffle entry
correct answer: +1 raffle entry
Milestones
3 checkpoints completed: +2 bonus entries
5 checkpoints completed: +5 bonus entries
all checkpoints completed: +10 bonus entries
Donation rewards
$5+ donation: +5 entries
$20+ donation: +15 entries + 2x rewards on next 3 checkpoints
$50+ donation: +50 entries + donor badge

This has enough richness to feel exciting without becoming hard to explain.

13. Educational Content Strategy

Each checkpoint should be associated with a short educational question related to the mission.

Topics could include:

what STEAM stands for
why STEAM matters in elementary education
what kinds of activities the program supports
what funding helps preserve
how creativity and engineering connect
why arts are part of STEAM
Tone

The questions should feel:

upbeat
child/family-friendly
clear
quick to answer
Avoid
long paragraphs
guilt-heavy wording
tricky or academic phrasing
Example explanation snippets
“Hands-on STEAM learning helps students build confidence through making and experimenting.”
“The arts are part of STEAM because creativity is essential to problem-solving.”
“Programs like STEAM Wheel help students explore ideas they may not otherwise encounter.”
14. Recommended Technical Stack
Frontend
Next.js
mobile-first responsive web app
deployed on Vercel

Rationale:

easier than Flutter for MVP
simpler deployment
no app store distribution
easy to access via QR code
can still feel app-like on mobile
Backend
Next.js API routes / Vercel serverless functions
Database
Supabase Postgres
Donation provider
Givebutter
QR scanning
browser-based camera QR scanner
15. Why Web App Instead of Flutter for MVP

Even though Flutter is possible, a web-first app is a better MVP choice here.

Reasons:

easier to share at an event
no install barrier
lower implementation overhead
easier QR launch flow
easier to deploy and iterate
no native packaging needed

Only choose Flutter if there is a strong requirement for an actual installed mobile app.

16. Data Model

A ledger-driven architecture is recommended so rewards can be audited and recomputed.

16.1 users

Stores lightweight participant identity.

Fields:

id uuid primary key
app_code text unique
nickname text nullable
email text nullable
created_at
updated_at
16.2 checkpoints

Represents physical QR locations.

Fields:

id uuid primary key
name text
slug text unique
qr_token text unique
description text nullable
entries_awarded int default 1
question_id uuid nullable
is_active boolean default true
sort_order int nullable
created_at
16.3 questions

Question bank for checkpoint prompts.

Fields:

id uuid primary key
prompt text
answer_a text
answer_b text
answer_c text
answer_d text nullable
correct_answer text
explanation text
is_active boolean default true
created_at

Could also be normalized into answers table, but for MVP flat columns are acceptable.

16.4 scans

Stores unique user checkpoint scans.

Fields:

id uuid primary key
user_id fk users
checkpoint_id fk checkpoints
created_at

Constraint:

unique (user_id, checkpoint_id)
16.5 question_attempts

Stores whether the user answered correctly.

Fields:

id uuid primary key
user_id fk users
checkpoint_id fk checkpoints
question_id fk questions
selected_answer text
is_correct boolean
created_at

Constraint could be:

one attempt per user per checkpoint
16.6 donations

Stores verified donations.

Fields:

id uuid primary key
external_id text unique
user_id fk users nullable
race_app_code text nullable
donor_email text nullable
amount_cents int
currency text
status text
raw_payload jsonb
created_at
16.7 raffle_entries_ledger

Source-of-truth ledger for all raffle changes.

Fields:

id uuid primary key
user_id fk users
source_type text
source_id text nullable
delta int
note text nullable
created_at

Possible source_type values:

checkpoint_scan
question_correct
checkpoint_milestone
donation_bonus
donation_multiplier_bonus
admin_adjustment
16.8 reward_states

Tracks stateful bonuses like multipliers.

Fields:

id uuid primary key
user_id fk users
reward_type text
remaining_uses int nullable
is_active boolean
metadata jsonb nullable
created_at
updated_at

Example:

reward_type = double_next_3_scans
remaining_uses = 3
17. Reward Logic
17.1 Checkpoint scan logic

On valid first-time scan:

insert into scans
add ledger entry +1
return associated question

If user has active scan multiplier:

apply multiplier to the scan-derived reward
decrement remaining uses
17.2 Question logic

After question submission:

create question_attempt
if correct:
add ledger entry +1
optionally also apply active multiplier only if desired

Recommendation:
Do not apply donation multiplier to question correctness bonus unless explicitly wanted. Simpler to let multiplier affect scan rewards only.

17.3 Milestone logic

After each successful new scan:

compute total unique checkpoints completed
if hitting a milestone not yet awarded:
add ledger entry for milestone bonus

Need to ensure milestone rewards are idempotent.

17.4 Donation logic

When webhook arrives:

verify authenticity if possible
ignore duplicates
store donation row
match race_app_code
award tiered donation bonus
if tier qualifies, activate multiplier reward state
18. API Design
POST /api/guest/init

Creates or returns guest user.

Response
user_id
app_code
POST /api/profile

Updates nickname/email.

Request
user_id
nickname
email
GET /api/me

Returns current user state.

Response
user_id
app_code
nickname
email
raffle_entries_total
checkpoints_completed
active_multiplier
donor_status
milestones
POST /api/scan

Submits QR token.

Request
user_id
qr_token
Response
success
checkpoint
entries_added
question
POST /api/question/answer

Submits answer for a checkpoint question.

Request
user_id
checkpoint_id
question_id
selected_answer
Response
is_correct
explanation
entries_added
total_entries
GET /api/checkpoints

Returns progress-friendly checkpoint list.

Response
checkpoint metadata
whether completed by current user
GET /api/leaderboard

Optional leaderboard endpoint.

Response
nickname
total_entries

Can be privacy-limited.

POST /api/webhooks/givebutter

Receives successful donation events.

Responsibilities
verify event authenticity
parse custom field race_app_code
parse amount
store donation
award donation rewards
remain idempotent
19. QR Strategy
Recommended QR content

Each checkpoint QR should resolve to a URL like:

https://yourapp.com/c/<token>

or scan token via in-app scanner.

The URL approach is better because:

users can participate even if scanner flow is imperfect
QR can launch the app directly into checkpoint flow
easier fallback behavior
Important

Tokens must be opaque and not guessable.

20. Admin Requirements

The MVP should include a minimal admin capability, even if ugly.

Admin needs:

create/edit checkpoints
assign questions to checkpoints
generate/export QR tokens
view users
view donations
view unmatched donations
manually reconcile donation to user
export raffle ledger / winner list

This can be:

password-protected simple admin pages
or even Supabase-driven internal tools if needed
21. UX and Visual Design Direction

The app should feel:

bright
community-oriented
family-friendly
optimistic
mission-connected
Design priorities
huge scan CTA
simple reward feedback
progress visibility
easy donation prompt
prominent app code
minimal typing
Home screen visual hierarchy
event title / mission
total raffle entries
big scan button
progress summary
donate CTA
app code card
Donation screen hierarchy
campaign title
amount raised / goal
short mission blurb
donor perks
big app code
copy button
donate CTA
22. Example Screen Set
Screen 1: Home
logo / event title
“Support STEAM Wheel”
total entries
checkpoints completed
active donor boost
scan button
donate button
code card
Screen 2: Scan
camera view
scanning overlay
fallback manual code entry optional
Screen 3: Question
checkpoint success banner
mission question
3–4 answers
Screen 4: Answer result
correct / not correct
explanation
entries earned
continue button
Screen 5: Donate
fundraising summary
donor perks
app code
copy button
open Givebutter CTA
Screen 6: Profile / Raffle
nickname
email
raffle eligibility
prize info
Screen 7: Leaderboard

Optional

23. Content Examples
Home copy

Scan checkpoints, answer STEAM questions, earn raffle entries, and help keep the Wheel turning.

Donate copy

Donate to support STEAM Wheel and unlock bonus raffle rewards.

Code instruction

Use this code at checkout to link your donation and receive your donor bonus.

Result copy

Great job! You earned 2 raffle entries.

24. Edge Cases

The implementation should account for:

repeated scans of same checkpoint
question resubmission attempts
missing email
missing or invalid donation code
webhook retries
unmatched donation
lost localStorage / device change
user donates without entering code

For MVP, unmatched donations should be stored and fixable by admins.

25. Security / Trust / Anti-cheat

This is an event app, not a financial system, so anti-cheat should be practical, not extreme.

Required
QR validation server-side
no duplicate rewards for same checkpoint
idempotent donation processing
do not expose QR secrets in public APIs
Optional
geolocation proximity check
rate limiting
signed QR tokens
admin audit logs
26. Build Priorities
Phase 1
guest identity
home screen
checkpoint model
QR scan flow
raffle ledger
progress totals
Phase 2
question system
question result screen
milestone rewards
email capture
Phase 3
donate screen
app code UX
Givebutter webhook integration
donation bonuses and multiplier state
Phase 4
leaderboard
admin tools
polish
error handling
27. Success Metrics

The organizer should be able to evaluate whether this was worthwhile.

Metrics to track
number of unique participants
number of scans
average checkpoints per participant
question completion rate
email capture rate
donation conversion rate
total verified donations linked through app code
total raffle entries awarded
number of unmatched donations
28. Claude Implementation Brief

Below is a version you can paste directly into Claude.

Build a mobile-first MVP web app for a charity race fundraiser supporting the STEAM Wheel campaign.

Product concept:
- Users open the app on their phones without needing a full login
- On first visit, create a guest identity with:
  - user_id (uuid)
  - short human-readable app_code like WHEEL-4821
- Persist this guest identity in localStorage
- Users scan QR checkpoints placed around the racetrack
- After each successful unique checkpoint scan, show a short multiple-choice question related to the STEAM Wheel mission
- Users earn raffle rewards through participation
- Users can optionally donate through Givebutter and enter their app_code at checkout to unlock donor rewards

Fundraising context:
- Campaign title: Support STEAM Wheel
- Campaign goal example: $2,363 raised of $10,000
- Messaging:
  STEAM - Science, Technology, Engineering, Arts, and Math
  Help Us Keep the Wheel Turning
  Our elementary students are at risk of losing the STEAM Wheel program due to a lack of funding. Click the Donate button to learn more about this vibrant program and make a contribution of your choosing.

Reward design:
- Each first-time checkpoint scan gives +1 raffle entry
- If the user answers the mission question correctly, give +1 additional raffle entry
- Milestone bonuses:
  - 3 checkpoints completed => +2 entries
  - 5 checkpoints completed => +5 entries
  - all checkpoints completed => +10 entries
- Donation bonuses:
  - >= $5 donation => +5 entries
  - >= $20 donation => +15 entries and activate a reward multiplier of 2x scan rewards for the next 3 checkpoints
  - >= $50 donation => +50 entries and donor badge
- The app should track and display active multiplier state

Important UX requirements:
- No required login on first open
- Ask for email only when needed for raffle eligibility / prize contact
- Show the user’s app_code prominently on the donation screen
- Tell the user to enter this code during Givebutter checkout in a required custom field called race_app_code
- Keep the experience extremely simple and race-day friendly
- Mobile-first design
- Large Scan button
- Clear reward feedback
- Very little typing

Technical requirements:
- Build as a Next.js mobile-first web app, not Flutter
- Deploy on Vercel
- Use Supabase Postgres for persistence
- Use serverless API routes
- Use browser-based QR scanning
- Implement Givebutter webhook handling
- Donation processing must be idempotent
- Match donations to users via race_app_code
- Store unmatched donations for manual reconciliation
- Use a ledger-based raffle entry system rather than only storing a mutable total

Data model should include at minimum:
- users
- checkpoints
- questions
- scans
- question_attempts
- donations
- raffle_entries_ledger
- reward_states

Implementation details:
- Prevent duplicate scan rewards per user/checkpoint
- Keep QR token validation server-side
- Support active scan multiplier rewards
- Maintain an audit-friendly ledger for all reward deltas
- Build minimal admin capability for:
  - managing checkpoints
  - assigning questions
  - viewing donations
  - reconciling unmatched donations
  - exporting raffle results

Frontend screens:
1. Home
2. Scan
3. Question
4. Answer result
5. Donate
6. Profile / raffle
7. Optional leaderboard

Please produce:
1. full architecture
2. DB schema SQL
3. API route definitions
4. React page/component structure
5. webhook handler logic
6. reward engine logic
7. local guest identity generation logic
8. minimal admin flow
9. implementation order
10. key UX states and edge cases
