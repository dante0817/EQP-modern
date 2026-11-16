# EQP Modern PRIMER — Independent Local Verification

Verification session: 16–17 November 2026, Asia/Manila (UTC+8).

## 1. Executive summary

**Final verdict: CONDITIONAL ACCEPTANCE.**

The authorized local research-assisted drafting workflow executed successfully after targeted corrections: actual Chromium navigation, authentic source collection/import, deterministic extraction, reviewed transfer, narrative synchronization, immutable revisions, review invalidation, HTML/PDF exports, and ZIP export/reimport. Final TypeScript and production build checks pass; **169/169 automated tests pass**, with zero failures, cancellations, or skips.

**10 confirmed defects or local-acceptance configuration gaps were corrected**, grouped in section 13. The PLOT solver and location-controller source files were not changed. No operational event files or station datasets were used as writable test stores.

Both final PDFs were opened by a PDF parser and rendered with Poppler. All **19 pages** were visually inspected as page images: public draft **9 pages**, scientific review **10 pages**, both A4 portrait. All four figures are visible; all **82 historical table rows** are present in both HTML and both PDF exports. Final browser replay captured no uncaught frontend exceptions or console errors.

Acceptance remains conditional on operator scientific review of the populated and pending fields, reconciliation of the authentic PHIVOLCS magnitude-label discrepancy, and the explicit limits below. Gemini live functionality is **BLOCKED — NO GEMINI API KEY**. This report does not confer institutional scientific approval or publication authorization.

## 2. Local environment and repository baseline

| Item | Observed result |
|---|---|
| Repository | `Y:\OFFICE\IPP\2026\PROG\EQP\EQP modern\earthquake-processor-(eqp)-15` |
| Source-control metadata | No `.git` repository; `git status` cannot establish a commit baseline |
| Local instructions | No applicable `AGENTS.md` found in the repository or its parent directories |
| Node / npm | Node **v24.20.0**, npm **11.19.0** |
| Original package manager evidence | `bun.lock` present; `package-lock.json` absent; Bun not installed on PATH |
| Lock maintenance | Bun **1.4.4** invoked through `npx` for lockfile-only maintenance after the dependency correction |
| Browser | Bundled Playwright with actual Chromium **151.0.7922.34**, headless, fresh isolated browser contexts |
| PDF inspection | `pdfinfo`, `pdftoppm` and `unpdf`; Pillow used only to assemble page-image contact sheets |
| Supported runtime evidence | Installed Vite requires Node 20.19+ or 22.12+; local verification used Node 24.20.0. README uses 22.12+ as the documented baseline |

Initial hashes of all `src/`, `server/`, and `tests/` files are retained in `verification/baseline/source-hashes.json`. Original root configuration/server/documentation copies are retained in `verification/baseline/`; the server copy has a `.original` suffix so TypeScript does not compile a duplicate server from the evidence folder.

## 3. Inspected source and architecture

Application entry: `index.html` → `src/main.tsx` → `src/App.tsx`.

Server: `server.ts`, Express HTTP server with Vite middleware in development, `dist/` static serving in production, and `/api/live` WebSocket handling. Development command: `npm run dev` (`tsx server.ts`). Static check: `npm run lint` (`tsc --noEmit`). Tests: Node test runner with tsx across 26 test files.

Reviewed the six supplied PRIMER reports: `PRIMER_FINAL_INTEGRATED_ACCEPTANCE.md`, `PRIMER_RESEARCH_ASSISTANT_R0_AUDIT.md`, and the R1, R2, R3, and R4 final reports. Their feature descriptions correspond to existing components/helpers, but their historical test claims were not treated as present-session evidence.

Principal inspected files:

- `package.json`, `bun.lock`, `README.md`, `.env.example`, `tsconfig.json`, `vite.config.ts`, `server.ts`.
- `src/App.tsx`, `src/main.tsx`, `src/data/eqpData.ts`, `src/utils/eqpStorage.ts`, `src/utils/historicalSeismicity.ts`.
- `src/components/PrimerGeneratorPanel.tsx`, `PrimerStage3Panel.tsx`, `PrimerStage4Panel.tsx`, `PrimerResearchAssistantPanel.tsx`, `PrimerScientificReviewPanel.tsx`, `OpenSolutionExplorerModal.tsx`.
- `src/utils/earthquakePrimer.ts`, `primerMapFigure.ts`, `primerPresentation.ts`, `primerSequenceIntegration.ts`, `primerCatalogAdapters.ts`, `primerScientificNarratives.ts`.
- `src/utils/primerResearchAssistant.ts`, `primerResearchExtraction.ts`, `primerResearchTransfer.ts`, source/findings/transfer store modules, and `researchUrlSecurity.ts`.
- `src/utils/primerRevisions.ts`, `primerRevisionArchive.ts`, `primerReviews.ts`, `primerReviewPackage.ts`; `server/primerResearchHelpers.ts`.
- Existing solver, historical-catalog, earthquake-primer, revision/review, and Research R1–R3 tests; four affected test files received focused regressions.

