/**
 * Seed Upstash Vector with the AFASA corpus (4 PDFs in data/).
 *
 *   npm run seed               -> chunk, embed and upload everything
 *   npm run seed -- --dry-run  -> chunk only and print a preview (no API calls, no cost)
 *
 * Changes from the class starter:
 *  1. Reads all four PDFs listed in DOCS (not just data/sample.pdf).
 *  2. Real page numbers: pdf-parse does not insert form-feeds between pages,
 *     so the starter labelled every chunk "page 1". We capture each page as
 *     pdf-parse renders it instead.
 *  3. Citation metadata on every chunk: docId, title, url (plus text, page).
 *  4. Unique ids per file/page/chunk, so one PDF can't overwrite another.
 *  5. Strips website and page-footer noise (LawPhil menu, "Page X of N").
 *  6. Works with a Vocareum key via OPENAI_BASE_URL (falls back to OpenAI).
 */
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';

// Next.js reads .env.local automatically; this script does not.
loadEnv({ path: path.join(process.cwd(), '.env.local') });
import { Index } from '@upstash/vector';
import { embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
// pdf-parse uses CommonJS; default-import the parser fn
import pdfParse from 'pdf-parse';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined, // unset = normal OpenAI
});

// ---- Settings to tune (record every change in docs/tuning-log.md) ----
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;

// ---- The corpus ----
const DOCS = [
  {
    file: 'ra-12010-afasa.pdf',
    docId: 'RA 12010',
    title: 'Anti-Financial Account Scamming Act (AFASA)',
    url: 'https://lawphil.net/statutes/repacts/ra2024/ra_12010_2024.html',
  },
  {
    file: 'bsp-circular-1213.pdf',
    docId: 'BSP Cir. 1213',
    title: 'IT risk management and fraud controls under AFASA',
    url: 'https://www.bsp.gov.ph/Regulations/Issuances/2025/1213.pdf',
  },
  {
    file: 'bsp-circular-1214.pdf',
    docId: 'BSP Cir. 1214',
    title: 'Inquiry into financial accounts and information sharing',
    url: 'https://www.bsp.gov.ph/Regulations/Issuances/2025/1214.pdf',
  },
  {
    file: 'bsp-circular-1215.pdf',
    docId: 'BSP Cir. 1215',
    title: 'Temporary holding of disputed funds and coordinated verification',
    url: 'https://www.bsp.gov.ph/Regulations/Issuances/2025/1215.pdf',
  },
];

type Chunk = { text: string; page: number };

/**
 * Naive but adequate chunker (unchanged from the starter): split text into
 * ~CHUNK_SIZE-char windows with CHUNK_OVERLAP overlap, breaking on sentence
 * boundaries when possible.
 */
function chunkText(text: string, page: number): Chunk[] {
  const out: Chunk[] = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(text.length, i + CHUNK_SIZE);
    if (end < text.length) {
      const lookahead = text.slice(end, end + 200);
      const m = lookahead.match(/[.!?]\s/);
      if (m && m.index !== undefined) end += m.index + 1;
    }
    const piece = text.slice(i, end).trim();
    if (piece.length > 0) out.push({ text: piece, page });
    if (end >= text.length) break;
    i = end - CHUNK_OVERLAP;
  }
  return out;
}

/** Read a PDF and return one string per page (index 0 = PDF page 1). */
async function loadPages(filePath: string): Promise<string[]> {
  const pages: string[] = [];
  await pdfParse(await fs.readFile(filePath), {
    // Same line-joining logic as pdf-parse's default renderer, but we keep each page.
    pagerender: async (pageData: any) => {
      const tc = await pageData.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      });
      let lastY: number | undefined;
      let text = '';
      for (const item of tc.items) {
        const y = item.transform[5];
        text += lastY === undefined || lastY === y ? item.str : '\n' + item.str;
        lastY = y;
      }
      pages.push(text);
      return text;
    },
  });
  return pages;
}

/** Remove lines that are website or page-footer noise, then tidy whitespace. */
function cleanPage(raw: string): string {
  const noise = [
    /^Today is \w+day, /i, // LawPhil date line
    /^Constitution Statutes Executive Issuances/i, // LawPhil menu
    /^The Lawphil Project/i, // LawPhil footer
    /^Page \d+ of \d+$/i, // BSP page footer
  ];
  return raw
    .replace(/1aшphi1/g, '') // LawPhil watermark (can sit at the end of a line)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !noise.some((re) => re.test(line)))
    .join('\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

type Record = {
  id: string;
  text: string;
  metadata: { text: string; page: number; docId: string; title: string; url: string };
};

async function buildRecords(): Promise<Record[]> {
  const all: Record[] = [];
  for (const d of DOCS) {
    const filePath = path.join(process.cwd(), 'data', d.file);
    const pages = await loadPages(filePath);
    let count = 0;
    pages.forEach((raw, p) => {
      const text = cleanPage(raw);
      if (!text) return;
      chunkText(text, p + 1).forEach((c, j) => {
        all.push({
          id: `${d.file.replace('.pdf', '')}-p${c.page}-c${j}`, // unique across all PDFs
          text: c.text,
          metadata: { text: c.text, page: c.page, docId: d.docId, title: d.title, url: d.url },
        });
        count++;
      });
    });
    console.log(`  ${d.docId.padEnd(14)} ${String(pages.length).padStart(3)} pages -> ${count} chunks`);
  }
  return all;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!dryRun) {
    if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
      console.error('Missing UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN. Set them in .env.local.');
      process.exit(1);
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY in .env.local.');
      process.exit(1);
    }
  }

  console.log(`Chunking ${DOCS.length} PDFs (size ${CHUNK_SIZE}, overlap ${CHUNK_OVERLAP})…`);
  const records = await buildRecords();
  const pageCount = new Set(records.map((r) => `${r.metadata.docId}|${r.metadata.page}`)).size;
  console.log(`Total: ${records.length} chunks across ${pageCount} pages`);

  if (dryRun) {
    const sample = records[Math.floor(records.length / 2)];
    console.log('\nDry run - nothing embedded or uploaded. Sample chunk:');
    console.log(`  id:    ${sample.id}`);
    console.log(`  cite:  [${sample.metadata.docId}, p. ${sample.metadata.page}]`);
    console.log(`  text:  ${sample.text.slice(0, 200).replace(/\n/g, ' ')}…`);
    return;
  }

  console.log('Embedding…');
  const { embeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: records.map((r) => r.text),
  });

  const index = new Index();
  const vectors = records.map((r, i) => ({ id: r.id, vector: embeddings[i], metadata: r.metadata }));

  console.log(`Upserting ${vectors.length} chunks to Upstash Vector…`);
  const BATCH = 100;
  for (let i = 0; i < vectors.length; i += BATCH) {
    await index.upsert(vectors.slice(i, i + BATCH));
  }
  console.log('✅ Done. Check the record count in the Upstash console.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
