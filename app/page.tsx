'use client';

/**
 * Chat page with sources (Step 2.5).
 *
 * Changes from the class starter:
 *  - Sources show the document name and page, e.g. "BSP Cir. 1215 · p. 16",
 *    with a link to the original document (BSP PDFs open on that page).
 *  - Answers keep their line breaks (whitespace-pre-wrap).
 *  - Header and placeholder renamed for AFASA. The full empty state with
 *    example questions comes in Day 3 (Step 3.1).
 */
import { useChat } from '@ai-sdk/react';

type Source = {
  text?: string;
  page?: number | null;
  score?: number;
  docId?: string;
  title?: string;
  url?: string;
};

/** Link to the source; PDFs open on the cited page. */
function sourceLink(src: Source): string | undefined {
  if (!src.url) return undefined;
  return src.url.toLowerCase().endsWith('.pdf') && src.page
    ? `${src.url}#page=${src.page}`
    : src.url;
}

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: '/api/chat',
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">AFASA Scam-Safe Assistant</h1>
        <p className="text-sm text-slate-500">
          Ask about the Anti-Financial Account Scamming Act (RA 12010) and BSP Circulars
          1213–1215. Sources appear under each answer.
        </p>
      </header>

      <ul className="space-y-4 mb-6 min-h-[200px]">
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.role === 'user'
                ? 'flex justify-end'
                : 'flex justify-start flex-col items-start'
            }
          >
            {m.content && (
              <span
                className={
                  m.role === 'user'
                    ? 'inline-block rounded-2xl bg-cyan-600 text-white px-4 py-2 max-w-[85%] whitespace-pre-wrap'
                    : 'inline-block rounded-2xl bg-white border border-slate-200 px-4 py-2 max-w-[85%] whitespace-pre-wrap'
                }
              >
                {m.content}
              </span>
            )}

            {m.role === 'assistant' &&
              m.toolInvocations?.map(
                (inv) =>
                  inv.state === 'result' &&
                  inv.toolName === 'getInformation' && (
                    <details
                      key={inv.toolCallId}
                      className="mt-2 text-sm text-slate-600 max-w-[85%]"
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
        {(status === 'submitted' || status === 'streaming') && (
          <li className="text-sm text-slate-400">Searching the AFASA documents…</li>
        )}
        {error && (
          <li className="text-sm text-rose-600">
            Error: {error.message}
          </li>
        )}
      </ul>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
          placeholder="e.g. How long can a bank hold disputed funds?"
          disabled={status === 'streaming' || status === 'submitted'}
        />
        <button
          type="submit"
          disabled={!input || status === 'streaming' || status === 'submitted'}
          className="rounded-lg bg-slate-900 text-white px-4 py-2 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </main>
  );
}
