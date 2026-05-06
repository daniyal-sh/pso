import { Icon } from "@/components/icon";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-black text-charcoal">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`${part}-${index}`} className="italic text-charcoal/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={`${part}-${index}`}
          className="font-bold text-emerald underline-offset-4 hover:underline"
          href={link[2]}
          target={link[2].startsWith("http") ? "_blank" : undefined}
          rel={link[2].startsWith("http") ? "noreferrer" : undefined}
        >
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

export function MarkdownRenderer({ content }: { content: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = content.split(/\r?\n/);
  let list: { kind: "ordered" | "unordered"; text: string }[] = [];

  function flushList() {
    if (list.length === 0) return;
    const kind = list[0]?.kind ?? "unordered";
    if (kind === "ordered") {
      blocks.push(
        <ol key={`list-${blocks.length}`} className="my-5 list-decimal space-y-3 pl-6">
          {list.map((item, index) => (
            <li key={`${item.text}-${index}`} className="pl-2 text-base leading-7 text-charcoal/80">
              {renderInline(item.text)}
            </li>
          ))}
        </ol>,
      );
    } else {
      blocks.push(
        <ul key={`list-${blocks.length}`} className="my-5 space-y-3">
          {list.map((item, index) => (
            <li key={`${item.text}-${index}`} className="flex gap-3 text-base leading-7 text-charcoal/80">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint text-emerald">
                <Icon name="check" className="h-3.5 w-3.5" />
              </span>
              <span>{renderInline(item.text.replace(/^\[ \]\s+/, ""))}</span>
            </li>
          ))}
        </ul>,
      );
    }
    list = [];
  }

  function pushList(kind: "ordered" | "unordered", text: string) {
    if (list.length > 0 && list[0]?.kind !== kind) {
      flushList();
    }
    list.push({ kind, text });
  }

  lines.forEach((line) => {
    if (line.startsWith("# ")) {
      flushList();
      blocks.push(
        <h1 key={`block-${blocks.length}`} className="mt-4 font-display text-4xl font-bold text-charcoal">
          {renderInline(line.replace("# ", ""))}
        </h1>,
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={`block-${blocks.length}`} className="mt-10 font-display text-3xl font-bold text-charcoal">
          {renderInline(line.replace("## ", ""))}
        </h2>,
      );
      return;
    }
    if (line.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={`block-${blocks.length}`} className="mt-8 text-xl font-black text-charcoal">
          {renderInline(line.replace("### ", ""))}
        </h3>,
      );
      return;
    }
    if (line.startsWith("#### ")) {
      flushList();
      blocks.push(
        <h4 key={`block-${blocks.length}`} className="mt-7 text-lg font-black text-charcoal">
          {renderInline(line.replace("#### ", ""))}
        </h4>,
      );
      return;
    }
    if (line.startsWith("> ")) {
      flushList();
      blocks.push(
        <blockquote key={`block-${blocks.length}`} className="my-5 border-l-4 border-gold bg-mint/60 px-5 py-3 text-base font-semibold leading-7 text-charcoal/80">
          {renderInline(line.replace("> ", ""))}
        </blockquote>,
      );
      return;
    }
    if (line.startsWith("- ")) {
      pushList("unordered", line.replace(/^- /, ""));
      return;
    }
    if (/^\d+\.\s+/.test(line)) {
      pushList("ordered", line.replace(/^\d+\.\s+/, ""));
      return;
    }
    if (line.trim().length === 0) {
      flushList();
      return;
    }
    flushList();
    blocks.push(
      <p key={`block-${blocks.length}`} className="mt-4 text-base leading-8 text-charcoal/80">
        {renderInline(line)}
      </p>,
    );
  });

  flushList();

  return <div>{blocks}</div>;
}
