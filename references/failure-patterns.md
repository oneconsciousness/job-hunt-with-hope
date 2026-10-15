# Hope Failure Patterns · v2.0

Every mistake caught during a real job hunt run with an AI partner fit one of a few shapes. This file names those shapes and gives the check that catches each one before the user does.

Examples use the test persona Jane Doe: Senior Product Designer in Brooklyn. Independent designer from June 2017, Product Designer at Linear from March 2019 to August 2022, Senior Product Designer at Figma from September 2022.

## How to use this file

1. **Before anything goes to the user to send or submit**, run the checks that fit the document. For any draft with a number, a date or a name in it, that is always lesson 14, P1, P3 and P5.
2. **When the user catches a mistake**, or you do:
   1. Name its class from this file.
   2. Write it in `HUNT-PROTOCOL.md`, section 5 (Lessons learned): the date, what went wrong, the class, the check that would have caught it.
   3. Run the check for the whole class, across every document in the hunt folder, the same hour (see P7).
3. **Quote the class by its name** when you tell the user, in plain words. Example: "Same mistake as before: a duration I wrote without computing it. I've now checked every duration in your folder."

## The patterns at a glance

| # | The pattern | The check, in one line |
|---|---|---|
| Lesson 14 | A duration that sounds balanced, never computed | Compute it from the dates. A gap in the window makes it false. |
| P1 | Asserting what sounds right instead of computing it | Every number, date, name and outcome comes from a file, a command or the web. Outside-world facts carry a dated primary source. |
| P2 | Absence in Hope's context read as absence in the user's record | Search everything, then ask, before writing "they lack X". |
| P3 | Drifting toward the JD | The JD picks what to select. Never what to add, never the wording. |
| P4 | Copied text treated as already checked | Re-check in each new document. Grep the whole folder for the phrase. |
| P5 | Trusting a read-through over a mechanical check | Render, grep, assert, screenshot. When they disagree, the script is right. |
| P6 | Reporting a weak search as full coverage | State the method and its blind spot next to the result. |
| P7 | Fixing the one instance instead of the whole class | Name the class, re-check the whole class, check the class not the string. |

---

## Lesson 14: Compute every duration

**The pattern:** a phrase like "nine years, the last six doing X" reads well, so it ships without anyone doing the arithmetic.

**Jane Doe example:** Jane's draft summary says "Nine years in product design, the last six leading design systems." The canon says her design-system leadership started at Figma on 1 September 2022. On 14 October 2026 that is 4 years 1 month. At Linear she owned the mobile design language, not a design system. "Six" is wrong on every reading. By the time anyone checked, the phrase was in the portfolio summary and two cover letters.

**The check:**

1. Find the first date where the claim was true. Use the canon in `HUNT-PROTOCOL.md` or the dates in `career-graph/career.json`.
2. Compute the time from that date to today with a command, never in your head:

```bash
python3 -c "from datetime import date; s=date(2022,9,1); t=date.today(); m=(t.year-s.year)*12+(t.month-s.month)-(t.day<s.day); print(f'{m//12} years {m%12} months')"
```

3. Check the whole window is continuous. If there is a stretch inside it where the claim was not true, the claim is false. A gap in the middle is not a rounding error.
4. Write the number the command printed, rounded down. Or write no number.

**Rules that follow:**

- Any "last N years" or "N years of X" claim is arithmetic, not prose.
- A duration copied into another document inherits nothing. Check it again there (P4).
- If the user offers a way to save the number ("count my freelance years too"), check that the same way. If the new version breaks under one follow-up question, reframe to something true instead. Example: "Nine years in product design, the last four leading a design system across 12 product teams."
- Prefer no number to a soft number. The work carries the weight. The duration rarely does.

## P1: Asserting what sounds right instead of computing it

**The pattern:** a number, date, name or outcome gets written because it sounds right, not because Hope read it or computed it.

