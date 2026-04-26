// RutaCritica.tsx — visualización vertical waterfall de los 7 grupos.
// Observatorio del Sistema de Energía de Jalisco — Fase 6.
//
// REGLA v1.2 del repo: strings con concatenación '+'. NO template literals.
// Pre-procesamiento en frontmatter Astro; aquí solo render + estado de hover.
//
// Inversas + inter-tramo (v1.6): no se renderizan como aristas. Sí participan
// en el hover transitivo (cálculo recursivo de predecesoras y sucesoras).

import { useMemo, useRef, useState, useLayoutEffect, useEffect } from 'react';
import meta from '../data/ordenamiento-meta.json';
import './RutaCritica.css';

export interface Reforma {
  id: string;
  titulo: string;
  ordenamiento: string;
  articulo_modificar: string;
  prioridad: string;
}

export interface Tramo {
  numero: number;
  titulo: string;
  frase: string;
  reformas: Reforma[];
  subgrupos?: Record<string, Reforma[]>;
  subOrden?: string[];
}

export interface Props {
  tramos: Tramo[];
  forward: Record<string, string[]>;
  backward: Record<string, string[]>;
}

function transitiveSet(start: string, edges: Record<string, string[]>): Set<string> {
  const visited = new Set<string>();
  const stack: string[] = [start];
  while (stack.length > 0) {
    const cur = stack.pop() as string;
    if (visited.has(cur)) continue;
    visited.add(cur);
    const next = edges[cur] || [];
    for (const n of next) stack.push(n);
  }
  return visited;
}

function ordRender(tag: string) {
  const entry = (meta as Record<string, any>)[tag];
  if (!entry) {
    return <span className="ord-name"><b>{tag}</b></span>;
  }
  const d = entry.nombre_display;
  if (!d) {
    return <span className="ord-name">{entry.nombre_completo || tag}</span>;
  }
  return (
    <span className="ord-name">
      {d.prefix_italic ? <i>{d.prefix_italic}</i> : null}
      <b>{d.core_bold_italic}</b>
      {d.suffix_italic_small ? <small>{d.suffix_italic_small}</small> : null}
    </span>
  );
}

interface CardProps {
  reforma: Reforma;
  hoveredId: string | null;
  highlightSet: Set<string>;
  onEnter: (id: string) => void;
  onLeave: () => void;
}

function Card({ reforma, hoveredId, highlightSet, onEnter, onLeave }: CardProps) {
  const isHover = hoveredId !== null;
  const isHi = highlightSet.has(reforma.id);
  let cls = 'ruta-card';
  if (isHover) cls = cls + (isHi ? ' highlighted' : ' faded');
  const href = '/sintesis/reformas/' + reforma.id;
  return (
    <a
      href={href}
      className={cls}
      data-rid={reforma.id}
      onMouseEnter={() => onEnter(reforma.id)}
      onMouseLeave={onLeave}
      onFocus={() => onEnter(reforma.id)}
      onBlur={onLeave}
    >
      <h4 className="ruta-card-title">{reforma.titulo}</h4>
      <p className="ruta-card-meta">
        <span className="ord-tag">{reforma.ordenamiento}</span>
        <span className="art">{reforma.articulo_modificar}</span>
        <span className="prio">Prioridad {reforma.prioridad}</span>
      </p>
      <span className="ruta-card-id">{reforma.id}</span>
    </a>
  );
}

interface CardBox {
  l: number;
  r: number;
  t: number;
  b: number;
  cx: number;
  cy: number;
}

interface SvgEdge {
  fromId: string;
  toId: string;
  d: string;            // path SVG con segmentos ortogonales y esquinas suavizadas
  endDir: 'left' | 'top'; // por dónde entra al destino (para el marker)
}

const CORNER_R = 5;             // radio de esquinas suavizadas
const ARROW_GAP = 10;            // espacio entre punta de flecha y borde de card
const ROW_TOL = 8;               // tolerancia px para considerar misma fila
const FINAL_STRAIGHT = 14;       // longitud mínima del tramo recto final (px) antes del marker

