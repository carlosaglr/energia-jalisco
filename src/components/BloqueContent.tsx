// src/components/BloqueContent.tsx
// Renders markdown content from bloque JSON sections with cross-reference tooltips.
import './BloqueContent.css';
import CrossRef, { type CrossRefEntry } from './CrossRef';

const XREF_RE = /\b(R-\d{1,3}|[1-6][A-D]\.\d{1,3})\b/g;

interface Props {
  markdown: string;
  crossRefs: Record<string, CrossRefEntry>;
}

// --- Inline markdown: bold, italic ---

function mdInline(s: string): string {
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  return s;
}

function Inline({ text, crossRefs }: { text: string; crossRefs: Record<string, CrossRefEntry> }) {
  const parts: (string | JSX.Element)[] = [];
  const re = new RegExp(XREF_RE.source, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      const seg = text.slice(last, m.index);
      parts.push(
        <span key={'t' + k++} dangerouslySetInnerHTML={{ __html: mdInline(seg) }} />
      );
    }
    parts.push(
      <CrossRef key={'x' + k++ + '-' + m[0]} code={m[0]} crossRefs={crossRefs} />
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    const seg = text.slice(last);
    parts.push(
      <span key={'t' + k++} dangerouslySetInnerHTML={{ __html: mdInline(seg) }} />
    );
  }
  return <>{parts}</>;
}

// --- Block parsing ---

interface Block {
  type: 'ul' | 'table' | 'p';
  items?: string[];
  tableLines?: string[];
  text?: string;
}

function parseBlocks(md: string): Block[] {
  const lines = md.split('\n');
  const blocks: Block[] = [];
  let listItems: string[] = [];
  let currentItem = '';
  let tableLines: string[] = [];

  function flushList() {
    if (currentItem) { listItems.push(currentItem); currentItem = ''; }
    if (listItems.length) { blocks.push({ type: 'ul', items: [...listItems] }); listItems = []; }
  }
  function flushTable() {
    if (tableLines.length) { blocks.push({ type: 'table', tableLines: [...tableLines] }); tableLines = []; }
  }

  for (const line of lines) {
    const t = line.trim();

    if (t.startsWith('|')) {
      flushList();
      tableLines.push(t);
      continue;
    }
    if (tableLines.length > 0) flushTable();

    if (t.startsWith('- ')) {
      if (currentItem) listItems.push(currentItem);
      currentItem = t.slice(2);
      continue;
    }

    if (t === '' || t === '---') {
      flushList();
      continue;
    }

    if (currentItem) {
      currentItem = currentItem + ' ' + t;
    } else {
      flushList();
      blocks.push({ type: 'p', text: t });
    }
  }

  flushList();
  flushTable();
  return blocks;
}

// --- Table rendering ---

function MdTable({ tableLines, crossRefs }: { tableLines: string[]; crossRefs: Record<string, CrossRefEntry> }) {
  if (tableLines.length < 3) return null;
  var parseCells = function (line: string) {
    return line.split('|').slice(1, -1).map(function (c) { return c.trim(); });
  };
  var headers = parseCells(tableLines[0]);
  var rows = tableLines.slice(2).map(parseCells);

  return (
    <div className="bloque-table-wrap">
      <table className="bloque-table">
        <thead>
          <tr>{headers.map(function (h, i) { return <th key={i}>{h}</th>; })}</tr>
        </thead>
        <tbody>
          {rows.map(function (row, ri) {
            return (
              <tr key={ri}>
                {row.map(function (cell, ci) {
                  return <td key={ci}><Inline text={cell} crossRefs={crossRefs} /></td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- Main component ---

export default function BloqueContent({ markdown, crossRefs }: Props) {
  var blocks = parseBlocks(markdown);
  return (
    <div className="bloque-content">
      {blocks.map(function (block, i) {
        if (block.type === 'table' && block.tableLines) {
          return <MdTable key={i} tableLines={block.tableLines} crossRefs={crossRefs} />;
        }
        if (block.type === 'ul' && block.items) {
          return (
            <ul key={i} className="bloque-list">
              {block.items.map(function (item, j) {
                return <li key={j}><Inline text={item} crossRefs={crossRefs} /></li>;
              })}
            </ul>
          );
        }
        if (block.type === 'p' && block.text) {
          var cls = block.text.startsWith('[AUSENCIA') ? 'bloque-absence' : '';
          return (
            <p key={i} className={cls}>
              <Inline text={block.text} crossRefs={crossRefs} />
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}
