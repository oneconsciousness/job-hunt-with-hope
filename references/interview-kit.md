# Interview kit · before, during and after every call

This file holds everything the `hope-interview` skill needs. The `hope-sync` and `hope-application` skills reuse section 1 (record every call).
Every rule here came from real recorded calls. Examples use the fixture persona Jane Doe.
Dates inside these files are written `14 Oct 2026` (`<D Mon YYYY>` in the templates). File names and script flags use `YYYY-MM-DD` (`references/hunt-folder.md` section 3).

## Contents

| # | Section | Read it when |
|---|---|---|
| 1 | [Record every call](#1-record-every-call) | The moment a call is known |
| 2 | [Pre-interview checklist](#2-pre-interview-checklist) | Building the prep file, and in the ten minutes before the call |
| 3 | [Customer-facing sutras](#3-customer-facing-sutras) | The role faces customers, clients or stakeholders; and in every debrief |
| 4 | [Translation dictionary](#4-translation-dictionary) | Prepping for questions; reading a transcript for missed meaning |
| 5 | [The prep file: INTERVIEW-PREP.md](#5-the-prep-file-interview-prepmd) | Before any call: the live-call sheet, company brief, recap of earlier calls, comp-call page |
| 6 | [The debrief: debrief-who-date.md](#6-the-debrief-debrief-who-datemd) | After any call, once the recording is in |
| 7 | [The stories file: interview-stories.md](#7-the-stories-file-interview-storiesmd) | Building depth behind résumé bullets; "difficult customer" questions |
| 8 | [The question bank: question-bank.md](#8-the-question-bank-question-bankmd) | After every debrief; when picking likely questions for prep |

---

## 1. Record every call

A recap from memory is smoothed. It keeps what the user thinks they said and loses the filler, the trailing off, and the words they reached for and missed.
The value of a debrief comes from the raw version. So every call is recorded, and Hope reviews the recording, not a recap.

### A call in the next hour outranks everything

1. Say so in one line, and move other work to the background.
2. Write what is paused, and exactly where to resume, in `WORKING-PAD.md`.
3. Give the record line and the live-call sheet (section 5) first. Everything else waits until after the call.

### When a call is scheduled

A call counts as scheduled when it appears in an email, a calendar invite, or the user says so. Then:

1. **Say it in the same reply, near the top, as one line:** "Record this one. Start Voice Memos before you join."
   Not a footnote at the end of a long answer. Any recorder app works; Voice Memos is the example.
2. **Create the reminder event.**
   - Title: `🔴 RECORD THE CALL - <Company> / <Person> in 10 min`
   - Starts 10 minutes before the call. Lasts 10 minutes. Shown as free, not busy.
   - Popup alarms at 10 minutes and at 0 minutes.
   - Description: the brief (template below).
3. **Create the call itself** if it is not already on the calendar. Title: `<Company> - <round> with <Person>`. Popup alarms at 60 and 15 minutes.
4. **Prep blocks, only if the user asks.** Give each a focus line, not just "prep". Example: `Prep: Acme - say the three beats out loud, twice`.
5. **Add the consent note** to the brief (see "Consent" below).
6. **No calendar tool?** Write an `.ics` file with `scripts/make_ics.py` and tell the user to double-click it. The description file is `INTERVIEW-PREP.md` itself: its top holds the round line and the live-call sheet. Example (start time is the user's local clock time, with no zone; `$PLUGIN_ROOT` is the plugin folder, set by the skill's "Before you start" block):
   ```
   python3 "$PLUGIN_ROOT/scripts/make_ics.py" --title "🔴 RECORD THE CALL - Acme Design Systems / Sam Lee in 10 min" --start "2026-10-02T10:50" --minutes 10 --alarm 10 --alarm 0 --free --description-file applications/acme-senior-product-designer/INTERVIEW-PREP.md --out applications/acme-senior-product-designer/record-reminder-2026-10-02.ics
   ```
   `--free` shows the reminder as free, not busy. Each `--alarm` is minutes before the start; `0` is at the start.
7. **Repeat the record line in the last message before the call.** That is the one the user will actually see.

Three cases that come up:

- **The time is not fixed yet** ("let's find a time next week"). Say the record line now. Create the events once the time is confirmed.
- **Dates and time zones.** Check today's date and weekday before writing "today", "tomorrow" or a day name. Give every call time in the user's time zone. Use the zone written in the invite or email to convert. If none is given, ask the user. Never assume.
- **No prep file yet.** Fill the brief with what you have. Keep the `Full prep:` line, and update the event description once the prep file is written.

**Calendar rules:** use whatever calendar tool the host has. Never add attendees. Never send invites. If the tool asks whether to notify guests, choose none.

**Check:** read the events back from the calendar (or open the `.ics` text). Confirm the title, the start time (10 minutes before the call), both alarms, and the consent note.

### The brief (the reminder's description)

```
Round: <recruiter screen / hiring manager / panel / technical>, <length>. This call decides: <one line>.
Three beats: 1) <...> 2) <...> 3) <...>
Have ready: the résumé as sent, the one comp number, the two questions, water.
Ask: 1) <question about their problem> 2) <question about their problem>
Already settled (do not reopen): <comp stated / location / work authorization / start date>
Consent: <Person> may be in <state or country>. <Ask first, or record only your side.>
Full prep: applications/<slug>/INTERVIEW-PREP.md
```

### Consent

Recording laws differ by place. In the US, some states need everyone on the call to agree (all-party consent). Others need only one person, which can be the user.

All-party US states include: California, Connecticut, Delaware, Florida, Illinois, Maryland, Massachusetts, Michigan, Montana, Nevada, New Hampshire, Oregon, Pennsylvania, Washington.

Clues to where the other person is: their email signature, the invite's time zone, the company's head office in `JD.md`.

1. If the other person may be in one of these states, or you do not know where they are, the user asks first. One line works: "Do you mind if I record this so I can take proper notes?"
2. If the user would rather not ask, they record only their own side (for example, a headset mic into Voice Memos with the call audio not captured).
3. Outside the US, check the country's rule. When unsure, ask first.

This is background, not legal advice. The user decides.

### After the call

1. **Ask for the recording file.** A recap from memory is not a substitute. Save it as `applications/<company>-<role-slug>/recording.<ext>`. If that file is already there from an earlier call, never overwrite it: name the new one `recording-<YYYY-MM-DD>-<who>.<ext>`.
2. **Transcribe it locally:**
   ```
   python3 "$PLUGIN_ROOT/scripts/transcribe.py" "applications/<slug>/<recording file>" --out "applications/<slug>/transcript-<YYYY-MM-DD>-<who>.txt"
   ```
   `<recording file>` is `recording.<ext>`, or `recording-<YYYY-MM-DD>-<who>.<ext>` for a later call (step 1).
   The script uses faster-whisper, model `small.en`, int8, beam size 5, with the VAD (silence) filter on. It writes one `[mm:ss] text` block about every 30 seconds. It does not label speakers: Hope notes the speaker where it is obvious from the flow of the conversation, and writes "speaker unclear" otherwise (section 6, rule 3).
   If faster-whisper is not installed, the script prints the install line and exits 2. The fallback is to ask the user to paste a transcript from their meeting tool or phone.
3. **Names in a transcript are machine-spelled.** Never copy a name from a transcript into a document or an email until you have checked it against an email signature, the invite or the user.
4. **Write the debrief** (section 6).

---

## 2. Pre-interview checklist

Read this in the ten minutes before any call. Every item is a mistake made on a real recorded call, not a generic tip.

### 2.1 The question behind the question

A question is asked in plain words. The plain answer often misses what is being tested. The literal answer is usually the wrong one.

| They ask | What it is really testing | What a good answer does |
|---|---|---|
| "What's drawing you to a new role now?" | Why this company. The highest-signal question a recruiter asks. | Lead with them. Money goes second and short, if at all. |
| "Tell me about yourself" | What you want them to remember from the first 60 seconds. | Three beats, decided in advance. Not your life in order. |
| "Walk me through a project" | Whether you pick the relevant one. | Match the story to their product and their buyer. |
| "How hands-on are you?" | Whether you can still do the work. | A number plus evidence. Never "I don't really do that any more." |
| "Any concerns about the role?" | Whether you raise problems early or let them surface late. | Name one real thing, then how you would handle it. |
| "What's your timeline?" | Their runway, and whether to fight for you. | Answer plainly. The one place a real deadline helps. |
| "Do you have other offers?" | Same, and whether you are honest. | True, brief, no list of companies. |
| "What questions do you have?" | Whether you understand the job. | Two questions about their problem. Not perks, not process. |
| "Would you consider a different role?" | Often a soft no for the one you applied to. | Ask what changed before you answer. |
| Silence after you say your number | Whether you will negotiate against yourself. | Say nothing. If you must break it, break it with a question. |

### 2.2 Sentences that cost money

These are patterns, not quotes. Each one has cost a real candidate a round or a number.

| Pattern | Sounds like | Say instead |
|---|---|---|
| Shrinking your own hands-on work | "I didn't really build it myself." | What you own: "I owned the interaction model and reviewed every build. Two engineers built it with me." |
| Calling their exercise or process unrealistic | "Two hours isn't realistic for this." | Do the exercise. Then: "With more time, I'd add X." |
| Leading "why are you looking" with money | "Honestly, I'm underpaid." | The work first. Money second, short, and only if asked. |
| Correcting their words | "I didn't say X." | "Yes, exactly that." Then answer. (Sutra 1.) |
| Reaching for a word you are not sure of | A made-up or half-right word under pressure. | The plain word you are sure of. |
| Asking about their timeline, especially twice | "Does that work with your timelines?" | Do not ask. See 2.3. |
| An unasked disclaimer | "I should say I've never owned X." | Answer the question asked. Disclose only hard gates. An unasked disclaimer turns a silence into an admission. |

### 2.3 The timeline rule

Before you ask "can you move fast for me?", the answer is an unexamined assumption in your favor. They are already spending time on you. That is the answer.

After you ask, it becomes an open item they must decide. The safe answer for a recruiter who has not yet spoken to the hiring manager is always "let me check."
You turned a non-issue into a gate. Asked once, it is information gathering. Asked twice in one call, it sounds like anxiety. In a customer-facing role, that is the trait being screened for.

**When it is right to raise a date:** you have a real competing offer with a real deadline. Raise it once, to the person who can act on it, as information, not a request:

> "I want to flag that I have a decision to make by the 5th. If there is anything you need from me to move faster, tell me now and I will get it to you today."

That gives them an action. "Does that work for you?" gives them a decision. And a deadline you are willing to move is not one to defend in an interview.

### 2.4 Front-load your own disqualifiers, with agencies especially

A direct application captures work authorization on the form, so the employer knows before anyone speaks.
A cold agency recruiter knows nothing, and their incentive is to get you on a call, not to pre-qualify you. So do it for them, in writing, in your first reply.

Say the thing that can end it before you spend an hour on the things that cannot. Examples:

- Work authorization (only if `profile.md` says it needs a transfer or sponsorship): "...and I'm on a <status> that would need a transfer." See `references/visa-and-sponsorship.md`.
- Travel: "...and I can travel up to 25%, not more." (Jane Doe's real limit, from her profile.)
- Relocation limits, a hard start date, a pay floor.

It costs nothing and reads as senior, not apologetic. Never put these in a cold cover letter to an employer.

### 2.5 Sixty seconds before you join

- [ ] The one project you will lead with, matched to this company.
- [ ] The "why us" answer. One sentence. Not about money.
- [ ] What is already settled (pay stated, location, work authorization, start date), so you do not reopen it.
- [ ] Two questions written down, about their problem.
- [ ] Recording on. Consent asked if the other person may be in an all-party state.
- [ ] Technical round: AI autocomplete and coding assistants off, unless the round allows them.
- [ ] Sharing a screen or a folder: close the tracker, prep notes, other role folders and other companies' tabs. Nothing from the rest of the hunt reaches an employer.

### 2.6 During: three habits

1. **Pause before answering.** Two seconds is invisible to them. It is where you catch the question behind the question. Speed is not scored. Relevance is.
2. **Say your reasoning, not just your conclusion.** In technical and case rounds, most of what is scored is what you say out loud.
3. **Answer, then stop.** The most common failure is the second paragraph. A 30-minute call has room for about four real answers. Long ones cost you two of them.

### 2.7 After

- [ ] Send the recording file to Hope (section 1, "After the call").
- [ ] Follow-up note the same day, while you are still specific. Hope drafts it with `hope-write`; the user sends.
- [ ] Log the outcome and one lesson in `job-tracker.xlsx` (`scripts/tracker.py update`).
- [ ] If rejected, ask one specific question: "Which round was weakest, and was it the work or how I explained it?" Not "any feedback?"

---

## 3. Customer-facing sutras

For any role that faces customers, clients or stakeholders: forward-deployed, solutions, consulting, client services, design partner roles. Interviews test the same skill.

**The finding in one line:** almost every fix is a deletion, not an addition. The strong habit is usually already there. The weak version sits right next to it and shows up under pressure.

### 3.1 What credibility is made of

The listener often cannot judge the work itself. They judge whether to believe the person describing it. Credibility has five parts:

1. **Calibration:** saying "I don't know" when you don't, so "I know" carries weight.
2. **Consequence framing:** turning technical facts into what happens to them.
3. **Economy:** the shortest true answer. Length reads as doubt.
4. **Composure:** not rattled, not apologizing for taking up time.
5. **Ownership language:** "I'll have that by Thursday," not "that should be possible."

Builders optimize for correctness and craft. Buyers and executives optimize for value and risk. The person who does not translate between the two is not being rigorous. They are being unhelpful.

### 3.2 Four common gaps, and how to spot them on a transcript

| Gap | What it looks like | How to spot it in a transcript | Cost |
|---|---|---|---|
| Precision compulsion | Correcting small details instead of answering | "I didn't say...", "Actually, it's called..." | Each correction is a small withdrawal. People stop using their own words, and you stop learning what they need. |
| Completeness compulsion | Covering every angle of a question | More than two topics in one answer; the other person closes with "we're about out of time" | They cannot tell which part mattered, so none of it does. |
| Confidence outrunning evidence | Unsourced numbers said in the same voice as solid ones | Any number not in the canon in `HUNT-PROTOCOL.md` | When one turns out wrong, they discount all of it. The most dangerous gap, because the speaker cannot hear it. |
| Pre-emptive apology | "If that makes sense", "sorry", "kind of", "sort of" on statements that need no hedge | Count them per call | It hands the work of understanding to the listener and signals you are unsure. |

In a debrief, count the filler phrases and put the counts in a small table. A number makes the habit visible.

### 3.3 Dos and don'ts

| Don't | Do |
|---|---|
| Correct their vocabulary | Answer the question they meant |
| End on "if that makes sense" | End on silence, or "I'll pause there" |
| Answer every part of a question | Answer the part they asked, then offer the rest |
| State an uncertain thing in a certain voice | "I think it's about X. I'd want to check." |
| Apologize for taking time to think | Take the time. Silence is fine. |
| Explain what it does | Explain what it costs them when it fails |
| Say "we could do X, Y or Z" | "I'd do X. Here's what would change my mind." |
| Describe a third party | Say nothing about companies not in the room |
| Push on when they look lost | "I think I'm losing you. Want me to back up?" |
| Say "that should be possible" | "I'll have an answer by Thursday." |

### 3.4 The eight sutras

Short enough to hold under pressure.

1. **Answer the question they meant, not the words they used.** If you know what they mean, that is the question.
2. **Answer, then stop.** The silence after a complete answer belongs to them. Do not fill it.
3. **Delete "if that makes sense."** Replace it with nothing. For a real check, use the strong form: "I'll pause there. Where do you want me to go deeper?"
4. **Say the number you have, not the number you want.** "Twelve product teams," not "the whole company." The smaller true number makes every other number believable.
5. **Speak in consequence, not in feature.** Not "semantic tokens with theme aliases." Instead: "When the brand color changes, it changes in one place, and no screen ships with the old one."
6. **"I don't know" is a credibility deposit.** Say it once, early and cheaply, and everything you do claim gets stronger. Follow it with how you would find out.
7. **Their vocabulary beats yours.** Find what they already understand and build the bridge from there.
8. **Never make a third party smaller.** No digs at competitors, no naming other companies you are talking to, no "that's pure marketing." The room notices what you say about people who are not in it.

### 3.5 Scripts

| Moment | Say |
|---|---|
| They describe your work in the wrong words | "Yes, exactly that." Then answer. Do not fix the words. |
| You do not know | "I don't know that yet. Here's how I'd find out, and here's what I'd do in the meantime." |
| They look lost | "I think I'm going too deep. Want the one-sentence version?" |
| They ask how well it performs | "What would you want it to be?" Then show it in the terms they already use. |
| You are about to give three options | "I'd do X. What would change my mind is Y." |
| You catch yourself starting a second topic | Stop. "That's the main thing. There's a second angle if it's useful." |
| The demo breaks | "That's a real bug and I'm glad you saw it. Here's what's happening, and here's a recording of it working while I fix it." |

**The one line:** you are not being scored on being right. You are being scored on being useful.

---

## 4. Translation dictionary

Sutra 1, expanded: answer the question they meant, not the words they used. The fix for indirect questions is not to become less direct. It is to know the aliases, so indirection stops costing time.

### 4.1 Why people are indirect

| Reason | Looks like | What to do |
|---|---|---|
| Saving face | "Help me understand..." / "Have you considered..." | They disagree. Defend or concede. Do not explain harder. |
| Hierarchy | A vague question in front of their boss | Answer the safe version. Offer detail after. |
| No vocabulary | An approximate word for your thing | Accept their word. Use it from then on. |
| A deliberate test | A broad, underspecified question | The vagueness is the test. Ask a clarifying question first. |
| An unformed thought | A rambling question with no clear ask | They do not know yet. Help them find it. That is discovery. |

The last row matters most. Often there is no hidden meaning: they have not thought it through. Your job is to help them find their own requirement, not to decode a riddle alone.

### 4.2 The general-purpose move

When a word is unfamiliar or the question feels off: **take the meaning that makes their question sensible, answer that, and offer to redirect.**

> "I'll take that as X. Tell me if you meant something else."

Then answer. Never stop the conversation to negotiate vocabulary. A right guess costs nothing. A wrong guess costs eight seconds.

What it replaces:
- "I didn't say that."
- "Could you tell me exactly what you're asking?"
- "Is that what you're asking?" (guessing without committing)

### 4.3 Aliases: words for things you already know

**General business and tech**

| They say | They mean |
|---|---|
| the labs / frontier labs / model providers | the companies that train the large AI models |
| the business | everyone who is not engineering |
| table stakes | the minimum to be considered |
| lift / heavy lift | effort / a lot of effort |
| shift left | do it earlier in the process |
| day-2 operations | running it after launch |
| time to value | how fast they see a benefit |
| stickiness | do people keep using it |
| single pane of glass | one dashboard for everything |
| greenfield / brownfield | a new build / an existing system |
| boil the ocean | the scope is too big |
| in the weeds / up-level | too much detail / make it strategic |
| 30,000-foot view | the summary |
| double-click on that | go deeper on that |
| socialize it | get informal buy-in before proposing |
| swim lane | the boundary between teams' scopes |
| the ask | what you want from them |

**Pre-sales and commercial**

| They say | They mean |
|---|---|
| technical win | they accept it works, before any money moves |
| POC / pilot / POV | proof of concept / limited live trial / proof of value |
| bake-off | a head-to-head test against a rival |
| land and expand | start small in one team, then grow the account |
| champion | the person inside who sells for you when you are not there |
| economic buyer | whoever signs |
| decision criteria | how they will judge it |
| what does good look like | define success, with a number they agree to |
| non-functional requirements | speed, uptime, security, compliance, scale |
| blockers / headwinds | problems |
| procurement / security review / InfoSec | the long approval step that kills deals |
| scope creep | they keep adding things |
| mutual action plan | a written who-does-what-by-when |

### 4.4 Intent map: what the question is really assessing

**Interview questions**

| They ask | They are assessing |
|---|---|
| "Tell me about yourself" | Give me the frame for reading your résumé, in 90 seconds. |
| "How many people did that reach?" | Is your number real? |
| "What makes a successful pilot?" | Have you run one, or only built things? |
| "A project stalls. What do you do?" | Do you have business instincts, or only craft instincts? |
| "Where is the field going?" | Do you have a point of view, and can you be brief? |
| "Which project was most successful?" | How do you define success? |
| "Walk me through how you'd debug X" | Do you have a method, or do you flail? |
| "Why are you leaving?" | Are you running from something? |
| "Tell me about a difficult customer" | Can you be wrong without it becoming a crisis? (See 7.3.) |
| "What would you do differently?" | Self-awareness. Not an invitation to apologize. |
| "Any questions for us?" | What do you actually care about? |
| "Help me understand why you chose X" | I think X is wrong. Defend it. |
| "Have you considered Y?" | You should have considered Y. |
| "That's interesting." (flat) | I'm not convinced. |
| "How would you handle changed requirements?" | Are you rigid? |

**Customer and stakeholder questions**

| They ask | They mean |
|---|---|
| "Can it do X?" | I have a use case I haven't told you about. Ask what X is for. |
| "How long would this take?" | My boss has asked me for a date. |
| "Is it secure?" | My security team will block this and I need answers for them. |
| "We tried something like this before." | We got burned. Tell me why yours is different. |
| "Let me check with the team." | I'm not the decision maker, or I'm not convinced. |
| "This is really interesting." | Polite. Not committed. |
| "What does it cost?" | I'm deciding whether to spend my own credibility on this. |
| "Can we start with something small?" | Lowering risk, or no budget yet. |
| "Who else uses this?" | I don't want to be first. |
| "What happens if it gets it wrong?" | I'm picturing explaining it to my boss. Answer with the fallback and who handles it, not with an accuracy number. |

### 4.5 Real-time tells that you missed the point

You do not need to detect subtext in advance. You need to notice the correction signal. Each of these means you answered a different question:

1. They rephrase their own question. (The strongest signal.)
2. They apologize: "sorry", "maybe I wasn't clear", "maybe I misunderstood."
3. They ask the same thing a second way.
4. They narrow it: "specifically, I mean..."
5. "Sure, sure" and a change of topic. They gave up.
6. Silence after your answer. They are not satisfied.

**The recovery line, once you notice:**

> "I think I answered a different question. Let me try again."

That one sentence turns the miss into a display of listening.

### 4.6 The short version

- Unfamiliar word: take the meaning that makes their sentence sensible, answer it, offer to redirect.
- Flat or broad question: it tests what you do with ambiguity. Ask first.
- They apologize: they are being polite about your miss. Reset at once.
- It rambles: there is no hidden meaning yet. Help them form the thought.

---

## 5. The prep file: INTERVIEW-PREP.md

One file per role: `applications/<company>-<role-slug>/INTERVIEW-PREP.md`. It covers every round with that company, organized by round, with the same look for every company.

**How the file is kept:**

1. It starts with the posting link and the role folder path. Always.
2. Update it in place, in the right section. Never append a second copy of a section.
3. When a round is over, remove that round's live-call sheet. What happened goes in the debrief (section 6).
4. The live-call sheet fits on one screen. The user cannot scroll during a call.

### 5.1 Rules for filling it

1. **Keywords, not scripts.** The live-call sheet holds keyword bullets the user can glance at. The user forms the sentences. Never write paragraphs for the user to read aloud.
2. **One screen, two columns.** A table with "Question" and "Keywords". Keep each cell short (aim for under ten words), so the user can zoom in and still see the whole table. Add nothing the user did not ask for.
3. **Evidence comes from the record.** The career file, the canon in `HUNT-PROTOCOL.md`, `applications/_common/interview-stories.md`, or the user's words. Never invent.
4. **Fact-check the user's own talking points.** Check every number and claim the user plans to say against the canon. Flag anything not on file (sutra 4).
5. **Pitch technical prep at the depth people speak in the room:** decisions and trade-offs, not benchmark trivia.
6. **Each gap gets a primer and one true line.** A short plain primer on what the JD term means (two or three lines). Then one true adjacent-experience line, in keywords. Never hide a gap. Never claim work that is not the user's.
7. **Questions to ask are specific to this person and this company.** Model them on the user's own best past questions (from `question-bank.md`, section 8). Offer three or four as options with the question tool (voice guide rule 6); the user picks two. No generic questions such as "what does success look like?"
8. **Keep the story the same.** Read "What you have told them" in `APPLICATION-ANSWERS.md` first. The "Keep the same" row on the sheet must match it.
9. **Outside facts are looked up fresh.** The company description, customers, news and how the company interviews are researched now, dated, with a source link. Never from memory. Check the brief against `JD.md` before handing it over.
10. **Likely questions come from `question-bank.md` first.** Add the follow-ups the user's own talking points will trigger. If the user will say "37%", expect "37% of what, measured how?"
11. **Pay is one number** from `profile.md` section 3. For a call about pay or an offer, build the comp-call page (5.4).
12. **Before a follow-up call with the same company,** add the recap of earlier calls (5.3).

### 5.2 Template

```
# <Company> - <Role> · interview prep

**Posting:** <url> · **Folder:** applications/<slug>/
**Band:** <published band or "not published"> · **Location:** <...> · **Updated:** <D Mon YYYY>

## Round: <round name> · <D Mon YYYY> (<weekday>), <start-end time and zone>, or "not booked yet" · <length> · with <Person, title>
**Decides:** <one line>. **Record:** reminder set (`🔴 RECORD THE CALL - <Company> / <Person> in 10 min`). Consent: <note>.

### Live-call sheet
| Question | Keywords |
|---|---|
| Tell me about yourself | <beat 1> · <beat 2> · <beat 3> |
| Why now / why us | <about them and the work, not money> |
| Walk me through a project | <story name> · <one number> |
| <likely question from the bank> | <keywords> |
| <gap question> | <true adjacent keywords> |
| Pay, if asked | <one number>. Stop. |
| Keep the same | <location> · <start date> · <work authorization> · <other processes> |
| Ask them | 1) <picked question> 2) <picked question> |

## Company brief
- **In their words:** "<their own one-line description>" (<source link>, read <date>)
- **Customers:** <who buys>
- **What they buy, and why:** <the problem it solves for them>
- **Latest news:** <dated item, with link>
- **This role in that relationship:** <what this person does for those customers>

## Overlap: what the JD asks, and the evidence
| JD asks (their words) | Evidence |
|---|---|

## Gaps: primer and the true line
### <Gap>
**What it is:** <two or three plain lines>.
**Adjacent, true:** <keywords>.

## Questions to ask (options)
1. <...> 2. <...> 3. <...>   (the user picks two; they go on the sheet)

## Recap of earlier calls (follow-up calls only)
## Comp call (calls about pay or an offer only)
```

### 5.3 Recap of earlier calls

Before a follow-up call with the same company, build a short recap from the recordings, not from memory.

1. Read every transcript with this company.
2. Pull the facts exchanged and the process they described.
3. Group the lines by topic: the team, the process, pay, logistics, open questions.
4. Write them as a play script: speaker, timestamp, their words. Put key phrases in bold.
5. Keep it to one screen. If the user wants the full transcript, offer it as markdown with speakers labelled and key phrases in bold.

```
**The process**
SAM (22:40): "No take-home. We do a **portfolio review** instead."
**Pay**
JANE (16:05): "**around 190**." (The form says 195000. See "What you have told them".)
```

### 5.4 The comp-call page

For a call about pay or an offer. One page, in `INTERVIEW-PREP.md` under "Comp call".
Pay stays out of writing until the call: no numbers and no negotiation plans in emails or messages. (A form field that asks for pay still gets the number from `profile.md`; see `references/ats-playbook.md` General rule 15.)

1. **The numbers on file:** the floor, the ask and the ATS value from `profile.md` section 3. What was already said, from "What you have told them".
2. **An "if they say, you say" table.** Fill it from the numbers on file. Never invent a number. This table is the one place where full lines are fine: in a pay talk, the exact words matter.

| If they say | You say |
|---|---|
| "What are you looking for?" | "<ask>." Then stop. |
| An offer inside the band, below the ask | "Thank you. I was looking at <ask>. Is there room to get there?" Then silence. |
| An offer below the floor | "Thank you. That is below what I can move for. What flexibility is there on base?" Do not accept or refuse on the call. |
| "That's the top of the band." | "Understood. What else can move: sign-on, equity, level, start date?" |
| "We need an answer by <day>." | "Thank you. I'll come back to you by <day>." Nothing more. |
| Silence after your number | Say nothing. If you must break it, ask a question. |
| "Do you have other offers?" | True and brief. No list of companies. Never cite an offer that has lapsed or does not exist. |

3. **Take-home estimate for the state.** Base pay minus federal tax, the tax of the state the user will live and work in, and payroll taxes, per month. Label it an estimate, with the date and the calculator used. Compare offers in different states on take-home, not on gross.
4. **Benefits from the posting,** copied from `JD.md`: bonus, equity, retirement match, health, time off. Write "not stated" where the posting is silent. Those become questions for the call.
5. **Moving costs,** if the role needs a move: a rough estimate, and whether the posting mentions relocation help.
6. **Do not:** decide on the call, put a number in an email or message before the call, or say "negotiable".

---

## 6. The debrief: debrief-who-date.md

One per call: `applications/<company>-<role-slug>/debrief-<who>-<YYYY-MM-DD>.md`. `<who>` is the person's name exactly as the source gives it, lowercase, with hyphens. Like every file about a role, it starts with the posting link and the role folder path (hard rule 16).
An invite from "Sam Lee" gives `sam-lee`. An email signed only "Pat" gives `pat`. Never expand a name (see `references/hunt-folder.md` section 3).

**Rules for filling it:**

1. **Verdicts only after reading the whole transcript.** Never from the user's recap, and never from a partial read. If the user asks for a quick read first, say it waits for the transcript.
2. **Quote with timestamps** for every claim about what was said.
3. **Right speaker every time.** Machine speaker labels can be wrong. Check them against the flow of the conversation. When unsure, write "speaker unclear".
4. **Names stay unconfirmed** until checked (section 1, "After the call").
5. **Three verdict words only:** Strong, Weak, Missed. Each gets one line saying why.
6. **Every fix uses true details on file.** If the better answer needs a story that is not on file, add an "Open - needs <user>" row to `interview-stories.md`. Never invent one.
7. **Explain what the user agreed to but may not have followed:** a term, a process step, an assessment format. Plain words, two or three lines each.
8. **The consistency check** compares the call with "What you have told them" in `APPLICATION-ANSWERS.md`. Any mismatch gets an action.
9. **Feed the other files:**
   - Add what the user said on the call (reason for leaving, other processes, location, timing, pay) to "What you have told them", one line: `<D Mon YYYY> · call with <Person> · said: <...>`. It must be true. If an earlier line is no longer true, add a new dated line with the true state; never keep repeating a lapsed claim.
   - Add every question they asked to `applications/_common/question-bank.md`, and the user's self-introduction to its drift check (section 8).
   - Update `job-tracker.xlsx` with `scripts/tracker.py update`: status, next action, and a note. Pass the call date with `--date YYYY-MM-DD`. Never type a date into the note text; the script writes it.
   - Remove the finished round's live-call sheet from `INTERVIEW-PREP.md`.

**Template:**

```
# Debrief - <Company> <round> with <Person> · <D Mon YYYY> (<weekday>, <length>)

**Posting:** <url> · **Folder:** applications/<slug>/
<Person, title (spelling checked against <source> / unconfirmed)>. <Role>, <req id>.
Recording: `<recording file>` · Transcript: `transcript-<YYYY-MM-DD>-<who>.txt` (faster-whisper small.en, local).

**Outcome:** <one line, e.g. "Moving to the hiring manager round" or "No decision on the call">.

## What happened
- (<mm:ss>) <Point, with a short quote and the right speaker.>

## The process they described
1. <Step, length, who.>
- Timeline: <what they said>.

## Question by question
| # | Question (their words) | Verdict | Why |
|---|---|---|---|
| 1 | ... | Strong / Weak / Missed | <one line> |

## What worked (keep doing it)
- ...

## Fix before <the next round, by name, e.g. "the hiring manager round">
1. **<Question or habit>:** <the better answer, as keywords, true details only>.

## Things you agreed to, explained
- **<term or step>:** <two or three plain lines>.

## Tape counts
| Phrase | Count |
|---|---|
| "kind of" / "sort of" | <n> |

## Consistency check: what you have told them
| Topic | Told them before (form, emails, calls) | Said on this call | Match? |
|---|---|---|---|
| Pay | ... | ... | Yes / No: <action> |
| Location | ... | ... | ... |
| Start date | ... | ... | ... |
| Work authorization | ... | ... | ... |
| Other processes | ... | ... | ... |

## Next step
- <Who does what, by when.> If nothing by <date>, nudge once (draft with hope-write; the user sends).
- Tracker: `scripts/tracker.py update --match "<Company>" --status "<status>" --next "<next action>" --note "<what happened>" --date <YYYY-MM-DD of the call>`
```

---

## 7. The stories file: interview-stories.md

One file for the whole hunt: `applications/_common/interview-stories.md`. The interview skill builds it over time, in the user's own words.

A résumé bullet is a door. This file is what is behind it. A story is ready when it can survive fifteen minutes of follow-up questions.

### 7.1 How a résumé bullet becomes a story

Ask the user these, one story at a time, and write their answers down. Hope never fills a gap with a guess.

| Part | What goes here | Question to ask the user |
|---|---|---|
| The bullet | The résumé line, verbatim | (copy it) |
| Your role | What you owned, and what others owned | "What was yours, and what was the team's?" |
| The tools | Stack, tools, methods | "What did you build it with?" |
| The problem | Why it mattered, to whom | "What was broken before?" |
| What you did | Concrete steps and decisions | "What did you decide that someone else might not have?" |
| What broke | The hard part, the failure, the surprise | "What went wrong on the way?" |
| What changed | The outcome | "What was different after?" |
| Numbers | Each number with its source | "Where does that number come from?" |
| Do differently | One honest line | "What would you change now?" |
| Answers these questions | The interview questions this story answers well | (Hope fills from the intent map in 4.4) |

Rules:

1. Numbers come from the canon in `HUNT-PROTOCOL.md` or the user's words, with the source written next to them.
2. No client names and no internal project names. Describe the work by what it does.
3. A search of the user's files that finds nothing is evidence about the files, not about the claim. Ask the user before writing "they did not do X."
4. After each debrief, if a question needed a story that is not on file, add it to an "Open - needs <user>" table at the end of the file.

**Template for one story:**

```
## <n>. <Short name of the work> (<employer>, <year>)

**The résumé bullet:** "<verbatim>"
**Role:** <what the user owned>. **Tools:** <...>

### The problem
### What <user> did
### What broke
### What changed (numbers, with sources)
### What <user> would do differently
### Questions this story answers well
- "<question>" -> <which part of the story>
```

### 7.2 Where good stories hide

Systems stories come easily. Stories about people are harder, and interviewers ask for them. Look where something changed someone's control:

- A process the user made faster removed somebody's checkpoint. Who lost it, and how was that handled?
- Senior stakeholders arrived with a fixed idea that would not work. How did the user redirect it?
- Skeptical users did not trust the new thing. What did the user change, and what did they refuse to change?
- A live incident under pressure. Who was upset, and what did the user own?

### 7.3 "Tell me about a difficult customer": what it really tests

It is not about handling rudeness. It is a proxy for four things:

1. Do you stay grounded in the work under social pressure, or agree to whatever ends the meeting?
2. Can you say no to a customer and keep the relationship?
3. Do you see that the customer is usually not wrong, just badly briefed?
4. Do you own the aftermath, or hand it to someone else?

The best answer has a moment where the user disagreed and was proved right, and a cost they paid. A story with no cost sounds invented.

**The structure: four beats, about 90 seconds spoken.**

1. **The situation, in one sentence.** Who they were, what they wanted, why it was hard. No preamble.
2. **The tension, named honestly.** What they wanted versus what was true. Make them reasonable given what they knew, not the villain.
3. **What the user did.** Concrete: what they proposed, built, showed or refused. This is where the craft bar is tested, so it needs real detail.
4. **The outcome, including the cost.** What shipped, and what it cost: a delay, a dropped feature, a hard conversation. Then one line on what the user does differently now.

Do not end on "and they loved it." End on what the user learned about scope, or about when to hold a line.

**If the user has no adversarial story, the honest answer beats an invented one:**

> "I haven't had a customer relationship turn hostile. What I've had a lot of is people who were sure they wanted something that would not have worked. I think that's the more common kind of difficult."

Then go straight into a real example of that. Never invent the anecdote: an invented conflict story falls apart at the first follow-up question.

---

## 8. The question bank: question-bank.md

One file for the whole hunt: `applications/_common/question-bank.md`. The interview skill builds it from every transcript. Prep pulls from it first.

**Rules:**

1. After every debrief, add each question the interviewer asked, in their words, with the company, round, date and timestamp. One table row per question: `| "<question>" | <Company>, <round>, <D Mon YYYY> (<mm:ss>) | <Strong / Weak / Missed> | <keywords> |`.
2. The same question asked again gets a new row. Do not merge rows: the repeats show what this market asks most.
3. The verdict comes from the debrief (Strong, Weak, Missed). "Keywords for next time" holds the better answer as keywords.
4. Prep (section 5) takes likely questions from here, then adds the follow-ups the user's own talking points will trigger.
5. **The drift check.** After each call, add the user's self-introduction (their first 60 seconds) as keywords. Compare it with earlier calls and with the canon.
   A beat that changed on purpose, to fit the company, is fine. A fact that changed (a number, a date, a title, a reason for leaving) is drift. Flag it to the user and fix it before the next call. The canon wins.

**Template:**

```
# Question bank

Every question asked in any interview so far, grouped by category. Built from transcripts. Newest first in each category.

## Opening and motivation
| Question (their words) | Company, round, date (timestamp) | Verdict | Keywords for next time |
|---|---|---|---|
| "<question>" | <Company>, <round>, <D Mon YYYY> (<mm:ss>) | <Strong / Weak / Missed> | <keywords> |

## Your work, in depth
## Craft and technical
## Working with people (stakeholders, customers, conflict)
## Logistics (pay, location, timeline, work authorization)
## Closing (their "any questions?" and what you asked)

## Self-introductions across calls (drift check)
| Date | Company, round | Beats used (keywords) | Matches the canon? | Drift |
|---|---|---|---|---|
| <D Mon YYYY> | <Company>, <round> | <beat 1> · <beat 2> · <beat 3> | <Yes / No: what differs> | <None / what changed> |
```

Every category heading gets the same four-column table, even when it is empty. An empty category keeps its header row and one line under the table: `None asked yet.`
