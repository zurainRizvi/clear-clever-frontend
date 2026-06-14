import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssistantMessageMarkdown } from "./assistant-message-markdown";
import { AssistantRichCodeBlock } from "./assistant-rich-content";

describe("AssistantRichCodeBlock", () => {
  it("renders a bar chart from chart fence JSON", () => {
    const code = JSON.stringify({
      type: "bar",
      title: "Premiums",
      labels: ["A", "B"],
      values: [4500, 5200],
    });
    render(<AssistantRichCodeBlock language="chart" code={code} />);
    expect(screen.getByText("Premiums")).toBeInTheDocument();
    expect(document.querySelector("[data-slot=chart]")).toBeTruthy();
  });

  it("renders stats KPI cards", () => {
    const code = JSON.stringify({
      type: "stats",
      items: [{ label: "Best match", value: "92%", hint: "Score" }],
    });
    render(<AssistantRichCodeBlock language="stats" code={code} />);
    expect(screen.getByText("Best match")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
  });

  it("renders compare cards", () => {
    const code = JSON.stringify({
      type: "compare",
      items: [
        {
          title: "Policy A",
          subtitle: "Insurer X",
          highlights: ["PKR 4,500/mo"],
          badge: "Top pick",
        },
      ],
    });
    render(<AssistantRichCodeBlock language="compare" code={code} />);
    expect(screen.getByText("Policy A")).toBeInTheDocument();
    expect(screen.getByText("Top pick")).toBeInTheDocument();
  });

  it("renders chart data arrays from json fences", () => {
    const code = JSON.stringify({
      type: "bar",
      data: [
        { label: "Home", value: 4500 },
        { label: "Auto", value: 5200 },
      ],
    });
    render(<AssistantRichCodeBlock language="json" code={code} />);
    expect(document.querySelector("[data-slot=chart]")).toBeTruthy();
  });

  it("renders chart from datasets array shape", () => {
    const code = JSON.stringify({
      type: "bar",
      title: "Categories",
      datasets: [{ labels: ["Home", "Auto"], values: ["800", "1200"] }],
    });
    render(<AssistantRichCodeBlock language="chart" code={code} />);
    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(document.querySelector("[data-slot=chart]")).toBeTruthy();
  });
});

describe("AssistantMessageMarkdown", () => {
  it("renders chart blocks from markdown fences", () => {
    const content = `Here is your chart:

\`\`\`chart
{"type":"bar","title":"Premiums","labels":["Policy A","Policy B"],"values":[4500,5200]}
\`\`\`

Explanation below.`;

    render(<AssistantMessageMarkdown content={content} />);
    expect(screen.getByText("Premiums")).toBeInTheDocument();
    expect(document.querySelector("[data-slot=chart]")).toBeTruthy();
  });

  it("renders stats blocks from markdown fences", () => {
    const content = `\`\`\`stats
{"type":"stats","items":[{"label":"Leads","value":"12","hint":"This month"}]}
\`\`\``;

    render(<AssistantMessageMarkdown content={content} />);
    expect(screen.getByText("Leads")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders bare inline visual JSON", () => {
    const content = `Summary:

{"type":"compare","items":[{"title":"Policy A","highlights":["PKR 4,500/mo"]}]}`;

    render(<AssistantMessageMarkdown content={content} />);
    expect(screen.getByText("Policy A")).toBeInTheDocument();
  });
});
