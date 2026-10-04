import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownRenderer } from "@/components/sections/markdown-renderer";

function render(content: string) {
  return renderToStaticMarkup(<MarkdownRenderer content={content} />);
}

describe("MarkdownRenderer", () => {
  it("renders headings, emphasis, lists and GFM tables", () => {
    const html = render("## Plan\n\n- **Bold** item\n\n1. First\n\n| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<h2");
    expect(html).toContain("<strong");
    expect(html).toContain("<ol");
    expect(html).toContain("<table");
    expect(html).toContain("<td");
  });

  it("keeps single line breaks that existing content relies on", () => {
    expect(render("Line one\nLine two")).toContain("<br/>");
  });

  it("strips script tags, inline handlers and javascript: links", () => {
    const html = render('[evil](javascript:alert(1)) <script>alert(1)</script> <img src=x onerror="alert(1)">');
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
  });

  it("opens external links in a new tab and keeps site links in place", () => {
    const html = render("[out](https://example.com) [in](/guides/nstc)");
    expect(html).toMatch(/href="https:\/\/example.com"[^>]*target="_blank"[^>]*rel="noreferrer"/);
    expect(html).toMatch(/href="\/guides\/nstc"(?![^>]*target)/);
  });

  it("drops protocol-relative and data: URLs", () => {
    const html = render("[a](//evil.example) [b](data:text/html,hi)");
    expect(html).not.toContain("evil.example");
    expect(html).not.toContain("data:");
  });
});