Relevant API groups include `/api/eqp/*`, `/api/bulletin/*`, `/api/stations`, `/api/places/*`, `/api/settings/*`, `/api/research/historical-catalog/*`, and `/api/primer/research/{gemini-capability,search,usgs-search,usgs-detail,fetch-url,import-file,extract-capability,extract-findings}`.

## 4. Dependencies, storage isolation, and startup

| Check | Status | Evidence |
|---|---|---|
| Original npm dependency resolution | **FAIL** | Vite 8.3.8 optional esbuild peer requires `^0.27.0 || ^0.28.0`; root requested `^0.25.0` |
| Corrected resolution | **PASS** | Root esbuild changed to `^0.28.2`; npm lock generated without bypassing peer checks |
| Clean installation | **PASS** | `npm ci`: 327 installed packages; npm audit at installation reported zero vulnerabilities |
| Existing Bun lock maintained | **PASS** | `npx --yes bun install --lockfile-only` saved the corrected lock |
| Development startup | **PASS** | `npm run dev`, port 3107, Express/Vite serving the actual application |
| Network bind | **PASS** | `Get-NetTCPConnection` confirmed `127.0.0.1:3107`, not `0.0.0.0` |
| Data isolation | **PASS** | `EQP_STORAGE_ROOT=verification/test-storage`, then `verification/test-storage-fixed`; separate fresh Chromium contexts |

Original server storage was hard-coded to `eqp_solutions` next to `server.ts`. The new optional `EQP_STORAGE_ROOT` preserves that default while allowing test-only storage. Station/place/catalog initialization and test history writes were confined to the explicitly selected verification directories. No `eqp_solutions` operational store was altered.

Browser persistence: drafts and eligibility rules use localStorage. Research sources, findings, transfer audit records, immutable revisions, reviews, and correction requests have separate IndexedDB stores. Raw/source material in the test profiles consists of retrieved public material and explicitly identified synthetic controls.

Installation warnings concerned an upstream deprecated `node-domexception` package and npm's install-script policy notices. Development startup warned about future Vite native-config handling of `__dirname`; the build warned about bundle sizes above 500 KB. These warnings did not prevent execution.

Cleanup: the retained test browser contexts were closed and the test listener on port 3107 was stopped after verification. `verification/logs/service-cleanup.json` records `TestListenerStopped:true`. No test service was left exposed. Restart instructions are in `README.md`.

## 5. TypeScript, build, and automated tests

| Run | TypeScript | Automated tests | Production build |
|---|---|---|---|
| Independent baseline after setup correction | **PASS** | **165/165 PASS** | **PASS** |
| Affected suites after corrections | **PASS** | **48/48 PASS** | Covered by final full build |
| Final full repository checks | **PASS** | **169/169 PASS**; 0 failed, skipped, cancelled | **PASS**, 3.27 seconds in the final recorded run |

Four new test cases cover historical GeoJSON millisecond dates, Windows-1252 degree symbols with unchanged source-byte SHA-256, named volcano localities in intensity lists, and unavailable solver diagnostics for parameter-only records.

The first TypeScript invocation inadvertently included the copied baseline `server.ts` as a second source file. Renaming that evidence copy to `server.ts.original` removed the harness contamination; the clean baseline then passed. Intermediate correction runs also caught an incorrectly placed parser edit and an incorrect regression category assertion; both were corrected before the successful final checks. These are not represented as application-baseline failures.

Logs: `verification/logs/{npm-lock-resolution.log,npm-lock-resolution-fixed.log,npm-ci.log,bun-lock-update.log,lint-baseline-clean.log,tests-baseline.log,build-baseline.log,targeted-regressions-fixed.log,lint-final.log,tests-final.log,build-final.log,final-checks.json}`.

## 6. Real Chromium verification

