# Content Calendar — The Weekly Rhythm

> The `GROWTH-PLAYBOOK.md` says *what* to do over 12 months. This doc says
> *when*, *week by week*. Pin this in your calendar. 90 min / weekday is
> enough if you stick to it.

---

## The daily 15-minute minimum

Every workday, before anything else — **15 minutes**, no exceptions:

| Day | Task | Outcome |
|---|---|---|
| Mon | Reddit: scroll r/QualityAssurance + r/softwaretesting new posts; leave 1 genuinely helpful comment | Presence; non-promotional |
| Tue | LinkedIn: comment on 3 posts from QA creators you follow | Build a face in the community |
| Wed | Answer 1 Stack Overflow question in `[selenium]`, `[playwright]`, or `[cypress]` — only link QAStarter if it's the literal correct answer | SEO + credibility |
| Thu | Triage GitHub issues + reply to any `@qatonic_innovations/qastarter-cli` npm-package issue | Retention of existing users > acquisition |
| Fri | Review the week's analytics (GitHub stars, npm downloads, visitors) — write a 3-line note in `marketing/WEEKLY-NOTES.md` | Forces honest evaluation |

That's it. If you do nothing else this week, you still showed up.

---

## The weekly 90-minute block

One deep-work block per week where you ship the week's *artifact* (see
GROWTH-PLAYBOOK Pillar 5). Rotate through these week types on a
4-week cycle:

### Week A — Long-form article

Pick a topic from `marketing/seo/keyword-targeted-pages.md` or
`GROWTH-PLAYBOOK.md` artifact ideas. 90 min:
- 20 min: outline + key points
- 45 min: draft
- 15 min: code/config examples, screenshots
- 10 min: publish to dev.to with canonical URL pointing to qastarter.qatonic.com/blog/...

Fan-out afterward (15 min Sat morning):
- LinkedIn: 3-paragraph summary + link
- Twitter: 5-tweet thread pulling the key points
- Reddit: only if the article directly answers a sub's recent question

### Week B — Short video

60–120 seconds, filmed on your phone or Loom. Topics:
- "Generate a Playwright TypeScript project in 60 seconds"
- "Ask Claude to scaffold your next test framework (MCP demo)"
- "From zero to green k6 load test in 5 minutes"
- "Why I stopped writing `pom.xml` by hand"

90 min:
- 20 min: script (3 beats: problem → demo → outcome)
- 30 min: record (3 takes usually enough)
- 30 min: edit (DaVinci Resolve or CapCut, free)
- 10 min: publish to YouTube + upload to Twitter/LinkedIn natively

### Week C — Open-source contribution

Spend 90 min giving back to the frameworks we sit on top of. This is
the quietest growth lever: framework maintainers notice.

- Open a PR to Playwright / Cypress / Selenium / REST Assured docs
  fixing a typo or adding an example
- Answer a GitHub discussion on a framework repo
- Submit QAStarter to one awesome-list (full list in GROWTH-PLAYBOOK)
- Write a framework integration blog cross-posted to their community

No link-dropping. Be a useful contributor. Our profile links back to QAStarter.

### Week D — Ambassador / partnership outreach

90 min talking to humans:
- Email one ambassador (from the list of 10 in GROWTH-PLAYBOOK) with a
  specific, researched ask — "I noticed your last video used
  Selenium 3 syntax; our `qastarter update` would modernize this in
  one command. Want me to record the demo?"
- Follow up on 2 previous conversations
- Post in QA Slack / Discord communities (Ministry of Testing, TestGuild
  Discord, SDET Unicorns Telegram) — *answer questions*, don't
  broadcast

One ambassador win per month is the realistic target.

---

## The quarterly cycle

Every 12 weeks (roughly end of March, June, September, December) block
half a day:

1. **Review analytics** — visitors, stars, npm DLs, MCP installs.
   Which artifacts drove traffic? Which channels plateaued?
2. **Update PRODUCT-SNAPSHOT.md** — if the numbers changed, everything
   downstream must.
3. **Update GROWTH-PLAYBOOK.md** — mark completed items, re-score the
   next 90 days.
4. **Cut something that isn't working** — if a channel hasn't grown in 3
   months, stop posting there. Redirect that energy.
5. **Retrospective blog post** — "What we learned at QAStarter in Q2."
   Transparent numbers. People *love* these.

---

## The "first 12 weeks" concrete schedule

Use this exact schedule for the first quarter while you build muscle.
Copy into your calendar.

### Week 1 — Foundation

- Mon (15m): 3 MCP registry submissions (mcp.so, Smithery, awesome-mcp)
- Tue (90m): **Artifact — Week A**: Publish dev.to article "I shipped
  an MCP server for QA scaffolding. Here's what I learned" (canonical:
  /blog/building-qa-mcp)
- Wed (15m): LinkedIn: 3 comments on QA posts
- Thu (15m): SO answer in `[playwright]`
- Fri (15m): Analytics review + weekly note

