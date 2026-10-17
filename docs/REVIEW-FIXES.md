# Repository review fixes

All ten findings from the 17 October 2026 review have been addressed.

| Finding                          | Change                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAPI access controls          | HTTPS connections validate the actual DNS answers used by the socket. Private/reserved addresses, mapped loopback addresses, redirects, URL credentials, and external/file references are rejected. Internal references remain supported.                                       |
| Template cache exhaustion        | The bounded compiled-template cache evicts older entries and treats cache-write failure as an optimization miss. Rendering no longer fails at 500 cached templates.                                                                                                             |
| Output serialization             | Templates now use format-specific escaping for JSON, code strings, properties, CSV, INI, Robot Framework and Compose values. Credentials retain meaningful whitespace. Python INI readers decode quoted values and disable interpolation.                                       |
| Empty Gradle wrappers            | Three empty JARs were replaced with the valid wrapper already used by the other Gradle 8.4 packs. ZIP and MCP extraction preserve executable launchers.                                                                                                                         |
| Incorrect MCP validation         | The API returns an explicit `data.valid` result while preserving legacy `isValid`. The CLI validates both response formats and rejects unexpected shapes.                                                                                                                       |
| Incompatible MCP requests        | GET generation, POST generation, previews, dependency lookup, validation and GitHub push share normalization and compatibility checks. Runner/build/pattern defaults depend on the framework. Utilities accept object, array or query-string forms.                             |
| Production readiness failures    | Originless requests proceed without CORS response headers. Allowed browser origins still receive the configured policy. Production HTTP hosts no longer tell WebKit to upgrade local assets to unavailable HTTPS endpoints; secure deployments retain the upgrade directive.    |
| YAML parsing and silent fallback | JSON/YAML is parsed as data inside the parser worker. A requested specification that cannot be loaded now produces a validation error instead of a successful archive containing unrelated static samples. Streaming, preview and GitHub delivery use the same generation path. |
| Ineffective resource limits      | Download deadlines cover DNS, TLS, headers and body consumption. Responses stop at the byte limit. Parsing runs in a worker with heap/stack bounds and is terminated at its deadline.                                                                                           |
| Missing CI gates                 | Lint/typecheck, client/CLI/server tests, strict template rendering, browser tests and generated-project checks are required before deployment. Coverage is generated before upload. CLI test/build scripts work on Windows and Unix.                                            |

Redis initialization now runs at startup. API, generation and GitHub rate limiters reuse that connection with separate counter namespaces. Compiled Handlebars functions stay in the local template cache because they are not serializable Redis values.

Additional verification exposed a TypeScript Playwright BDD variant with missing dependencies and outdated page-object calls. Its Cucumber dependencies, imports and hooks were corrected, and compilation plus Cucumber dry-run discovery were added to the CI matrix. MCP extraction also checks existing directory links before writing, replaces files atomically, and bounds extracted archive size.

## Compatibility notes

- OpenAPI inputs must be standalone specifications at public HTTPS URLs. Bundle external references before uploading or serving a specification. Redirecting URLs must be replaced with their final HTTPS location.
- Invalid runner/build-tool/pattern combinations return validation errors before rendering.
- Legacy validation clients can continue using `isValid`; current clients use `data.valid`.
- The `pom` query alias continues to mean `page-object-model`.

## Verification

| Automated suite                        | Result         |
| -------------------------------------- | -------------- |
| Server/shared                          | 779 passed     |
| React client                           | 63 passed      |
| CLI/MCP                                | 36 passed      |
| Production API and browser E2E         | 73 passed      |
| Template manifests and rendered output | 49 of 49 clean |

- Root server/shared regression suite and coverage, including security, cache, serialization, middleware and API contracts.
- React client tests and CLI tests/build, including real junction/symlink extraction regressions.
- TypeScript checking, lint and production build.
- Both template validators across all 49 packs with caching enabled.
- 73 API/browser E2E tests against the production build across Chromium, Firefox and WebKit.
- Syntax checks on 195 generated JavaScript/TypeScript files and 116 generated Python files using special-character inputs; Python INI and standard CSV credential roundtrips.
- Generated default TypeScript and BDD TypeScript compilation, JavaScript Jest discovery, WebdriverIO dependency loading, REST Assured Maven compilation and Python pytest collection. Cucumber dry-run discovery found six scenarios and 27 steps.

The follow-up lint cleanup removed all 296 warnings by replacing loose types, removing unused declarations, and correcting React dependencies and effect-driven state. Lint now requires zero warnings. Dependency search ignores canceled responses and derives loading state from the current request; configuration hydration uses lazy initialization.

The production Docker image was built and exercised with password-protected Redis and two application replicas. Checks cover non-root execution, originless readiness, ZIP generation, shared generation limits, independent API/GitHub counters, cache serialization, TTL expiry and scoped flushing. Temporary containers and their network are removed after verification. Run `npm run test:containers` after building the `qastarter:review-fixes` image; this check also runs in pull-request CI.

Production Compose now uses persistent volumes, enables caching, waits for Redis readiness, and authenticates Redis healthchecks. Docker build contexts exclude temporary audit projects and local agent state.
