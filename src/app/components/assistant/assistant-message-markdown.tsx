import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { normalizeAssistantMarkdown } from "@/lib/assistant-markdown";

export function AssistantMessageMarkdown({ content }: { content: string }) {
  const normalized = normalizeAssistantMarkdown(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      className="assistant-markdown text-[15px] leading-[1.75] text-slate-900 space-y-4 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:mb-4 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:leading-relaxed [&_strong]:font-semibold [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-2 [&_br]:block [&_br]:content-[''] [&_br]:mb-2"
      components={{
        p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
        li: ({ children }) => <li className="mb-1.5 leading-relaxed">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-blue-600 underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {normalized}
    </ReactMarkdown>
  );
}
