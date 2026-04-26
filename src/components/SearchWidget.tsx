// SearchWidget.tsx — modal flotante con Pagefind.
// Observatorio del Sistema de Energía de Jalisco — Fase 7.
//
// REGLA v1.2 del repo: strings con concatenación '+'. NO template literals.
//
// Disparadores de apertura:
//   - Tecla '/' (escuchada en Editorial.astro y propagada vía CustomEvent).
//   - Click en el ícono lupa del Header (mismo CustomEvent).
//   - window.dispatchEvent(new CustomEvent('open-search'))
//
// Cierre:
//   - Tecla Esc.
//   - Click en backdrop.
//   - Click en un resultado.
//   - Botón × del modal.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './SearchWidget.css';

interface RawResult {
  id: string;
  data: () => Promise<{
    url: string;
    raw_url?: string;
    meta?: { title?: string; seccion?: string; image?: string };
    excerpt?: string;
  }>;
}

interface ResolvedResult {
  url: string;
  title: string;
  seccion: string;
  excerpt: string;
}

interface PagefindModule {
  init: () => Promise<void>;
  search: (q: string) => Promise<{ results: RawResult[] }>;
}

declare global {
  interface Window {
    __pagefind__?: PagefindModule;
  }
}

const DEBOUNCE_MS = 200;
const MAX_RESULTS = 20;

function loadPagefind(): Promise<PagefindModule> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('No window'));
  }
  if (window.__pagefind__) {
    return Promise.resolve(window.__pagefind__);
  }
  // Import dinámico del bundle generado por pagefind --site dist.
  // El path absoluto /pagefind/pagefind.js lo sirve Astro/preview.
  const url = '/pagefind/pagefind.js';
  return import(/* @vite-ignore */ url).then(async (mod) => {
    const pf = mod as PagefindModule;
    if (typeof pf.init === 'function') {
      await pf.init();
    }
    window.__pagefind__ = pf;
    return pf;
  });
}

