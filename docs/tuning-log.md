# Tuning Log: AFASA RAG Bot

Every change to chunking, retrieval or prompts, one row per experiment, and what it did to the test results in `docs/test-questions.md`. The one-page reflection is written from this file.

## Corpus

| Doc | File | PDF pages | Chunks |
|---|---|---|---|
| RA 12010 | `ra-12010-afasa.pdf` | 6 | 33 |
| BSP Cir. 1213 | `bsp-circular-1213.pdf` | 12 | 40 |
| BSP Cir. 1214 | `bsp-circular-1214.pdf` | 9 | 39 |
| BSP Cir. 1215 | `bsp-circular-1215.pdf` | 35 | 112 |
| **Total** | | **62** | **224** |

Runs 1–3: 224 chunks (size 800, overlap 100; min 104, avg 744, max 998 characters). Runs 4–5: 353 chunks (size 500, overlap 100: RA 12010 51, Cir. 1213 64, Cir. 1214 61, Cir. 1215 177). Model `gpt-4o-mini`, embeddings `text-embedding-3-small` (1536 dims, cosine), both via the Vocareum gateway.

## Experiments (summary)

| Run | Date | Chunk size / overlap | topK | maxSteps | Prompt / tool description | In-scope correct (of 15) | Partial | Failed | Out-of-scope declined (of 3) | Greetings, no tool (of 2) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 (baseline) | 2026-11-18 | 800 / 100 | 4 | 3 | First AFASA prompt (answer only from tool, cite, decline unrelated) | **5** | 3 | 7 | 3* | 2* |
| 2 | 2026-11-18 | 800 / 100 | **8** | 3 | unchanged | **8** | 1 | 6 | not retested | not retested |
| 3 | 2026-11-18 | 800 / 100 | 8 | **5** | **New:** corpus scope listed (incl. Cir. 1213 security features); rules: search first, one search per part, check exceptions, search again with new wording | **11** | 3 | 1 | **3** | **2** |
| 4 | 2026-11-18 | **500 / 100** (re-seeded: 353 chunks) | 8 | 5 | unchanged from Run 3 | **~10** (7 retested + 3 safety checks) | 4 | 1 | not retested | not retested |
| 5 | 2026-11-18 | 500 / 100 | **12** | 5 | unchanged | worse (4 retested) | | | | |

\* Run 1 out-of-scope and greeting questions were accidentally asked with hint text in brackets; Run 3 re-tested them cleanly.

## Per-question results

✅ correct and grounded · ⚠️ partly correct · ❌ wrong, declined in error, or not found

