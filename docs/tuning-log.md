# Tuning Log: AFASA RAG Bot

Record **every** change to chunking, retrieval or prompts here, one row per experiment, and what it did to the test results in `docs/test-questions.md`. Your one-page reflection will be written from this file.

## Corpus

| Doc | File | PDF pages | Chunks (run 1) |
|---|---|---|---|
| RA 12010 | `ra-12010-afasa.pdf` | 6 | 33 |
| BSP Cir. 1213 | `bsp-circular-1213.pdf` | 12 | 40 |
| BSP Cir. 1214 | `bsp-circular-1214.pdf` | 9 | 39 |
| BSP Cir. 1215 | `bsp-circular-1215.pdf` | 35 | 112 |
| **Total** | | **62** | **224** |

## Experiments

| Run | Date | Chunk size / overlap | topK | Tool description / prompt | In-scope correct (of 15) | Out-of-scope declined (of 3) | Greetings, no tool (of 2) | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 (baseline) | 2026-11-18 | 800 / 100 | 4 | Starter defaults | | | | Seeded with fixed page numbers and citation metadata. Chunk length min 104, avg 744, max 998 chars. |
| 2 | | | | | | | | |
| 3 | | | | | | | | |

## Fixes made to the starter (for the reflection)

- **Page numbers:** the starter split pages on a form-feed character that pdf-parse never inserts, so every chunk was labelled "page 1". The new `lib/seed.ts` captures each page as it is rendered. Verified: the 4 PDFs give 62 distinct pages.
- **Multiple documents:** the starter read only `data/sample.pdf` and used ids `chunk_0, chunk_1…`, so a second PDF would overwrite the first. The ids are now `file-p{page}-c{n}`.
- **Citation metadata:** each chunk stores `docId`, `title` and `url` as well as `text` and `page`.
- **Noise removal:** the LawPhil website menu, date line, footer and watermark, and the BSP "Page X of N" footers, are stripped before chunking.
- **Vocareum:** uses `createOpenAI` with `OPENAI_BASE_URL`.

## Observations while testing

- 
