// src/components/CrossRefText.tsx
// Renderiza un string detectando codigos R-NN y NA.NN y envolviendolos
// con CrossRef para mostrar tooltip rico al hover.
import CrossRef, { type CrossRefEntry } from './CrossRef';

const XREF_PATTERN = /\b(R-\d{1,3}|[1-6][A-D]\.\d{1,3})\b/g;

interface Props {
  text: string;
  crossRefs: Record<string, CrossRefEntry>;
}

export default function CrossRefText({ text, crossRefs }: Props) {
  const parts: Array<string | JSX.Element> = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  const re = new RegExp(XREF_PATTERN.source, 'g');

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    const code = match[0];
    parts.push(
      <CrossRef
        key={'xr-' + i++ + '-' + code}
        code={code}
        crossRefs={crossRefs}
      />
    );
    lastIdx = match.index + code.length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return <>{parts}</>;
}