| # | Question (short) | Expected source | Run 1 | Run 2 | Run 3 | Notes |
|---|---|---|---|---|---|---|
| 1 | Money mule | RA 12010 p2 | ✅ | (✅) | ✅ | Cited RA 12010 p2 and Cir. 1214 p3 in every run. |
| 2 | Sell/rent account + penalty | RA p2, p4 | ⚠️ | ✅ | ✅ | Run 1 missed the penalty (p4 not in top 4). Fixed by topK 8. Run 3 also mentions account closure. |
| 3 | Social engineering scheme | RA p2 | ❌ | ❌ | ✅ | Runs 1–2 declined **without searching**. Fixed by the "search first" rule. |
| 4 | Economic sabotage + penalty | RA p2, p4 | ✅ | (✅) | ✅ | |
| 5 | Senior-citizen penalty | RA p4 | ✅ | (✅) | ✅ | Didn't give the normal penalty for comparison (minor). |
| 6 | Bank refund | RA p2 | ✅ | (✅) | ✅ | Run 3 adds "conviction not required". Minor error: says *improper* holding leads to restitution (that's Sec. 9 failure to hold; Sec. 10 improper holding = administrative action). |
| 7 | What makes a transaction disputed | RA p3 | ✅ | (✅) | ✅ | |
| 8 | Holding period split (comparison) | RA p2; Cir. 1215 | ⚠️ | ✅ | ✅ | Run 1 missed the court extension. Still cites only Cir. 1215, not the law itself. |
| 9 | What happens when the hold ends | Cir. 1215 p16–17 | ❌ | ❌ | ⚠️ | Run 3 found p16 (search-again rule) but summarised the waiver and scam-return exceptions as "other valid reasons". |
| 10 | Verification duration | Cir. 1215 p15–16 | ❌ | ✅ | ✅ | Run 1 said "not stated" (answer ranked 5th–8th). Fixed by topK 8. |
| 11 | Wrong account number (exclusion) | Cir. 1215 p2, p4 | ❌ | ❌ | ⚠️ | Runs 1–2: confidently said the rules **apply** (wrong). Run 3 found the exclusion (exceptions rule) but opened with "the rules do apply", contradicting itself. |
| 12 | Transaction Pause Period | Cir. 1213 p5 | ❌ | ❌ | ❌ | Runs 1–2 honestly said "not found". **Run 3 invented a wrong description** and cited p4. The retrieval still misses this chunk; the stronger prompt turned an honest miss into a guess. |
| 13 | Clickable links / QR codes | Cir. 1213 p9 | ❌ | ❌ | ✅ | Runs 1–2 declined without searching. Exact answer in Run 3. |
| 14 | Money lock | Cir. 1213 p8 | ❌ | ❌ | ✅ | Same pattern as Q13. |
| 15 | BSP inquiry / bank secrecy (comparison) | RA p3; Cir. 1214 | ⚠️ | ⚠️ | ⚠️ | Core correct every run. Never named CAPO or the 10-day deadline from Cir. 1214. |
| 16 | World Cup | (none) | ✅* | — | ✅ | Run 3 also suggests in-scope topics. |
| 17 | BSP policy rate (near miss) | (none) | ✅* | — | ✅ | |
| 18 | Best bank | (none) | ✅* | — | ✅ | Run 3 offers to explain the rules instead of ranking. |
| 19 | "Hi! What can you help me with?" | no tool | ✅* | — | ✅ | No Sources line. |
| 20 | "Thanks!" | no tool | ✅* | — | ✅ | No Sources line. |

(✅) = not retested in Run 2 (it already passed in Run 1).

## Runs 4–5: chunk size experiments

| # | Question (short) | Run 3 (800 / k8) | Run 4 (500 / k8) | Run 5 (500 / k12) | Notes |
|---|---|---|---|---|---|
| 1 | Money mule | ✅ | ⚠️ | ⚠️ | 500-char chunks split the 5-item list; the answer kept only 3 items. |
| 2 | Sell/rent + penalty | ✅ | ✅ | – | |
| 3 | Social engineering | ✅ | ✅ | – | Safety check. |
| 8 | Holding period split | ✅ | ⚠️ | – | Now cites RA 12010 and Cir. 1215, but wrongly says the 25-day extension needs a court order (a court is only needed beyond 30 days). |
| 9 | When the hold ends | ⚠️ | ⚠️ | – | Lists the statuses incl. "released to the source account owner"; exceptions still vague. |
| 10 | Verification duration | ✅ | ❌ | ❌ | "Not explicitly stated": the 30/60-day sentence got separated from its context. An honest miss. |
| 11 | Wrong account (exclusion) | ⚠️ | ✅ | ✅ | Clear "do not apply" [Cir. 1215 p2]. |
| 12 | Transaction Pause Period | ❌ (invented) | ✅ | ❌ (invented) | 500-char chunk isolates the TPP passage → exact answer at k8. At k12 the extra loosely related chunks pulled the model back into an invented description. |
| 13 | Clickable links | ✅ | ✅ | – | Safety check. |
| 15 | BSP inquiry | ⚠️ | ⚠️ | – | Cites Cir. 1214 p1 now; still no CAPO or 10-day deadline. |

## Final configuration (chosen 2026-11-18)

**Chunk size 500 / overlap 100 (353 chunks), topK 8, maxSteps 5, Run 3 prompt.**

Why: Runs 3 and 4 score about the same (11 vs ~10 of 15), but they fail differently.
- Run 3's failures include a **fully invented rule** (Q12) and a **self-contradicting answer** on the exclusion question (Q11). Both could lead a user to act on false information.
- Run 4 gets both of those safety-critical questions right. Its failures are an honest "not stated" (Q10), an incomplete list (Q1), and one wrong detail (Q8, the court order).
- For a bot about scams and people's money, **"I don't know" or "incomplete" is safer than confidently wrong**, so Run 4's failure profile was preferred despite a slightly lower count.
- Run 5 showed that adding more context (topK 12) does not compensate for smaller chunks: extra loosely related text increased invention (Q12).

Known limitations: Q8 (wrong court-order detail), Q10 (not found), Q1/Q9/Q15 (incomplete).


## What each change did (for the reflection)

- **topK 4 → 8 (Run 2):** fixed retrieval misses where the answer ranked 5th–8th (Q2, Q10, partly Q8): **+3**. It could not fix questions where the model never searched (Q3, Q13, Q14) or never looked for exceptions (Q11). Cost: about twice the retrieved text per search, and a longer sources panel. The class default of 4 was too small for a corpus where Cir. 1215 alone has 112 similar "holding / disputed funds" chunks.
- **Prompt and tool-description rewrite, maxSteps 3 → 5 (Run 3):** fixed the "decline without searching" failures (Q3, Q13, Q14), improved the exception question (Q11) and the release question (Q9): **+3 correct, and more partials**. Listing the Cir. 1213 security features in the prompt and the tool description is what got the model to search for them. maxSteps was raised so the model has room for one search per part plus a retry.
- **Trade-off found (Q12):** telling the model to search harder and avoid "not covered" made it more helpful, but when retrieval still failed it **guessed** instead of admitting it didn't know. Helpfulness and honesty pulled against each other.

- **Chunk size 800 → 500 (Run 4):** smaller chunks made specific definitions and exclusions match much better (Q11, Q12 fixed) but split lists and multi-sentence rules across chunks (Q1 incomplete, Q10 not found, Q8 one wrong detail). The classic chunk-size trade-off: precision of matching vs completeness of context.
- **topK 8 → 12 with 500-char chunks (Run 5):** giving the model the same total amount of text as Run 3 did **not** restore completeness; the extra chunks added noise, and the model invented an answer again (Q12). More context is not automatically better.

## Fixes made to the starter

- **Page numbers:** the starter split pages on a form-feed character that pdf-parse never inserts, so every chunk was labelled "page 1". The new `lib/seed.ts` captures each page as it is rendered. Verified: 62 distinct pages.
- **Multiple documents:** the starter read only `data/sample.pdf` and used ids `chunk_0, chunk_1…`, so a second PDF would overwrite the first. Ids are now `file-p{page}-c{n}`.
- **Citation metadata:** every chunk stores `docId`, `title` and `url` as well as `text` and `page`. The sources panel shows "BSP Cir. 1215 · p. 16" and links to the PDF page.
- **Noise removal:** the LawPhil website menu, date line, footer and watermark, and the BSP "Page X of N" footers, are stripped before chunking.
- **Vocareum:** `createOpenAI` with `OPENAI_BASE_URL` in both the seed script and the route.

## Next experiments (next session)

1. **Chunking, done in Runs 4–5.** Possible follow-ups: a larger overlap at 500 (e.g. 500/150) so lists and rules aren't cut, or prefixing each chunk with its document title and section heading ("contextual chunks") — both need a re-seed.
2. **Honesty guard:** add a rule like "if the retrieved text does not explicitly describe the term, say it wasn't found; never describe a rule from its name alone", then re-check Q12.
3. **Exclusion wording (Q11):** "if the documents exclude the situation, start the answer with *No*".
4. Day 3 display fix: render markdown so `**bold**` doesn't show as raw text.