| Workflow | Status | Actual observation |
|---|---|---|
| App load; Data/PLOT, Map, Bulletin, Intensity, Research, Primer navigation | **PASS** | Buttons exercised in Chromium; final replay captured no frontend exceptions or console errors |
| Manual primer generation and active parameter display | **PASS** | Actual Generate Primer action; displayed origin, coordinates, depth, and exact magnitude scale inspected |
| Automatic generation away from PRIMER | **PASS** | Eligible imported/seeded event created `auto-rule-draft` while Data was active |
| Eligibility and duplicate behavior | **PASS** | Below-threshold initial event did not auto-create; eligible event created once; helper repeat returned `existing-draft-preserved` |
| Stale PLOT solution | **PASS** | Synthetic control: edited BES P arrival through UI, enabled automatic drafting, and observed no saved draft |
| Solver interaction | **PASS**, bounded observation | PLOT clicked on the isolated synthetic control; no draft storage writes recorded during or after the run |
| Exact intermediate/pending-candidate GUI transitions | **NOT VERIFIED** | Solver is fast/synchronous; helper-level `isLocating` and `hasPendingCandidate` rejection executed, but every internal transition was not individually observed via GUI |
| Manual section/caption/settings edits | **PASS** | Section prose and caption edited, saved, and preserved after reload; document title/subtitle, layout controls, and new historical-row cap exercised |
| Saved drafts after reload | **PASS** | Original manual draft and final Bohol draft loaded with saved content; no duplicate on normal reload |
| Research panel navigation | **PASS** | Official Search, USGS Products, Imports, Source Library, Findings opened |
| Evidence references, comparison, transfer confirmation | **PASS** | Verbatim evidence/locators and Before/After destination shown; transfer disabled until checkbox confirmation |
| Unsupported transfer blocking | **PASS** | Core parameters, raw tsunami flag, ShakeMap/DYFI and PAGER findings showed unsupported/blocking explanations |

`verification/run-browser-regression.cjs` is a repeatable Playwright replay, using the bundled browser package through `EQP_PLAYWRIGHT_PATH`. It seeds the authentic parameter-only Bohol event by changing **only the test browser's module response**, not source files or operational records. Initial local `.eqp` file-picker import was also tested separately. Synthetic guard data is explicitly labelled and is not evidence of scientific accuracy.

Final replay evidence: `verification/logs/browser-final.json`, `browser-final-run.log`, `solver-ui-guards.json`, `browser-auto-guards.json`, `navigation.json`, and `draft-persistence.json`.

## 7. Actual HTML/PDF visual inspection

Final files are under `verification/artifacts/final/`:

| Artifact | Size | Inspection result |
|---|---:|---|
| `bohol-public.html` | 201,491 bytes | **PASS**, opened in Chromium; 4 SVG figures, all 82 historical IDs; internal ledger hidden |
| `bohol-review.html` | 216,118 bytes | **PASS**, opened in Chromium; 4 SVG figures, all 82 historical IDs; internal ledger included |
| `bohol-public.pdf` | 739,119 bytes | **PASS**, 9 A4 portrait pages rendered and inspected |
| `bohol-review.pdf` | 748,203 bytes | **PASS**, 10 A4 portrait pages rendered and inspected |
| `bohol-review-package.zip` | 2,528,224 bytes | **PASS**, browser export/reimport and independent validator succeeded |

Inspected title, UTC/PST origin, Ms scale, 9.860°N/124.070°E, 12.0 km depth, distinct origin/update/catalog-cutoff timestamps, body text, section ordering, map/chart visibility, scale bars and legends, figure captions, repeated table headers, page margins, running headers/footers/page numbers, references, DRAFT labels, and unavailable-data qualifications. No blank scientific figures or body/table overlaps were observed in the final rendered set.

Public and scientific mode numbering differs because unsupported tsunami content is suppressed in public mode while the review copy retains its explicit unavailable-status discussion. Both remain drafts. A public draft with populated figures is not a scientifically complete release.

PDF extraction independently found **82/82 historical event IDs** in each PDF; the visual inspection was performed on actual PNGs, not inferred from PDF object counts. `verification/inspect-final.mjs` produces `verification/logs/final-artifact-integrity.json` and the extracted text files. `pdfinfo` confirmed A4 dimensions of **595.28 × 841.89 points**.

Historical table typography is compact; full-resolution pages are retained for operator review. Nearest-locality/generator and verified-PEIS fields remain explicitly pending where the parameter-only fixture supplied no corresponding verified entries. No missing observations were invented to fill those fields.

## 8. Screenshot and artifact locations

