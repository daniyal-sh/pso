import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { Icon } from "@/components/icon";

// Only web links, mail links, in-page anchors and site-relative paths survive.
function safeUrl(url: string) {
  const transformed = defaultUrlTransform(url);
  if (!transformed) return "";
  if (/^(https?:|mailto:|#|\/(?!\/))/i.test(transformed)) return transformed;
  return "";
}

function isExternal(href: string | undefined) {
  return Boolean(href && /^https?:/i.test(href));
}

const components: Components = {
  h1: ({ children }) => <h1 className="mt-4 font-display text-4xl font-bold text-charcoal">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-10 font-display text-3xl font-bold text-charcoal">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-8 text-xl font-black text-charcoal">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-7 text-lg font-black text-charcoal">{children}</h4>,
  p: ({ children }) => <p className="mt-4 text-base leading-8 text-charcoal/80">{children}</p>,
  strong: ({ children }) => <strong className="font-black text-charcoal">{children}</strong>,
  em: ({ children }) => <em className="italic text-charcoal/90">{children}</em>,
  a: ({ href, children }) => (
    <a
      className="break-words font-bold text-emerald underline-offset-4 hover:underline"
      href={href}
      target={isExternal(href) ? "_blank" : undefined}
      rel={isExternal(href) ? "noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-5 border-l-4 border-gold bg-mint/60 px-5 py-1 text-base font-semibold leading-7 text-charcoal/80">{children}</blockquote>
  ),
  ul: ({ children }) => <ul className="my-5 space-y-3">{children}</ul>,
  ol: ({ children }) => <ol className="my-5 list-decimal space-y-3 pl-6">{children}</ol>,
  // Unordered items get the check badge; ordered items keep their numbers.
  li: ({ children }) => (
    <li className="text-base leading-7 text-charcoal/80 [ol>&]:pl-2 [ul>&]:flex [ul>&]:gap-3">
      <span className="mt-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint text-emerald [ul>li>&]:flex">
        <Icon name="check" className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  ),
  code: ({ children }) => <code className="rounded bg-cool px-1.5 py-0.5 font-mono text-sm text-charcoal">{children}</code>,
  pre: ({ children }) => <pre className="my-5 overflow-x-auto rounded-md bg-charcoal p-4 text-sm leading-6 text-white [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-white">{children}</pre>,
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-navy/15 bg-mint/60 px-3 py-2 font-black text-charcoal">{children}</th>,
  td: ({ children }) => <td className="border-b border-navy/10 px-3 py-2 text-charcoal/80">{children}</td>,
  hr: () => <hr className="my-8 border-navy/10" />,
  img: ({ src, alt }) =>
    typeof src === "string" && src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt ?? ""} loading="lazy" className="my-5 max-h-[640px] w-full rounded-md object-contain" />
    ) : null,
};

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="min-w-0 overflow-hidden break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeSanitize]} urlTransform={safeUrl} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
