# Search surfaces · where good roles come from

Where to look for roles, how to read each source, and the rules every search follows.
Every surface here is **read-only**. Searching never applies, messages, follows, signs up or connects.

Who reads this: `hope-discovery` (the sweep and the shortlist), `hope-sync` (recruiter inbound), `hope-start` (the weekly rhythm).
Related: `references/ats-playbook.md` (API shapes per ATS), `references/visa-and-sponsorship.md` (the sponsorship screen), `references/hunt-folder.md` (the shortlist file shape).
Examples use the fixture persona Jane Doe, a Senior Product Designer in Brooklyn.

## Contents

1. [The surfaces at a glance](#1-the-surfaces-at-a-glance)
2. [ATS board APIs: Greenhouse, Ashby, Lever](#2-ats-board-apis-greenhouse-ashby-lever)
3. [Company careers pages](#3-company-careers-pages)
4. [LinkedIn "How you fit" feed](#4-linkedin-how-you-fit-feed)
5. [VC job boards and newsletters](#5-vc-job-boards-and-newsletters)
6. [Recruiter inbound](#6-recruiter-inbound)
7. [The user's own links, referrals and hiring posts](#7-the-users-own-links-referrals-and-hiring-posts)
8. [Rules for every search](#8-rules-for-every-search)
9. [Deferred with reasons](#9-deferred-with-reasons)
10. [The shortlist header](#10-the-shortlist-header)

---

## 1. The surfaces at a glance

| Surface | What it finds | How Hope reads it | Blind spot |
|---|---|---|---|
| ATS board APIs | Every open role on each listed board, with full text | `scripts/sweep_boards.py` over `boards.txt` | Companies not in `boards.txt`, and companies on other systems |
| Company careers pages | Big employers on Workday, Oracle HCM, SmartRecruiters | The search APIs in section 3, or the browser | Sites with no API; reqs that close overnight |
| LinkedIn "How you fit" | Roles LinkedIn's model matches to the user's profile | The user's signed-in browser, read-only | Not a query; not repeatable; LinkedIn-only view |
| VC job boards and newsletters | Startups backed by one investor | The page, then each company's own board | Only that investor's companies |
| Recruiter inbound | Roles that come to the user | `hope-sync` reads email and LinkedIn messages | Only what arrives |
| The user's own links, referrals | Roles the user already wants | `hope-application` takes the link | Only what the user finds |
| Hiring posts | Roles a person at the company posts about | The user's signed-in browser, read-only | Only posts the user sees or shares |

---

## 2. ATS board APIs: Greenhouse, Ashby, Lever

Most startups and many mid-size companies post on one of these three. Each has a public API that lists every open role on a board, with the full description.

**List a whole board:**

| ATS | URL |
|---|---|
| Greenhouse | `https://boards-api.greenhouse.io/v1/boards/<board>/jobs?content=true` |
| Ashby | `https://api.ashbyhq.com/posting-api/job-board/<org>?includeCompensation=true` |
| Lever | `https://api.lever.co/v0/postings/<org>?mode=json` |

**Find a company's board name (the slug):** open the company's careers page and read the apply link.

| Apply link looks like | ATS | Slug |
|---|---|---|
| `job-boards.greenhouse.io/acme/jobs/123` | Greenhouse | `acme` |
| `jobs.ashbyhq.com/acme/...` | Ashby | `acme` |
| `jobs.lever.co/acme/...` | Lever | `acme` |

A 404 from the API means a wrong slug or a different ATS. Try the careers page again before deciding.

**`applications/_research/boards.txt`:** one board per line, in the form `<ats>:<slug>`.

```
greenhouse:acme
ashby:acme
lever:acme
```

Blank lines are fine. Text after `#` on a line is a comment. Run `python3 "$PLUGIN_ROOT/scripts/sweep_boards.py" --help` for the ATS types it supports.
(`$PLUGIN_ROOT` is the plugin folder. The skill's "Before you start" block sets it.)
When the user mentions a company, or a sweep finds one, add its board to `boards.txt` so the next sweep covers it.

**Run the sweep** (Jane Doe's example):

```
python3 "$PLUGIN_ROOT/scripts/sweep_boards.py" --boards applications/_research/boards.txt --include "design system,design tokens,component library,typography,developer tools,prototyping" --exclude-title "Manager,Director,Head of,Intern,Contract" --locations "New York,Remote,San Francisco" --tracker job-tracker.xlsx --out applications/_research/shortlist-2026-10-14.md
```

**Check:** the shortlist file exists, and its header states the boards swept, the method and the blind spot.

**Blind spot:** only the boards in `boards.txt`. Big companies on Workday, Oracle HCM or their own sites are invisible to it. Say so in the shortlist.

---

## 3. Company careers pages

Big employers rarely use the three APIs above. Use their own search instead. API shapes are in `references/ats-playbook.md`.

| System | How to search one employer |
|---|---|
| Workday | `POST https://<tenant>.wdN.myworkdayjobs.com/wday/cxs/<tenant>/<site>/jobs` with `{"appliedFacets":{},"limit":20,"offset":0,"searchText":"design systems"}` |
| Oracle HCM | `GET https://<host>/hcmRestApi/resources/latest/recruitingCEJobRequisitions?...` (full shape in `ats-playbook.md`) |
| SmartRecruiters | `GET https://api.smartrecruiters.com/v1/companies/<company>/postings?q=<words>&limit=100` |
| A site with no API | Open it in the browser and use its own search |

Rules for careers pages:

1. These sites change and close reqs fast. A link a search engine returns as live can already be a 404 the same day.
2. If you cannot list a site's roles reliably, do not guess. Put the company under "Deferred with reasons" (section 9).
3. Read the full posting before you call it a fit. A title on a list is not a role.

---

## 4. LinkedIn "How you fit" feed

LinkedIn's own recommendation feed, with a "How you fit" panel on each role. LinkedIn's model picks the roles by reading the user's profile. It is not a keyword search.

**How to reach it:** in the browser the user signed into, open LinkedIn Jobs, then the recommended feed ("Top job picks for you"). Open a role. Read the "How you fit" panel.

**It is not a reusable URL.** The address carries session tokens that expire. Do not save it as a search. Go back through the Jobs page each time.

**What it is good for:**

1. It surfaces roles the user's own keyword searches miss.
2. The panel names the gap before the user applies. A seniority wall shows up there first.

**How to record it:** write each role's job ID (the number in `linkedin.com/jobs/view/<id>`) and title in the shortlist. Then find the employer's own posting and apply there.

**Read-only, always.** No Easy Apply, no messages, no connection requests, no follows, no likes. Viewing a person's profile notifies them, so ask the user first.
Never fetch a linkedin.com URL with a plain web fetch. It returns a login wall.

---

## 5. VC job boards and newsletters

Investors publish job boards and newsletters for their portfolio companies (for example, a16z's jobs newsletter and Y Combinator's Work at a Startup).

How to use one:

1. Treat it as a list of companies, not a list of roles.
2. For each company that might fit, open its own board (section 2) and read every role there. The listed role is often not the best fit on that board.
3. Record the verdict per company, including "no fit" with the reason, so the same newsletter is not re-read later.
4. Add every board you opened to `boards.txt`.
5. Some boards ask the user to sign in. That step is the user's. Hope never creates accounts.
6. A role whose only contact is an email address: Hope drafts the email with `hope-write`. The user sends it.

**Blind spot:** only that investor's companies.

---

## 6. Recruiter inbound

Recruiters write to the user by email or LinkedIn message. `hope-sync` reads both, read-only, and adds or updates tracker rows.

1. Each new contact becomes a tracker row with status `Inbound` or `Recruiter contact`.
2. Get the JD before anything else. If the recruiter did not send it, find the posting, or draft a reply asking for it.
3. **Agency recruiters** often do not name the client. Ask, in the draft reply.
4. **Front-load hard blockers in the first reply** (work authorization, travel, relocation, start date, pay floor). See `references/interview-kit.md` section 2.4 and `references/visa-and-sponsorship.md` section 6.
5. Hope drafts the reply. The user sends it.

---

## 7. The user's own links, referrals and hiring posts

The best leads are often the ones the user already found. A link from the user goes straight to `hope-application`.

### 7.1 The user's own links

1. **Apply to exactly the links the user hands over.** Do not swap in "better" roles. If you see a better one, mention it separately and let the user decide.
2. Run the same screens as a sweep (section 8, rules 3 to 9) before building the folder. Tell the user if one fails, and let them decide.
3. **Two roles at one company:** pick the closest fit plus the one most likely to land, in the same skill set. Never more than the per-company cap.

### 7.2 Referrals

A referral is scarce. Spend it carefully.

1. **Rank the company's open roles first.** Know which role is the best fit before anyone is asked.
2. **Ask a contact only for roles in their own team.** A referral from outside the team carries little weight and uses up goodwill.
3. **Check the role's sponsorship line first,** against the user's rule (`references/visa-and-sponsorship.md` section 3).
4. **Ask how the referrer submits.** Many referral tools take one résumé for all roles. The résumé sent that way must match the one the user applies with.
5. **Never cold-apply to a role someone is referring the user for.** A cold application first can break the referral.
6. **Hope drafts the ask with `hope-write`. The user sends it.** Write who referred them, and when, in the tracker note.

### 7.3 Hiring posts

Someone posts "we're hiring" on LinkedIn or elsewhere, and lists roles or says how to reach them.

1. **Apply first, through the company's own form.** Then draft a note to the poster saying the user has applied.
2. **Use the channel the post names.** If it says "email me", draft an email, not a direct message.
3. **Draft notes only to people in the user's target job market.** Not to every poster.
4. **A connection note stays under the platform's character limit,** framed as an invitation, not a request.
5. **LinkedIn is read-only for Hope.** Hope drafts. The user sends every note and every connection request.

---

## 8. Rules for every search

1. **Search descriptions, not titles.** Titles hide the function. "Member of Technical Staff", "Founding Designer", "Design Engineer" and "UX Engineer" can all be the role Jane wants. Match the include keywords against the full description text.
2. **Build the query from the whole person, not this week's positioning.** Take keywords from the career file (skills, past roles, projects) and the target shapes in `profile.md` section 5. Not only from the title the user is pitching this week.
   Jane is pitching "design systems" this week. Her record also has developer tools, typography and keyboard-first interaction. A sweep on "design systems" alone misses those roles.
3. **Dedupe against the tracker.** Match on company and on posting URL. Also check req IDs in the tracker's Notes column, the folder names in `applications/`, and earlier shortlists (to see earlier cut reasons).
   Flag near-duplicates of a req that already rejected the user.
4. **Per-company cap.** Default: 2 live applications per company, for the same skill set. The user may set a different number in `profile.md` section 5.
   Count the company's tracker rows at `Ready to apply`, `Applied`, `Applied - confirmed`, `Interviewing` or `Offer`. `Rejected`, `Closed` and `Withdrawn` never count.
   The full rule is in `references/hunt-folder.md` (profile section 5). A company at the cap goes to "Skipped and why". Also respect any cap the posting itself states (for example "3 applications per 90 days").
5. **Title and seniority exclusions** come from `profile.md` section 5. A stated years bar well above the user's years is a seniority wall. Note it.
6. **The pay screen** comes from `profile.md` section 3. If the top of the band is below the user's screen, cut it and say why. If no band is published, keep it and write "not published".
   Watch for total pay versus base pay. A band marked OTE or total target compensation is not a base salary.
7. **Location** comes from `profile.md` section 4. Watch for in-office days and travel percentages in the description.
8. **The sponsorship line.** Copy the posting's exact words. Apply the user's rule from `references/visa-and-sponsorship.md` section 3. Never infer the user's status.
9. **Re-verify a req is live at apply time.** Reqs close overnight. Fetch the posting again just before building a role folder. A 404 or "no longer accepting applications" means `Closed` in the tracker.
10. **State the method and its blind spot** at the top of every shortlist. A weak method reported as full coverage misleads the user.
11. **Quote the JD when you claim a fit.** Use the posting's own words, checked against the posting text.
12. **Read-only.** Never apply, message, sign up, follow or connect while searching.
13. **During an active hunt, offer a daily "new since yesterday" sweep.** Same boards and rules. Report only postings that are not in the tracker or in an earlier shortlist. A wider sweep stays weekly.
14. **Feed what the market says back into the filter.** Rejection reasons and interview feedback (from debriefs and the tracker notes) change the include words, the exclusions or the tiers. Write each change, with its reason and date, in the shortlist header.
15. **Check how each company interviews** before a role goes into Tier 1: public write-ups of their process, dated, with a link. Note it in one line.
16. **Fresh funding news is a lead.** A company that just raised money is often about to hire. Find its board and add it to `boards.txt`.
17. **Quality over volume.** A short list of roles that truly fit beats a long list. Take the time to read each posting.

---

## 9. Deferred with reasons

Some companies cannot be searched well: a site with no API, scripted requests blocked, a careers page that 404s, a board with zero postings under every slug you tried.
Never drop them quietly. List each one under "Deferred with reasons" in the shortlist, so the decision can be reviewed.

For each company, write:

1. **What you tried.** The URLs and slugs, with the date.
2. **Why it failed.** In one line.
3. **What you could see anyway.** Roles visible through other sources, marked "not verified".
4. **What to do at apply time.** For example: "Browse the careers site in the browser and search 'design systems'. About two minutes."
5. **A recommendation.** Worth the two minutes, or lowest priority, and why.

Example:

```
### Fabrikam - deferred
Tried: Workday search API at fabrikam.wd5 (3 site names), 2026-10-14. All returned 404.
Seen elsewhere (not verified): "Staff Product Designer, Platform", New York.
At apply time: open careers.fabrikam.example in the browser, search "design system". About two minutes.
Recommendation: worth the two minutes. The visible role matches Jane's design-system work.
```

---

## 10. The shortlist header

The full shortlist shape is in `references/hunt-folder.md` section 5.6. The header is where most mistakes hide. Its "How this list was made" block always states:

1. **Your rules applied:** the user's rules that shaped the sweep, quoted, with dates.
2. **Boards swept and method:** how many boards, how postings were pulled, and the keywords matched against each description.
3. **What this method cannot see:** the blind spot.
4. **Dedupe:** what was matched against, with counts.

Example for Jane Doe:

```
# Shortlist - 2026-10-14

## How this list was made
- **Your rules applied:** "Senior IC roles only, no management" (Jane, 2026-10-06). "No more than 25% travel" (profile.md section 4). Per-company cap: 2 live applications.
- **Boards swept and method:** 42 Greenhouse, Ashby and Lever boards from boards.txt, through their public APIs. Matched description text against: design system, design tokens, component library, typography, developer tools. Dropped titles with Manager, Director, Head of. Kept New York, Remote (US), San Francisco.
- **What this method cannot see:** Workday and other big-company sites, LinkedIn-only postings, and any board not in boards.txt.
- **Dedupe:** against job-tracker.xlsx on company + posting URL (23 rows), the 4 role folders, and 1 earlier shortlist. 3 postings were already tracked.
```
