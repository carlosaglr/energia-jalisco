// src/components/CrossRef.tsx
import { useState, useRef, useEffect } from 'react';

export interface CrossRefEntry {
  tipo?: string;
  titulo_corto?: string;
  url?: string;
  debilidades?: string[];
  proyectos?: string[];
  conflictos?: string[];
  reformas?: string[];
}

interface CrossRefProps {
  code: string;
  crossRefs: Record<string, CrossRefEntry>;
  children?: React.ReactNode;
}

export default function CrossRef({ code, crossRefs, children }: CrossRefProps) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const entry = crossRefs[code];

  if (!entry || !entry.url) {
    return <span className="xref-missing">{children ?? code}</span>;
  }

  const show = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), 120);
  };

  const counts: Array<[string, number]> = [];
  if (entry.debilidades?.length) counts.push(['debilidades', entry.debilidades.length]);
  if (entry.reformas?.length) counts.push(['reformas', entry.reformas.length]);
  if (entry.proyectos?.length) counts.push(['proyectos', entry.proyectos.length]);
  if (entry.conflictos?.length) counts.push(['conflictos', entry.conflictos.length]);

  const tooltipClass = 'tooltip ' + (open ? 'visible' : '');
  const eyebrowText = (entry.tipo ?? 'referencia').toUpperCase() + ' · ' + code;

  return (
    <span
      className="xref-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <a href={entry.url} className="xref">{children ?? code}</a>
      <span
        className={tooltipClass}
        role="tooltip"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        <span className="tooltip-eyebrow">{eyebrowText}</span>
        {entry.titulo_corto && (
          <span className="tooltip-title">{entry.titulo_corto}</span>
        )}
        {counts.length > 0 && (
          <span className="tooltip-meta">
            {counts.map(([label, n], i) => (
              <span key={label} className="tooltip-meta-item">
                <b>{n}</b> {label}
                {i < counts.length - 1 ? <span className="tooltip-meta-sep" /> : null}
              </span>
            ))}
          </span>
        )}
      </span>
    </span>
  );
}
