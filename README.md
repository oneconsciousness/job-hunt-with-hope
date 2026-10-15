# JobHunt with Hope

> **AI already changed hiring. Use it to get hired.** Free job-hunt skills for any AI agent. No coding, no catch.

Free · open-source (MIT) · works with the AI you already use (Claude Code · Codex · Gemini · Copilot…) · your data never leaves your laptop

<!-- IMAGE: any-agent: agent-agnostic hero (user-provided) -->
<p align="center"><img src="assets/readme/any-agent.png" alt="Tell your favorite AI agent, Claude, ChatGPT, Gemini, Cursor, VS Code, GitHub Copilot, Windsurf, or Perplexity: &quot;build my portfolio with Job Hunt with Hope.&quot;" width="720"></p>

**The hiring side already runs on AI**: résumé screeners, ranking, instant auto-rejects. Hope puts AI on your side too.

Hope hands your AI ten free skills that run a whole job hunt with you: a portfolio recruiters stop for, real openings found, application forms filled, every message in your voice, prep for every call, and one tracker you own. Hope drafts and fills. You decide, and you press send.

You don't need to code. You don't need an IDE. **If you can chat with an AI, you can do this.** Just laid off, switching fields, or looking for your first job: Hope is for anyone looking for work.

<!-- IMAGE: demo: the live multi-persona demo (recorded GIF) -->
<p align="center"><img src="assets/readme/demo.gif" alt="A live Hope portfolio in action: switching between people, a playable career timeline, and a feed of real social posts" width="760"></p>

<!-- IMAGE: proof: real interviews/offers (owner-supplied) -->
<p align="center"><img src="assets/readme/proof.png" alt="Real interviews and offers: EY, Amazon, Baker McKenzie, FedEx, Cerebras, Apple, and more" width="720"></p>

<p align="center"><sub>Built while job-hunting. <strong>85.5% of its earlier users landed multiple interviews and secured full-time roles.</strong></sub></p>

## What Hope does for you

Ten skills, in the order a hunt runs:

1. **Start.** Know where you stand and what to do next. Hope reads your hunt folder, tells you where you are, and sends you to the right step. It also teaches you the daily rhythm.
2. **Onboarding.** Get known once. Hope meets you and builds your career file. Then it builds your application profile (every answer a form asks, asked once) and your hunt folder.
3. **Portfolio & résumé.** Get noticed. A designed page recruiters stop for, with a living timeline of your career, and the one résumé that goes with your applications.
4. **Publish.** Get one link you own. Hope puts your portfolio on a free page in your name. Paste it anywhere. Only you can change it.
5. **Find jobs.** See the roles worth your time. Hope sweeps job boards through their own data feeds and matches on the job description, not just the title. It screens against your rules, skips what is already in your tracker, and hands you a shortlist. You pick.
6. **Apply.** Skip the retyping. Give Hope a link. It saves the posting, makes a folder for the role, and fills the form in your browser with real keystrokes. It writes down every answer it entered and every one it left for you, adds the tracker row, and stops at submit. You press send.
7. **Write.** Sound like yourself in every message. Emails, LinkedIn messages, cover letters, form answers, replies to recruiters: Hope drafts them in your own voice and learns from every edit you make. Each draft is saved to a file. You send.
8. **Interview.** Walk in prepared. The moment a call is known, you get a reminder to record it with your prep inside, a prep file, and prep blocks if you want them. After the call: a transcript made on your machine, a debrief with a question-by-question read, and the follow-up draft.
9. **Sync.** Start each day knowing what changed. Hope reads your email and LinkedIn (read-only), updates your tracker, and tells you what changed and what needs you.
10. **Tracker.** One place for the whole hunt. One spreadsheet you own: every role, its status, the next action, and dated notes. Ask where you stand and what needs you.

<!-- IMAGE: portfolio-hero -->
<p align="center"><img src="assets/readme/portfolio-hero.png" alt="A finished Hope portfolio website, shown in its light theme and its dark theme side by side" width="720"></p>

## The promises

These hold in every skill, every time. They are written down in [`references/hard-rules.md`](references/hard-rules.md).

- **Hope never sends anything in your name.** It drafts, fills, and saves, then stops. You press send. The one exception is yours to make: say "submit it" for one specific application, and Hope clicks submit after showing you the final review.
- **LinkedIn and email are read-only.** Hope reads them. It never messages, connects, likes, replies, forwards, or deletes.
- **It never invents a fact about you.** Numbers, dates, titles, and names come from your files or your own words. Not on file means it asks.
- **It never enters passwords or document numbers.** Passwords, payment details, SSN, passport and visa numbers: Hope stops and hands that step to you. It never creates accounts.
- **Legal checkboxes are yours.** Hope leaves agreements, attestations, and consent boxes for you, and lists them in the answers file.
- **Your data stays on your machine.** `career.json`, `job-tracker.xlsx`, and `applications/` never leave it. Only the portfolio you choose to publish goes online.
- **Every call gets a "record this one" reminder.** The moment a call is known, Hope tells you to record it and sets the reminder, with a note on when to ask the other person first.

## Your data stays yours