function trapFocus(container: HTMLElement, event: KeyboardEvent) {
  if (event.key !== 'Tab') return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

export default function SearchWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [grouped, setGrouped] = useState<Record<string, ResolvedResult[]>>({});
  const [orderedSections, setOrderedSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pagefindReady, setPagefindReady] = useState<boolean | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const resultRefs = useRef<HTMLAnchorElement[]>([]);
  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef<number>(0);

  const flatResults = useMemo(() => {
    const out: ResolvedResult[] = [];
    for (const sec of orderedSections) {
      const arr = grouped[sec] || [];
      for (const r of arr) out.push(r);
    }
    return out;
  }, [grouped, orderedSections]);

  // ----- Apertura / cierre -----
  const open = useCallback(() => {
    triggerRef.current = (document.activeElement as HTMLElement) || null;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
      triggerRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const onOpen = () => open();
    window.addEventListener('open-search', onOpen as EventListener);
    return () => {
      window.removeEventListener('open-search', onOpen as EventListener);
    };
  }, [open]);

  // Foco al input cuando abre + load de pagefind
  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 30);
    if (pagefindReady === null) {
      loadPagefind()
        .then(() => setPagefindReady(true))
        .catch((e) => {
          setPagefindReady(false);
          setErrorMsg('No se pudo cargar el motor de búsqueda. ' + (e?.message || ''));
        });
    }
    return () => window.clearTimeout(t);
  }, [isOpen, pagefindReady]);

  // Esc + Tab trap mientras el modal está abierto
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        trapFocus(dialogRef.current, e);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, flatResults.length - 1)));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        if (activeIndex >= 0 && activeIndex < flatResults.length) {
          e.preventDefault();
          const url = flatResults[activeIndex].url;
          window.location.href = url;
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close, flatResults, activeIndex]);

  // Lock scroll del body
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Asegurar que el resultado activo sea visible
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = resultRefs.current[activeIndex];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // ----- Búsqueda con debounce -----
  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }
    if (q.length === 0) {
      setGrouped({});
      setOrderedSections([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      const myReq = ++requestIdRef.current;
      setLoading(true);
      setErrorMsg(null);
      try {
        const pf = await loadPagefind();
        const search = await pf.search(q);
        if (myReq !== requestIdRef.current) return;
        const top = search.results.slice(0, MAX_RESULTS);
        const datas = await Promise.all(top.map((r) => r.data()));
        if (myReq !== requestIdRef.current) return;

        const sections: Record<string, ResolvedResult[]> = {};
        const order: string[] = [];
        for (const d of datas) {
          const meta = d.meta || {};
          const seccion = (meta.seccion || 'Otros').trim();
          const title = (meta.title || meta.seccion || d.url || '').toString();
          const item: ResolvedResult = {
            url: d.url,
            title: title,
            seccion: seccion,
            excerpt: d.excerpt || '',
          };
          if (!sections[seccion]) {
            sections[seccion] = [];
            order.push(seccion);
          }
          sections[seccion].push(item);
        }
        setGrouped(sections);
        setOrderedSections(order);
        setActiveIndex(datas.length > 0 ? 0 : -1);
      } catch (err: any) {
        setErrorMsg('Error al buscar: ' + (err?.message || 'desconocido'));
      } finally {
        if (myReq === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [query, isOpen]);

  // Reset de estado al cerrar
  useEffect(() => {
    if (isOpen) return;
    setQuery('');
    setGrouped({});
    setOrderedSections([]);
    setErrorMsg(null);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  let runningIndex = -1;

  return (
    <div
      className="search-backdrop"
      onMouseDown={onBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-heading"
      >
        <div className="search-header">
          <span id="search-heading" className="search-eyebrow">BUSCAR</span>
          <button
            type="button"
            className="search-close"
            aria-label="Cerrar búsqueda"
            onClick={close}
          >
            ×
          </button>
        </div>

        <div className="search-input-wrap">
          <input
            ref={inputRef}
            className="search-input"
            type="search"
            placeholder="Buscar en el Observatorio…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Texto de búsqueda"
          />
        </div>

        <div className="search-results" role="listbox" aria-label="Resultados de búsqueda">
          {loading && query.trim().length > 0 ? (
            <p className="search-empty">Buscando…</p>
          ) : null}

          {!loading && errorMsg ? (
            <p className="search-empty search-error">{errorMsg}</p>
          ) : null}

          {!loading && !errorMsg && query.trim().length === 0 ? (
            <p className="search-empty">
              Escriba para buscar en hallazgos, reformas, proyectos, conflictos, vacíos y los veinte ordenamientos.
            </p>
          ) : null}

          {!loading && !errorMsg && query.trim().length > 0 && flatResults.length === 0 ? (
            <p className="search-empty">Sin resultados.</p>
          ) : null}

          {!loading && orderedSections.map((sec) => (
            <div key={sec} className="search-section">
              <h3 className="search-section-title">{sec}</h3>
              <ul className="search-section-list">
                {(grouped[sec] || []).map((r) => {
                  runningIndex = runningIndex + 1;
                  const idx = runningIndex;
                  const cls = 'search-result' + (idx === activeIndex ? ' active' : '');
                  return (
                    <li key={r.url}>
                      <a
                        ref={(el) => {
                          if (el) resultRefs.current[idx] = el;
                        }}
                        className={cls}
                        href={r.url}
                        onClick={() => close()}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <span className="search-result-title">{r.title}</span>
                        {r.excerpt ? (
                          <span
                            className="search-result-excerpt"
                            dangerouslySetInnerHTML={{ __html: r.excerpt }}
                          />
                        ) : null}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="search-footer">
          <span className="search-hint">
            <kbd>↑</kbd> <kbd>↓</kbd> navegar · <kbd>↵</kbd> abrir · <kbd>Esc</kbd> cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
