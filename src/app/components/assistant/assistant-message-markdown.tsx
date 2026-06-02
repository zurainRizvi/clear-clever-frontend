import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AssistantMessageMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="assistant-markdown text-[15px] leading-relaxed text-slate-900 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_strong]:font-semibold [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-3 [&_h3]:mb-2"
      components={{
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
      {content}
    </ReactMarkdown>
  );
}