**Jane Doe example:** Jane asks what she told Northwind about onboarding time. Hope answers from memory: "You said you cut it from 4 weeks to 1." Her `APPLICATION-ANSWERS.md` and the canon both say 3 weeks to 1. In the same session, a cover-letter draft says "15 product teams". The canon says 12.

**The check:** if a claim contains a number, a date, an outcome or a proper noun, it must come from a file, a command, or the web before it ships. Fluent prose is not a source.

```bash
grep -n "product teams" HUNT-PROTOCOL.md                           # what does the canon say?
cat applications/northwind-senior-product-designer/APPLICATION-ANSWERS.md   # what was actually sent?
```

To answer "what did I send?", open the file and quote it (`sent-*.md` in the role folder, or "Submitted answers" in `APPLICATION-ANSWERS.md`). Never rebuild it from memory.

**Facts about the outside world.** A fact about a company, a product, an interview format, a law or a tool is researched fresh every time, never taken from memory. Hand it over with a source link the user can open and the date it was checked: `(source: <url>, checked 14 Oct 2026)`. This applies to briefings and prep files for the user, not only to documents that ship.

**A user correction about the outside world** is checked against a primary source before it goes into `HUNT-PROTOCOL.md`. A primary source is the company's own page, the vendor's own documentation, or the text of the law or a government page. A blog or a forum post is not. If the source disagrees with the user, show them the source and the exact line, and let them decide what gets written.

**Jane Doe example:** Jane says "Northwind's design round is always a take-home." Before writing it down, Hope opens Northwind's own "How we hire" page. It says the design round is a 60-minute live exercise. Hope shows Jane the page and the line. What goes into `HUNT-PROTOCOL.md` is the checked version, with the link and the date in "Verified how".

## P2: Treating absence in Hope's context as absence in the user's record

**The pattern:** Hope has not seen evidence of something, so it writes that the user does not have it.

**Jane Doe example:** A role at a payments company asks for fintech experience. The skills list in `career.json` has no fintech entry, so Hope's honest-fit note says "Gap: no fintech experience." Jane's résumé says she redesigned onboarding for a fintech client in 2017 to 2019, lifting day-one activation from 34% to 51%.

**The check:** before writing "the user lacks X", search everything, then ask the user.

```bash
grep -rniI "fintech" career-graph/career.json user-story.md HUNT-PROTOCOL.md applications/_common/
pdftotext applications/_common/resume.pdf - | grep -ni "fintech"    # if pdftotext is installed; otherwise open the PDF and read it
```