interface CardGroupProps {
  reformas: Reforma[];
  forward: Record<string, string[]>;
  hoveredId: string | null;
  highlightSet: Set<string>;
  onEnter: (id: string) => void;
  onLeave: () => void;
  groupKey: string;
}

// Construye un path ortogonal con esquinas redondeadas a partir de una lista
// de puntos (polilínea). Cada esquina se sustituye por un cuarto de círculo
// (arco) de radio CORNER_R. El último segmento NO se suaviza: queda como L
// recto puro para que el arrowhead orient="auto-start-reverse" reciba una
// tangente exactamente horizontal o vertical.
//
// Cuantización: todas las coordenadas se redondean con Math.round antes de
// componer el string, para evitar anti-aliasing subpixel que se percibe
// como inclinación.
function orthoPath(rawPoints: Array<[number, number]>): string {
  const points: Array<[number, number]> = rawPoints.map((p) => [Math.round(p[0]), Math.round(p[1])]);
  if (points.length === 0) return '';
  if (points.length === 1) return 'M ' + points[0][0] + ' ' + points[0][1];
  const cmds: string[] = [];
  cmds.push('M ' + points[0][0] + ' ' + points[0][1]);
  // Última esquina = índice points.length - 2. El tramo points[len-2] → points[len-1]
  // es el "tramo recto final" y no debe suavizarse.
  const lastIdx = points.length - 1;
  for (let i = 1; i < lastIdx; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    const dxIn = cur[0] - prev[0];
    const dyIn = cur[1] - prev[1];
    const dxOut = next[0] - cur[0];
    const dyOut = next[1] - cur[1];
    const lenIn = Math.abs(dxIn) + Math.abs(dyIn);
    const lenOut = Math.abs(dxOut) + Math.abs(dyOut);
    // Limitar el radio a la mitad del segmento entrante y a la mitad del
    // saliente. Para el segmento saliente: si es el último (i = lastIdx - 1),
    // restringir aún más para preservar FINAL_STRAIGHT recto al final.
    const cap = i === lastIdx - 1 ? Math.max(0, lenOut - FINAL_STRAIGHT) : lenOut;
    const r = Math.max(0, Math.min(CORNER_R, lenIn / 2, cap / 2));
    if (r <= 0.5) {
      cmds.push('L ' + cur[0] + ' ' + cur[1]);
      continue;
    }
    const sx = Math.round(cur[0] - Math.sign(dxIn) * r);
    const sy = Math.round(cur[1] - Math.sign(dyIn) * r);
    const ex = Math.round(cur[0] + Math.sign(dxOut) * r);
    const ey = Math.round(cur[1] + Math.sign(dyOut) * r);
    cmds.push('L ' + sx + ' ' + sy);
    const cross = dxIn * dyOut - dyIn * dxOut;
    const sweep = cross > 0 ? 1 : 0;
    cmds.push('A ' + r + ' ' + r + ' 0 0 ' + sweep + ' ' + ex + ' ' + ey);
  }
  // Tramo recto final SIEMPRE como L explícito (mantiene la tangente).
  const last = points[lastIdx];
  cmds.push('L ' + last[0] + ' ' + last[1]);
  return cmds.join(' ');
}

// Devuelve true si el segmento horizontal y=ay entre x=ax1..ax2 cruza la
// caja box. Solo se chequea bandas horizontales; el routing solo genera
// segmentos horizontales de cruce, así que es suficiente.
function hSegmentCrossesBox(ax1: number, ax2: number, ay: number, box: CardBox): boolean {
  const xMin = Math.min(ax1, ax2);
  const xMax = Math.max(ax1, ax2);
  return ay >= box.t && ay <= box.b && xMax > box.l && xMin < box.r;
}

