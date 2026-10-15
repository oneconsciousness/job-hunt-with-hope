# Interview stories - the detail behind Jane's résumé bullets

A résumé bullet is a door. This file is what is behind it. Each story should survive fifteen minutes of follow-up questions.
Every detail here is in Jane's words. Numbers carry their source. No client names. Shape: `references/interview-kit.md` section 7.

## 1. Design-system consolidation (Figma, 2022 to now)

**The résumé bullet:** "Led the consolidation of Figma's internal design system across 12 product teams. Achieved 37% surface-area unification in 8 months. Onboarding time for new designers dropped from 3 weeks to 1."
**Role:** Jane led it and owned the governance model. Each team's designers owned their own migration. **Tools:** shared Figma libraries, an RFC template, a voting form, a deprecation calendar.

### The problem
Twelve product teams had drifted into their own versions of the same components. New designers spent their first weeks learning which button was the real one.

### What Jane did
- Wrote the governance model: any change to a shared component goes through a short RFC.
- Set up a vote with one designer per team, so no team was surprised by a change.
- Built a deprecation calendar, so teams knew when an old component would stop being supported.

### What broke
The first RFCs stalled. Three teams ignored them, because nothing happened if they did not vote. Jane added one rule: no vote within five working days counts as yes. Votes came in after that.

### What changed (numbers, with sources)
- 37% surface-area unification in 8 months (resume.txt; Jane confirmed 6 Oct 2026).
- New-designer onboarding: 3 weeks down to 1 (resume.txt; Jane confirmed 6 Oct 2026).

### What Jane would do differently
Publish the deprecation calendar on day one, not in month three. Teams plan better when they can see the end date.

### Questions this story answers well
- "Tell me about a design system you have shaped." -> the whole story
- "How do you get buy-in across teams?" -> the vote and the five-day rule
- "Tell me about something that didn't work." -> the stalled RFCs
- "Have you worked with design tokens?" -> naming and ownership in the governance model

## 2. Keyboard-first command palette (Linear, 2019 to 2022)

**The résumé bullet:** "Designed Linear's keyboard-first command palette (still in production). Increased power-user retention by 18% in the cohort that adopted it."
**Role:** Jane owned the interaction model and the usability rounds. Two engineers built it. **Tools:** high-fidelity prototypes, keyboard-only test scripts.

### The problem
Power users wanted to move faster than the mouse allowed. Common actions sat three clicks deep in menus.

### What Jane did
- Defined the interaction model: one shortcut opens it, typing filters, Enter runs the action.
- Prototyped it and ran usability rounds built around keyboard-only tasks.

### What broke
In the first round, testers could not find actions whose exact names they did not know. Jane added synonyms, so typing "delete" also found "archive".

### What changed (numbers, with sources)
- 18% higher power-user retention in the cohort that adopted it (resume.txt; Jane confirmed 6 Oct 2026). Still in production.

### What Jane would do differently
Test with new users earlier. The first version was built for people who already knew the product.

### Questions this story answers well
- "Walk me through a project." -> best for developer-tool companies
- "How do you work with engineers?" -> two engineers, one shared prototype
- "How did you know it worked?" -> the retention number and the cohort it came from

## Open - needs Jane

| # | Question | Came up in |
|---|---|---|
| 1 | "Tell me about a difficult stakeholder." Which team pushed back hardest on the RFC process, and how was it settled? | Acme hiring manager prep, 2 Oct 2026 |

<!-- Fixture: fictional. Jane Doe's stories are invented for testing Hope. -->
