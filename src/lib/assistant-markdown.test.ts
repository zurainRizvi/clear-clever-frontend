import { describe, expect, it } from "vitest";
import {
  normalizeAssistantMarkdown,
  prepareAssistantMarkdown,
  wrapInlineVisualJson,
} from "./assistant-markdown";

describe("prepareAssistantMarkdown", () => {
  it("preserves chart fences through normalization", () => {
    const input = `\`\`\`chart
{"type":"bar","labels":["A","B"],"values":[1,2]}
\`\`\``;
    expect(prepareAssistantMarkdown(input)).toContain("```chart");
  });

  it("wraps bare visual JSON objects", () => {
    const input = `Here is the breakdown:

{"type":"stats","items":[{"label":"Leads","value":"5"}]}

Done.`;
    const prepared = prepareAssistantMarkdown(input);
    expect(prepared).toContain("```stats");
    expect(prepared).toContain('"Leads"');
  });

  it("rewrites json fences with visual payloads to chart fences", () => {
    const input = `\`\`\`json
{"type":"bar","labels":["Home","Auto"],"values":[4500,5200]}
\`\`\``;
    expect(prepareAssistantMarkdown(input)).toContain("```chart");
  });

  it("does not split fenced code blocks during normalization", () => {
    const longIntro = "A".repeat(300);
    const input = `${longIntro}

\`\`\`chart
{"type":"pie","labels":["A","B"],"values":[1,2]}
\`\`\``;
    const normalized = normalizeAssistantMarkdown(input);
    expect(normalized).toContain("```chart");
  });
});

describe("wrapInlineVisualJson", () => {
  it("leaves existing fences unchanged", () => {
    const input = "```chart\n{}\n```";
    expect(wrapInlineVisualJson(input)).toBe(input);
  });
});