function CardGroup(props: CardGroupProps) {
  const { reformas, forward, hoveredId, highlightSet, onEnter, onLeave, groupKey } = props;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState<SvgEdge[]>([]);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const idSet = useMemo(() => new Set(reformas.map((r) => r.id)), [reformas]);

  const recompute = () => {
    const root = wrapRef.current;
    if (!root) return;
    const rootRect = root.getBoundingClientRect();
    const cardEls = root.querySelectorAll<HTMLElement>('.ruta-card');
    const boxes: Record<string, CardBox> = {};
    cardEls.forEach((el) => {
      const rid = el.getAttribute('data-rid');
      if (!rid) return;
      const cr = el.getBoundingClientRect();
      const l = cr.left - rootRect.left;
      const r = cr.right - rootRect.left;
      const t = cr.top - rootRect.top;
      const b = cr.bottom - rootRect.top;
      boxes[rid] = {
        l,
        r,
        t,
        b,
        cx: l + (r - l) / 2,
        cy: t + (b - t) / 2,
      };
    });

    // Agrupar cards por fila (mismo top aproximado).
    const rowsMap = new Map<number, CardBox[]>();
    Object.values(boxes).forEach((box) => {
      let key = -1;
      rowsMap.forEach((_, k) => {
        if (Math.abs(k - box.t) <= ROW_TOL) key = k;
      });
      if (key === -1) {
        rowsMap.set(box.t, [box]);
      } else {
        const arr = rowsMap.get(key) as CardBox[];
        arr.push(box);
      }
    });
    const rows = Array.from(rowsMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, arr]) => {
        arr.sort((a, b) => a.l - b.l);
        return arr;
      });

    // rowOf: para cada caja, índice de fila + altura inferior (b) máxima
    // y altura superior (t) mínima de la fila completa, para calcular gutters.
    const rowOf: Map<CardBox, { idx: number; rowTop: number; rowBottom: number }> = new Map();
    rows.forEach((row, idx) => {
      const rowTop = Math.min(...row.map((b) => b.t));
      const rowBottom = Math.max(...row.map((b) => b.b));
      row.forEach((box) => rowOf.set(box, { idx, rowTop, rowBottom }));
    });

    // Calcular gutter Y entre filas i y i+1 (centro vertical libre).
    const gutterBetween: number[] = [];
    for (let i = 0; i < rows.length - 1; i++) {
      const aBottom = Math.max(...rows[i].map((b) => b.b));
      const bTop = Math.min(...rows[i + 1].map((b) => b.t));
      gutterBetween.push((aBottom + bTop) / 2);
    }
    // Gutter superior antes de la primera fila y posterior a la última.
    const topGutter = rows.length > 0 ? Math.max(0, Math.min(...rows[0].map((b) => b.t)) - 14) : 0;

    const out: SvgEdge[] = [];

    for (const r of reformas) {
      const preds = forward[r.id] || [];
      for (const pre of preds) {
        if (!idSet.has(pre)) continue;
        const a = boxes[pre];
        const b = boxes[r.id];
        if (!a || !b) continue;
        const aRow = rowOf.get(a);
        const bRow = rowOf.get(b);
        if (!aRow || !bRow) continue;

        const sameRow = aRow.idx === bRow.idx;
        const isLeftToRight = b.l >= a.r;

        let pts: Array<[number, number]> = [];
        let endDir: 'left' | 'top' = 'left';

        if (sameRow && isLeftToRight) {
          // Misma fila, destino a la derecha.
          // Verificar si hay alguna card intermedia (entre a.r y b.l) en
          // esta fila. Si la hay, ruteo por gutter superior o inferior.
          const row = rows[aRow.idx];
          const blocked = row.some((box) => {
            if (box === a || box === b) return false;
            return box.l < b.l && box.r > a.r;
          });

          const fromX = a.r;
          const fromY = a.cy;
          const toX = b.l - ARROW_GAP;
          const toY = b.cy;
          endDir = 'left';

          if (!blocked) {
            // Adyacentes en la fila: línea horizontal recta.
            pts = [
              [fromX, fromY],
              [toX, toY],
            ];
          } else {
            // Saltar cards intermedias por gutter superior o inferior.
            const gutterY = aRow.idx < gutterBetween.length
              ? gutterBetween[aRow.idx]
              : aRow.rowBottom + 18;
            const upperY = aRow.idx > 0
              ? gutterBetween[aRow.idx - 1]
              : Math.max(8, aRow.rowTop - 18);

            // Elegir el gutter más corto que no cruce ninguna card en su path.
            const candidates: number[] = [gutterY, upperY];
            let chosenY = candidates[0];
            for (const cy of candidates) {
              const crosses = row.some(
                (box) => box !== a && box !== b && hSegmentCrossesBox(a.r, b.l, cy, box)
              );
              if (!crosses) {
                chosenY = cy;
                break;
              }
            }
            pts = [
              [fromX, fromY],
              [fromX + 14, fromY],
              [fromX + 14, chosenY],
              [toX, chosenY],
              [toX, toY],
            ];
          }
        } else if (!sameRow) {
          // Filas distintas. La regla pide entrada por el borde superior del
          // destino (regla 4). Aplica cuando b está en una fila posterior a a.
          // Para casos donde b está arriba de a (raro en grids con wrap),
          // entramos por el borde inferior simétricamente.
          const goingDown = bRow.idx > aRow.idx;
          if (goingDown) {
            const gutterY = gutterBetween[aRow.idx] !== undefined
              ? gutterBetween[aRow.idx]
              : aRow.rowBottom + 18;
            const fromX = a.r;
            const fromY = a.cy;
            const toX = b.cx;
            const toY = b.t - ARROW_GAP;
            endDir = 'top';
            pts = [
              [fromX, fromY],
              [fromX + 14, fromY],
              [fromX + 14, gutterY],
              [toX, gutterY],
              [toX, toY],
            ];
          } else {
            // Va hacia arriba: entra por el borde inferior del destino.
            const aboveIdx = bRow.idx;
            const gutterY = gutterBetween[aboveIdx] !== undefined
              ? gutterBetween[aboveIdx]
              : bRow.rowBottom + 18;
            const fromX = a.r;
            const fromY = a.cy;
            const toX = b.cx;
            const toY = b.b + ARROW_GAP;
            endDir = 'top'; // se trata simétricamente; reusamos marker
            pts = [
              [fromX, fromY],
              [fromX + 14, fromY],
              [fromX + 14, gutterY],
              [toX, gutterY],
              [toX, toY],
            ];
          }
        } else {
          // Misma fila pero destino a la izquierda del origen (poco común).
          // Bajamos al gutter inferior, cruzamos y entramos por la izquierda.
          const gutterY = aRow.idx < gutterBetween.length
            ? gutterBetween[aRow.idx]
            : aRow.rowBottom + 18;
          const fromX = a.r;
          const fromY = a.cy;
          const toX = b.l - ARROW_GAP;
          const toY = b.cy;
          endDir = 'left';
          pts = [
            [fromX, fromY],
            [fromX + 14, fromY],
            [fromX + 14, gutterY],
            [toX, gutterY],
            [toX, toY],
          ];
        }

        out.push({
          fromId: pre,
          toId: r.id,
          d: orthoPath(pts),
          endDir,
        });
      }
    }
    setEdges(out);
    setSize({ w: rootRect.width, h: rootRect.height });
  };

  useLayoutEffect(() => {
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reformas, forward]);

  useEffect(() => {
    const onResize = () => recompute();
    window.addEventListener('resize', onResize);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && wrapRef.current) {
      ro = new ResizeObserver(() => recompute());
      ro.observe(wrapRef.current);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markerId = 'ruta-arrowhead-' + groupKey;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div className="ruta-cards-row">
        {reformas.map((r) => (
          <Card
            key={r.id}
            reforma={r}
            hoveredId={hoveredId}
            highlightSet={highlightSet}
            onEnter={onEnter}
            onLeave={onLeave}
          />
        ))}
      </div>
      {edges.length > 0 ? (
        <svg
          className="ruta-svg-layer"
          width={size.w}
          height={size.h}
          viewBox={'0 0 ' + size.w + ' ' + size.h}
          aria-hidden="true"
        >
          <defs>
            <marker
              id={markerId}
              markerWidth="8"
              markerHeight="8"
              refX="7.5"
              refY="4"
              orient="auto-start-reverse"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#1B2C5E" />
            </marker>
          </defs>
          {edges.map((e, i) => {
            const isHover = hoveredId !== null;
            const both = highlightSet.has(e.fromId) && highlightSet.has(e.toId);
            let cls = 'ruta-arrow';
            if (isHover) cls = cls + (both ? ' highlighted' : ' faded');
            return (
              <path
                key={i}
                className={cls}
                d={e.d}
                strokeLinejoin="round"
                strokeLinecap="round"
                markerEnd={'url(#' + markerId + ')'}
              />
            );
          })}
        </svg>
      ) : null}
    </div>
  );
}

