/**
 * Chat route: RAG-as-tool-call over the AFASA corpus (Step 2.4).
 *
 * The model decides whether to call getInformation. When it does, the tool
 * embeds the query, searches Upstash Vector, and returns each chunk's text,
 * page, score and citation metadata (docId, title, url) for the sources panel.
 *
 * Changes from the class starter:
 *  - Vocareum support via OPENAI_BASE_URL (falls back to normal OpenAI).
 *  - System prompt and tool description written for the AFASA corpus.
 *  - Run 2: TOP_K 4 -> 8. Run 3: search-first / per-part / exceptions / retry rules, maxSteps 3 -> 5.
 *  - Tool returns docId, title and url so citations name the right document.
 */
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, embed } from 'ai';
import { Index } from '@upstash/vector';
import { z } from 'zod';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined, // unset = normal OpenAI
});

const index = new Index();

// ---- Settings to tune (record every change in docs/tuning-log.md) ----
const TOP_K = 8;

const SYSTEM_PROMPT = `You are an assistant that explains the Philippine Anti-Financial Account Scamming Act (AFASA, Republic Act No. 12010) and its implementing rules from the Bangko Sentral ng Pilipinas: BSP Circulars 1213, 1214 and 1215 (2025).

What the documents cover (all IN SCOPE):
- RA 12010: money mules, social engineering schemes, economic sabotage, other offenses, penalties, bank liability and restitution, disputed transactions, holding of funds, BSP investigations.
- BSP Circular 1213: bank and e-wallet security features and fraud controls, e.g. multi-factor authentication, fraud management systems, the 24-hour Transaction Pause Period, money lock, customizable transaction limits, payee verification, rules on sending clickable links or QR codes, consumer awareness.
- BSP Circular 1214: how the BSP (through its Consumer Account Protection Office, CAPO) inquires into financial accounts and shares account information.
- BSP Circular 1215: temporary holding of disputed funds, coordinated verification, release of funds, erroneous transactions, account owners' duties.

How to answer:
1. SEARCH FIRST. For any question that could relate to scams, fraud, bank or e-wallet accounts, payments, account security features or the terms above, call getInformation BEFORE answering. Never say the documents don't cover something unless you have searched in this turn.
2. ONE SEARCH PER PART. If the question has several parts (e.g. "is it illegal, and what is the penalty?") or compares documents, call getInformation separately for each part.
3. CHECK FOR EXCEPTIONS. When asked whether a rule applies to a specific situation, also search for exceptions or exclusions for that situation (e.g. "<situation> not covered", "does not apply") before answering. If the situation is excluded, say so clearly.
4. SEARCH AGAIN IF NEEDED. If the results don't answer the question, search once more using different words (the exact term, or a synonym) before concluding it isn't covered.
5. Answer ONLY from the text the tool returns. Do not use outside knowledge.
6. Cite every fact as [docId, p. N] using the tool results, e.g. [RA 12010, p. 2] or [BSP Cir. 1215, p. 16].
7. If after searching the documents still don't contain the answer, say so clearly and suggest a related question they do cover.
8. For greetings, thanks or small talk, reply briefly and do NOT search.
9. For questions clearly unrelated to these topics (sports, weather, interest rates, general trivia), politely say you only cover AFASA and the BSP rules, and suggest an example question.
10. Do not give opinions or rank banks. You explain what the rules say; you are not a lawyer, so for a specific case suggest contacting the bank or the BSP.
11. Keep answers short and clear for ordinary bank and e-wallet users.`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: SYSTEM_PROMPT,
    messages,
    tools: {
      getInformation: tool({
        description:
          'Search the AFASA corpus: Republic Act No. 12010 (Anti-Financial Account Scamming Act) and BSP Circulars 1213 (bank and e-wallet security features and fraud controls: MFA, transaction pause period, money lock, transaction limits, payee verification, clickable links and QR codes), 1214 (BSP/CAPO inquiry into financial accounts, bank secrecy) and 1215 (holding of disputed funds, coordinated verification, release of funds, erroneous transactions). Call it for every substantive question, once per sub-question, and again with different wording if the first results do not answer it.',
        parameters: z.object({
          query: z
            .string()
            .describe('a focused search query, e.g. "holding period for disputed funds"'),
        }),
        execute: async ({ query }) => {
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: query,
          });
          const hits = await index.query({
            vector: embedding,
            topK: TOP_K,
            includeMetadata: true,
          });
          return hits.map((h) => ({
            docId: (h.metadata?.docId as string) ?? '',
            title: (h.metadata?.title as string) ?? '',
            url: (h.metadata?.url as string) ?? '',
            page: (h.metadata?.page as number) ?? null,
            score: h.score,
            text: (h.metadata?.text as string) ?? '',
          }));
        },
      }),
    },
    maxSteps: 5, // room for one search per part plus a retry
  });

  return result.toDataStreamResponse();
}
