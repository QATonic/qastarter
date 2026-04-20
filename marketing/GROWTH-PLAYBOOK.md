# QAStarter — Growth Playbook

> **Goal:** reach every QA engineer in the world, slowly and sustainably.
>
> "Slowly" is the point. Growth hacks die. Owned distribution compounds.
> This plan is a 12-month roadmap that privileges compounding assets
> (SEO pages, evergreen videos, integrations, ambassadors) over burst
> tactics (paid ads, influencer buys, viral stunts).

---

## Where we are (Month 0)

- Product: mature. 49 templates, CLI + MCP + web all shipping.
- Distribution: near-zero. Handful of dev.to posts, an un-promoted GitHub repo.
- Realistic audience: ~7 million QA / SDET / test engineers globally.
  - ~1 million actively googling tooling questions each month.
  - ~200k active on Reddit / LinkedIn / Twitter in QA circles.
  - ~50k content-creating testers (bloggers, YouTubers, speakers).
  - ~2k "super-connectors" whose single recommendation moves thousands.
- Our job: reach the 2k super-connectors first, then let them reach the rest.

---

## The 5 growth pillars

Every single tactic in this playbook rolls up to one of these. If an
activity doesn't map, don't do it.

### Pillar 1 — Own the search intent

QA engineers google the same 200 questions every week:
- "selenium java maven project structure"
- "playwright typescript example"
- "how to set up cypress"
- "pytest requests api testing example"
- "appium android test setup"
- "rest assured testng maven example"

Each of those is a QAStarter landing page waiting to exist. We already
have `marketing/seo/keyword-targeted-pages.md` — the list is good, the
pages don't exist yet. **Ship them.**

Compounding: a page ranked on page 1 brings 50-500 visitors/month
indefinitely. 40 pages × 200 visitors = 8,000/month passive traffic.

### Pillar 2 — Meet QAs where they already are

Don't build a new community. Show up, consistently, in existing ones.
The five that matter:

| Channel | Sub-community | Cadence |
|---|---|---|
| Reddit | r/QualityAssurance, r/softwaretesting, r/selenium, r/playwright, r/cypress, r/SoftwareEngineering | 1 genuine helpful comment / day + 1 post / month |
| LinkedIn | Follow 200 QA creators; comment thoughtfully on their posts | 3 comments / day |
| Stack Overflow | Answer top 10 unanswered questions/week in `[selenium]`, `[playwright]`, `[cypress]`, `[appium]`, `[rest-assured]` tags | 3 answers / week |
| GitHub | Open PRs to `awesome-*` lists; answer questions in framework repos' discussions | 1 PR or 5 comments / week |
| YouTube comments | Pin a thoughtful comment on new videos by QA creators (Automation Step by Step, Angie Jones, Rahul Shetty, etc.) | 1 / day |

No spam. No drops of "try QAStarter!" in every reply. The rule: **help
first, link only when directly asked or when the link genuinely solves
the question.**

### Pillar 3 — AI-native distribution (the structural advantage)

Here's the unfair advantage the team just shipped: **QAStarter speaks MCP**.

Every engineer who configures QAStarter in Claude Desktop / Cursor /
Windsurf becomes a distribution node. They don't share links; they say
"just type 'scaffold me a Playwright project' to Claude" — and their
teammate configures it, and now it's two people.

**What to do:**