export default function RutaCritica(props: Props) {
  const { tramos, forward, backward } = props;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Validaciones internas
  const errors: string[] = [];
  if (tramos.length !== 7) {
    errors.push('Esperaba 7 tramos, vi ' + tramos.length + '.');
  }
  let totalEnRuta = 0;
  for (const t of tramos) totalEnRuta = totalEnRuta + t.reformas.length;
  if (totalEnRuta !== 65) {
    errors.push('Esperaba 65 reformas en ruta, vi ' + totalEnRuta + '.');
  }
  const t6 = tramos.find((t) => t.numero === 6);
  if (!t6) {
    errors.push('Falta T6.');
  } else {
    if (!t6.subgrupos || Object.keys(t6.subgrupos).length === 0) {
      errors.push('T6 sin subgrupos.');
    } else {
      const n = Object.keys(t6.subgrupos).length;
      if (n < 8 || n > 12) {
        errors.push('T6 tiene ' + n + ' sub-bandas; rango aceptable 8-12.');
      }
    }
  }
  for (const t of tramos) {
    if (t.numero !== 6 && t.subgrupos && Object.keys(t.subgrupos).length > 0) {
      errors.push('Tramo G' + t.numero + ' no debería tener sub-bandas.');
    }
  }

  // Hover transitivo
  const highlightSet = useMemo(() => {
    if (hoveredId === null) return new Set<string>();
    const fwd = transitiveSet(hoveredId, forward);
    const bwd = transitiveSet(hoveredId, backward);
    const merged = new Set<string>();
    fwd.forEach((id) => merged.add(id));
    bwd.forEach((id) => merged.add(id));
    return merged;
  }, [hoveredId, forward, backward]);

  const onEnter = (id: string) => setHoveredId(id);
  const onLeave = () => setHoveredId(null);

  if (errors.length > 0) {
    if (typeof console !== 'undefined') {
      console.error('[RutaCritica] errores de validación:\n' + errors.join('\n'));
    }
    return (
      <div className="ruta-error" role="alert">
        <strong>Error en datos de la ruta crítica:</strong>
        <ul>
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="ruta-root">
      {tramos.map((tramo, idx) => (
        <div key={tramo.numero}>
          <section className={'ruta-banda ruta-banda-t' + tramo.numero}>
            <header className="ruta-banda-header">
              <span className="ruta-banda-eyebrow">GRUPO {tramo.numero}</span>
              <h3 className="ruta-banda-title">{tramo.titulo}</h3>
              <p className="ruta-banda-phrase">{tramo.frase}</p>
            </header>

            {tramo.numero === 6 && tramo.subgrupos && tramo.subOrden ? (
              <div className="ruta-t6-stack">
                {tramo.subOrden.map((tag, i) => {
                  const subReformas = (tramo.subgrupos as Record<string, Reforma[]>)[tag] || [];
                  return (
                    <div key={tag} className="ruta-t6-subbanda">
                      <div className="ruta-t6-subheader">{ordRender(tag)}</div>
                      <CardGroup
                        reformas={subReformas}
                        forward={forward}
                        hoveredId={hoveredId}
                        highlightSet={highlightSet}
                        onEnter={onEnter}
                        onLeave={onLeave}
                        groupKey={'t6-' + tag}
                      />
                      {i < (tramo.subOrden as string[]).length - 1 ? (
                        <hr className="ruta-t6-divider" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <CardGroup
                reformas={tramo.reformas}
                forward={forward}
                hoveredId={hoveredId}
                highlightSet={highlightSet}
                onEnter={onEnter}
                onLeave={onLeave}
                groupKey={'t' + tramo.numero}
              />
            )}
          </section>

          {idx < tramos.length - 1 ? (
            <div className="ruta-tramo-divider" aria-hidden="true">
              <span className="ruta-tramo-divider-label">
                G{tramo.numero} ⊢ G{tramo.numero + 1}
              </span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
