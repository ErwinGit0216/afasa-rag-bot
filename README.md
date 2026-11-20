# AFASA Scam-Safe Assistant

A retrieval-augmented (RAG) chatbot that answers questions about the Philippine **Anti-Financial Account Scamming Act (AFASA, Republic Act No. 12010)** and its implementing rules from the Bangko Sentral ng Pilipinas, with a page citation for every fact.

**Live app:** https://afasa-rag-bot.vercel.app

Built for AIM Mini Project 14.3, "Ship Your Own RAG", starting from the course's Next.js RAG starter.

> Educational tool only. This is not legal advice. For a specific case, contact your bank or the BSP.

## Why this corpus

Scams involving bank and e-wallet accounts are a daily problem in the Philippines. AFASA (2024) and the three BSP circulars that implement it (2025) set out new crimes, such as money muling, along with the security features banks must offer and what happens to disputed funds. The documents are long and legal. Ordinary account holders rarely read them, but they need answers like *"Can my bank hold my money?"* or *"What is a money lock?"*

## Corpus

| Doc | Title | Pages | Chunks | Source |
|---|---|---|---|---|
| RA 12010 | Anti-Financial Account Scamming Act (2024) | 6 | 51 | [LawPhil](https://lawphil.net/statutes/repacts/ra2024/ra_12010_2024.html) |
| BSP Cir. 1213 | IT risk management and fraud controls under AFASA | 12 | 64 | [BSP](https://www.bsp.gov.ph/Regulations/Issuances/2025/1213.pdf) |
| BSP Cir. 1214 | Inquiry into financial accounts and information sharing | 9 | 61 | [BSP](https://www.bsp.gov.ph/Regulations/Issuances/2025/1214.pdf) |
| BSP Cir. 1215 | Temporary holding of disputed funds and coordinated verification | 35 | 177 | [BSP](https://www.bsp.gov.ph/Regulations/Issuances/2025/1215.pdf) |
| **Total** | | **62** | **353** | |

Philippine government works are not subject to copyright (RA 8293, Sec. 176).

## How it works

```
User question
   │
   ▼
Next.js page (useChat) ──POST──► /api/chat (server only, holds all keys)
                                     │  streamText(gpt-4o-mini, maxSteps 5)
                                     │
                                     ├─► tool: getInformation(query)
                                     │      embed query (text-embedding-3-small)
                                     │      Upstash Vector query, topK 8 (cosine)
                                     │      returns text + docId + page + score + URL
                                     │
                                     ◄── model answers only from returned text,
                                         citing [docId, p. N]
   ▲
   └── streamed answer + expandable "Sources" list with links to the exact PDF page
```

- **Retrieval is a tool call.** The model decides when to search, and can search once per sub-question or again with different wording (up to 5 steps). Greetings don't trigger a search.
- **Streaming.** The answer streams token by token through the Vercel AI SDK data stream.
- **Sources shown.** Each answer has an expandable list showing document, page, similarity score and an "open source" link (`#page=N` for PDFs).
- **No client-side secrets.** All keys are read only in `app/api/chat/route.ts` and `lib/seed.ts`. None use the `NEXT_PUBLIC_` prefix. A production build was searched for key fragments, and none were found.
- **Meaningful empty state.** The start page explains what the bot covers and what it won't do, offers 4 example questions, and lists the documents it uses.

## Tech stack

Next.js 15 (App Router) · Vercel AI SDK v4 (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`) · Upstash Vector (1536 dims, cosine) · OpenAI `gpt-4o-mini` and `text-embedding-3-small` via the Vocareum gateway · pdf-parse · Tailwind CSS · deployed on Vercel.

## Tuning summary

Tested against 20 fixed questions (`docs/test-questions.md`): 15 in scope with expected pages, 3 out of scope and 2 greetings. Full details are in `docs/tuning-log.md`.

| Run | Change | In-scope correct (of 15) |
|---|---|---|
| 1 | Baseline: chunk 800/100, topK 4 | 5 |
| 2 | topK 4 → 8 | 8 |
| 3 | New system prompt and tool description (search first, one search per part, check exceptions, search again), maxSteps 5 | 11 |
| 4 | Chunk size 800 → 500 | ~10 |
| 5 | topK 8 → 12 | worse |

**Final configuration:** chunk 500 / overlap 100, topK 8, maxSteps 5, Run 3 prompt. Run 4 scored slightly lower than Run 3, but its failures are safer. It fixed an invented answer (Transaction Pause Period) and a self-contradicting one (wrong-account exclusion). Its remaining misses are honest "not stated" or incomplete answers. For a bot about people's money, a cautious answer beats a confidently wrong one.

### Fixes to the starter

- Page numbers: the starter split pages on `\f`, which pdf-parse never inserts, so every chunk was labelled page 1. Pages are now read one by one with a custom `pagerender`.
- Multi-document seeding with stable IDs (`<file>-p<page>-c<n>`) and metadata (`docId`, `title`, `url`, `page`).
- LawPhil headers, footers and watermark text are removed before chunking.
- `baseURL` support for the Vocareum OpenAI-compatible gateway.
- Removed a `.env.local` with live keys that came bundled in the starter zip.

## Known limitations

- **Holding-period extension:** may say the 25-day extension needs a court order. In fact, court approval is only needed beyond 30 days.
- **Verification duration:** may answer "not stated" because the 30/60-day rule is split across chunks.
- **Long lists** (e.g. all money-mule acts) can come back incomplete.
- **BSP inquiry:** gives the core answer but doesn't name CAPO or the 10-day deadline.
- Covers only the four documents above, as of 2025. It doesn't know about later amendments or news.

## Run it locally (Windows PowerShell)

```powershell
git clone https://github.com/ErwinGit0216/afasa-rag-bot.git
cd afasa-rag-bot
npm ci
notepad .env.local      # create it with the four values below
npm run seed -- --dry-run   # check chunk counts without uploading
npm run seed            # embed and upload the PDFs in data\
npm run dev             # open http://localhost:3000
```

Environment variables (server-side only, never commit `.env.local`):

| Name | Purpose |
|---|---|
| `OPENAI_API_KEY` | OpenAI or Vocareum key |
| `OPENAI_BASE_URL` | Optional, e.g. `https://openai.vocareum.com/v1`; leave empty for OpenAI directly |
| `UPSTASH_VECTOR_REST_URL` | Upstash Vector index endpoint (1536 dims, cosine) |
| `UPSTASH_VECTOR_REST_TOKEN` | Upstash Vector token |

## Deploy

```powershell
vercel link
vercel env add OPENAI_API_KEY production   # repeat for the other three
vercel --prod
```

## Project layout

```
app/page.tsx            chat UI, empty state, sources
app/layout.tsx          page title and metadata
app/api/chat/route.ts   streamText + getInformation retrieval tool
lib/seed.ts             PDF → pages → chunks → embeddings → Upstash
data/                   the four source PDFs
docs/test-questions.md  20 evaluation questions with expected pages
docs/tuning-log.md      every tuning run and its results
```