Your facts live in one file on your computer: `career.json`. Hope keeps a small notebook too: `user-story.md`, how you like to work. Your hunt lives in the same folder:

- `job-tracker.xlsx`: the tracker. Every role, its status, the next action, dated notes.
- `applications/`: your application profile, plus one folder per role with the posting, the answers entered, your drafts, and your interview notes.
- `HUNT-PROTOCOL.md`: your settled facts, your rules, and what Hope learned from your corrections.

All of it is yours: open it, edit it, delete it. **No tracking. No accounts. Nothing leaves your machine** except what you choose to put out: the portfolio you publish, and the applications and messages you send.

<!-- IMAGE: data-stays-home -->
<p align="center"><img src="assets/readme/data-stays-home.png" alt="One laptop with a file labeled career.json inside it, and a clear cue that nothing leaves the machine: no cloud, no arrows out" width="420"></p>

## How to use it

Hope ships as a one-command plugin for **[Claude Code](https://claude.com/claude-code)**, but it's just plain skills and scripts, so **any capable AI agent can run it.**

- **Claude Code / Claude desktop**: install in one command:
  ```
  /plugin marketplace add oneconsciousness/job-hunt-with-hope
  /plugin install hope@hope
  ```
- **Any other agent** (OpenAI Codex, Cursor, GitHub Copilot, Gemini, Windsurf…): point it at this repo and say **"run my job hunt with Hope."** It reads the skills and follows them.

Then, in a fresh chat in an empty folder:

1. Say **run my job hunt with Hope.**
2. Hand it whatever you have: an old résumé, your LinkedIn, your GitHub, a folder of files, or just talk. Hope meets you, builds your career file and your application profile, and sets up your hunt folder. From there it walks you to your portfolio and your live link.

> **What you need:** any capable AI agent (most have a free tier or a paid plan). Hope itself is free.

<!-- IMAGE: how-hope-works -->
<p align="center"><img src="assets/readme/how-hope-works.png" alt="Four steps left to right: what you have, Hope reads it, your portfolio, your link" width="680"></p>

### The daily rhythm

Once you are set up, say **run my job hunt with Hope** each morning. Start picks up where you left off.

1. **Sync.** Hope reads your email and LinkedIn and updates your tracker.
2. **Reply and apply.** Anything that needs an answer gets a draft in your voice. New links you found get applied. You press send.
3. **Prep.** Every call gets a record reminder and a prep file.
4. **Once a week:** a tracker report, a fresh sweep for new roles, and a look at what you corrected, so it gets written down.

## Built for a smaller model

Hope 2.0 was written so Claude Sonnet can run every step. Each skill uses short steps, exact file names, and a check after each step. Scripts do the mechanical parts, so the model does not have to improvise: fetching a job posting, sweeping job boards, updating the tracker, writing calendar files, and transcribing calls.

## How to update

- **Your portfolio:** say **update my portfolio**. Hope asks what changed (your story, the look, what's featured) and offers the newest features. Then say **publish the changes**: same page, same link.
- **Hope itself:** rerun the install. In Claude Code:
  ```
  /plugin uninstall hope@hope && /plugin install hope@hope
  ```
  (with another agent, re-pull this repo.) Then start a fresh chat so the newest Hope loads. Nothing is lost: everything lives in your folder, and Hope hands you a short summary to carry into the new chat.

## What changed in 2.0

Hope 2.0 is rebuilt from a real job hunt its maker ran with an AI partner. The skills now match how that hunt actually worked.

- **Ten skills that match a real hunt.** New: Start, Write, Interview, Sync, and Tracker. Rewritten: Onboarding, Find jobs, and Apply. Portfolio and Publish got a plain-English pass.
- **Three skills retired: Skill Gap, Proof Projects, and Dashboard.** The real hunt never used them. The tracker replaced the dashboard, and an honest fit read for each role now lives inside Find jobs and Apply. They are kept in [`skills-roadmap/retired/`](skills-roadmap/retired/), so nothing is lost.
- **Nothing breaks if you used 1.5.** Your career file and your portfolios are unchanged. Run onboarding again to build your application profile and your hunt folder.

The full list is in [`CHANGELOG.md`](CHANGELOG.md).

## Who made this, and why

I built Hope while job-hunting myself. It's been evolving since 2023, born inside my startup **CareerX, Inc.** on early ChatGPT, rebuilt across many models and stacks since, and grown into **Agent Hope, an agentic career manager for humans**. This skill, runnable by whatever AI you already use, is its best form yet. Tools that do good should meet people wherever they are, so Hope is free, and it stays that way.

## How to contribute

Found something broken, or want to build on Hope? **Reach out on LinkedIn: [in/arunganpa24](https://www.linkedin.com/in/arunganpa24).**

If you work with a coding agent, [`CONTRIBUTING.md`](CONTRIBUTING.md) is written for it, and the design and voice that make Hope feel like Hope live in [`references/`](references/).

## Like it?

**Leave a ⭐ on this repo and share the link.** Every share puts a free portfolio within reach of someone who needs work.

## License

MIT. See [`LICENSE`](LICENSE). Free to use, change, and share. Hope stands on the work of others. See [`CREDITS.md`](CREDITS.md).

---

If you need work, point your AI at this and start.
