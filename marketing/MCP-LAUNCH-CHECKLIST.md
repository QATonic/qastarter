# QAStarter MCP Launch Checklist

Ship day: day you decide to press go. Everything in `marketing/` is drafted; this is the sequencing.

## Day 0 (soft launch)

- [x] `/mcp` page live at https://qastarter.qatonic.com/mcp
- [x] `@qatonic_innovations/qastarter-cli@1.2.0` on npm
- [x] MCP nav link + "NEW" pip in site header
- [x] Landing-page hero banner linking to `/mcp`
- [x] `marketing/devto/04-mcp-launch-article.md` — `published: true` so dev.to syndicates via the GitHub sync

## Day 1 — dev.to + LinkedIn

- [ ] Dev.to article auto-publishes (via your GitHub → dev.to sync)
- [ ] Share the dev.to URL on LinkedIn personal account using `marketing/linkedin/05-mcp-launch-post.md`
- [ ] Also post it on the QATonic Innovations company page
- [ ] Monitor comments for 2 hours — respond to every question within 10 min for the first hour

## Day 2 — Twitter/X

- [ ] Post `marketing/twitter/03-mcp-launch-thread.md` (7 tweets)
- [ ] Quote-retweet from @QATonic_Innov and @qatonic if separate handles
- [ ] @mention of Anthropic / Claude / Cursor if appropriate

## Day 3 — Reddit (one sub at a time, one per day)

- [ ] r/QualityAssurance — post from `marketing/reddit/06-mcp-launch-post.md`
- [ ] Day 4: r/softwaretesting
- [ ] Day 5: r/ClaudeAI (different angle — already drafted)
- [ ] Day 6: r/cursor
- [ ] Do **not** crosspost word-for-word — each sub gets its own angle

## Day 7 — Product Hunt (optional)

- [ ] If dev.to + reddit have produced engagement, do a PH launch — the listing template is at `marketing/producthunt/listing.md` (update it for MCP)
- [ ] Fire off launch notification to your email list 2 hours before PH goes live

## Ongoing

- [ ] Submit to the MCP awesome list (`marketing/github/01-awesome-list-prs.md` — update text for QAStarter MCP)
- [ ] Watch telemetry at `/api/v1/stats` for the `source: mcp` tag — after 2 weeks, compare to `source: web` combo picks and write a follow-up post on the divergence.
- [ ] If a combo is being picked disproportionately often by AI clients, invest in that template's docs + sample tests before anything else.

## If something goes wrong

- **429 at launch** — raise `RATE_LIMIT_GENERATE_MAX` via env; we set `RATE_LIMIT_MCP_GENERATE_MAX=100` for trusted MCP clients.
- **Someone breaks the /mcp page** — it's a static React page; revert the last commit and the Cloudflare CDN can serve the prior build for ~5min.
- **npm package issue** — `npm deprecate @qatonic_innovations/qastarter-cli@1.2.0 "<msg>"` and publish 1.2.1 with the fix. CLI's `update` command handles the bump on next invocation.
