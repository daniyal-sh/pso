import { Icon } from "@/components/icon";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-black text-charcoal">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function MarkdownRenderer({ content }: { content: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = content.split(/\r?\n/);
  let list: string[] = [];

  function flushList() {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-5 space-y-3">
        {list.map((item) => (
          <li key={item} className="flex gap-3 text-base leading-7 text-charcoal/80">
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint text-emerald">
              <Icon name="check" className="h-3.5 w-3.5" />
            </span>
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>,
    );
    list = [];
  }

  lines.forEach((line) => {
    if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={line} className="mt-10 font-display text-3xl font-bold text-charcoal">
          {line.replace("## ", "")}
        </h2>,
      );
      return;
    }
    if (line.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={line} className="mt-8 text-xl font-black text-charcoal">
          {line.replace("### ", "")}
        </h3>,
      );
      return;
    }
    if (line.startsWith("- ")) {
      list.push(line.replace("- ", ""));
      return;
    }
    if (line.trim().length === 0) {
      flushList();
      return;
    }
    flushList();
    blocks.push(
      <p key={`${line}-${blocks.length}`} className="mt-4 text-base leading-8 text-charcoal/80">
        {renderInline(line)}
      </p>,
    );
  });

  flushList();

  return <div>{blocks}</div>;
}