1. **Pre-launch the MCP integration** to every MCP registry:
   - [x] npm package is published (`@qatonic_innovations/qastarter-cli`)
   - [ ] Submit to [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) awesome list
   - [ ] Submit to [Smithery](https://smithery.ai) MCP registry
   - [ ] Submit to [Claude Hub](https://claudehub.com) if live
   - [ ] Submit to [mcp.so](https://mcp.so) directory
   - [ ] Cursor's [docs.cursor.com/mcp](https://docs.cursor.com/mcp) — open PR adding us as an example
2. **Blog post on Anthropic's dev.to / Discord**: "Building an MCP server for QA scaffolding — lessons learned"
3. **Demo video**: 60 seconds of Claude scaffolding a project end-to-end. Every AI YouTuber will cover it if it's visibly magic.

### Pillar 4 — Community + ambassadors

We need 10 "QA influencers" who recommend QAStarter organically. Here's
how to earn them, not buy them:

1. **Make their life easier.** Offer each of them custom onboarding:
   "Hey Rahul, if you'd like, I can add a `qastarter new --preset
   rahul-shetty-course` that matches your course's stack exactly." They
   get a free ongoing integration, we get recommendations in course videos.
2. **Send swag that they want.** A well-designed sticker + a hand-written
   note beats a t-shirt they'll never wear.
3. **Co-author one post.** "Rahul Shetty and I spent an afternoon
   building a complete RestAssured + TestNG CI pipeline. Here's what
   we learned." Their audience finds us; we hand them content that
   makes their brand look good.

Priority ambassadors to approach (in order):

| Name | Reach | Angle |
|---|---|---|
| Angie Jones | 100k+ | "First QA-native MCP" — speaks to her AI-in-testing beat |
| Rahul Shetty | 1M+ YouTube | Free scaffold that matches his Udemy stack |
| Joe Colantonio (TestGuild) | 60k podcast listens/mo | Interview-style podcast episode |
| Automation Step by Step | 400k YouTube | "60-second setup" shorts — her format exactly |
| Mihai Parparita (Appium core) | Framework maintainer | Get us mentioned in Appium docs as "quickstart tool" |
| Michael Bolton / James Bach | Exploratory testing elders | Not our direct audience but their endorsement moves conversation |
| Lisa Crispin | 50k | "Agile testing" angle; she reviews testing tools |
| Gil Zilberfeld | 20k | European QA conference circuit |
| Patrick Lumumba (K6 / Grafana Labs) | Growing | Performance-testing angle via k6 template |
| SDET Unicorns / Artem Bondar | 30k+ Telegram | CIS region reach |

### Pillar 5 — Compounding content assets

One piece of content, deployed five ways, lives five years. Stop writing
one-off tweets. Every week ship one *artifact* and fan it out:

```
                Week's artifact (pick one)
                        │
     ┌──────────────────┼──────────────────┐
     │                  │                  │
  Blog post        YouTube video      OSS contribution
  (1500 words)     (5-10 min)        (framework repo,
                                      awesome list, etc.)
     │                  │                  │
     ▼                  ▼                  ▼
  Dev.to + Medium   YouTube + shorts   GitHub star magnet
     │                  │
     ▼                  ▼
  LinkedIn article  Twitter thread
     │                  │
     ▼                  ▼
  Newsletter       Reddit TIL post
```

**Artifact ideas that compound (24 months of content):**

- "How I set up Playwright with TypeScript, Jest, Docker, GitHub Actions in 60 seconds" × one per testing-type/framework combo = **49 possible pieces**
- "The pom.xml every Java QA engineer should start from" (comparison: ours vs. naive vs. Maven archetype)
- "I audited 8 test-automation starter templates. Here's what most get wrong." (real comparison: ours, Maven archetypes, official framework quickstarts)
- "What's actually in your `node_modules` when you `npx playwright install`?" (deep-dive that indirectly shows we've done the homework)
- "Setting up Appium on M1/M2 Mac in 2026" (evergreen — Apple Silicon users suffer this forever)
- "From 0 to k6 load test in 5 minutes" (performance testing is under-tooled — we lead here)

---

## The 12-month roadmap

### Months 1–3: Foundation (we are here)

**Goal:** stop leaking traffic. Every visitor to qastarter.qatonic.com
should see polished messaging; every mention on social should have a
clean landing page to convert on.

- [x] Product: stable CLI + MCP + web
- [x] PRODUCT-SNAPSHOT.md — single source of truth for messaging
- [ ] Ship 10 SEO pages from `marketing/seo/keyword-targeted-pages.md`
  (targeting: 100 visitors/month each by Month 6)
- [ ] Publish `/docs` rewrite with task-based structure ("How do I
  generate a Cypress TS project?") rather than feature-based
- [ ] Post dev.to launch article (01) — already drafted, just flip `published: true`
- [ ] Post MCP launch article (04) — already done ✅
- [ ] Submit to 5 MCP registries (list above)
- [ ] Open 5 awesome-list PRs (awesome-testing, awesome-nodejs, awesome-selfhosted, awesome-claude, awesome-mcp)
- [ ] Set up plausible.io / umami analytics so we can actually see if any of this is working
- [ ] First Product Hunt launch (Tuesday 12:01am PT is the magic slot) — `producthunt/listing.md` is drafted
- [ ] First YouTube video: "QAStarter in 60 seconds" — highest-leverage single piece of content we can make

**Success metric for Month 3:** 1,000 GitHub stars, 500 weekly npm
downloads on the CLI, 50 MCP server installations. Not viral numbers —
foundational ones.

### Months 4–6: Amplification

**Goal:** turn "the product exists" into "QAs have heard of it."

- [ ] Weekly dev.to / LinkedIn article rhythm (1 per week)
- [ ] 30 awesome-list / framework-docs PRs submitted
- [ ] 10 ambassador conversations started (from table above)
- [ ] Guest post on TestGuild / Ministry of Testing / LambdaTest blog
- [ ] YouTube: 3 more long-form videos (one per top framework: Selenium, Playwright, Cypress), 12 shorts
- [ ] SEO pages ramp to 25 published
- [ ] First conference talk submitted: TestCon, SeleniumConf, AppiumConf — "Scaffolding production-ready QA frameworks in seconds"
- [ ] Reddit: 3 high-quality long-form posts (not promotional — genuinely
  helpful with a footer link), one per major sub (r/QualityAssurance,
  r/selenium, r/programming)
- [ ] First paid experiment: $500 on Google Ads targeting exact keyword
  matches ("playwright typescript starter", etc.) to test conversion
  rate. NOT to scale — to learn if CAC makes sense.

**Success metric for Month 6:** 5,000 stars, 2,500 weekly npm downloads,
10,000 unique monthly web visitors, 3 public ambassadors mentioning QAStarter.

### Months 7–9: Ambassador & partnership flywheel

**Goal:** QAs start recommending QAStarter to other QAs without our prompting.

- [ ] Launch `qastarter-ambassadors` program: free hosted docs, swag, early
  access to new templates, co-marketing. Target: 20 active ambassadors.
- [ ] Co-author content with 3 ambassadors (podcast episode, joint
  YouTube demo, co-signed LinkedIn article)
- [ ] Sponsor 1 podcast ($1–2k slot on TestGuild or similar)
- [ ] First conference talk delivered
- [ ] "QAStarter in Production" case study series — 5 interviews with
  real QA teams (even if small) using it day-to-day
- [ ] Localization: translate landing page + CLI into Hindi, Portuguese,
  Mandarin. India, Brazil, China each have >500k QAs.
- [ ] Integration partnerships: get listed on BrowserStack, LambdaTest,
  Sauce Labs "integrations" pages (we support their cloud-device config
  out of the box — lead with that)

**Success metric for Month 9:** 15,000 stars, 10,000 weekly npm downloads,
30,000 MAU on web, 50 MCP installs/week, 5 public case studies.

### Months 10–12: Compounding

**Goal:** marketing runs itself. Most new users come from SEO + word of
mouth, not from us posting.

- [ ] SEO pages: 50 published, ranking page 1 for at least 20 keywords
- [ ] YouTube channel: 15 long-form videos, 50 shorts
- [ ] 2–3 paid sponsorships of QA newsletters (DevRel Weekly,
  TestGuild, Ministry of Testing)
- [ ] First-party QAStarter newsletter (weekly, "this week in QA tooling")
- [ ] Partner integration: official tutorial on Playwright.dev or
  Cypress.io docs ("Starting a new project? Use QAStarter.")
- [ ] 1-year retrospective blog post — transparent metrics, lessons
  learned. Always performs well, even when numbers are humble.

**Success metric for Month 12:** 50,000 stars, 50,000 weekly npm downloads,
100,000 MAU, 20+ conference / podcast mentions, 1 company quoting us in
their hiring post ("experience with QAStarter a plus").

---

## The leverage hierarchy (do these in order)

If you only have 1 hour this week, spend it on the highest-leverage
thing that isn't done yet. In rough order:

1. **SEO pages** — each one is infinite compounding traffic
2. **MCP registry submissions** — zero ongoing cost, permanent discoverability
3. **Awesome-list PRs** — zero cost, permanent backlink, minutes to write
4. **One dev.to post per week** — already drafted, just ship
5. **One YouTube video per month** — highest conversion of any medium
6. **Daily Reddit/LinkedIn commenting** — slow, compounds, humanises the brand
7. **Ambassador outreach** — needs human attention, but 1 win = 1000 users
8. **Paid ads** — only to validate messaging, never as the growth lever

---

## Anti-patterns — things NOT to do

- ❌ **Buying followers or ratings.** Gets detected, kills credibility. QAs especially notice.
- ❌ **Posting the same content across 10 subreddits the same day.** Instaban + you look desperate.
- ❌ **Writing "QAStarter is the BEST tool!" self-congratulatory content.** QAs are professional skeptics. Let users say it.
- ❌ **Shipping features to chase press.** Every PR decision should serve existing users first.
- ❌ **Hiring a marketing agency in year 1.** They'll generate generic SaaS content that doesn't speak our audience's language. Do it yourself until you know what works, then hire.
- ❌ **Launching on every channel at once.** Pick 3. Master them. Add one per quarter.
- ❌ **Tracking vanity metrics.** Twitter followers ≠ users. npm weekly downloads, GitHub stars, weekly active web users, MCP installs — those move revenue equivalent.

---

## When to revisit this plan

- **Every 90 days:** re-score the roadmap. Move completed items to a CHANGELOG. Add new tactics from what's working.
- **When a channel stops working:** cut it. Don't keep posting to an empty room.
- **When a new distribution surface emerges:** Cursor-specific stores, new MCP marketplaces, Anthropic feature launches — react within 30 days.
- **When revenue becomes a factor:** pricing, enterprise tier, etc. rewrite this doc from scratch — the calculus changes when you have a paid product to protect.

---

## Closing thought

The goal isn't to get every QA engineer to sign up in 2026. It's to
build something that, ten years from now, a senior QA engineer mentors
a junior and says "oh, you're setting up your first framework? Just use
QAStarter." That's won when the tool is boring infrastructure, not when
it's trending.

Slow and sustainable. Ship one compounding thing a week. Nothing else
matters.
