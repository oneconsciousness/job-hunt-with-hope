# Jane's hunt protocol

> **How Hope uses this file.** This is your rulebook for the job hunt. Hope reads it before it writes, fills or sends you anything.
>
> - When you correct Hope, Hope writes the correction here **the same turn**, dated, in your words. That is how Hope stops repeating a mistake.
> - The canon (section 2) is the single source of truth. If your résumé, portfolio or LinkedIn disagree with it, the canon wins and Hope fixes the other one, after asking you.
> - Hope may add rows to sections 2, 4 and 5. It never deletes or rewords a line you wrote.
> - A fact about the outside world (a company, a law, a tool) goes in only after Hope checks it against a primary source, such as the company's own page. "Verified how" then carries the link and the date.
> - This file stays on your machine. It is never committed or published.
>
> Last updated: 6 Oct 2026

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
| Current role | "Senior Product Designer, Figma. Sep 2022 to now." | Jane, in chat, 16 Sep 2026. Matches the résumé and the career file (start 1 Sep 2022). |
| Role before Figma | "Product Designer, Linear. Mar 2019 to Aug 2022." | Jane, in chat, 16 Sep 2026. The career file has 1 Mar 2019 to 15 Aug 2022. The résumé shows the years only. |
| First role after school | "Independent Designer, various clients. Jun 2017 to 2019." | Jane, in chat, 16 Sep 2026. The month is Jane's. The résumé shows the years only. LinkedIn disagrees: see section 3. |
| Degree | "BFA, Graphic Design, Rhode Island School of Design, 2017." | Jane, in chat, 16 Sep 2026. Matches the résumé (2013 to 2017). |
| Certificate | "Cooper Design Leadership Certificate, 2023." | Jane, in chat, 16 Sep 2026. Matches the résumé. |
| Years in product design | "9 years in product design." Counted from Jun 2017. Recompute before each use (lesson 14). | Computed with the lesson 14 command on 16 Sep 2026: 9 years 3 months. Start date confirmed by Jane, 16 Sep 2026. |
| Design-system consolidation at Figma | "Led the consolidation of Figma's internal design system across 12 product teams." | Jane, in chat, 16 Sep 2026. Confirmed again 6 Oct 2026. Matches the résumé. |
| Result of the consolidation | "37% surface-area unification in 8 months." | Jane, in chat, 16 Sep 2026. Confirmed again 6 Oct 2026. Matches the résumé. |
| Onboarding time at Figma | "Onboarding time for new designers dropped from 3 weeks to 1." Never as a percentage. | Jane, in chat, 6 Oct 2026: "Say 3 weeks to 1. Don't turn it into a percentage." Matches the résumé. |
| Governance model at Figma | "Designed the component governance model adopted across the design org: an RFC flow, a vote, and a deprecation calendar." | Jane, in chat, 16 Sep 2026. Matches the résumé. |
| Mentoring at Figma | "Mentored 4 junior designers. 2 were promoted to mid-level within the year." | Jane, in chat, 16 Sep 2026. Matches the résumé. |
| Command palette at Linear | "Designed Linear's keyboard-first command palette (still in production). Power-user retention rose 18% in the cohort that adopted it." | Jane, in chat, 16 Sep 2026. Confirmed again 6 Oct 2026. Matches the résumé. |
| Mobile launch at Linear | "Owned the design language for Linear's mobile app launch in 2021. Shipped on time with zero designer reworks during dev integration." | Jane, in chat, 16 Sep 2026. Matches the résumé. |
| Independent work | "Worked with 8 early-stage startups. An onboarding redesign for a fintech client lifted day-one activation from 34% to 51%." No client names. | Jane, in chat, 16 Sep 2026. Matches the résumé. |
| Typebook | "Typebook (2024): a self-published 200-page book on typography in software interfaces. 2,400 copies sold in its first quarter." | Jane, in chat, 16 Sep 2026. Matches the résumé. |
| Open-source palette pattern | "After Linear, contributed a community keyboard-palette pattern now used by 15+ open-source apps." | Jane, in chat, 16 Sep 2026. Matches the résumé. |

## 3. Open discrepancies

Things that still disagree. Each one is a live risk until it is fixed. Never assume one is fine.

| Item | One source says | Another source says | Action to reconcile |
|---|---|---|---|
| Start year of Jane's independent studio | LinkedIn: 2018 | Résumé: 2017 (Jane: Jun 2017, the canon in section 2) | Jane fixes the LinkedIn date herself. Hope never edits LinkedIn. It matters because "9 years in product design" counts from 2017, and a recruiter reading LinkedIn counts 8. After Jane says it is done, Hope reads her LinkedIn profile (read-only, in her browser) and marks this row fixed. Found 16 Sep 2026. |

## 4. My rules

Your standing instructions, dated, in your words. Every skill follows these.

| Date | The rule, in Jane's words | What Hope does about it |
|---|---|---|
| 16 Sep 2026 | "No Manager titles. No Director or Head of either. I want to keep designing." | hope-discovery drops these titles. hope-application stops and asks before filling one. |
| 16 Sep 2026 | "Ask me before you take anything off my résumé. Even one skill." | Any removal is shown first as a table (where, now, proposed, why). Nothing comes off without Jane's yes. |
| 16 Sep 2026 | "Two live applications per company, max." | Before any new application, Hope counts the company's live rows in `job-tracker.xlsx` (`tracker.py list --company`). At two, Hope stops and tells Jane. |

## 5. Lessons learned

What went wrong, the class it belongs to, and the check that would have caught it. The classes are listed in `failure-patterns.md` in Hope's references folder.

| Date | What went wrong | Class | The check that would have caught it |
|---|---|---|---|
| 3 Oct 2026 | The first debrief draft called the next round "a call with the VP of Design". The transcript says "design director". Hope then copied that line into `INTERVIEW-PREP.md`, so the wrong title sat in two files. Jane caught it. Both files now say "design director". | P4 (copied text treated as already checked) | Re-check a copied line against its source (here, the transcript) in every file it lands in. Then search the whole folder for the phrase and fix every hit: `grep -rn "VP of Design" applications/`. |
| 6 Oct 2026 | Hope's first draft of the Figma story in `interview-stories.md` said onboarding time "fell by 70%". No file has that number. The canon says 3 weeks to 1. Jane then confirmed every number in `interview-stories.md` the same day. | P1 (asserting instead of computing) | Every number in a draft must match a canon row in section 2. Before handing a draft over, list every number in it (`grep -noE "[0-9][0-9,.]*%?" <file>`) and find each one in the canon. |

## 6. Recording protocol

**Record every interview and recruiter call.** A recap from memory keeps what you meant to say and loses what you actually said. The debrief needs the real version.

The moment a call is known (from an email, an invite, or you saying so), Hope will:

1. Say it in that same reply, in one line: "Record this one. Start Voice Memos before you join."
2. Set a reminder event 10 minutes before the call, titled `🔴 RECORD THE CALL - <Company> / <Person> in 10 min`, with alarms at 10 and 0 minutes.
3. Say it again in the last exchange before the call.
4. Ask for the recording file afterwards. A recap from memory is not a substitute.

**Consent.** Some places need everyone on the call to agree to a recording. If the other person may be in one of them, ask first, or record only your own side. The list of US states is in Hope's `interview-kit.md`.

- The app I record with: Voice Memos, on my iPhone.
- Where I usually take calls from (state or country): New York.
