import { Check } from "lucide-react";
import React from "react";

export default function MarkdownRenderer({ content }: { content: string }) {
  const renderInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const boldItalicMatch = remaining.match(
        /^([\s\S]*?)\*\*\*([\s\S]*?)\*\*\*/,
      );
      const boldMatch = remaining.match(/^([\s\S]*?)\*\*([\s\S]*?)\*\*/);
      const italicMatch = remaining.match(/^([\s\S]*?)\*([\s\S]*?)\*/);
      const codeMatch = remaining.match(/^([\s\S]*?)`([\s\S]*?)`/);
      const strikeMatch = remaining.match(/^([\s\S]*?)~~([\s\S]*?)~~/);
      const linkMatch = remaining.match(/^([\s\S]*?)\[([^\]]+)\]\(([^)]+)\)/);

      const candidates = [
        boldItalicMatch && {
          match: boldItalicMatch,
          type: "bolditalic",
          prefixLen: boldItalicMatch[1].length,
          totalLen: boldItalicMatch[0].length,
        },
        boldMatch && {
          match: boldMatch,
          type: "bold",
          prefixLen: boldMatch[1].length,
          totalLen: boldMatch[0].length,
        },
        italicMatch && {
          match: italicMatch,
          type: "italic",
          prefixLen: italicMatch[1].length,
          totalLen: italicMatch[0].length,
        },
        codeMatch && {
          match: codeMatch,
          type: "code",
          prefixLen: codeMatch[1].length,
          totalLen: codeMatch[0].length,
        },
        strikeMatch && {
          match: strikeMatch,
          type: "strike",
          prefixLen: strikeMatch[1].length,
          totalLen: strikeMatch[0].length,
        },
        linkMatch && {
          match: linkMatch,
          type: "link",
          prefixLen: linkMatch[1].length,
          totalLen: linkMatch[0].length,
        },
      ].filter(Boolean) as {
        match: RegExpMatchArray;
        type: string;
        prefixLen: number;
        totalLen: number;
      }[];

      if (candidates.length === 0) {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }

      const earliest = candidates.reduce((a, b) =>
        a.prefixLen <= b.prefixLen ? a : b,
      );
      const { match, type, prefixLen, totalLen } = earliest;

      if (prefixLen > 0) parts.push(<span key={key++}>{match[1]}</span>);

      if (type === "bolditalic") {
        parts.push(
          <strong key={key++} className="font-semibold text-white">
            <em className="italic">{match[2]}</em>
          </strong>,
        );
      } else if (type === "bold") {
        parts.push(
          <strong key={key++} className="font-semibold text-white">
            {match[2]}
          </strong>,
        );
      } else if (type === "italic") {
        parts.push(
          <em key={key++} className="italic text-stone-200">
            {match[2]}
          </em>,
        );
      } else if (type === "code") {
        parts.push(
          <code
            key={key++}
            className="bg-stone-800/80 border border-stone-700/60 px-1.5 py-0.5 rounded text-[0.8em] font-mono text-emerald-300 tracking-tight"
          >
            {match[2]}
          </code>,
        );
      } else if (type === "strike") {
        parts.push(
          <del key={key++} className="line-through text-stone-500">
            {match[2]}
          </del>,
        );
      } else if (type === "link") {
        parts.push(
          <a
            key={key++}
            href={match[3]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline underline-offset-2 decoration-blue-400/40 hover:text-blue-300 hover:decoration-blue-300/60 transition-colors"
          >
            {match[2]}
          </a>,
        );
      }

      remaining = remaining.slice(totalLen);
    }

    return parts;
  };

  const renderBlock = (
    lines: string[],
    startIndex: number,
  ): { node: React.ReactNode; consumed: number } => {
    const line = lines[startIndex];
    const trimmed = line.trim();

    if (trimmed === "") {
      return {
        node: <div key={`blank-${startIndex}`} className="h-2" />,
        consumed: 1,
      };
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const configs: {
        className: string;
        tag: keyof React.JSX.IntrinsicElements;
      }[] = [
        {
          tag: "h1",
          className:
            "text-[1.5rem] font-bold text-white mt-6 mb-3 pb-2 border-b border-stone-700/60 leading-tight tracking-tight",
        },
        {
          tag: "h2",
          className:
            "text-[1.25rem] font-bold text-white mt-5 mb-2.5 pb-1.5 border-b border-stone-800/80 leading-tight tracking-tight",
        },
        {
          tag: "h3",
          className:
            "text-[1.1rem] font-semibold text-white mt-4 mb-2 leading-snug",
        },
        {
          tag: "h4",
          className:
            "text-[1rem] font-semibold text-stone-100 mt-3 mb-1.5 leading-snug",
        },
        {
          tag: "h5",
          className:
            "text-[0.9rem] font-semibold text-stone-200 mt-2 mb-1 uppercase tracking-wide",
        },
        {
          tag: "h6",
          className:
            "text-[0.85rem] font-semibold text-stone-400 mt-2 mb-1 uppercase tracking-wide",
        },
      ];
      const { tag: Tag, className } = configs[level - 1];
      return {
        node: (
          <Tag key={`h-${startIndex}`} className={className}>
            {renderInline(text)}
          </Tag>
        ),
        consumed: 1,
      };
    }

    // Horizontal rule
    if (/^(---+|===+|\*\*\*+)$/.test(trimmed)) {
      return {
        node: (
          <hr
            key={`hr-${startIndex}`}
            className="border-0 border-t border-stone-700/50 my-4"
          />
        ),
        consumed: 1,
      };
    }

    // Fenced code block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      let i = startIndex + 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      return {
        node: (
          <div
            key={`code-${startIndex}`}
            className="my-4 rounded-lg overflow-hidden border border-stone-700/50"
          >
            {lang && (
              <div className="flex items-center justify-between bg-stone-800/80 px-4 py-2 border-b border-stone-700/50">
                <span className="text-[0.7rem] font-mono font-medium text-stone-400 uppercase tracking-widest">
                  {lang}
                </span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-600" />
                </div>
              </div>
            )}
            <pre className="bg-stone-900/70 p-4 overflow-x-auto text-[0.82rem] font-mono text-emerald-300 leading-relaxed whitespace-pre">
              <code>{codeLines.join("\n")}</code>
            </pre>
          </div>
        ),
        consumed: i - startIndex + 1,
      };
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      let i = startIndex;
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      return {
        node: (
          <blockquote
            key={`bq-${startIndex}`}
            className="my-3 pl-4 border-l-[3px] border-stone-500/60 bg-stone-800/20 py-2.5 pr-3 rounded-r-md"
          >
            {quoteLines.map((ql, qi) => (
              <p
                key={qi}
                className="text-stone-400 text-sm leading-relaxed italic m-0"
              >
                {renderInline(ql)}
              </p>
            ))}
          </blockquote>
        ),
        consumed: i - startIndex,
      };
    }

    // Checkbox list (must come before unordered list)
    if (/^[-*+]\s\[[ xX]\]\s/.test(trimmed)) {
      const items: { checked: boolean; text: string }[] = [];
      let i = startIndex;
      while (i < lines.length && /^[-*+]\s\[[ xX]\]\s/.test(lines[i].trim())) {
        const t = lines[i].trim();
        const checked = /^[-*+]\s\[[xX]\]/.test(t);
        items.push({ checked, text: t.replace(/^[-*+]\s\[[ xX]\]\s/, "") });
        i++;
      }
      return {
        node: (
          <ul
            key={`chk-${startIndex}`}
            className="my-2.5 space-y-2 ml-1 list-none"
          >
            {items.map((item, ii) => (
              <li key={ii} className="flex items-start gap-2.5 text-sm">
                <span
                  className={`mt-0.5 shrink-0 w-[1.1rem] h-[1.1rem] rounded-sm border flex items-center justify-center text-[0.65rem] font-bold transition-colors ${
                    item.checked
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : "border-stone-600 bg-stone-800/40"
                  }`}
                >
                  {item.checked && <Check size={12} />}
                </span>
                <span
                  className={
                    item.checked
                      ? "text-stone-500 line-through leading-relaxed"
                      : "text-stone-300 leading-relaxed"
                  }
                >
                  {renderInline(item.text)}
                </span>
              </li>
            ))}
          </ul>
        ),
        consumed: i - startIndex,
      };
    }

    // Unordered list
    if (/^[-*+]\s/.test(trimmed)) {
      const items: string[] = [];
      let i = startIndex;
      while (i < lines.length && /^[-*+]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s/, ""));
        i++;
      }
      return {
        node: (
          <ul
            key={`ul-${startIndex}`}
            className="my-2.5 space-y-1.5 ml-1 list-none"
          >
            {items.map((item, ii) => (
              <li
                key={ii}
                className="flex items-start gap-2.5 text-stone-300 text-sm leading-relaxed"
              >
                <span className="mt-[0.4rem] shrink-0 w-1.5 h-1.5 rounded-full bg-stone-500" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        ),
        consumed: i - startIndex,
      };
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      let i = startIndex;
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      return {
        node: (
          <ol
            key={`ol-${startIndex}`}
            className="my-2.5 space-y-1.5 ml-1 list-none"
          >
            {items.map((item, ii) => (
              <li
                key={ii}
                className="flex items-start gap-2.5 text-stone-300 text-sm leading-relaxed"
              >
                <span className="shrink-0 min-w-[1.4rem] text-right text-stone-500 font-mono text-[0.75rem] mt-[0.15rem] select-none">
                  {ii + 1}.
                </span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        ),
        consumed: i - startIndex,
      };
    }

    // Paragraph
    return {
      node: (
        <p
          key={`p-${startIndex}`}
          className="text-stone-300 text-sm leading-[1.75] m-0"
        >
          {renderInline(trimmed)}
        </p>
      ),
      consumed: 1,
    };
  };

  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const { node, consumed } = renderBlock(lines, i);
    nodes.push(node);
    i += consumed;
  }

  return <div className="markdown-body space-y-1 text-stone-300">{nodes}</div>;
}