- Initial/defect screenshots: `verification/screenshots/01-application.png` through `08-revision-comparison.png`.
- Final browser screenshots: `verification/screenshots/final-primer.png`, `final-transfer-confirmation.png`, `final-solver-guard.png`, `final-public-html.png`, `final-review-html.png`.
- Original PDF renders and contact sheets: `verification/artifacts/pdf-pages/`.
- Final **19 individual page PNGs** and six inspection contact sheets: `verification/artifacts/final/pdf-pages/`.
- Authentic retrieved bytes: `verification/artifacts/bulletin.html`, `usgs.geojson`.
- Parameter-only test inputs: `verification/artifacts/2013_1015_0012_M72D012_B3.eqp`, `bohol-event.json`.
- Explicit synthetic input: `verification/artifacts/SYNTHETIC_NAVIGATION_FIXTURE.eqp`.
- Final research evidence and frozen export context: `verification/artifacts/final/research-evidence.json`, `verification/browser-state-final.json`.
- Artifact hashes: `verification/logs/final-artifact-hashes.json`.

Browser state files contain public/synthetic test data and are verification artifacts, not credentials or deployable application configuration.

## 9. Authentic Research Assistant end-to-end results

Authentic sources retrieved with HTTP 200:

1. [PHIVOLCS Earthquake Information No. 3, Bohol](https://earthquake.phivolcs.dost.gov.ph/2013_Earthquake_Bulletins/October/2013_1015_0012_B3F.html), **40,776 bytes**.
2. [USGS ComCat `usb000kdb4` GeoJSON](https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=usb000kdb4&format=geojson), **106,447 bytes**.

The requested earlier report referred to Bulletin 4. That exact bulletin was not established in this session; the retrieved primary bulletin is **B3**. B3 supplies 08:12:31 PST, 9.86°N/124.07°E and 12 km, but labels magnitude **Mw 7.2**. The requested **PHIVOLCS Ms 7.2 baseline** is also used in the agency's [earthquake-hazards material](https://www.phivolcs.dost.gov.ph/eartquake-hazards/). The fixture and subtitle explicitly disclose the distinction. USGS **Mww 7.1** was retained separately, never substituted for Ms.

| Required chain/check | Status | Evidence |
|---|---|---|
| ComCat lookup and product retrieval | **PASS** | Actual UI lookup of `usb000kdb4`; preferred magnitude and available/missing products displayed |
| Authentic document import | **PASS** | Actual HTML file-picker import of downloaded B3 bytes |
| Metadata and SHA-256 preservation | **PASS** | Stored USGS and bulletin hashes independently match saved original bytes |
| Event matching | **PASS** | USGS remains `probable-match`; unhinted local bulletin remains `insufficient-evidence`, not silently confirmed |
| Deterministic extraction and verbatim evidence | **PASS** | Final library produced 13 findings: 8 USGS, 5 bulletin; every supporting passage exists in stored extracted text |
| Conflicts | **PASS** | Real B3 Mw versus USGS Mww difference and reported-vs-modeled intensity distinctions displayed; no automatic winner selected |
| Unsupported destinations | **PASS** | Raw USGS tsunami flag, modeled loss/shaking, and core EQP parameter replacement blocked |
| Probable/ambiguous matching safeguards | **PASS** at domain/test layer; partial GUI coverage | Probable-match not promoted; unresolved local source blocked; ambiguous/manual-resolution edge cases covered by passing R3 tests |
| Explicit operator confirmation | **PASS** | Actual transfer remained disabled until checked |
| Stage 4 mapping | **PASS** | Authentic moment tensor NP1 39/46/77 transferred to `externalData.tectonic.evidenceReferences` as preliminary modeled evidence |
| Manual narrative preservation | **PASS** | Deliberate operator note survived transfer; removed only through explicit section sync |
| Provenance | **PASS** | Source/version, raw value/unit, quote/locator, hash, modeled basis, and operator transfer link retained |
| Revision creation/comparison | **PASS** | Two actual frozen revisions; changed subtitle detected, both revision checksums remain valid |
| Review invalidation | **PASS** | Revision 1 review becomes `outdated-newer-revision`; review never automatically carries to revision 2 |
| ZIP export/reimport | **PASS after fix** | Actual browser download and upload; independent validator returns `ok:true`, zero errors/warnings |

The final ZIP intentionally targets frozen **revision 1**, while standalone final HTML/PDF files represent the current **revision 2** draft. This exercises historical export without mutating its snapshot. The ZIP includes review/provenance data; raw R1 source documents remain outside it, as disclosed by the package notice. The complete saved source evidence is separately retained in the verification artifacts.

Final Stage 3 catalog: 650 retrieved records, **128** post-event spatiotemporal candidates, intervals **62/85/111/128** at 24 h/72 h/7 d/30 d, largest candidate **Mww 5.7**, and **82** historical M≥5 matches within 150 km and 50 years. Candidate membership is not a scientifically confirmed aftershock assignment. The catalog cutoff is the retrieval-time cutoff in November 2026, distinct from the October 2013 origin.

## 10. Gemini capability and live status

**BLOCKED — NO GEMINI API KEY.**

Only `.env.example` existed; the server process reported no configured Gemini key. Read-only capability endpoints returned `configured:false` / extraction `available:false`. Configured model string: **`gemini-4-hydrogen`**. Google Search tool and structured-extraction code exist; actual model availability, compatibility, grounding quality, quotas, and live extraction are **NOT VERIFIED**.

No billable probe was run. No source documents or restricted material were sent to Gemini. README was corrected to describe the actual `.env`/server-environment configuration rather than implying `.env.local` is automatically loaded by `dotenv/config`.

## 11. Scientific provenance and integrity assessment

**PASS within the verified local-draft boundary.** Original source-byte hashes match, supporting excerpts are present, review status remains local/unverified, and modeled products retain their epistemic classification. The USGS tsunami flag never becomes a PHIVOLCS advisory. ShakeMap, DYFI, and PAGER never become verified PEIS, casualties, or observed damage. Absent observations remain unavailable.

The parameter-only event contains no fabricated station picks, measured uncertainty, or solver convergence results. A confirmed output defect that previously printed zero RMS/uncertainty and free-depth wording for such a record was corrected. Synthetic station-pick controls were used only for behavior/security/negative tests.

Scientific completeness is separate from technical export success. The test primer has unresolved sources/PEIS/locality/response/advisory information and requires authorized specialist review. Its institutional-looking draft header is accompanied by explicit draft and unreleased notices.

## 12. Security and privacy

- **PASS:** development listener restricted to loopback; test storage separated through explicit configuration.
- **PASS:** no secret values printed or added to client code. Public browser maps-key plumbing is distinct from the server-only Gemini key.
- **PASS:** existing SSRF/private-IP/redirect, prototype-pollution, malicious SVG/HTML, and transfer-consent regressions passed in the full suite.
- **PASS:** browser source import/extraction did not autonomously call Gemini. Local imports retain restricted/local warnings and cannot silently become verified facts.
- **PASS:** frozen revision checksums and ZIP validation executed. These are local integrity aids, not tamper-proof audit storage or reviewer authentication.
- **NOT VERIFIED:** an adversarial penetration test of every server endpoint, multi-user deployment hardening, or institutional identity integration; these are outside the local acceptance evidence.

## 13. Confirmed defects and corrections

| ID | Reproduction / symptom | Responsible code and minimal correction | Final verification |
|---|---|---|---|
| D01 | Clean npm resolution rejects esbuild 0.25 versus Vite 8 peer | `package.json`: esbuild `^0.28.2`; update Bun lock and add npm lock | **PASS**, clean `npm ci`, TypeScript/build |
| D02 | Default dev listener is `0.0.0.0`; storage path cannot be redirected for isolated acceptance | `server.ts`: default `127.0.0.1`, optional `HOST` and `EQP_STORAGE_ROOT`; document usage | **PASS**, loopback socket observed and isolated storage populated |
| D03 | Authentic pre-2001 USGS events display years such as +022075 and are omitted from historical windows | `historicalSeismicity.ts`: consistent numeric threshold and explicit GeoJSON epoch-millisecond handling | **PASS**, new historical-date regression; real query historical count 20 → 82 |
| D04 | PDF long subtitle/footer clips; metadata keeps only first wrapped line; continuation header changes body font | `earthquakePrimer.ts`: wrap subtitle/metadata/footer, reserve number area, bound running header, preserve font state, measure callouts at actual font | **PASS**, all final page PNGs inspected |
| D05 | Four raster figures produce ~14.45 MB PDF, over ZIP 12 MiB entry limit; export throws uncaught | `earthquakePrimer.ts`: lossless PNG compression at embedding; `PrimerGeneratorPanel.tsx`: visible failure notice | **PASS**, ~0.74 MB PDFs, 2.53 MB ZIP and clean browser replay |
| D06 | Authentic Windows-1252 HTML degree symbols become replacement characters | `server/primerResearchHelpers.ts`: honor declared HTML charset while hashing original bytes | **PASS**, fresh browser import and hash regression |
| D07 | Intensity list with Bulusan locality becomes volcano-monitoring claim | `primerResearchExtraction.ts`: require volcano/activity/monitoring context around named volcanoes | **PASS**, real bulletin no false finding; positive/negative regression |
| D08 | Long event IDs crowd Stage 3 map/chart headings and reference legend | `primerSequenceIntegration.ts`: concise dated titles, separate membership banner, short symbol legend; full ID retained in caption/provenance | **PASS**, map/chart pixels inspected |
| D09 | Export says to adjust Historical Table Row Cap but no UI control exists; exports capped at 12 | `PrimerStage3Panel.tsx`: expose existing config field with bounded input | **PASS**, actual input set to 100; 82/82 rows in both formats |
| D10 | Parameter-only source with zero default diagnostics claims RMS 0.00, ±0.00 km, free-depth solution | `earthquakePrimer.ts`, `primerScientificNarratives.ts`: withhold diagnostics without solver iterations and disclose missing depth constraint | **PASS**, regression and actual final HTML/PDF text/images |

Two prerequisite configuration corrections were needed during setup before local startup; the remaining application corrections were applied after the sequential browser/export/research phases established their symptoms. No broad refactoring or solver changes were made.

## 14. Exact modification record and remaining limits

Existing files changed (**16**):

1. `package.json`
2. `bun.lock`
3. `server.ts`
4. `README.md`
5. `server/primerResearchHelpers.ts`
6. `src/components/PrimerGeneratorPanel.tsx`
7. `src/components/PrimerStage3Panel.tsx`
8. `src/utils/earthquakePrimer.ts`
9. `src/utils/historicalSeismicity.ts`
10. `src/utils/primerResearchExtraction.ts`
11. `src/utils/primerScientificNarratives.ts`
12. `src/utils/primerSequenceIntegration.ts`
13. `tests/earthquakePrimer.test.ts`
14. `tests/historicalSeismicity.test.ts`
15. `tests/primerResearchR1.test.ts`
16. `tests/primerResearchR2.test.ts`

Added: `package-lock.json`, this report, `verification/run-browser-regression.cjs`, `verification/inspect-final.mjs`, and the evidence/log/fixture/render/test-store files beneath `verification/`. Vite also generated `dist/` and installed dependencies under `node_modules/`. These are generated artifacts, not additional application-source edits.

Hash comparison against the baseline confirms no changes to `src/App.tsx`, `src/utils/hypocenterSolver.ts`, `src/utils/locationController.ts`, travel-time providers, station seed files, or unrelated application modules. The historical-catalog parser change is shared with Research and was covered by its existing tests plus the new regression.

Remaining statuses:

- **BLOCKED:** live Gemini search/extraction, because no key is configured.
- **NOT VERIFIED:** every fine-grained intermediate/pending candidate GUI transition; helper guards and bounded real PLOT behavior were verified.
- **NOT VERIFIED:** exact earlier B4 source record; authentic B3 and public agency references were used with disclosed magnitude labels.
- **NOT VERIFIED:** migration of pre-existing imports/catalogs already stored with old decoding/timestamps. The final replay used fresh test storage/imports; operational migration was not authorized or performed. Existing affected imports need operator-reviewed reimport/reconciliation.
- **NOT VERIFIED:** comprehensive scientific accuracy of all solver/calculation modules; existing tests pass, but synthetic behavior tests do not establish scientific validation.
- **NOT VERIFIED:** native Acrobat interaction, physical printing, other browsers, and all possible layouts; Chromium, Poppler, and the tested A4 layouts were verified.
- Institutional authorization/publication remains unavailable; no institutional approval is asserted.

## 15. Final recommendation

**CONDITIONAL ACCEPTANCE for local research-assisted drafting.** The executed local workflows and exported layouts pass after correction. Use only as a draft-preparation/review tool; preserve unresolved fields and source-scale differences, reconcile previously stored affected data before reuse, and obtain the appropriate scientific/institutional review outside the app. Gemini capability must remain unverified until a key and explicit authorization for bounded live requests are supplied.

The final application checks are recorded in `verification/logs/final-checks.json`; the final browser replay in `verification/logs/browser-final.json`; and PDF/ZIP/hash evidence in `verification/logs/final-artifact-integrity.json`. This report is the acceptance record, not a claim of official PHIVOLCS approval.