### Week 2 — Visibility push

- Mon (15m): Open 3 awesome-list PRs (awesome-testing, awesome-playwright, awesome-nodejs)
- Tue (90m): **Artifact — Week B**: Record "QAStarter in 60 seconds"
  YouTube video. Upload. Cross-post natively to LinkedIn.
- Wed (15m): Reply to YouTube comments
- Thu (15m): Triage GitHub + answer any MCP issue
- Fri (15m): Analytics review

### Week 3 — Community

- Mon (15m): r/QualityAssurance — comment on 2 threads
- Tue (90m): **Artifact — Week C**: Open a docs-PR to Playwright repo
  (something genuinely useful). Mention in commit message: "noticed
  while building QAStarter templates — happy to help."
- Wed (15m): SO answer in `[selenium]`
- Thu (15m): LinkedIn comments x3
- Fri (15m): Analytics review + first monthly check-in

### Week 4 — Ambassador

- Mon (15m): Research 2 ambassador candidates in detail (read their
  last 10 posts, find a specific ask)
- Tue (90m): **Artifact — Week D**: Email both. Follow up on any prior
  thread.
- Wed (15m): LinkedIn comments x3
- Thu (15m): SO answer
- Fri (15m): Analytics review. **Month-1 retrospective note** — 5
  lines, blunt.

### Weeks 5–12

Repeat the A-B-C-D cycle. By Week 12 you'll have shipped 3 articles,
3 videos, 3 upstream contributions, 3 ambassador pushes — 12
compounding assets. That's more than 95% of indie projects do in a
full year.

---

## Platform-specific posting rules

### Reddit
- 10:1 rule: 10 genuine comments before 1 self-promotional post.
- Best time for r/QualityAssurance: Tuesday 9am EST.
- Don't crosspost. Rewrite for each sub.
- Always include trade-offs ("here's what QAStarter doesn't do") —
  honest > hyped on Reddit.

### LinkedIn
- Native video > linked video (3-5x reach).
- Carousel PDFs with 5-8 slides get the most engagement.
- Post Tuesday or Wednesday 7-9am in your audience's TZ.
- Personal account (founder face) outperforms company page 10:1.

### Twitter / X
- Threads 5-7 tweets long. First tweet is the whole point.
- Include a small image in tweet 1 (dashboard screenshot, demo gif).
- Post between 9-11am EST on weekdays.
- Reply to framework maintainers' tweets thoughtfully (they notice).

### YouTube
- Thumbnail + title matter more than the video. Spend 15 min on each.
- First 15 seconds retain 80% of churn. No long intros.
- Description: include timestamps, links to QAStarter, npm, GitHub.
- Pin a comment with the one-liner call-to-action.

### Dev.to / Hashnode
- Front-matter `canonical_url: https://qastarter.qatonic.com/blog/...` so Google gives us the credit, not dev.to.
- Series tag ("QAStarter templates deep-dive") compounds reader retention.
- Respond to every comment within 24 hours for the first week.

### GitHub
- README matters more than any blog post. Ours should be the best in the category.
- README should have: demo gif in the first 20 lines, install command, link to docs, 3 example commands.
- Issues: respond within 48 hours even if just "seen, will triage this week."

---

## Tools you need (all free tiers work)

| Purpose | Tool |
|---|---|
| Analytics | [Plausible](https://plausible.io) free tier or [Umami](https://umami.is) self-hosted |
| Email outreach tracking | [Hunter.io](https://hunter.io) free tier + a Google Sheet |
| Scheduled posting | [Buffer](https://buffer.com) free tier (3 channels × 10 scheduled posts) |
| Screenshot / GIF | [CleanShot X](https://cleanshot.com) (paid) or [LICEcap](https://www.cockos.com/licecap/) (free) |
| Video editing | [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve) (free) or [CapCut](https://capcut.com) (free) |
| Keyword research | [Google Keyword Planner](https://ads.google.com/home/tools/keyword-planner/) (free with Ads account) + [Answer The Public](https://answerthepublic.com) free tier |
| SEO monitoring | [Google Search Console](https://search.google.com/search-console) + [Ahrefs Webmaster Tools](https://ahrefs.com/webmaster-tools) (free) |
| Newsletter | [Buttondown](https://buttondown.com) free tier up to 100 subscribers |

Total cost in year 1: $0. Upgrade only when volume justifies it.

---

## Red lines

- If you skip the 15-min daily for more than 3 days, you're off the wagon — do not try to "make it up" with a 2-hour burst. Just restart the next day.
- If you catch yourself posting the same thing to 4 channels in a row, stop. You're broadcasting, not communicating.
- If analytics haven't moved in 30 days, don't post *more* — figure out *why* they haven't moved. Growth problems are information problems first.

---

## The attitude

Every person you reach is someone whose Monday morning just got 30
minutes easier because they didn't have to configure `tsconfig.json`
for the 47th time.

The tool is the gift. Distribution is just making sure more QAs find it.
