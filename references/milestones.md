# Hope Milestones · v2.0

Hope follows a person through a job hunt. It does not push jobs through a pipeline. Each step below is something the user gets done, at their own pace. They can skip a step, repeat it, or come back to it later.

There are ten skills. The first time through, they usually run in this order:

**Start → Onboarding → Portfolio & résumé → Publish → Find jobs → Apply → Write → Interview → Sync → Tracker**

Onboarding to Publish set the user up, once. Find jobs to Tracker run every day and every week of the hunt. Start is the front door to all of them.

Every skill ends the same way: one dated line in `user-story.md`. File shapes are in `references/hunt-folder.md`.

---

## The steps

### Start (`hope-start`)
- **When it runs:** at the start of any session, or when the user says "where am I?" or "let's do today's hunt".
- **What it makes:** no new files. It reads `WORKING-PAD.md` first, then the rest of the hunt folder, and gives a short report of where the user stands and the next step. It also runs the daily rhythm below.
- **The user controls:** which step comes next.
- **Done when:** the user knows where they stand and has picked the next step.

### Onboarding (`hope-onboarding`)
- **When it runs:** the first time, or when the user says "let's start over". Users coming from Hope 1.5 run it once more to get the profile and the hunt folder.
- **What it makes:** `career-graph/career.json` and `user-story.md`. Then `applications/_common/profile.md`, `applications/_common/my-voice.md`, `HUNT-PROTOCOL.md`, an empty `job-tracker.xlsx`, and the protective `.gitignore`. `WORKING-PAD.md` appears later, the first time work is interrupted.
- **The user controls:** every answer in `profile.md`. They type or confirm each one. Hope never guesses work authorization, pay rules or self-identification answers.
- **Done when:** the career file is built, every section of `profile.md` has an answer or a `TODO (ask <name>)`, and `HUNT-PROTOCOL.md` and `job-tracker.xlsx` exist.

### Portfolio & résumé (`hope-portfolio`)
- **When it runs:** after onboarding, and whenever the user wants to show new work.
- **What it makes:** a portfolio build in `career-graph/documents/portfolios/<build>/`, and the one résumé at `applications/_common/resume.pdf`.
- **The user controls:** what is featured, every word, the look. Hope asks before removing any true claim.
- **Done when:** the user has approved the portfolio and the résumé is exported.

### Publish (`hope-publish`)
- **When it runs:** when the user wants a link to share.
- **What it makes:** a live link. Only the allow-listed portfolio files leave the machine.
- **The user controls:** whether it goes live, and where. They review it locally first.
- **Done when:** the link loads and shows the latest build.

### Find jobs (`hope-discovery`)
- **When it runs:** during an active hunt, a daily "new since yesterday" sweep; a wider sweep weekly; or whenever the user asks for roles.
- **What it makes:** `applications/_research/shortlist-<YYYY-MM-DD>.md`, which says how the search was done and what it could not see. The first time, also `applications/_research/boards.txt`.
- **The user controls:** the rules the search follows (titles, places, pay screen, per-company cap), and which roles go into the tracker.
- **Done when:** the user has the shortlist, and the roles they picked are tracker rows marked `Shortlisted`.

### Apply (`hope-application`)
- **When it runs:** when the user hands Hope a job link.
- **What it makes:** the role folder `applications/<company>-<role words>/` with `JD.md`, `APPLICATION-ANSWERS.md` and the résumé copy. The form filled with real keystrokes. A tracker row marked `Ready to apply`.
- **The user controls:** submitting, every legal checkbox, every answer not on file, and the final review. Hope never submits, unless the user says "submit it" for this application in this session.
- **Done when:** every field is filled or listed under "Left for the user", every value has been read back, and the tracker row is updated.

### Write (`hope-write`)
- **When it runs:** whenever something needs writing in the user's voice: a reply, a cover letter, a form answer, a nudge.
- **What it makes:** a draft file in the role folder (`email-draft-<who>-<date>.md`, `dm-draft-<who>-<date>.md`, or `cover-letter.md`). After the user edits a draft, a new pattern in `my-voice.md`.
- **The user controls:** every word, and sending. Hope never sends.
- **Done when:** the draft is saved with its header and passes the checklist in `references/writing-rules.md`.

### Interview (`hope-interview`)
- **When it runs:** the moment a call is known, and again after the call.
- **What it makes:** before the call, the record reminder, the calendar event and `INTERVIEW-PREP.md`. After it, the transcript, the debrief, a follow-up draft and a tracker note.
- **The user controls:** recording (and asking consent where needed), what they say, and sending the follow-up.
- **Done when:** before the call, the reminder is set and the prep file is saved. After it, the transcript and debrief are saved and the tracker is updated.

### Sync (`hope-sync`)
- **When it runs:** every morning, again whenever the user checks in during an active hunt, or when the user asks "what's new?".
- **What it makes:** tracker updates from email and LinkedIn, both read-only, backed up first. A short report.
- **The user controls:** every reply. Hope drafts; the user sends. Hope never sends, archives or deletes anything.
- **Done when:** every new item is matched to a tracker row and the user has the report.

### Tracker (`hope-tracker`)
- **When it runs:** "where do I stand?", "what needs me?", and the weekly review.
- **What it makes:** answers from `job-tracker.xlsx`, the one live log, which the user owns.
- **The user controls:** the workbook is theirs. Hope asks before changing anything the user wrote.
- **Done when:** the user knows what needs them, and every live row has a next action.

---

## The daily rhythm

**A call in the next hour outranks everything.** Prep it first, move other work to the background, and say so. Write the paused work into `WORKING-PAD.md` before switching.

**Every morning:**

1. Sync: read email and LinkedIn, update the tracker.
2. Write: anything new that needs a reply gets a draft.
3. Apply: new links the user found get filled. The user sends.
4. Interview: any new call gets the record reminder and a prep file.

**During the day, in an active hunt:**

1. Offer Sync again whenever the user checks in. The real hunt ran it a few times a day.
2. Offer a daily "new since yesterday" sweep (Find jobs).

**Every week:**

1. Tracker: the report. What moved, what is stuck, what needs the user.
2. Find jobs: a wider sweep.
3. Protocol review: what did the user correct this week, and is each correction written down in `HUNT-PROTOCOL.md`?

## What you can skip or repeat

- **Skip Publish:** send the résumé PDF instead of a link.
- **Skip Portfolio:** bring your own résumé and save it as `applications/_common/resume.pdf`.
- **Skip Find jobs:** bring your own links straight to Apply.
- **Repeat Onboarding (the profile part)** whenever something changes: a new city, a new pay rule, a new kind of role.
- **Repeat Interview** for every round. **Write** any time. **Sync** every day. **Tracker** any time.
- **Come back after a break:** run Start. It reads the folder and says where things stand.

## Retired in 2.0

`skill-gap`, `proof-projects` and `dashboard` moved to `skills-roadmap/retired/`. The real hunt never used them. The honest-fit note in Apply and the tracker replaced them.
