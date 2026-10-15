# Visa and sponsorship · background for the hunt

> **Read this first.**
> This is background, not legal advice. Immigration rules, fees and forms change. For any decision that matters, the user checks the official source (for the US, uscis.gov) or an immigration attorney.
> **The user states their own status. Hope never infers it.** Not from a name, a school, a past job, a country, or anything else.
> The user's answers live in `applications/_common/profile.md` section 2, in their own words. If an answer is not there, it is `TODO (ask <user>)`.
> This file is written for the US. Other countries have their own systems. The habits in sections 6 to 10 still apply.

Who reads this: `hope-discovery` (the sponsorship screen), `hope-application` (form questions and the answers file), `hope-write` (first messages to recruiters), `hope-onboarding` (building the profile).

## Contents

1. [Three questions that sound alike](#1-three-questions-that-sound-alike)
2. [Sponsorship, transfer and the lottery, in plain words](#2-sponsorship-transfer-and-the-lottery-in-plain-words)
3. ["No sponsorship": a filter or a wall?](#3-no-sponsorship-a-filter-or-a-wall)
4. [E-Verify is a separate system](#4-e-verify-is-a-separate-system)
5. [What to actually check per company](#5-what-to-actually-check-per-company)
6. [When and how to say it](#6-when-and-how-to-say-it)
7. [How the application profile records it](#7-how-the-application-profile-records-it)
8. [What Hope writes when a posting says no sponsorship](#8-what-hope-writes-when-a-posting-says-no-sponsorship)
9. [Rules for Hope](#9-rules-for-hope)
10. [When the user corrects a visa rule](#10-when-the-user-corrects-a-visa-rule)

---

## 1. Three questions that sound alike

Forms ask three different questions. They often get different answers from the same person.

| The form asks | What it really asks |
|---|---|
| "Are you legally authorized to work in the US?" | Can you work here at all, today? |
| "Are you authorized to work for **any** employer in the US?" | Is your permission free, or tied to one employer? |
| "Will you now or in the future require sponsorship?" | Will this employer ever have to file paperwork for you to keep working? |

Why they differ, in two examples:

- A person whose permission is tied to one employer (an H-1B holder, for example) is authorized to work. They are not authorized for any employer. Moving to a new employer needs a new filing.
- A student working on post-study permission may be authorized for any employer today, and still need sponsorship in the future.

These examples explain the questions. They are never used to fill in a user's answers.
Answer each form question exactly as `profile.md` section 2 says. If the form's wording does not match a question in the profile, leave the field for the user and say why in `APPLICATION-ANSWERS.md`.

---

## 2. Sponsorship, transfer and the lottery, in plain words

1. **Sponsorship** means the employer files paperwork with the government so a person can work for them. The employer pays for it and must agree to do it.
2. **The lottery** is how new H-1B sponsorships are rationed. Employers register candidates once a year (in spring). A random draw picks who may be filed for. Work usually starts in October at the earliest. The outcome is uncertain, so many employers avoid it.
3. **A transfer** is for someone who already holds a status like H-1B and has already been counted in the lottery. The new employer files a change-of-employer petition. There is no lottery, and it can be filed any day of the year.
   In many cases the person may start work once the new petition is properly filed, before approval. An attorney confirms this for each case.
4. **Cap-exempt employers** (for example, universities and some research nonprofits) can file without the lottery.
5. **Cost:** a filing has government fees and usually legal fees. Some fees depend on company size, and fees change, sometimes sharply. Check the current USCIS fee page before quoting any number.

| | New sponsorship (lottery) | Transfer |
|---|---|---|
| Who it is for | Someone not yet counted in the lottery | Someone already in the status |
| Timing | Once a year, random draw | Any day |
| Certainty for the employer | Low | Much higher |
| What an employer usually means by "no sponsorship" | This | Often not this |

---

## 3. "No sponsorship": a filter or a wall?

Many "no sponsorship" lines are written with new, lottery-based sponsorship in mind. That costs the employer time, money and uncertainty.
A transfer is cheaper, faster and far more certain. Some employers who write "no sponsorship" will still do a transfer for a candidate they want.

So the same line means different things for different people:

| The posting says | User needs a transfer | User needs new sponsorship | User needs none |
|---|---|---|---|
| "We are unable to sponsor visas for this role." | **Filter.** Keep the role if the user's rule says so. Flag it. Ask a human at the right moment. | **Wall.** The line usually means exactly this case. | Not an issue. |
| "Must be authorized to work without sponsorship now or in the future." | **Filter, with lower odds.** Stronger wording. Follow the user's rule. | **Wall.** | Not an issue. |
| "US citizenship required" / "security clearance required" / "export control: must be a US person" | **Wall** unless the user meets the requirement. These are legal requirements, not preferences. | **Wall** unless met. | Check the user meets it. |
| Nothing about sponsorship | Unknown. Write "not stated". Ask at the right moment. | Unknown. | Not an issue. |

Notes:

1. "US person" for export control is wider than "US citizen". It includes permanent residents, among others. The user decides whether they meet it.
2. The user's own rule decides what happens. It lives in `profile.md` section 2 or in "My rules" in `HUNT-PROTOCOL.md`. Example: "Apply when the posting says no sponsorship, as long as nothing says citizenship or clearance."
3. If the user has no rule yet, ask once, offer choices, and write the answer to "My rules" with the date.

---

## 4. E-Verify is a separate system

**E-Verify** is a federal system that checks a new hire's work eligibility after hiring. An employer enrolls and then runs every new hire through it.
**Sponsorship** is a petition for one named person in one role. The two are separate. An employer does not need to be enrolled in E-Verify to file an H-1B petition or a transfer.

| | Sponsorship (for example, H-1B) | E-Verify |
|---|---|---|
| What it does | Lets a specific person work in a specific role | Confirms work eligibility for new hires in general |
| Who starts it | The employer, for a named person | The employer, for every new hire, once enrolled |
| Required for the other? | No | No |

**Where E-Verify genuinely matters:**

1. **The STEM OPT extension** (a student work-permission extension): the employer must be enrolled in E-Verify. This is a hard rule.
2. **Some federal contractors**, whose contracts require it.
3. **Some states**, which require it for some or all private employers. At least one large state restricts its use instead. Rules vary and change.

**Why people mix them up:** the usual student path is study, then post-study work permission, then the STEM extension, then H-1B. At the STEM stage, "the company must use E-Verify" is true and important.
People carry that rule into the H-1B stage, where it no longer applies. Many sponsoring companies also happen to use E-Verify, which keeps the belief alive.

**So:** an employer's E-Verify status does not tell you whether it will sponsor or transfer. Check what section 5 lists instead.

---

## 5. What to actually check per company

1. **The posting's exact words.** Copy the sponsorship sentence, verbatim, into the `Sponsorship:` line of `JD.md`. `scripts/fetch_jd.py` extracts it when it can. If there is none, write "not stated".
2. **Public petition history.** The USCIS H-1B Employer Data Hub shows whether a company has filed petitions before:
   `https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub`
   A young company will have no history. That is not a no. It means untested.
3. **Ask directly, at the right moment** (section 6):
   > "Have you transferred a visa before, or would this be a first?"

   A first is fine. It means the company budgets for an attorney.

What decides whether a small company can do a transfer:

| Factor | What it means |
|---|---|
| Willingness | The real filter. Some small companies decline on principle or to avoid hassle. |
| Ability to file | Any legitimate employer with a tax ID can. |
| Ability to pay the required wage | A funded company usually can. |
| Cost | Government fees plus an attorney. Varies with company size and current rules. |
| A normal employment relationship | Regular salaried employment satisfies it. |

---

## 6. When and how to say it

| Situation | When | What to say or do |
|---|---|---|
| Direct application on a form | On the form | Answer the form's questions exactly as `profile.md` says. The employer learns it from the form. |
| Agency recruiter (cold inbound) | In the first reply, in writing | Front-load it in one short clause, for example: "...and I'm on a <status> that would need a transfer." Nine words or so. Then the rest of the reply. |
| In-house recruiter, first call | When they ask. If the form never asked and they do not ask either, near the end of the first call | One plain sentence. Then stop. If it fits, ask: "Have you transferred a visa before, or would this be a first?" |
| Cold cover letter or cold email to an employer | **Never** | It is a conversation for a human, at the right moment. A cover letter is the wrong place. |
| Hiring manager round | Only if they raise it | Answer in one sentence. The recruiter owns this topic. |

Why the agency rule differs: an agency recruiter knows nothing about the user, and their incentive is to get a call booked, not to pre-qualify.
A call can end in minutes over a fact that was fixed before anyone dialed in. Saying it first, in writing, saves both sides the hour. It reads as senior, not apologetic.

The same "front-load it" rule covers any other hard blocker: relocation limits, a hard start date, a pay floor, a travel limit. See `references/interview-kit.md` section 2.4.

---

## 7. How the application profile records it

`applications/_common/profile.md` section 2, "Work authorization". The user answers. Hope writes their words verbatim and never fills a blank with a guess.

```
## 2. Work authorization

Country: United States
| The form asks | <user>'s answer (verbatim) |
|---|---|
| Are you legally authorized to work in the US? | TODO (ask <user>) |
| Are you authorized to work for ANY employer in the US? | TODO (ask <user>) |
| Will you now or in the future require sponsorship? | TODO (ask <user>) |
| Have you been sponsored before? | TODO (ask <user>) |
| Status, and dates (typed by <user>) | TODO (ask <user>) |
| Would a move need a transfer, new sponsorship, or nothing? | TODO (ask <user>) |
| Export control / clearance: do you meet "US person" or hold a clearance? | TODO (ask <user>) |
| Restrictive agreements (non-compete, NDA) that limit where you can work | TODO (ask <user>) |

Rule for "no sponsorship" postings (user's words, dated): TODO (ask <user>)
How to say it to an agency recruiter (user's words): TODO (ask <user>)
```

Repeat the table for each country the user would work in.

**Never** store visa document numbers, passport numbers, I-94 numbers or similar here. Hope never enters them into a form either. That step goes to the user.

---

## 8. What Hope writes when a posting says no sponsorship

Two places: the `Sponsorship:` line in `JD.md`, and the `Sponsorship:` line under "Honest fit" in `APPLICATION-ANSWERS.md`. In a shortlist, the "Sponsorship" column carries the posting's exact words.

**In `JD.md`:** the posting's exact words, in quotes, or "not stated".

**In `APPLICATION-ANSWERS.md`, pick the case that matches `profile.md`:**

Case A: the profile says no sponsorship is needed.

```
- **Sponsorship:** Posting says "<exact words>". Profile: no sponsorship needed. Not an issue.
```

Case B: the profile says a move needs a transfer.

```
- **Sponsorship:** Posting says "<exact words>". Profile: would need a transfer, not new sponsorship.
  For a transfer this line is a filter, not a wall. Petition history: <checked on <date>: <what it showed> / not checked yet>.
  Do not raise it in the cover letter. Ask a human at the right moment: "Have you transferred a visa before, or would this be a first?"
  Applied under <user>'s rule: "<rule, verbatim, with date>".
```

Case C: the profile says a move needs new sponsorship.

```
- **Sponsorship:** Posting says "<exact words>". Profile: would need new sponsorship. This line is likely a wall.
  Per <user>'s rule ("<rule>"), <skipped / kept and flagged>.
```

Case D: the posting states a legal requirement (citizenship, clearance, export control).

```
- **Sponsorship:** Posting says "<exact words>". This is a legal requirement, not a preference. Profile says: "<user's answer>". <Meets it / does not meet it: skipped.>
```

If a role is skipped for sponsorship, it goes in the shortlist's "Skipped and why" with the exact words. Never drop it silently.

---

## 9. Rules for Hope

1. The user states their own status. Hope never infers it, and never guesses an answer to a work-authorization question.
2. Copy the posting's sponsorship words exactly. Never paraphrase them.
3. Never raise visa status in a cold cover letter or cold email to an employer.
4. With an agency recruiter, front-load it in the first reply, in the user's own wording from `profile.md`.
5. Never enter document numbers. Never create accounts.
6. Legal-requirement lines (citizenship, clearance, export control) are respected. Hope does not argue around them.
7. A skipped role always has its reason written down.
8. Anything that decides a real choice gets checked against the official source or an attorney. Say so to the user.
9. A user correction about a visa rule is verified from a primary source before it is written down (section 10).

---

## 10. When the user corrects a visa rule

Visa rules are easy to misremember. A rule that was true at one stage (for example, the STEM OPT E-Verify rule) often gets carried into a stage where it no longer applies.
So a correction from the user about a visa rule is checked before it goes into any file. The user's own status is different: that is theirs to state, and it is never checked or second-guessed.

1. **Say it plainly:** "Before I write that down, I'll check it against the official source."
2. **Find a primary source:** uscis.gov, dol.gov, travel.state.gov, the regulation itself, or an immigration law firm's published answer with a date and an author.
3. **If the source agrees,** write the rule into `HUNT-PROTOCOL.md` ("My rules" or "Lessons learned") with the source link and the date.
4. **If the source disagrees,** tell the user plainly, show the source and quote the line that matters. Write nothing until the user decides.
5. **If no primary source settles it,** say so. Write the question down as open, not as a rule.

This file can be wrong or out of date too. The same check applies to it.
