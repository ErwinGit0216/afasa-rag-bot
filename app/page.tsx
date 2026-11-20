'use client';

/**
 * AFASA Scam-Safe Assistant: chat page (Day 3, Steps 3.1-3.4).
 *
 * - 3.1 Meaningful empty state: what the bot covers, what it can't do,
 *       clickable example questions, and links to the source documents.
 * - 3.2 Citations: answers render **bold** and lists properly; sources show
 *       document + page with a link (BSP PDFs open on the cited page).
 * - 3.3 Failure states: friendly error message with a Retry button, and a
 *       "Searching the documents..." indicator while the bot works.
 * - 3.4 Layout: readable column that also works at phone width.
 */
import { useChat } from '@ai-sdk/react';
import type { ReactNode } from 'react';

type Source = {
  text?: string;
  page?: number | null;
  score?: number;
  docId?: string;
  title?: string;
  url?: string;
};

const EXAMPLE_QUESTIONS = [
  'What is a "money mule" under the AFASA?',
  'If I lose money to a scam, does my bank have to refund me?',
  'How long can a bank hold my funds in a disputed transaction?',
  'What is the "money lock" feature?',
];

const DOCUMENTS = [
  {
    label: 'RA 12010: Anti-Financial Account Scamming Act (2024)',
    url: 'https://lawphil.net/statutes/repacts/ra2024/ra_12010_2024.html',
  },
  {
    label: 'BSP Circular 1213: fraud controls and account security (2025)',
    url: 'https://www.bsp.gov.ph/Regulations/Issuances/2025/1213.pdf',
  },
  {
    label: 'BSP Circular 1214: BSP inquiry into financial accounts (2025)',
    url: 'https://www.bsp.gov.ph/Regulations/Issuances/2025/1214.pdf',
  },
  {
    label: 'BSP Circular 1215: holding of disputed funds (2025)',
    url: 'https://www.bsp.gov.ph/Regulations/Issuances/2025/1215.pdf',
  },
];

/** Link to the source; PDFs open on the cited page. */
function sourceLink(src: Source): string | undefined {
  if (!src.url) return undefined;
  return src.url.toLowerCase().endsWith('.pdf') && src.page
    ? `${src.url}#page=${src.page}`
    : src.url;
}

/** Render **bold** inside a line of text. */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** Minimal formatting for answers: paragraphs, bullet/numbered lists, bold. */
function FormattedAnswer({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <div key={i} className="h-2" />;
        const bullet = line.match(/^\s*[-*]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span aria-hidden>•</span>
              <span>{renderInline(bullet[1])}</span>
            </div>
          );
        }
        const numbered = line.match(/^\s*(\d+)\.\s+(.*)$/);
        if (numbered) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span>{numbered[1]}.</span>
              <span>{renderInline(numbered[2])}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, status, error, reload, append } =
    useChat({ api: '/api/chat' });

  const busy = status === 'submitted' || status === 'streaming';

  const ask = (question: string) => {
    if (!busy) append({ role: 'user', content: question });
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">AFASA Scam-Safe Assistant</h1>
        <p className="text-sm text-slate-500">
          Answers from the Philippine Anti-Financial Account Scamming Act and its BSP rules, with
          page citations.
        </p>
      </header>

      {/* 3.1 Meaningful empty state */}
      {messages.length === 0 && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">What I can help with</h2>
          <p className="mt-1 text-sm text-slate-700">
            Ask about money mules, social engineering scams, penalties, bank and e-wallet security
            features, disputed transactions and holding of funds, and the BSP&apos;s power to look
            into accounts. Every answer cites the document and page it comes from.
          </p>

          <h3 className="mt-4 text-sm font-semibold text-slate-900">Try one of these</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="rounded-full border border-cyan-600 px-3 py-1.5 text-left text-sm text-cyan-800 hover:bg-cyan-50"
              >
                {q}
              </button>
            ))}
          </div>

          <h3 className="mt-4 text-sm font-semibold text-slate-900">What I can&apos;t do</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
            <li>I only answer from the four documents below, not general knowledge or the news.</li>
            <li>I&apos;m not a lawyer, and I can&apos;t look up your account. For a specific case, contact your bank or the BSP.</li>
            <li>I don&apos;t rank or recommend banks.</li>
          </ul>

          <h3 className="mt-4 text-sm font-semibold text-slate-900">Documents I use</h3>
          <ul className="mt-1 space-y-0.5 text-sm">
            {DOCUMENTS.map((d) => (
              <li key={d.url}>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-700 underline"
                >
                  {d.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="mb-6 min-h-[120px] space-y-4">
        {messages.map((m) => (
          <li
            key={m.id}
            className={m.role === 'user' ? 'flex justify-end' : 'flex flex-col items-start'}
          >
            {m.content &&
              (m.role === 'user' ? (
                <span className="inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl bg-cyan-600 px-4 py-2 text-white">
                  {m.content}
                </span>
              ) : (
                <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900">
                  <FormattedAnswer text={m.content} />
                  <p className="mt-2 text-xs text-slate-400">
                    AI-generated from the documents below. Check the source before acting.
                  </p>
                </div>
              ))}

            {/* 3.2 Sources with document + page + link */}
            {m.role === 'assistant' &&
              m.toolInvocations?.map(
                (inv) =>
                  inv.state === 'result' &&
                  inv.toolName === 'getInformation' && (
                    <details
                      key={inv.toolCallId}
                      className="mt-2 max-w-[85%] text-sm text-slate-600"
                    >
                      <summary className="cursor-pointer">
                        Sources ({(inv.result as Source[]).length})
                        {inv.args?.query ? ` for "${inv.args.query}"` : ''}
                      </summary>
                      <ul className="mt-2 space-y-2">
                        {(inv.result as Source[]).map((src, i) => {
                          const href = sourceLink(src);
                          return (
                            <li key={i} className="border-l-2 border-cyan-500 pl-3">
                              <span className="text-xs text-slate-500">
                                <strong>{src.docId || 'Unknown document'}</strong>
                                {' · p. '}
                                {src.page ?? '?'}
                                {' · score '}
                                {typeof src.score === 'number' ? src.score.toFixed(2) : '—'}
                                {href && (
                                  <>
                                    {' · '}
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-cyan-700 underline"
                                    >
                                      open source
                                    </a>
                                  </>
                                )}
                              </span>
                              <p className="whitespace-pre-wrap">{src.text}</p>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  ),
              )}
          </li>
        ))}

        {/* 3.3 Loading and failure states */}
        {busy && <li className="text-sm text-slate-400">Searching the AFASA documents…</li>}
        {error && (
          <li className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Sorry, something went wrong while getting your answer. This is usually temporary.
            <button
              type="button"
              onClick={() => reload()}
              className="ml-3 rounded-lg bg-rose-700 px-3 py-1 text-white hover:bg-rose-800"
            >
              Retry
            </button>
          </li>
        )}
      </ul>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-cyan-500 focus:outline-none"
          placeholder="Ask about scams, disputed funds, bank security features…"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={!input || busy}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40"
        >
          Send
        </button>
      </form>
      <p className="mt-3 text-xs text-slate-400">
        Educational tool for Mini Project 14.3. Not legal advice. Sources: RA 12010 and BSP
        Circulars 1213, 1214 and 1215 (Philippine government works, RA 8293 Sec. 176).
      </p>
    </main>
  );
}
