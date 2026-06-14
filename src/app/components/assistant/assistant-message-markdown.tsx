import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { normalizeAssistantMarkdown } from "@/lib/assistant-markdown";
import { AssistantRichCodeBlock } from "./assistant-rich-content";

export function AssistantMessageMarkdown({ content }: { content: string }) {
  const normalized = normalizeAssistantMarkdown(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      className="assistant-markdown text-[15px] leading-[1.75] text-foreground space-y-3 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ul]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:leading-relaxed [&_strong]:font-semibold [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-3 [&_h3]:mb-1.5 [&_table]:w-full [&_table]:text-sm [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_td]:border-t [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-2"
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
        li: ({ children }) => <li className="mb-1 leading-relaxed">{children}</li>,
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto rounded-xl border border-border/70 shadow-sm">
            <table className="w-full min-w-[280px]">{children}</table>
          </div>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="font-medium text-primary underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        pre: ({ children }) => <>{children}</>,
        code: ({ className, children }) => {
          const match = /language-(\w+)/.exec(className ?? "");
          const language = match?.[1];
          const code = String(children).replace(/\n$/, "");
          const isBlock = className?.includes("language-");

          if (isBlock) {
            return <AssistantRichCodeBlock language={language} code={code} />;
          }

          return (
            <code className="rounded bg-muted px-1.5 py-0.5 text-[13px] font-medium">{children}</code>
          );
        },
      }}
    >
      {normalized}
    </ReactMarkdown>
  );
}