Also check the portfolio, old résumés the user gave you, and LinkedIn (read-only, in the user's browser). If all of that finds nothing, ask: "I can't find X in your files. Have you done it?" An unsearched gap is an unknown, not a gap. The user's record is always bigger than Hope's summary of it.

## P3: Drifting toward the JD and away from the user

**The pattern:** the job description starts deciding what the user claims and how it is worded.

**Jane Doe example:** The JD says "experience with prototyping tools (Figma, Framer, ProtoPie, etc.)". Hope adds "ProtoPie" to Jane's skills line. Nothing in her record mentions ProtoPie. In the same draft, Hope rewrites her governance bullet in the JD's words, and her own specifics ("RFC flow, voting, deprecation calendar") disappear.

**The check:** the JD decides **what to select** from the user's record. It never decides what to add, and never decides the wording. A JD parenthetical is not a skill.

For every skill or claim in a draft that is not already on the résumé:

```bash
grep -rniI "protopie" career-graph/career.json HUNT-PROTOCOL.md user-story.md applications/_common/
```

A hit only inside a `JD.md` or a shortlist does not count. It came from a job description, so it proves nothing. When a JD theme has thin evidence, pick a different true piece of the user's record. Do not soften a claim until it fits.

## P4: Copied text inherits no verification

**The pattern:** a phrase written once spreads into other documents, and nobody checks it again.

**Jane Doe example:** A line in the Northwind cover letter says "the design system every Figma product team now uses." Hope copied it into the Acme letter and a form answer. The canon says 12 product teams, not every team. Checking the first letter would not have caught the copies.

**The check:** re-check the claim in each document it lands in, because each document makes its own claim. Then search the whole hunt folder for the phrase and fix every hit, not only the one in front of you:

```bash
grep -rn "every Figma product team" applications/ career-graph/documents/
```

## P5: Trusting a read-through over a mechanical check

**The pattern:** Hope reads its own work, decides it is right, and skips a cheap check that would have proved it.

**Jane Doe example:** Hope re-read Jane's cover letter and reported "no em dashes." The em dash check found two. On an Ashby form, the browser tool reported a dropdown as set. A screenshot showed it still on "Select...".

**The check:** verify the artifact, not the intent. Render it, grep it, assert on it, screenshot it. When a read-through and a script disagree, the script is right.

```bash
grep -n "$(printf '\342\200\224')" applications/northwind-senior-product-designer/cover-letter.md   # em dash check: must print nothing
```

- After filling a form, take a screenshot or read the page text, and compare every value with `APPLICATION-ANSWERS.md`.
- After making a PDF, check the PDF, not the markdown it came from.
- A check that reads the same layer you wrote to is not a check. Reading the page back after setting a value by script proves nothing about what the server saved.
- Put the check before the write when you can, so a failed check cannot leave a half-applied edit on disk.

## P6: Reporting a weak method's output as coverage

**The pattern:** a limited search is reported as if it had looked everywhere.

**Jane Doe example:** Hope searched 20 boards for titles containing "Product Designer" and told Jane "Northwind has no other design roles." Northwind's "Design Engineer, Interfaces" role had a description full of design-system and Figma work. A title search could never find it.

**The check:** state the method and its blind spot next to the result. "I searched X" is a finding only if the method could have found the thing.

- Match on the description text, not the title. Titles hide the job.
- Build the search from the user's whole record, not from how they are being positioned this week.
- Say what the method cannot see. Example: "I matched descriptions on the 20 boards in `boards.txt`. This misses companies not in that file and roles posted only on LinkedIn."
- Every shortlist header has a `**Blind spot:**` line that says what the method cannot see (see `references/hunt-folder.md`, section 5.6).

## P7: Fixing the instance instead of the class

**The pattern:** the one phrase that was caught gets fixed, and the same mistake lives on elsewhere. This is the pattern that makes the other six come back.

**Jane Doe example:** After "the last six years leading design systems" was caught, Hope replaced that phrase and confirmed it was gone. The portfolio summary still said "a decade of product design". That is false for the same reason: since June 2017 is 9 years 4 months.

**The check:**

1. Name the class the mistake belongs to. Here: every duration claim.
2. Re-derive the whole class from scratch, across every document. For durations:

```bash
grep -rniE "decade|[0-9]+\+? years?|(one|two|three|four|five|six|seven|eight|nine|ten) years?|last (one|two|three|four|five|six|seven|eight|nine|ten|[0-9]+)" \
  applications/ career-graph/documents/ --include='*.md' --include='*.html' --include='*.txt'
```

3. Compute each hit with the lesson 14 check.
4. Check the class, not the string. Confirming "the last six" is gone proves nothing about "a decade".
5. If a rule was worth writing into `HUNT-PROTOCOL.md`, run it against every document the same hour, not only against the sentence that triggered it.

Keep the quotes around `'*.md'` and the others. Without them, zsh tries to expand the pattern itself and the command fails.

---

## A found bug is a sample, never the population

When one mistake turns up, assume there are more of the same kind. Find the class. Check all of it. Then tell the user how many you found and fixed, and where.

## The root cause

P1, P2 and P5 share one root: **Hope substituted its own confidence for a check that was cheap and available.** When something can be checked in under a minute, check it.
