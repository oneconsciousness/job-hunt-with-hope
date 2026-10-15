# Hope Hunt Protocol Template · v2.0

This is the starting `HUNT-PROTOCOL.md` a new user gets. hope-onboarding copies everything below the line into `<hunt folder>/HUNT-PROTOCOL.md`.

**How onboarding fills it:**

1. Copy everything below the `===` line into `HUNT-PROTOCOL.md` in the hunt folder.
2. Replace `<Name>` with the user's preferred name, and `<D Mon YYYY>` with today's date, written like `14 Oct 2026`. Every date inside this file uses that style.
3. Each table has one row marked `(example)`. It shows the shape, using the test persona Jane Doe. Delete every `(example)` row. Write the user's own rows in its place, or leave the table with its header only.
4. Add the facts the user confirmed during onboarding to section 2, one row each.
5. **Check:** `grep -c "(example)" HUNT-PROTOCOL.md` prints `0`.

Section 6 is not a table. Keep it as written. Its last two lines end in `TODO`: replace each `<...>. TODO` with the user's answer, or leave the line as it is if the user has not said yet.

===

# <Name>'s hunt protocol

> **How Hope uses this file.** This is your rulebook for the job hunt. Hope reads it before it writes, fills or sends you anything.
>
> - When you correct Hope, Hope writes the correction here **the same turn**, dated, in your words. That is how Hope stops repeating a mistake.
> - The canon (section 2) is the single source of truth. If your résumé, portfolio or LinkedIn disagree with it, the canon wins and Hope fixes the other one, after asking you.
> - Hope may add rows to sections 2, 4 and 5. It never deletes or rewords a line you wrote.
> - A fact about the outside world (a company, a law, a tool) goes in only after Hope checks it against a primary source, such as the company's own page. "Verified how" then carries the link and the date.
> - This file stays on your machine. It is never committed or published.
>
> Last updated: <D Mon YYYY>

## 1. The one principle

**This is a marketing game, played truthfully.**

- Every claim gets its strongest honest framing. Weak framing wastes real work.
- No claim survives that cannot be defended under questioning. A claim that breaks in an interview costs more than it ever won.
- When the two conflict, truth wins, and Hope says so out loud.

## 2. The canon: settled facts

Every number, title, date and credential you have confirmed. The facts are fixed. The phrasing may flex to fit a sentence, but the substance (the level, the number, the title, the date) never changes.

**Résumés already sent keep the wording they were sent with.** Never edit a résumé copy in a role folder after it went out. If a fact changes, update the canon and everything not yet sent.

| Fact | Approved wording | Verified how (who said it, when) |
|---|---|---|
| Design-system consolidation at Figma (example) | "Led the consolidation of Figma's design system across 12 product teams. 37% surface-area unification in 8 months." | Jane, in chat, 2 Oct 2026. Matches the résumé. |

## 3. Open discrepancies

Things that still disagree. Each one is a live risk until it is fixed. Never assume one is fine.

| Item | One source says | Another source says | Action to reconcile |
|---|---|---|---|
| Linear end date (example) | LinkedIn: Jul 2022 | Résumé: Aug 2022 | Jane checks her last payslip, then Hope fixes whichever is wrong. |

## 4. My rules

Your standing instructions, dated, in your words. Every skill follows these.

| Date | The rule, in <Name>'s words | What Hope does about it |
|---|---|---|
| 3 Oct 2026 (example) | "No Manager or Director titles. I want to stay an IC." | hope-discovery drops these titles. hope-application stops and asks before filling one. |

## 5. Lessons learned

What went wrong, the class it belongs to, and the check that would have caught it. The classes are listed in `failure-patterns.md` in Hope's references folder.

| Date | What went wrong | Class | The check that would have caught it |
|---|---|---|---|
| 5 Oct 2026 (example) | A cover letter said "the last six years leading design systems". Figma started in Sep 2022, so it was 4 years 1 month. | Lesson 14 (compute every duration) and P1 (asserting instead of computing) | Compute every duration from the dates in the canon before it ships. Then grep every draft for "years" and check each hit. |

## 6. Recording protocol

**Record every interview and recruiter call.** A recap from memory keeps what you meant to say and loses what you actually said. The debrief needs the real version.

The moment a call is known (from an email, an invite, or you saying so), Hope will:

1. Say it in that same reply, in one line: "Record this one. Start Voice Memos before you join."
2. Set a reminder event 10 minutes before the call, titled `🔴 RECORD THE CALL - <Company> / <Person> in 10 min`, with alarms at 10 and 0 minutes.
3. Say it again in the last exchange before the call.
4. Ask for the recording file afterwards. A recap from memory is not a substitute.

**Consent.** Some places need everyone on the call to agree to a recording. If the other person may be in one of them, ask first, or record only your own side. The list of US states is in Hope's `interview-kit.md`.

- The app I record with: <Voice Memos, or the app you use>. TODO
- Where I usually take calls from (state or country): <answer>. TODO
